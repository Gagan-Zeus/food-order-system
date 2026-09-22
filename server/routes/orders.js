const express = require('express');
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// @route   POST /api/orders
// @desc    Place a new order (Protected - Customers)
router.post('/', verifyToken, async (req, res) => {
    // We use a transaction because we need to write to two tables safely
    const client = await pool.connect();
    
    try {
        const { items, total_amount } = req.body; 
        // Expected items format: [{ menu_item_id: 1, quantity: 2 }, ...]

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        await client.query('BEGIN'); // Start transaction

        // 1. Insert into orders table
        // (razorpay_order_id is left null for now, to be handled in the Payment integration phase)
        const orderResult = await client.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
            [req.user.id, total_amount, 'pending']
        );
        const orderId = orderResult.rows[0].id;

        // 2. Insert all items into order_items table
        for (let item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ($1, $2, $3)',
                [orderId, item.menu_item_id, item.quantity]
            );
        }

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on any failure
        console.error('Error placing order:', err.message);
        res.status(500).json({ error: 'Server error placing order' });
    } finally {
        client.release();
    }
});

// @route   GET /api/orders/my-orders
// @desc    Get logged-in user's past orders (Protected - Customers)
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        // We use PostgreSQL json_agg to efficiently fetch the order along with its nested items in one query
        const detailedOrdersQuery = `
            SELECT o.id, o.total_amount, o.status, o.razorpay_order_id,
                   json_agg(json_build_object(
                       'menu_item_id', m.id,
                       'name', m.name,
                       'price', m.price,
                       'image_url', m.image_url,
                       'quantity', oi.quantity
                   )) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.id DESC;
        `;
        const detailedOrders = await pool.query(detailedOrdersQuery, [req.user.id]);

        res.json(detailedOrders.rows);
    } catch (err) {
        console.error('Error fetching user orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// @route   GET /api/orders
// @desc    Get all orders across the platform (Protected - Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const detailedOrdersQuery = `
            SELECT o.id, o.total_amount, o.status, o.razorpay_order_id, 
                   u.name as customer_name, u.email as customer_email,
                   json_agg(json_build_object(
                       'menu_item_id', m.id,
                       'name', m.name,
                       'quantity', oi.quantity
                   )) as items
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN menu_items m ON oi.menu_item_id = m.id
            GROUP BY o.id, u.name, u.email
            ORDER BY o.id DESC;
        `;
        const allOrders = await pool.query(detailedOrdersQuery);
        res.json(allOrders.rows);
    } catch (err) {
        console.error('Error fetching all orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Protected - Admin only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status provided' });
        }

        const updatedOrder = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (updatedOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order status updated', order: updatedOrder.rows[0] });
    } catch (err) {
        console.error('Error updating order status:', err.message);
        res.status(500).json({ error: 'Server error updating order status' });
    }
});

module.exports = router;
