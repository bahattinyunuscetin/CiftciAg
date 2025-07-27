const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
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
    current: {
        temperature: Number,
        humidity: Number,
        pressure: Number,
        windSpeed: Number,
        windDirection: Number,
        description: String,
        icon: String,
        timestamp: Date
    },
    forecast: [{
        date: Date,
        temperature: {
            min: Number,
            max: Number
        },
        humidity: Number,
        description: String,
        icon: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});


weatherSchema.index({ 'location.lat': 1, 'location.lon': 1 });


weatherSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 3600 }); 

module.exports = mongoose.model('Weather', weatherSchema); 