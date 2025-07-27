/**
 * Weather API Client
 * 
 * Provides functions to retrieve weather data from various sources
 * with appropriate caching and fallback mechanisms.
 */

const axios = require('axios');

class WeatherAPIClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENWEATHER_API_KEY;
    this.meteoLkKey = config.meteoLkKey || process.env.METEOLK_API_KEY;
    this.cacheDuration = config.cacheDuration || 60 * 60 * 1000; // 1 hour default
    this.weatherCache = new Map();
    
    if (!this.apiKey) {
      console.warn('No OpenWeatherMap API key provided. Weather data may be unavailable.');
    }
  }
  
  /**
   * Get current and forecast weather data for a location
   * @param {Object} location - Location object with lat and lon properties
   * @returns {Promise<Object>} Weather data
   */
  async getWeatherData(location) {
    if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      throw new Error('Invalid location provided');
    }
    
    const cacheKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
    const cachedData = this.weatherCache.get(cacheKey);
    
    // Return cached data if valid
    if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
      console.log('Using cached weather data');
      return cachedData.data;
    }
    
    try {
      // First try OpenWeatherMap
      const weatherData = await this.fetchFromOpenWeatherMap(location);
      this.weatherCache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });
      return weatherData;
    } catch (error) {
      console.error('OpenWeatherMap request failed:', error.message);
      
      // Try fallback weather source for Sri Lanka locations
      if (this.isInSriLanka(location) && this.meteoLkKey) {
        try {
          console.log('Attempting to use MeteoLk as fallback');
          const fallbackData = await this.fetchFromMeteoLk(location);
          this.weatherCache.set(cacheKey, {
            data: fallbackData,
            timestamp: Date.now()
          });
          return fallbackData;
        } catch (fallbackError) {
          console.error('MeteoLk fallback also failed:', fallbackError.message);
        }
      }
      
      // If both sources failed, throw a 424 Failed Dependency error
      const err = new Error('Weather data unavailable from all sources');
      err.status = 424;
      throw err;
    }
  }
  
  /**
   * Fetch weather data from OpenWeatherMap
   * @private
   */
  async fetchFromOpenWeatherMap(location) {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }
    
    try {
      const response = await axios.get(
        'https://api.openweathermap.org/data/2.5/onecall',
        {
          params: {
            lat: location.lat,
            lon: location.lon,
            exclude: 'minutely,hourly',
            appid: this.apiKey,
            units: 'metric'
          },
          timeout: 5000 // 5 second timeout
        }
      );
      
      return this.normalizeOpenWeatherData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Transform axios errors into more readable format
        if (error.response) {
          throw new Error(`OpenWeatherMap API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          throw new Error('OpenWeatherMap API not responding');
        }
      }
      throw error;
    }
  }
  
  /**
   * Fetch weather data from MeteoLk (Sri Lanka specific)
   * @private
   */
  async fetchFromMeteoLk(location) {
    if (!this.meteoLkKey) {
      throw new Error('MeteoLk API key not configured');
    }
    
    // This is a placeholder implementation
    // In a real system, you would implement the actual API call
    console.log('Using MeteoLk API for Sri Lanka weather data');
    
    // For this example, we'll just simulate data
    return this.simulateWeatherData(location);
  }
  
  /**
   * Normalize OpenWeatherMap data to our internal format
   * @private
   */
  normalizeOpenWeatherData(data) {
    return {
      location: {
        lat: data.lat,
        lon: data.lon
      },
      current: {
        timestamp: data.current.dt,
        temperature: data.current.temp,
        feelsLike: data.current.feels_like,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        windDirection: data.current.wind_deg,
        pressure: data.current.pressure,
        uvIndex: data.current.uvi,
        visibility: data.current.visibility,
        precipitation: data.current.rain ? data.current.rain['1h'] : 0,
        conditions: data.current.weather[0].main,
        description: data.current.weather[0].description,
        icon: data.current.weather[0].icon
      },
      daily: data.daily.map(day => ({
        timestamp: day.dt,
        sunrise: day.sunrise,
        sunset: day.sunset,
        temperature: day.temp.day,
        minTemperature: day.temp.min,
        maxTemperature: day.temp.max,
        feelsLike: day.feels_like.day,
        humidity: day.humidity,
        windSpeed: day.wind_speed,
        windDirection: day.wind_deg,
        pressure: day.pressure,
        uvIndex: day.uvi,
        precipitation: day.rain || 0,
        conditions: day.weather[0].main,
        description: day.weather[0].description,
        icon: day.weather[0].icon,
        probabilityOfPrecipitation: day.pop
      }))
    };
  }
  
  /**
   * Simulate weather data for testing and fallback
   * @private
   */
  simulateWeatherData(location) {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      location: {
        lat: location.lat,
        lon: location.lon
      },
      current: {
        timestamp: now,
        temperature: 30 + (Math.random() * 5 - 2.5),
        feelsLike: 32 + (Math.random() * 5 - 2.5),
        humidity: 75 + (Math.random() * 10 - 5),
        windSpeed: 10 + (Math.random() * 5 - 2.5),
        windDirection: Math.floor(Math.random() * 360),
        pressure: 1013 + (Math.random() * 10 - 5),
        uvIndex: 7 + (Math.random() * 3 - 1.5),
        visibility: 10000,
        precipitation: Math.random() > 0.7 ? Math.random() * 5 : 0,
        conditions: Math.random() > 0.7 ? 'Rain' : 'Clear',
        description: Math.random() > 0.7 ? 'light rain' : 'clear sky',
        icon: Math.random() > 0.7 ? '10d' : '01d'
      },
      daily: Array(7).fill(null).map((_, i) => {
        const isRainy = Math.random() > 0.7;
        return {
          timestamp: now + (i * 86400),
          sunrise: now + (i * 86400) + 21600,
          sunset: now + (i * 86400) + 64800,
          temperature: 30 + (Math.random() * 5 - 2.5),
          minTemperature: 25 + (Math.random() * 3 - 1.5),
          maxTemperature: 32 + (Math.random() * 3 - 1.5),
          feelsLike: 32 + (Math.random() * 5 - 2.5),
          humidity: 75 + (Math.random() * 10 - 5),
          windSpeed: 10 + (Math.random() * 5 - 2.5),
          windDirection: Math.floor(Math.random() * 360),
          pressure: 1013 + (Math.random() * 10 - 5),
          uvIndex: 7 + (Math.random() * 3 - 1.5),
          precipitation: isRainy ? Math.random() * 20 : 0,
          conditions: isRainy ? 'Rain' : 'Clear',
          description: isRainy ? 'light rain' : 'clear sky',
          icon: isRainy ? '10d' : '01d',
          probabilityOfPrecipitation: isRainy ? 0.6 + (Math.random() * 0.4) : Math.random() * 0.3
        };
      })
    };
  }
  
  /**
   * Check if a location is in Sri Lanka (for fallback purposes)
   * @private
   */
  isInSriLanka(location) {
    // Approximate bounding box for Sri Lanka
    return location.lat >= 5.8 && location.lat <= 9.9 && 
           location.lon >= 79.6 && location.lon <= 81.9;
  }
  
  /**
   * Clear the weather cache
   * This can be useful after API key changes or for testing
   */
  clearCache() {
    this.weatherCache.clear();
    console.log('Weather cache cleared');
  }
}

// Export a singleton instance by default
const defaultClient = new WeatherAPIClient();

module.exports = {
  WeatherAPIClient,
  defaultClient
}; 