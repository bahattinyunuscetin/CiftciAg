const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Define file filter
const fileFilter = (req, file, cb) => {
    // Accept images, videos, PDFs, and Office documents
    const allowedFileTypes = [
        // Images
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
        // Documents
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        // Videos
        '.mp4', '.webm', '.avi', '.mov',
        // Other
        '.zip', '.txt', '.csv'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedFileTypes.includes(ext)) {
        return cb(null, true);
    } else {
        return cb(new Error('Only specific file formats are allowed!'));
    }
};

// Configure upload limits
const limits = {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5 // Max 5 files per upload
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits
});

module.exports = upload; 