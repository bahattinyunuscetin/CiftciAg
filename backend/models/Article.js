const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Crop Farming', 'Livestock', 'Organic Farming', 'Market Trends', 'Agri-Tech'],
    },
    summary: {
        type: String,
        required: true,
    },
    readTime: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
        enum: ['external', 'local', 'typed'],
        default: 'external'
    },
    url: { 
        type: String, 
        required: function() { return this.contentType === 'external'; },
        validate: {
          validator: function(v) {
            if (this.contentType !== 'external') return true;
            return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
          },
          message: props => `${props.value} is not a valid URL!`
        }
    },
    content: {
        type: String,
        required: function() { return this.contentType === 'typed'; }
    },
    fileUrl: {
        type: String,
        required: function() { return this.contentType === 'local'; }
    },
    fileName: {
        type: String,
        required: function() { return this.contentType === 'local'; }
    },
    fileType: {
        type: String,
        enum: ['pdf', 'doc', 'docx', null],
        required: function() { return this.contentType === 'local'; }
    },
    featuredImage: { 
        type: String 
    }, // Optional image URL
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'published'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Article', articleSchema);