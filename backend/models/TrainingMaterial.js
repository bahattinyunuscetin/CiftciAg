const mongoose = require('mongoose');

const trainingMaterialSchema = new mongoose.Schema({
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
        type: String
    },
    type: {
        type: String,
        enum: ['video', 'document', 'presentation', 'guide', 'manual'],
        required: true
    },
    category: {
        type: String,
        enum: ['irrigation', 'crop', 'weather', 'general', 'technology', 'disease', 'pest'],
        required: true
    },
    targetAudience: {
        type: [String],
        enum: ['farmer', 'expert', 'admin'],
        default: ['farmer', 'expert']
    },
    fileUrl: {
        type: String
    },
    externalUrl: {
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
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
trainingMaterialSchema.index({ 
    title: 'text', 
    description: 'text', 
    content: 'text',
    tags: 'text' 
});

module.exports = mongoose.model('TrainingMaterial', trainingMaterialSchema); 