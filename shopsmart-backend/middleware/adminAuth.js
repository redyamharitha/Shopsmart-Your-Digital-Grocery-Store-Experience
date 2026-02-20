// shopsmart-backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user; // req.user will have id and role from JWT payload

        // --- CHECK FOR ADMIN ROLE ---
        if (req.user.role !== 'admin') { // <-- IMPORTANT CHECK
            return res.status(403).json({ msg: 'Access denied: Admin role required' });
        }
        // --- END CHECK ---

        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};