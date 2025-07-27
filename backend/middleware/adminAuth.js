// Admin middleware - verifies user is admin
const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

module.exports = adminAuth; 