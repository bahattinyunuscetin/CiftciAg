const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const weatherService = require('../services/weatherService');

// CORS middleware for weather routes
const setCorsHeaders = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
};

router.use(setCorsHeaders);

// Get current weather
router.get('/current', auth, async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            console.log('Missing coordinates:', { lat, lon });
            return res.status(400).json({ 
                message: 'Latitude and longitude are required',
                details: 'Both lat and lon parameters must be provided'
            });
        }

        console.log('Processing weather request:', {
            lat,
            lon,
            userId: req.user?._id
        });

        const weatherData = await weatherService.getCurrentWeather(lat, lon);
        res.json(weatherData);
    } catch (error) {
        console.error('Weather route error:', error);
        
        if (error.message.includes('Invalid coordinates')) {
            return res.status(400).json({
                message: 'Invalid coordinates',
                details: error.message
            });
        } else if (error.message.includes('API key')) {
            return res.status(500).json({ 
                message: 'Weather service configuration error',
                details: 'Invalid or missing API key'
            });
        } else if (error.message.includes('timed out')) {
            return res.status(504).json({
                message: 'Weather service timeout',
                details: 'The request to the weather service took too long'
            });
        }
        
        res.status(500).json({ 
            message: 'Error fetching weather data',
            details: error.message
        });
    }
});

// Get weather forecast
router.get('/forecast', auth, async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            console.log('Missing coordinates:', { lat, lon });
            return res.status(400).json({ 
                message: 'Latitude and longitude are required',
                details: 'Both lat and lon parameters must be provided'
            });
        }

        console.log('Processing forecast request:', {
            lat,
            lon,
            userId: req.user?._id
        });

        const forecastData = await weatherService.getForecast(lat, lon);
        res.json(forecastData);
    } catch (error) {
        console.error('Forecast route error:', error);
        
        if (error.message.includes('Invalid coordinates')) {
            return res.status(400).json({
                message: 'Invalid coordinates',
                details: error.message
            });
        } else if (error.message.includes('API key')) {
            return res.status(500).json({ 
                message: 'Weather service configuration error',
                details: 'Invalid or missing API key'
            });
        } else if (error.message.includes('timed out')) {
            return res.status(504).json({
                message: 'Weather service timeout',
                details: 'The request to the weather service took too long'
            });
        }
        
        res.status(500).json({ 
            message: 'Error fetching forecast data',
            details: error.message
        });
    }
});

// Get irrigation recommendation
router.get('/irrigation-recommendation', auth, async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            console.log('Missing coordinates:', { lat, lon });
            return res.status(400).json({ 
                message: 'Latitude and longitude are required',
                details: 'Both lat and lon parameters must be provided'
            });
        }

        console.log('Processing irrigation request:', {
            lat,
            lon,
            userId: req.user?._id
        });

        const weatherData = await weatherService.getCurrentWeather(lat, lon);
        const recommendation = await weatherService.getIrrigationRecommendation(weatherData);
        res.json(recommendation);
    } catch (error) {
        console.error('Irrigation route error:', error);
        
        if (error.message.includes('Invalid coordinates')) {
            return res.status(400).json({
                message: 'Invalid coordinates',
                details: error.message
            });
        } else if (error.message.includes('API key')) {
            return res.status(500).json({ 
                message: 'Weather service configuration error',
                details: 'Invalid or missing API key'
            });
        } else if (error.message.includes('timed out')) {
            return res.status(504).json({
                message: 'Weather service timeout',
                details: 'The request to the weather service took too long'
            });
        }
        
        res.status(500).json({ 
            message: 'Error getting irrigation recommendation',
            details: error.message
        });
    }
});

module.exports = router; 