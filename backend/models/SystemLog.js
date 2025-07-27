const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    activity: {
        type: String,
        required: true
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['Success', 'Failed', 'Warning'],
        default: 'Success'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create initial system logs for demo purposes
SystemLogSchema.statics.createInitialLogs = async function() {
    const count = await this.countDocuments();
    if (count === 0) {
        // Create a single initialization log instead of mock data
        const initLog = new this({
            user: 'system',
            activity: 'System initialized',
            ipAddress: '127.0.0.1',
            status: 'Success',
            timestamp: new Date(),
            details: { source: 'system-initialization', message: 'First system startup' }
        });
        
        await initLog.save();
        console.log('System initialized with first log entry');
    } else {
        console.log(`System logs already exist (${count} records)`);
    }
};

module.exports = mongoose.model('SystemLog', SystemLogSchema); 