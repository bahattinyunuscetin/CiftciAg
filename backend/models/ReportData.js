const mongoose = require('mongoose');

const ReportDataSchema = new mongoose.Schema({
    reportType: {
        type: String,
        enum: ['usage', 'crops', 'water', 'feedback'],
        required: true
    },
    region: {
        type: String,
        default: 'all'
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    data: {
        type: Object,
        required: true
    },
    chartData: [
        {
            label: String,
            value: Number,
            percentage: Number
        }
    ],
    metadata: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Initialize some sample report data
ReportDataSchema.statics.createSampleReports = async function() {
    const count = await this.countDocuments();
    if (count === 0) {
        const now = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        // Usage report
        const usageReport = {
            reportType: 'usage',
            region: 'all',
            period: 'monthly',
            startDate: lastMonth,
            endDate: now,
            data: {
                totalUsers: 132,
                userTrend: 8,
                activeFields: 45,
                fieldsTrend: 12,
                waterSaved: 28500,
                waterTrend: 15,
                satisfaction: 92,
                satisfactionTrend: 4,
                monthlyUsage: {
                    Jan: 250, Feb: 280, Mar: 320, Apr: 350, May: 400,
                    Jun: 450, Jul: 480, Aug: 420, Sep: 380, Oct: 340, 
                    Nov: 300, Dec: 270
                }
            },
            chartData: [
                { label: 'Jan', value: 250, percentage: 50 },
                { label: 'Feb', value: 280, percentage: 56 },
                { label: 'Mar', value: 320, percentage: 64 },
                { label: 'Apr', value: 350, percentage: 70 },
                { label: 'May', value: 400, percentage: 80 },
                { label: 'Jun', value: 450, percentage: 90 },
                { label: 'Jul', value: 480, percentage: 96 },
                { label: 'Aug', value: 420, percentage: 84 },
                { label: 'Sep', value: 380, percentage: 76 },
                { label: 'Oct', value: 340, percentage: 68 },
                { label: 'Nov', value: 300, percentage: 60 },
                { label: 'Dec', value: 270, percentage: 54 }
            ],
            metadata: {
                source: 'system-initialization'
            }
        };
        
        // Crop distribution report
        const cropReport = {
            reportType: 'crops',
            region: 'all',
            period: 'monthly',
            startDate: lastMonth,
            endDate: now,
            data: {
                totalUsers: 132,
                userTrend: 8,
                activeFields: 45,
                fieldsTrend: 12,
                cropDistribution: {
                    Rice: 35,
                    Tea: 25,
                    Vegetables: 20,
                    Coconut: 15,
                    Other: 5
                }
            },
            chartData: [
                { label: 'Rice', value: 35, percentage: 35 },
                { label: 'Tea', value: 25, percentage: 25 },
                { label: 'Vegetables', value: 20, percentage: 20 },
                { label: 'Coconut', value: 15, percentage: 15 },
                { label: 'Other', value: 5, percentage: 5 }
            ],
            metadata: {
                source: 'system-initialization'
            }
        };
        
        // Water savings report
        const waterReport = {
            reportType: 'water',
            region: 'all',
            period: 'monthly',
            startDate: lastMonth,
            endDate: now,
            data: {
                totalUsers: 132,
                userTrend: 8,
                activeFields: 45,
                fieldsTrend: 12,
                waterSaved: 28500,
                waterTrend: 15,
                waterSavingsByMonth: {
                    Jan: 250, Feb: 280, Mar: 320, Apr: 350, May: 400,
                    Jun: 450, Jul: 480, Aug: 420, Sep: 380, Oct: 340, 
                    Nov: 300, Dec: 270
                }
            },
            chartData: [
                { label: 'Jan', value: 250, percentage: 25 },
                { label: 'Feb', value: 280, percentage: 28 },
                { label: 'Mar', value: 320, percentage: 32 },
                { label: 'Apr', value: 350, percentage: 35 },
                { label: 'May', value: 400, percentage: 40 },
                { label: 'Jun', value: 450, percentage: 45 },
                { label: 'Jul', value: 480, percentage: 48 },
                { label: 'Aug', value: 420, percentage: 42 },
                { label: 'Sep', value: 380, percentage: 38 },
                { label: 'Oct', value: 340, percentage: 34 },
                { label: 'Nov', value: 300, percentage: 30 },
                { label: 'Dec', value: 270, percentage: 27 }
            ],
            metadata: {
                source: 'system-initialization'
            }
        };
        
        // Feedback report
        const feedbackReport = {
            reportType: 'feedback',
            region: 'all',
            period: 'monthly',
            startDate: lastMonth,
            endDate: now,
            data: {
                totalUsers: 132,
                userTrend: 8,
                activeFields: 45,
                fieldsTrend: 12,
                satisfaction: 92,
                satisfactionTrend: 4,
                feedback: {
                    Excellent: 45,
                    Good: 30,
                    Average: 15,
                    Poor: 10
                }
            },
            chartData: [
                { label: 'Excellent', value: 45, percentage: 45 },
                { label: 'Good', value: 30, percentage: 30 },
                { label: 'Average', value: 15, percentage: 15 },
                { label: 'Poor', value: 10, percentage: 10 }
            ],
            metadata: {
                source: 'system-initialization'
            }
        };
        
        await this.insertMany([usageReport, cropReport, waterReport, feedbackReport]);
        console.log('Created initial report data');
    }
};

module.exports = mongoose.model('ReportData', ReportDataSchema); 