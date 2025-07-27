const mongoose = require('mongoose');

const userDocumentationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    section: {
        type: String,
        enum: ['getting-started', 'irrigation', 'crop-management', 'weather', 'disease-detection', 'faq', 'troubleshooting', 'feature-guide'],
        required: true
    },
    targetUser: {
        type: [String],
        enum: ['farmer', 'expert', 'admin'],
        default: ['farmer', 'expert']
    },
    order: {
        type: Number,
        default: 0
    },
    images: {
        type: [String],
        default: []
    },
    relatedDocuments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDocumentation'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    published: {
        type: Boolean,
        default: true
    }
});

// Add text index for search functionality
userDocumentationSchema.index({ 
    title: 'text', 
    description: 'text', 
    content: 'text' 
});

module.exports = mongoose.model('UserDocumentation', userDocumentationSchema); 