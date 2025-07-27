const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authorization token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Update lastActive timestamp for the user
        try {
            await User.findByIdAndUpdate(user.id, { lastActive: new Date() });
        } catch (updateError) {
            console.error('Error updating lastActive timestamp:', updateError);
            // Continue processing even if update fails
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        const message = error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Authentication failed';
        res.status(401).json({ 
            success: false,
            message 
        });
    }
};

// Role authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}` 
            });
        }
        next();
    };
};

// Specific role checkers
const isAdmin = authorize('admin');
const isExpert = authorize('expert');
const adminOrExpert = authorize('admin', 'expert');
const isFarmer = authorize('farmer');

// Route protection middleware
const protect = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            error: 'Authorization token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        next();
    } catch (err) {
        res.status(401).json({ 
            success: false,
            error: 'Not authorized, token failed' 
        });
    }
};

module.exports = { 
    auth,
    authorize,
    isAdmin,
    isExpert,
    adminOrExpert,
    isFarmer,
    protect
};