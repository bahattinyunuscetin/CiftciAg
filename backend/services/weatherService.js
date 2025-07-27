/**
 * Weather Service
 * 
 * This service provides weather data for irrigation calculations.
 * In a production environment, this would connect to a real weather API.
 */

/**
 * Get current weather and forecast data
 * @param {string} lat - Latitude
 * @param {string} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
async function getCurrentWeather(lat, lon) {
  try {
    // In a production app, this would call a weather API with the lat and lon parameters
    // For now, return mock data
    
    console.log(`Fetching current weather for coordinates: ${lat}, ${lon}`);
    
    // Generate slightly randomized data to simulate real weather variations
    const currentTemp = 22 + Math.random() * 10; // Between 22-32°C
    const currentHumidity = 50 + Math.random() * 30; // Between 50-80%
    const currentWindSpeed = 5 + Math.random() * 15; // Between 5-20 km/h
    
    // Generate random precipitation (20% chance of rain)
    const isRaining = Math.random() < 0.2;
    const currentPrecipitation = isRaining ? Math.random() * 15 : 0; // 0-15mm if raining
    
    // Generate 3-day forecast
    const forecast = [];
    let forecastTemp = currentTemp;
    let forecastPrecipitation = currentPrecipitation;
    
    for (let i = 0; i < 3; i++) {
      // Temperature changes by -3 to +3 degrees each day
      forecastTemp += (Math.random() * 6) - 3;
      
      // Precipitation changes (30% chance of rain each day)
      const willRain = Math.random() < 0.3;
      forecastPrecipitation = willRain ? Math.random() * 20 : 0;
      
      // Determine weather condition based on precipitation
      let condition;
      if (forecastPrecipitation === 0) {
        condition = forecastTemp > 28 ? 'Sunny' : 'Partly Cloudy';
      } else if (forecastPrecipitation < 5) {
        condition = 'Light Rain';
      } else if (forecastPrecipitation < 15) {
        condition = 'Moderate Rain';
      } else {
        condition = 'Heavy Rain';
      }
      
      forecast.push({
        day: i + 1,
        temperature: Math.round(forecastTemp),
        precipitation: Math.round(forecastPrecipitation * 10) / 10,
        condition
      });
    }
    
    return {
      temperature: Math.round(currentTemp * 10) / 10,
      humidity: Math.round(currentHumidity),
      precipitation: Math.round(currentPrecipitation * 10) / 10,
      windSpeed: Math.round(currentWindSpeed * 10) / 10,
      forecast
    };
        } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data');
  }
}

/**
 * Get weather forecast
 * @param {string} lat - Latitude
 * @param {string} lon - Longitude
 * @returns {Promise<Object>} Forecast data
 */
async function getForecast(lat, lon) {
  try {
    console.log(`Fetching forecast for coordinates: ${lat}, ${lon}`);
    
    // In a production app, this would call a weather API for forecast
    // For now, generate mock forecast data
    
    // Generate base weather patterns for the area
    const baseTemp = 18 + Math.random() * 10; // Base temperature between 18-28°C
    const rainProbability = Math.random() * 0.5; // 0-50% chance of rain as base
    
    // Generate 7-day forecast
    const forecast = [];
    let forecastTemp = baseTemp;
    
    for (let i = 0; i < 7; i++) {
      // Add some variation to temperature with a slight trend
      // Trend could be warming or cooling over the week
      const trend = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2 degrees trend per day
      forecastTemp += trend + (Math.random() * 4) - 2; // Daily variation of ±2 degrees
      
      // Precipitation probability and amount
      const dailyRainProbability = rainProbability + (Math.random() * 0.4) - 0.2; // Adjust base probability
      const willRain = Math.random() < dailyRainProbability;
      const precipitation = willRain ? Math.random() * 25 : 0;
      
      // Calculate humidity based on rain and temperature
      const humidity = willRain 
        ? 65 + Math.random() * 25 // 65-90% if raining
        : 40 + Math.random() * 30; // 40-70% if not raining
      
      // Wind speed tends to be higher on rainy days
      const windSpeed = willRain
        ? 10 + Math.random() * 20 // 10-30 km/h if raining
        : 5 + Math.random() * 10; // 5-15 km/h if not raining
      
      // Determine weather condition
      let condition;
      if (precipitation === 0) {
        condition = forecastTemp > 26 ? 'Sunny' : 'Partly Cloudy';
      } else if (precipitation < 5) {
        condition = 'Light Rain';
      } else if (precipitation < 15) {
        condition = 'Moderate Rain';
      } else {
        condition = 'Heavy Rain';
      }
      
      // Get date for this forecast day
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      forecast.push({
        day: i + 1,
        date: forecastDate.toISOString().split('T')[0],
        temperature: Math.round(forecastTemp * 10) / 10,
        temperatureMin: Math.round((forecastTemp - 3 - Math.random() * 2) * 10) / 10,
        temperatureMax: Math.round((forecastTemp + 3 + Math.random() * 2) * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeed * 10) / 10,
        condition,
        rainProbability: Math.round(dailyRainProbability * 100)
      });
    }
    
    return {
      location: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        name: "Sample Location" // In real implementation this would be resolved from coordinates
      },
      current: {
        temperature: forecast[0].temperature,
        condition: forecast[0].condition,
        humidity: forecast[0].humidity,
        windSpeed: forecast[0].windSpeed,
        precipitation: forecast[0].precipitation
      },
      forecast
    };
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw new Error('Failed to fetch weather forecast data');
  }
}

