const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing of JSON request bodies

// Static File Serving (for images)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Food Ordering API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
