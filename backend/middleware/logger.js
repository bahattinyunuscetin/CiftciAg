const SystemLog = require('../models/SystemLog');

/**
 * API Logger Middleware - Logs all API requests and responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const apiLogger = (req, res, next) => {
    // Skip logging for health checks and static files
    if (req.path === '/health' || req.path === '/' || req.path.startsWith('/uploads')) {
        return next();
    }
    
    // Record start time
    const start = Date.now();
    
    // Get user info
    const user = req.user ? 
        (typeof req.user === 'object' ? req.user.email || req.user.username : req.user) : 
        'Anonymous';
    
    // Get user ID if available
    const userId = req.user && req.user._id ? req.user._id : null;
    
    // Create a sanitized path (remove IDs for cleaner logs)
    const pathParts = req.path.split('/');
    const sanitizedPath = pathParts
        .map(part => {
            // If part looks like an ID (24 hex chars), replace with :id
            return /^[0-9a-f]{24}$/i.test(part) ? ':id' : part;
        })
        .join('/');
    
    // Build log entry
    const logEntry = {
        user,
        userId,
        activity: `${req.method} ${sanitizedPath}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        details: {
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.headers['user-agent']
        }
    };
    
    // Override res.end to log after response is sent
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        // Calculate response time
        const responseTime = Date.now() - start;
        
        // Add response info to log entry
        logEntry.details.responseTime = responseTime;
        logEntry.details.statusCode = res.statusCode;
        
        // Determine status based on status code
        if (res.statusCode >= 200 && res.statusCode < 300) {
            logEntry.status = 'Success';
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
            logEntry.status = 'Warning';
        } else if (res.statusCode >= 500) {
            logEntry.status = 'Failed';
        } else {
            logEntry.status = 'Info';
        }
        
        // Save to database
        const log = new SystemLog(logEntry);
        log.save().catch(err => console.error('Error saving API log:', err));
        
        // Call original end method
        originalEnd.apply(res, arguments);
    };
    
    next();
};

/**
 * Error Logger - Logs all application errors
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorLogger = (err, req, res, next) => {
    // Get user info
    const user = req.user ? 
        (typeof req.user === 'object' ? req.user.email || req.user.username : req.user) : 
        'Anonymous';
    
    // Get user ID if available
    const userId = req.user && req.user._id ? req.user._id : null;
    
    // Build error log
    const log = new SystemLog({
        user,
        userId,
        activity: `Error: ${req.method} ${req.path}`,
        status: 'Failed',
        ipAddress: req.ip || req.connection.remoteAddress,
        details: {
            error: err.message,
            stack: err.stack,
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            userAgent: req.headers['user-agent']
        }
    });
    
    // Save to database
    log.save().catch(err => console.error('Error saving error log:', err));
    
    // Continue to next error handler
    next(err);
};

module.exports = { apiLogger, errorLogger }; 