/**
 * Get historical weather data for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Historical weather data
 */
async function getHistoricalWeather(startDate, endDate) {
  try {
    // Mock implementation - would connect to weather history API in production
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const data = [];
    
    let currentDate = new Date(startDate);
    let tempTrend = 20 + Math.random() * 5; // Starting temperature trend
    
    for (let i = 0; i < days; i++) {
      // Randomize temperature with a trend
      tempTrend += (Math.random() * 2) - 1; // Trend changes by -1 to +1 degree
      const temp = tempTrend + (Math.random() * 4) - 2; // Daily variation of ±2 degrees
      
      // Randomize precipitation (25% chance of rain)
      const precipitation = Math.random() < 0.25 ? Math.random() * 20 : 0;
      
      data.push({
        date: new Date(currentDate),
        temperature: Math.round(temp * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        humidity: Math.round(50 + Math.random() * 30)
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
        } catch (error) {
    console.error('Error fetching historical weather:', error);
    throw new Error('Failed to fetch historical weather data');
  }
}

/**
 * Get irrigation recommendation based on weather data
 * @param {Object} weatherData - Current weather data
 * @returns {Promise<Object>} Irrigation recommendation
 */
async function getIrrigationRecommendation(weatherData) {
  try {
    // In a production app, this would use more sophisticated logic
    // For now, use simple rules based on weather
    
    // Default values
    let shouldWater = true;
    let waterAmount = 5; // liters per square meter
    let duration = 30; // minutes
    let startTime = new Date();
    startTime.setHours(6, 0, 0, 0); // Default to 6 AM
    
    // Adjust based on precipitation
    if (weatherData.precipitation > 0) {
      // If it's already raining, reduce watering
      waterAmount = Math.max(0, waterAmount - (weatherData.precipitation * 2));
      shouldWater = waterAmount > 1; // Only water if amount is significant
    }
    
    // Check forecast for rain
    const rainInForecast = weatherData.forecast.some(day => day.precipitation > 5);
    if (rainInForecast) {
      // If rain is coming, reduce watering
      waterAmount = Math.max(0, waterAmount - 2);
      shouldWater = waterAmount > 1;
    }
    
    // Adjust based on temperature
    if (weatherData.temperature > 30) {
      // Hot weather needs more water
      waterAmount += 2;
      // Water in early morning to reduce evaporation
      startTime.setHours(5, 0, 0, 0);
    } else if (weatherData.temperature < 15) {
      // Cool weather needs less water
      waterAmount -= 1;
    }
    
    // Adjust based on humidity
    if (weatherData.humidity > 70) {
      // High humidity means less evaporation
      waterAmount -= 1;
    } else if (weatherData.humidity < 40) {
      // Low humidity means more evaporation
      waterAmount += 1;
    }
    
    // Adjust duration based on water amount
    duration = Math.max(15, Math.round(waterAmount * 6));
    
    // Ensure water amount is positive
    waterAmount = Math.max(0, waterAmount);
    
    return {
      shouldWater,
      waterAmount,
      duration,
      startTime: startTime.toISOString(),
      reason: shouldWater 
        ? "Scheduled irrigation adjusted for weather conditions"
        : "Irrigation not needed due to current or upcoming precipitation"
    };
        } catch (error) {
    console.error('Error generating irrigation recommendation:', error);
    throw new Error('Failed to generate irrigation recommendation');
  }
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getHistoricalWeather,
  getIrrigationRecommendation
}; 