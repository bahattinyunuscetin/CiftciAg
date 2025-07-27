const axios = require('axios');
// require('dotenv').config();
const config = require('../config');

class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        console.log('WeatherService initialized');
    }

    getApiKey() {
        const apiKey = config.weather.apiKey;
        if (!apiKey) {
            console.error('OpenWeather API key is not configured!');
            throw new Error('OpenWeather API key is not configured');
        }
        
        console.log('API Key loaded:', apiKey.substring(0, 4) + '...');
        return apiKey;
    }

    // ... rest of the file remains the same ...
}

module.exports = new WeatherService(); 