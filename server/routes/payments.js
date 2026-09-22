const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../db');
const router = express.Router();

// Ensure Razorpay keys are available, otherwise warn the user
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️ Razorpay keys are missing in .env! Payments will not work until they are set.');
}

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @route   POST /api/payments/create-order
// @desc    Generate a Razorpay Order ID for frontend checkout
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body; 

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        // Razorpay expects the amount in the smallest currency unit (e.g., paise for INR).
        // 1 INR = 100 paise.
        const options = {
            amount: Math.round(amount * 100), 
            currency: 'INR',
            receipt: `rcpt_${req.user.id}_${Date.now()}`,
            payment_capture: 1 // Automatically capture the payment
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: 'Error generating Razorpay order' });
        }

        res.json(order);
    } catch (err) {
        console.error('Error in POST /api/payments/create-order:', err.message);
        res.status(500).json({ error: 'Server error creating Razorpay order' });
    }
});

// @route   POST /api/payments/verify
// @desc    Verify the Razorpay payment signature after successful frontend transaction
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment signature details' });
        }

        // To verify the signature, we HMAC SHA256 the order_id and payment_id together 
        // using our highly secure Razorpay Key Secret.
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // The payment is verified! 
            // In a production app, you might also update the database here, but we will 
            // handle the database order insertion on the frontend immediately after this succeeds.
            res.json({ success: true, message: 'Payment successfully verified' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid payment signature - potential fraud attempt' });
        }
    } catch (err) {
        console.error('Error in POST /api/payments/verify:', err.message);
        res.status(500).json({ error: 'Server error verifying payment signature' });
    }
});

module.exports = router;
