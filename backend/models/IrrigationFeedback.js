const mongoose = require('mongoose');

const irrigationFeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IrrigationSchedule',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: false
    },
    isHelpful: {
        type: Boolean,
        default: null
    },
    cropType: {
        type: String,
        required: false
    },
    soilType: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create initial feedback for demo purposes
irrigationFeedbackSchema.statics.createInitialFeedback = async function() {
    const count = await this.countDocuments();
    if (count === 0) {
        try {
            // Get some schedules to reference
            const IrrigationSchedule = mongoose.model('IrrigationSchedule');
            const schedules = await IrrigationSchedule.find().limit(10);
            
            if (schedules.length === 0) {
                console.log('No irrigation schedules found to create sample feedback');
                return;
            }
            
            const feedback = [];
            const comments = [
                'Great recommendations, saved a lot of water!',
                'The schedule worked well for my crop.',
                'Could be better, didn\'t account for afternoon shade.',
                'Perfect timing for irrigation, thank you!',
                'Recommendations were okay but needed some adjustments.',
                'Very useful, helped me improve my yield.',
                'Not quite right for my soil type.',
                'Excellent water conservation suggestions!',
                'Scheduling was convenient and effective.',
                'Would prefer different watering times.'
            ];
            
            // Generate 20 sample feedback entries
            for (let i = 0; i < 20; i++) {
                const schedule = schedules[Math.floor(Math.random() * schedules.length)];
                const rating = Math.floor(Math.random() * 5) + 1;
                const isHelpful = rating > 3 ? true : (rating < 3 ? false : null);
                
                // Create date between 1-30 days ago
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30) - 1);
                
                feedback.push({
                    userId: schedule.userId,
                    scheduleId: schedule._id,
                    rating,
                    comment: comments[Math.floor(Math.random() * comments.length)],
                    isHelpful,
                    cropType: schedule.cropType,
                    createdAt
                });
            }
            
            if (feedback.length > 0) {
                await this.insertMany(feedback);
                console.log(`Created ${feedback.length} initial feedback entries`);
            }
        } catch (error) {
            console.error('Error creating initial feedback:', error);
        }
    }
};

module.exports = mongoose.model('IrrigationFeedback', irrigationFeedbackSchema); 