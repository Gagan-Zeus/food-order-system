const express = require('express');
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// @route   GET /api/menu
// @desc    Get all available menu items (Public)
router.get('/', async (req, res) => {
    try {
        const menuItems = await pool.query('SELECT * FROM menu_items ORDER BY id DESC');
        res.json(menuItems.rows);
    } catch (err) {
        console.error('Error in GET /api/menu:', err.message);
        res.status(500).json({ error: 'Server error fetching menu' });
    }
});

// @route   POST /api/menu
// @desc    Add a new menu item with an image (Private - Admin only)
router.post('/', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, is_available } = req.body;
        
        // Construct the image URL that the frontend will use to display it
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const newItem = await pool.query(
            'INSERT INTO menu_items (name, description, price, image_url, is_available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, image_url, is_available !== undefined ? is_available : true]
        );

        res.status(201).json(newItem.rows[0]);
    } catch (err) {
        console.error('Error in POST /api/menu:', err.message);
        res.status(500).json({ error: 'Server error creating menu item' });
    }
});

// @route   PUT /api/menu/:id
// @desc    Update an existing menu item (Private - Admin only)
router.put('/:id', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, is_available } = req.body;
        
        // Fetch existing item to check for old image
        const existingItemResult = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
        if (existingItemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        let image_url = existingItemResult.rows[0].image_url;
        
        // If admin uploaded a new image, replace the old one
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
            
            // Delete the old image from the server to save space
            if (existingItemResult.rows[0].image_url) {
                const oldImagePath = path.join(__dirname, '..', existingItemResult.rows[0].image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        const updatedItem = await pool.query(
            'UPDATE menu_items SET name = $1, description = $2, price = $3, image_url = $4, is_available = $5 WHERE id = $6 RETURNING *',
            [name, description, price, image_url, is_available, id]
        );

        res.json(updatedItem.rows[0]);
    } catch (err) {
        console.error('Error in PUT /api/menu:', err.message);
        res.status(500).json({ error: 'Server error updating menu item' });
    }
});

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item (Private - Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if item exists
        const itemResult = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        
        // Delete the associated image file from disk
        const item = itemResult.rows[0];
        if (item.image_url) {
            const imagePath = path.join(__dirname, '..', item.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete from database
        await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
        res.json({ message: 'Menu item deleted successfully' });
    } catch (err) {
        console.error('Error in DELETE /api/menu:', err.message);
        res.status(500).json({ error: 'Server error deleting menu item' });
    }
});

module.exports = router;
