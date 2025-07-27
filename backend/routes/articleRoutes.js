const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Article = require('../models/Article');
const { protect, adminOrExpert } = require('../middleware/auth');

// Set up multer storage for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/articles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File filter for allowed extensions
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Define the validateUrl function
const validateUrl = (url) => {
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*(\?.*)?$/i;
    return urlRegex.test(url);
};

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, contentType } = req.query;
        let filter = {};
        
        if (category) filter.category = category;
        if (contentType) filter.contentType = contentType;
        
        const articles = await Article.find(filter)
            .sort('-createdAt')
            .populate('addedBy', 'username role');
            
        res.json(articles);
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch articles',
            error: err.message
        });
    }
});

// @desc    Add a new article (external URL, typed content, or file)
// @route   POST /api/articles
// @access  Admin/Expert
router.post('/', protect, adminOrExpert, upload.single('articleFile'), async (req, res) => {
    try {
        const { title, category, summary, readTime, contentType, url, content } = req.body;
        
        // Validate required fields for all article types
        if (!title || !category || !summary || !readTime || !contentType) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: title, category, summary, readTime, contentType' 
            });
        }

        // Create article object
        const newArticle = {
            title,
            category,
            summary,
            readTime,
            contentType,
            addedBy: req.user._id,
            status: req.user.role === 'admin' ? 'published' : 'pending'
        };

        // Handle different content types
        if (contentType === 'external') {
            if (!url) {
                return res.status(400).json({
                    success: false,
                    message: 'URL is required for external articles'
                });
            }
            
            // Validate URL format
            if (!validateUrl(url)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid URL starting with http:// or https://'
                });
            }
            
            newArticle.url = url;
        } 
        else if (contentType === 'typed') {
            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Content is required for typed articles'
                });
            }
            
            newArticle.content = content;
        } 
        else if (contentType === 'local') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'File is required for local articles'
                });
            }
            
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            let fileType;
            
            if (fileExtension === '.pdf') fileType = 'pdf';
            else if (fileExtension === '.doc') fileType = 'doc';
            else if (fileExtension === '.docx') fileType = 'docx';
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Only PDF and Word documents are allowed'
                });
            }
            
            newArticle.fileUrl = `/uploads/articles/${req.file.filename}`;
            newArticle.fileName = req.file.originalname;
            newArticle.fileType = fileType;
        }

        // Add optional featured image if provided
        if (req.body.featuredImage) {
            newArticle.featuredImage = req.body.featuredImage;
        }

        const article = new Article(newArticle);
        const savedArticle = await article.save();
        
        res.status(201).json({
            success: true,
            data: savedArticle
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to add article',
            error: err.message
        });
    }
});

// @desc    Get article by ID
// @route   GET /api/articles/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate('addedBy', 'username role');
            
        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }
        
        res.json(article);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch article',
            error: err.message
        });
    }
});

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Admin/Expert
router.delete('/:id', protect, adminOrExpert, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false,
                message: 'Article not found' 
            });
        }

        // Verify article belongs to user or user is admin
        if (article.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to delete this article' 
            });
        }

        // If article has a file, delete it from the filesystem
        if (article.contentType === 'local' && article.fileUrl) {
            const filePath = path.join(__dirname, '..', article.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await article.deleteOne();
        res.json({ 
            success: true,
            message: 'Article deleted successfully' 
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete article',
            error: err.message
        });
    }
});

module.exports = router;