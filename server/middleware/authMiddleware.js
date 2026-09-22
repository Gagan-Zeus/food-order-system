const jwt = require('jsonwebtoken');

// Middleware to check if the user is authenticated via JWT
const verifyToken = (req, res, next) => {
    // Expected format: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adds user id and role to the request object
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Middleware to check if the authenticated user is an admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
};

module.exports = { verifyToken, isAdmin };
