const mongoose = require('mongoose');

const IrrigationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  cropType: {
    type: String,
    required: true
  },
  soilType: {
    type: String,
    required: true
  },
  fieldSize: {
    type: Number,
    required: true
  },
  recommendation: {
    waterAmount: Number,
    duration: Number,
    startTime: String,
    frequency: Number,
    waterSavings: Number,
    confidence: Number
  },
  weather: {
    temperature: Number,
    humidity: Number,
    precipitation: Number,
    windSpeed: Number,
    forecast: [
      {
        day: Number,
        temperature: Number,
        precipitation: Number,
        condition: String
      }
    ]
  },
  soilCondition: {
    moisture: Number,
    ph: Number,
    nutrientLevel: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    date: {
      type: Date,
      default: Date.now
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Irrigation = mongoose.model('irrigation', IrrigationSchema); 