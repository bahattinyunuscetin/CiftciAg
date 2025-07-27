const mongoose = require('mongoose');

const irrigationScheduleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cropType: {
        type: String,
        required: true
    },
    fieldSize: {
        type: Number,
        required: true,
        min: 0
    },
    startTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
    },
    adjustForWeather: {
        type: Boolean,
        default: true
    },
    active: {
        type: Boolean,
        default: true
    },
    location: {
        lat: {
            type: Number,
            required: true
        },
        lon: {
            type: Number,
            required: true
        },
        name: String
    },
    lastRun: {
        type: Date
    },
    nextRun: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
irrigationScheduleSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('IrrigationSchedule', irrigationScheduleSchema); 