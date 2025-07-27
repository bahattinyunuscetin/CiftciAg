/**
 * Smart Irrigation Scheduling Service
 * 
 * Provides advanced irrigation scheduling recommendations based on weather data,
 * crop type, soil conditions, and location information.
 */

const axios = require('axios');
const Weather = require('../models/Weather');
const weatherService = require('./weatherService');
const sriLankanIrrigation = require('./sriLankanIrrigationService');
const userService = require('./userService');
const User = require('../models/User');

// Replace existing crop factors with Sri Lanka dry zone specific crops
const CROP_FACTORS = {
  'Rice': {
    waterNeeds: 'High',
    rootDepth: 0.6, // meters
    stage: { initial: 1.15, development: 1.23, mid: 1.3, late: 0.9 },
    stressThreshold: 0.2, // Rice is sensitive to water stress
    growthDuration: { short: 90, medium: 120, long: 150 }, // days
    waterRequirement: { min: 7.5, max: 10 } // mm/day in dry zone
  },
  'Maize': {
    waterNeeds: 'Medium',
    rootDepth: 1.0,
    stage: { initial: 0.7, development: 0.85, mid: 1.05, late: 0.8 },
    stressThreshold: 0.5,
    growthDuration: { short: 90, medium: 110, long: 130 },
    waterRequirement: { min: 4.5, max: 6.5 }
  },
  'Mung Bean': {
    waterNeeds: 'Low-Medium',
    rootDepth: 0.6,
    stage: { initial: 0.5, development: 0.7, mid: 0.8, late: 0.5 },
    stressThreshold: 0.6,
    growthDuration: { short: 60, medium: 75, long: 90 },
    waterRequirement: { min: 3.0, max: 4.5 }
  },
  'Groundnut': {
    waterNeeds: 'Medium',
    rootDepth: 0.8,
    stage: { initial: 0.6, development: 0.75, mid: 0.95, late: 0.7 },
    stressThreshold: 0.4,
    growthDuration: { short: 90, medium: 110, long: 130 },
    waterRequirement: { min: 4.0, max: 6.0 }
  },
  'Chili': {
    waterNeeds: 'Medium-High',
    rootDepth: 0.7,
    stage: { initial: 0.6, development: 0.85, mid: 1.05, late: 0.9 },
    stressThreshold: 0.3,
    growthDuration: { short: 120, medium: 150, long: 180 },
    waterRequirement: { min: 5.0, max: 7.0 }
  },
  'Onion': {
    waterNeeds: 'Medium',
    rootDepth: 0.4,
    stage: { initial: 0.5, development: 0.75, mid: 1.0, late: 0.85 },
    stressThreshold: 0.3,
    growthDuration: { short: 100, medium: 120, long: 140 },
    waterRequirement: { min: 4.0, max: 6.0 }
  },
  'Cowpea': {
    waterNeeds: 'Low-Medium',
    rootDepth: 0.6,
    stage: { initial: 0.5, development: 0.7, mid: 0.9, late: 0.65 },
    stressThreshold: 0.55,
    growthDuration: { short: 60, medium: 75, long: 90 },
    waterRequirement: { min: 3.0, max: 4.5 }
  },
  'Sesame': {
    waterNeeds: 'Low',
    rootDepth: 0.8,
    stage: { initial: 0.4, development: 0.6, mid: 0.8, late: 0.55 },
    stressThreshold: 0.6,
    growthDuration: { short: 80, medium: 100, long: 120 },
    waterRequirement: { min: 2.5, max: 4.0 }
  },
  // Default values for unknown crops
  'default': {
    waterNeeds: 'Medium',
    rootDepth: 0.7,
    stage: { initial: 0.6, development: 0.8, mid: 1.0, late: 0.7 },
    stressThreshold: 0.5,
    growthDuration: { short: 90, medium: 120, long: 150 },
    waterRequirement: { min: 4.0, max: 6.0 }
  }
};

// Sri Lankan dry zone soil types
const SOIL_TYPES = {
  'Reddish Brown Earth': {
    texture: 'Sandy clay loam to clay loam',
    infiltrationRate: 12, // mm/hour
    fieldCapacity: 0.24, // volume fraction
    wiltingPoint: 0.12,
    availableWaterCapacity: 0.12,
    drainageRate: 'Moderate',
    waterRetention: 'Medium'
  },
  'Low Humic Gley': {
    texture: 'Clay loam to clay',
    infiltrationRate: 5,
    fieldCapacity: 0.38,
    wiltingPoint: 0.22,
    availableWaterCapacity: 0.16,
    drainageRate: 'Poor',
    waterRetention: 'High'
  },
  'Red-Yellow Latosol': {
    texture: 'Clay',
    infiltrationRate: 4,
    fieldCapacity: 0.36,
    wiltingPoint: 0.24,
    availableWaterCapacity: 0.12,
    drainageRate: 'Poor to moderate',
    waterRetention: 'High'
  },
  'Non-Calcic Brown': {
    texture: 'Sandy loam to sandy clay loam',
    infiltrationRate: 18,
    fieldCapacity: 0.18,
    wiltingPoint: 0.08,
    availableWaterCapacity: 0.10,
    drainageRate: 'Good',
    waterRetention: 'Low to medium'
  },
  'Grumusol': {
    texture: 'Clay',
    infiltrationRate: 3,
    fieldCapacity: 0.42,
    wiltingPoint: 0.25,
    availableWaterCapacity: 0.17,
    drainageRate: 'Very poor',
    waterRetention: 'Very high'
  },
  'Alluvial': {
    texture: 'Variable (loam to clay loam)',
    infiltrationRate: 15,
    fieldCapacity: 0.28,
    wiltingPoint: 0.14,
    availableWaterCapacity: 0.14,
    drainageRate: 'Moderate to good',
    waterRetention: 'Medium to high'
  },
  // Default values for unknown soil types
  'default': {
    texture: 'Loam',
    infiltrationRate: 10,
    fieldCapacity: 0.24,
    wiltingPoint: 0.12,
    availableWaterCapacity: 0.12,
    drainageRate: 'Moderate',
    waterRetention: 'Medium'
  }
};

// Sri Lankan dry zone specific irrigation schedules
const DRY_ZONE_IRRIGATION_SCHEDULES = {
  'Rice': {
    'Reddish Brown Earth': {
      landPreparation: { waterDepth: 100, duration: 15 }, // mm, days
      vegetative: { waterDepth: 50, interval: 3 }, // mm, days
      reproductive: { waterDepth: 70, interval: 2 },
      ripening: { waterDepth: 30, interval: 4 },
      totalWaterRequirement: 1200 // mm for growing season
    },
    'Low Humic Gley': {
      landPreparation: { waterDepth: 120, duration: 15 },
      vegetative: { waterDepth: 60, interval: 4 },
      reproductive: { waterDepth: 80, interval: 3 },
      ripening: { waterDepth: 40, interval: 5 },
      totalWaterRequirement: 1350
    }
  },
  'Maize': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 40, interval: 4 }, // mm, days
      vegetative: { waterAmount: 50, interval: 6 },
      flowering: { waterAmount: 60, interval: 5 },
      grain: { waterAmount: 40, interval: 7 },
      totalWaterRequirement: 550
    },
    'Non-Calcic Brown': {
      establishment: { waterAmount: 45, interval: 3 },
      vegetative: { waterAmount: 55, interval: 5 },
      flowering: { waterAmount: 65, interval: 4 },
      grain: { waterAmount: 45, interval: 6 },
      totalWaterRequirement: 600
    }
  },
  'Chili': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 30, interval: 3 },
      vegetative: { waterAmount: 40, interval: 4 },
      flowering: { waterAmount: 50, interval: 3 },
      fruiting: { waterAmount: 45, interval: 4 },
      totalWaterRequirement: 650
    },
    'Alluvial': {
      establishment: { waterAmount: 35, interval: 3 },
      vegetative: { waterAmount: 45, interval: 4 },
      flowering: { waterAmount: 55, interval: 3 },
      fruiting: { waterAmount: 50, interval: 4 },
      totalWaterRequirement: 700
    }
  },
  'Onion': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 25, interval: 2 },
      vegetative: { waterAmount: 35, interval: 3 },
      bulb: { waterAmount: 40, interval: 3 },
      maturity: { waterAmount: 30, interval: 4 },
      totalWaterRequirement: 450
    },
    'Non-Calcic Brown': {
      establishment: { waterAmount: 30, interval: 2 },
      vegetative: { waterAmount: 40, interval: 3 },
      bulb: { waterAmount: 45, interval: 3 },
      maturity: { waterAmount: 35, interval: 4 },
      totalWaterRequirement: 500
    }
  }
};

// Typical planting seasons for Sri Lanka dry zone
const PLANTING_SEASONS = {
  'Maha': { // October to March (Northeast monsoon)
    start: { month: 9, day: 15 }, // mid-September to mid-October is typical
    end: { month: 2, day: 15 },
    rainfall: 'Moderate to high',
    crops: ['Rice', 'Maize', 'Groundnut', 'Cowpea', 'Chili']
  },
  'Yala': { // April to September (Southwest monsoon)
    start: { month: 3, day: 15 }, // mid-March to mid-April is typical
    end: { month: 8, day: 15 },
    rainfall: 'Low to moderate',
    crops: ['Rice', 'Mung Bean', 'Cowpea', 'Onion', 'Chili', 'Sesame']
  }
};

// Function to get current season
const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  
  if (month >= 9 || month <= 2) {
    return 'Maha';
  } else {
    return 'Yala';
  }
};

// Modify the existing cropWaterNeeds and soilRetentionFactors with our new data
const cropWaterNeeds = {};
Object.keys(CROP_FACTORS).forEach(crop => {
  cropWaterNeeds[crop] = { 
    base: CROP_FACTORS[crop].waterRequirement.min * 5, // Convert to existing system units
    sensitivity: CROP_FACTORS[crop].stressThreshold 
  };
});

const soilRetentionFactors = {};
Object.keys(SOIL_TYPES).forEach(soil => {
  // Convert water retention description to factor
  let factor = 1.0;
  switch(SOIL_TYPES[soil].waterRetention) {
    case 'Very low': factor = 0.5; break;
    case 'Low': factor = 0.7; break;
    case 'Low to medium': factor = 0.85; break;
    case 'Medium': factor = 1.0; break;
    case 'Medium to high': factor = 1.15; break;
    case 'High': factor = 1.3; break;
    case 'Very high': factor = 1.5; break;
    default: factor = 1.0;
  }
  soilRetentionFactors[soil] = factor;
});

// Enhanced cache with TTL (Time To Live) functionality
class CacheManager {
  constructor(ttl = 60 * 60 * 1000) { // default 1 hour TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Create cache instances
const weatherCache = new CacheManager(60 * 60 * 1000); // 1 hour
const predictionCache = new CacheManager(30 * 60 * 1000); // 30 minutes

/**
 * Get weather data from cache or API
 * @param {Object} location - Location object with lat and lon
 * @returns {Promise<Object>} - Weather data
 */
const getWeatherData = async (location) => {
  const cacheKey = `${location.lat},${location.lon}`;
  const cachedData = weatherCache.get(cacheKey);
  
  // If we have valid cached data, return it
  if (cachedData) {
    console.log('Using cached weather data');
    return cachedData;
  }
  
  try {
    console.log('Fetching weather data for location:', location);
    
    // Use weatherService to get current weather
    const currentResponse = await weatherService.getCurrentWeather(location.lat, location.lon);
    
    // Use weatherService to get forecast
    const forecastResponse = await weatherService.getForecast(location.lat, location.lon);
    
    // Add soil moisture API integration if available
    let soilMoistureData = null;
    try {
      // This could be a call to a soil moisture sensor API or satellite data service
      soilMoistureData = await getSoilMoistureData(location);
    } catch (moistureError) {
      console.warn('Could not retrieve soil moisture data:', moistureError.message);
      // Continue without soil moisture data
    }
    
    const weatherData = {
      current: {
        temp: currentResponse.main.temp,
        humidity: currentResponse.main.humidity,
        wind_speed: currentResponse.wind.speed,
        uvi: currentResponse.uvi || 0,
        rain: currentResponse.rain ? currentResponse.rain['1h'] : 0,
        clouds: currentResponse.clouds ? currentResponse.clouds.all : 0,
        pressure: currentResponse.main.pressure,
        feels_like: currentResponse.main.feels_like,
        soilMoisture: soilMoistureData ? soilMoistureData.current : null
      },
      daily: forecastResponse.list
        .filter((item, index) => index % 8 === 0) // Get one forecast per day
        .map(item => ({
          dt: item.dt,
          temp: {
            day: item.main.temp,
            min: item.main.temp_min,
            max: item.main.temp_max
          },
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
          rain: item.rain ? item.rain['3h'] : 0,
          clouds: item.clouds ? item.clouds.all : 0,
          pressure: item.main.pressure,
          uvi: item.uvi || 0,
          soilMoisture: soilMoistureData ? 
            soilMoistureData.forecast.find(f => new Date(f.date).getDate() === new Date(item.dt * 1000).getDate())?.value : 
            null
        }))
    };
    
    weatherCache.set(cacheKey, weatherData);
    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Try to use Meteo.lk as fallback for Sri Lanka locations
    if (isInSriLanka(location)) {
      try {
        console.log('Attempting to use Meteo.lk as fallback');
        return await getMeteoLkData(location);
      } catch (fallbackError) {
        console.error('Fallback weather source also failed:', fallbackError);
      }
    }
    
    throw new Error(`Unable to retrieve weather data: ${error.message}`);
  }
};

/**
 * Check if location is in Sri Lanka for fallback weather source
 */
const isInSriLanka = (location) => {
  // Approximate bounding box for Sri Lanka
  return location.lat >= 5.8 && location.lat <= 9.9 && 
         location.lon >= 79.6 && location.lon <= 81.9;
};

/**
 * Get soil moisture data if available (from sensors or satellite data)
 * This is a placeholder for real soil moisture API integration
 */
const getSoilMoistureData = async (location) => {
  // Simulated soil moisture data - in a real system, this would call an API
  return {
    current: Math.random() * 0.3 + 0.2, // Random value between 0.2 and 0.5
    forecast: Array(7).fill(null).map((_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString(),
      value: Math.random() * 0.3 + 0.2
    }))
  };
};

/**
 * Process weather data from our database
 */
const processWeatherData = (weatherRecord) => {
  return {
    current: {
      temp: weatherRecord.temperature,
      humidity: weatherRecord.humidity,
      wind_speed: weatherRecord.windSpeed,
      uvi: weatherRecord.uvIndex || 0,
      rain: weatherRecord.precipitation || 0,
      clouds: weatherRecord.cloudCover || 0,
      pressure: weatherRecord.pressure || 1013,
      feels_like: weatherRecord.feelsLike || weatherRecord.temperature
    },
    daily: weatherRecord.forecast.map(day => ({
      dt: new Date(day.date).getTime() / 1000,
      temp: {
        day: day.temperature,
        min: day.minTemperature,
        max: day.maxTemperature
      },
      humidity: day.humidity,
      wind_speed: day.windSpeed,
      rain: day.precipitation || 0,
      clouds: day.cloudCover || 0,
      pressure: day.pressure || 1013,
      uvi: day.uvIndex || 0
    }))
  };
};

/**
 * Enhanced AI-based irrigation recommendation with machine learning simulation
 * In a real implementation, this would call a machine learning model API
 */
const getAIPrediction = (weatherData, cropTypeId, soilTypeId, cropData, soilData) => {
  try {
    // Cache key for prediction
    const cacheKey = `${cropTypeId}_${soilTypeId}_${JSON.stringify(weatherData.current)}`;
    const cachedPrediction = predictionCache.get(cacheKey);
    
    if (cachedPrediction) {
      console.log('Using cached AI prediction');
      return cachedPrediction;
    }
    
    console.log('Generating AI prediction for:', { cropTypeId, soilTypeId });
    
    // Get crop and soil data
    const cropInfo = cropData || CROP_FACTORS[cropTypeId] || CROP_FACTORS.default;
    const soilInfo = soilData || SOIL_TYPES[soilTypeId] || SOIL_TYPES.default;

    // Calculate reference evapotranspiration using FAO Penman-Monteith equation
    const et0 = calculatePenmanMonteithET(weatherData);
    
    // Determine crop growth stage (simulated - would come from user input in real app)
    const growthStage = determineGrowthStage(cropTypeId);
    
    // Calculate crop coefficient (Kc) based on growth stage
    const cropCoefficient = cropInfo.stage ? cropInfo.stage[growthStage] : 1.0;
    
    // Calculate crop evapotranspiration (ETc)
    const cropET = et0 * cropCoefficient;
    
    // Calculate available water in soil (if soil moisture data available)
    const availableWater = weatherData.current.soilMoisture ? 
      weatherData.current.soilMoisture * soilInfo.availableWaterCapacity :
      (soilInfo.fieldCapacity - soilInfo.wiltingPoint) * 0.5; // Assume 50% of capacity if no data
    
    // Calculate root zone depletion
    const rootZoneDepth = cropInfo.rootDepth;
    const totalAvailableWater = (soilInfo.fieldCapacity - soilInfo.wiltingPoint) * rootZoneDepth * 1000; // mm
    const currentDepletion = (1 - (availableWater / soilInfo.availableWaterCapacity)) * totalAvailableWater;
    
    // Account for effective rainfall
    const rainfall = weatherData.current.rain + (weatherData.daily[0]?.rain || 0);
    const effectiveRainfall = calculateEffectiveRainfall(rainfall, soilInfo);
    
    // Calculate net irrigation requirement
    const irrigationNeed = Math.max(0, currentDepletion - effectiveRainfall);
    
    // Adjustment factors
    let stressAllowance = cropInfo.stressThreshold;
    if (growthStage === 'mid') {
      // During mid-season, plants are most sensitive to water stress
      stressAllowance = Math.min(stressAllowance, 0.8);
    }
    
    // Apply water stress allowance
    const adjustedIrrigationNeed = irrigationNeed * (1 - stressAllowance);
    
    // Convert to duration in minutes based on application rate
    const applicationRate = 5; // mm/hour (typical sprinkler system)
    const durationMinutes = Math.round((adjustedIrrigationNeed / applicationRate) * 60);
    
    // Calculate water use efficiency
    const waterUseEfficiency = calculateWaterUseEfficiency(cropInfo, soilInfo, weatherData);
    
    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(weatherData);
    
    // Determine optimal irrigation timing based on weather forecast
    const optimalTime = determineOptimalIrrigationTime(weatherData);
    
    // Create recommendation result
    const recommendation = {
      irrigation_need_mm: Math.round(irrigationNeed * 10) / 10,
      duration_minutes: durationMinutes > 0 ? Math.max(15, Math.min(120, durationMinutes)) : 0,
      confidence_score: confidenceScore,
      water_efficiency: waterUseEfficiency,
      optimal_time: optimalTime,
      next_check: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      growth_stage: growthStage,
      evapotranspiration: {
        reference: Math.round(et0 * 100) / 100,
        crop: Math.round(cropET * 100) / 100
      },
      soil_conditions: {
        available_water: Math.round(availableWater * 100) / 100,
        depletion: Math.round(currentDepletion * 10) / 10
      },
      weather_factors: {
        temperature: weatherData.current.temp,
        humidity: weatherData.current.humidity,
        wind: weatherData.current.wind_speed,
        rainfall: rainfall,
        effective_rainfall: effectiveRainfall
      },
      basis: "AI_prediction"
    };
    
    // Store in cache
    predictionCache.set(cacheKey, recommendation);
    
    return recommendation;
  } catch (error) {
    console.error('AI prediction failed:', error);
    throw error;
  }
};

/**
 * Determine crop growth stage (simulated)
 * In a real app, this would be user input or calculated from planting date
 */
const determineGrowthStage = (cropType) => {
  // In a real app, this would be based on days since planting and crop-specific thresholds
  const stages = ['initial', 'development', 'mid', 'late'];
  const randomIndex = Math.floor(Math.random() * stages.length);
  return stages[randomIndex];
};

/**
 * Calculate water use efficiency
 */
const calculateWaterUseEfficiency = (cropInfo, soilInfo, weatherData) => {
  // Simplified calculation combining crop, soil and weather factors
  const cropFactor = cropInfo.waterRequirement / 6; // Normalize to 0-1 range
  const soilFactor = soilInfo.infiltrationRate / 25; // Normalize to 0-1 range
  const weatherFactor = Math.min(1, Math.max(0, (30 - weatherData.current.temp) / 20));
  
  return Math.round((cropFactor * 0.4 + soilFactor * 0.3 + weatherFactor * 0.3) * 100) / 100;
};

/**
 * Calculate effective rainfall (amount of rain actually usable by plants)
 */
const calculateEffectiveRainfall = (rainfall, soilInfo) => {
  if (rainfall <= 0) return 0;
  
  // Simplified model based on soil infiltration capacity
  const infiltrationCapacity = soilInfo.infiltrationRate * 24; // mm/day
  const runoffFactor = Math.min(1, infiltrationCapacity / Math.max(1, rainfall));
  
  return rainfall * runoffFactor * 0.8; // Assume 80% efficiency
};

/**
 * Determine optimal irrigation time based on weather forecast
 */
const determineOptimalIrrigationTime = (weatherData) => {
  // Avoid irrigation when it's expected to rain
  const rainExpected = weatherData.daily.slice(0, 2).some(day => day.rain > 5);
  if (rainExpected) {
    return "after_rain";
  }
  
  // Avoid irrigation during high wind periods
  const highWind = weatherData.current.wind_speed > 15;
  if (highWind) {
    return "low_wind";
  }
  
  // Prefer early morning or late evening to reduce evaporation
  const currentHour = new Date().getHours();
  if (currentHour >= 6 && currentHour <= 10) {
    return "morning";
  } else if (currentHour >= 17 && currentHour <= 21) {
    return "evening";
  } else {
    return "next_morning";
  }
};

/**
 * Calculate reference evapotranspiration using Penman-Monteith equation
 */
const calculatePenmanMonteithET = (weatherData) => {
  const temp = weatherData.current.temp;
  const humidity = weatherData.current.humidity;
  const windSpeed = weatherData.current.wind_speed;
  const solarRadiation = weatherData.current.uvi * 0.45; // Approximate from UV index
  const pressure = weatherData.current.pressure || 1013;
  const clouds = weatherData.current.clouds || 0;
  
  // Constants
  const ALBEDO = 0.23; // Reflection coefficient for reference crop
  const STEFAN_BOLTZMANN = 4.903e-9; // Stefan-Boltzmann constant [MJ K⁻⁴ m⁻² day⁻¹]
  
  // Saturation vapor pressure
  const satVaporPressure = 0.6108 * Math.exp(17.27 * temp / (temp + 237.3));
  
  // Actual vapor pressure
  const actualVaporPressure = satVaporPressure * (humidity / 100);
  
  // Slope of saturation vapor pressure curve
  const delta = 4098 * (0.6108 * Math.exp(17.27 * temp / (temp + 237.3))) / Math.pow((temp + 237.3), 2);
  
  // Psychrometric constant
  const psychrometric = 0.000665 * pressure;
  
  // Extraterrestrial radiation (simplified)
  let extraRadiation = 30; // Approximate average
  
  // Adjust for cloudiness
  const clearSkyFraction = (100 - clouds) / 100;
  
  // Net radiation
  const netRadiation = solarRadiation * (1 - ALBEDO) * clearSkyFraction;
  
  // Wind speed at 2m height (if given at different height)
  const wind2m = windSpeed;
  
  // Reference evapotranspiration (simplified Penman-Monteith)
  const numerator = 0.408 * delta * netRadiation + psychrometric * (900 / (temp + 273)) * wind2m * (satVaporPressure - actualVaporPressure);
  const denominator = delta + psychrometric * (1 + 0.34 * wind2m);
  
  const et0 = numerator / denominator;
  
  // Return in mm/day, ensuring reasonable values
  return Math.max(1, Math.min(15, et0));
};

/**
 * Calculate confidence score based on weather data quality
 */
const calculateConfidenceScore = (weatherData) => {
  let score = 0.7; // Base score
  
  // Deduct if important data is missing
  if (weatherData.current.uvi === undefined || weatherData.current.uvi === null) score -= 0.05;
  if (weatherData.current.soilMoisture === null) score -= 0.1;
  
  // Adjust based on forecast availability
  if (!weatherData.daily || weatherData.daily.length < 3) {
    score -= 0.1;
  } else if (weatherData.daily.length >= 5) {
    score += 0.05;
  }
  
  // Higher confidence if no rain coming (rainfall predictions are easier)
  const rainPredicted = weatherData.daily.some(day => day.rain > 0);
  if (!rainPredicted) score += 0.05;
  
  // Ensure score is between 0 and 1
  return Math.max(0.3, Math.min(0.95, score));
};

/**
 * Rule-based recommendations as fallback to AI
 */
const getRuleBasedRecommendation = (weatherData, cropTypeId, soilTypeId, cropData, soilData) => {
  try {
    // Get crop and soil type info
    const cropInfo = cropData || CROP_FACTORS[cropTypeId] || CROP_FACTORS.default;
    const soilInfo = soilData || SOIL_TYPES[soilTypeId] || SOIL_TYPES.default;
    
    // Get current weather and forecast
    const currentTemp = weatherData.current.temp;
    const currentHumidity = weatherData.current.humidity;
    const todayRain = weatherData.current.rain || 0;
    const tomorrowRain = weatherData.daily[0]?.rain || 0;
    
    // Basic irrigation logic
    let shouldIrrigate = true;
    let reason = 'Normal irrigation schedule';
    let duration = 30; // default 30 minutes
    
    // Don't irrigate if it's raining or about to rain
    if (todayRain > 5) {
      shouldIrrigate = false;
      reason = 'Rainfall detected today';
    } else if (tomorrowRain > 10) {
      shouldIrrigate = false;
      reason = 'Heavy rainfall expected tomorrow';
    }
    
    // Adjust for temperature and humidity
    if (shouldIrrigate) {
      if (currentTemp > 30) {
        duration += 10;
        reason = 'Increased due to high temperature';
      } else if (currentTemp < 15) {
        duration -= 10;
        reason = 'Decreased due to low temperature';
      }
      
      if (currentHumidity > 80) {
        duration -= 5;
        reason += ', high humidity';
      } else if (currentHumidity < 40) {
        duration += 5;
        reason += ', low humidity';
      }
    }
    
    // Adjust for soil type
    if (soilInfo.infiltrationRate < 10) {
      // Clay-like soils with low infiltration
      duration = Math.round(duration * 0.8);
      reason += ', clay-like soil';
    } else if (soilInfo.infiltrationRate > 20) {
      // Sandy soils with high infiltration
      duration = Math.round(duration * 1.3);
      reason += ', sandy soil';
    }
    
    // Adjust for crop water requirements
    duration = Math.round(duration * (cropInfo.waterRequirement / 5.0));
    
    return {
      irrigation_need_mm: duration * (5/60), // rough conversion from minutes to mm
      duration_minutes: shouldIrrigate ? Math.max(15, Math.min(90, duration)) : 0,
      confidence_score: 0.6, // Rule-based has lower confidence than AI
      optimal_time: 'morning',
      next_check: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      reason: reason,
      basis: "rule_based"
    };
  } catch (error) {
    console.error('Rule-based recommendation failed:', error);
    throw error;
  }
};

/**
 * Apply farmer feedback to improve future recommendations
 */
const applyFarmerFeedback = (recommendation, feedback) => {
  if (!feedback) return recommendation;
  
  let adjustedRecommendation = { ...recommendation };
  
  // Apply feedback to duration
  if (feedback.durationFeedback) {
    const durationAdjustment = feedback.durationFeedback === 'too_long' ? 0.8 : 
                              feedback.durationFeedback === 'too_short' ? 1.2 : 1.0;
    
    adjustedRecommendation.duration_minutes = Math.round(
      adjustedRecommendation.duration_minutes * durationAdjustment
    );
    
    adjustedRecommendation.feedback_applied = true;
  }
  
  // Apply timing feedback
  if (feedback.timingFeedback) {
    // Store timing preference for future recommendations
    adjustedRecommendation.preferred_time = feedback.timingFeedback;
    adjustedRecommendation.optimal_time = feedback.timingFeedback;
  }
  
  // Apply soil moisture feedback
  if (feedback.soilMoistureFeedback) {
    // Adjust irrigation need based on reported soil moisture
    const moistureAdjustment = feedback.soilMoistureFeedback === 'too_dry' ? 1.3 : 
                              feedback.soilMoistureFeedback === 'too_wet' ? 0.7 : 1.0;
    
    adjustedRecommendation.irrigation_need_mm = Math.round(
      adjustedRecommendation.irrigation_need_mm * moistureAdjustment * 10
    ) / 10;
    
    // Recalculate duration based on adjusted need
    if (!feedback.durationFeedback) {
      adjustedRecommendation.duration_minutes = Math.round(
        adjustedRecommendation.duration_minutes * moistureAdjustment
      );
    }
  }
  
  return adjustedRecommendation;
};

/**
 * Generate smart irrigation schedule
 * @param {Object} params
 * @param {Object} params.location - Location coordinates
 * @param {string} params.cropType - Type of crop
 * @param {string} params.soilType - Type of soil
 * @param {Object} params.feedback - Optional farmer feedback
 * @returns {Promise<Object>} Smart irrigation schedule
 */
const generateSmartSchedule = async (params) => {
  try {
    const { location, cropType, soilType, feedback } = params;
    
    // Validate location
    if (!location || !location.lat || !location.lon) {
      throw new Error('Valid location coordinates are required');
    }
    
    // Get weather data
    const weatherData = await getWeatherData(location);
    
    // Fetch crop and soil data from database or use defaults
    let cropData, soilData;
    try {
      // In a real implementation, this would fetch from the database
      const CropType = require('../models/CropType');
      const SoilType = require('../models/SoilType');
      
      if (cropType !== 'default') {
        const cropDoc = await CropType.findById(cropType);
        if (cropDoc) {
          cropData = {
            waterRequirement: cropDoc.waterRequirement,
            stressThreshold: cropDoc.stressThreshold,
            rootDepth: parseFloat(cropDoc.rootDepth) / 100 // convert to meters
          };
        }
      }
      
      if (soilType !== 'default') {
        const soilDoc = await SoilType.findById(soilType);
        if (soilDoc) {
          soilData = {
            fieldCapacity: soilDoc.fieldCapacity,
            wiltingPoint: soilDoc.wiltingPoint,
            infiltrationRate: soilDoc.infiltrationRate
          };
        }
      }
    } catch (dbError) {
      console.warn('Error fetching crop/soil data:', dbError.message);
      // Continue with default values
    }
    
    let recommendation;
    
    // Try AI prediction first
    try {
      recommendation = getAIPrediction(weatherData, cropType, soilType, cropData, soilData);
    } catch (aiError) {
      console.warn('AI prediction failed, falling back to rule-based:', aiError.message);
      recommendation = getRuleBasedRecommendation(weatherData, cropType, soilType, cropData, soilData);
    }
    
    // Apply farmer feedback if provided
    if (feedback) {
      recommendation = applyFarmerFeedback(recommendation, feedback);
    }
    
    // Create schedule response
    const scheduleResponse = {
      location: {
        lat: location.lat,
        lon: location.lon
      },
      timestamp: new Date().toISOString(),
      recommendation: recommendation,
      weather: {
        current: {
          temperature: weatherData.current.temp,
          humidity: weatherData.current.humidity,
          conditions: getWeatherCondition(weatherData.current),
          rain_chance: calculateRainChance(weatherData)
        },
        forecast: weatherData.daily.slice(0, 3).map(day => ({
          date: new Date(day.dt * 1000).toISOString().split('T')[0],
          temperature: day.temp.day,
          humidity: day.humidity,
          conditions: getWeatherCondition(day),
          rain_chance: day.rain > 0 ? Math.min(95, day.rain * 10) : 10
        }))
      }
    };
    
    // Store schedule history in database (would be implemented in real app)
    // await storeScheduleHistory(scheduleResponse);
    
    return scheduleResponse;
  } catch (error) {
    console.error('Failed to generate smart schedule:', error);
    
    // Add more specific error handling with status codes
    if (error.message.includes('weather data')) {
      error.status = 424; // Failed dependency - weather service is down
    }
    
    throw error;
  }
};

/**
 * Get weather condition description
 */
const getWeatherCondition = (weatherData) => {
  if (weatherData.rain > 10) return 'Heavy Rain';
  if (weatherData.rain > 0) return 'Light Rain';
  
  if (weatherData.clouds > 80) return 'Cloudy';
  if (weatherData.clouds > 40) return 'Partly Cloudy';
  
  if (weatherData.temp > 32) return 'Hot';
  if (weatherData.temp < 15) return 'Cool';
  
  return 'Clear';
};

/**
 * Calculate rain chance
 */
const calculateRainChance = (weatherData) => {
  if (weatherData.current.rain > 0) return 100;
  
  // Check humidity and clouds
  const humidityFactor = Math.min(1, (weatherData.current.humidity - 50) / 50);
  const cloudFactor = weatherData.current.clouds / 100;
  
  let rainChance = humidityFactor * 30 + cloudFactor * 40;
  
  // Check if any rain in forecast
  if (weatherData.daily.some(day => day.rain > 0)) {
    rainChance += 20;
  }
  
  return Math.round(Math.min(95, Math.max(0, rainChance)));
};

/**
 * Get weather data from Meteo.lk API (Fallback for Sri Lanka locations)
 * This is a placeholder for a real API integration
 */
const getMeteoLkData = async (location) => {
  try {
    console.log(`Fetching Meteo.lk data for ${location.lat}, ${location.lon}`);
    
    // In a real implementation, this would call the Meteo.lk API
    // For now, generate mock data that matches the expected format
    
    const currentTemp = 28 + (Math.random() * 4) - 2; // 26-32°C typical for Sri Lanka
    const currentHumidity = 70 + (Math.random() * 20) - 10; // 60-90% typical for Sri Lanka
    const currentWindSpeed = 5 + Math.random() * 10; // 5-15 km/h
    
    // Higher chance of rain in Sri Lanka
    const isRaining = Math.random() < 0.4;
    const currentPrecipitation = isRaining ? Math.random() * 20 : 0;
    
    // Generate daily forecast
    const daily = [];
    let forecastTemp = currentTemp;
    
    for (let i = 0; i < 7; i++) {
      forecastTemp += (Math.random() * 2) - 1; // Small daily variations
      
      const willRain = Math.random() < 0.4; // 40% chance of rain each day
      const precipitation = willRain ? Math.random() * 30 : 0;
      
      daily.push({
        dt: Math.floor(Date.now() / 1000) + (i * 86400), // Unix timestamp for each day
        temp: {
          day: forecastTemp,
          min: forecastTemp - 2 - Math.random(),
          max: forecastTemp + 2 + Math.random()
        },
        humidity: 70 + (Math.random() * 20) - 10,
        wind_speed: 5 + Math.random() * 10,
        rain: precipitation,
        clouds: Math.round(precipitation > 0 ? 50 + Math.random() * 50 : Math.random() * 40),
        pressure: 1010 + Math.random() * 8,
        uvi: 8 + Math.random() * 4 // Sri Lanka has high UV index
      });
    }
    
    return {
      current: {
        temp: currentTemp,
        humidity: currentHumidity,
        wind_speed: currentWindSpeed,
        rain: currentPrecipitation,
        clouds: Math.round(currentPrecipitation > 0 ? 60 + Math.random() * 40 : Math.random() * 50),
        pressure: 1010 + Math.random() * 8,
        feels_like: currentTemp + (currentHumidity > 80 ? 2 + Math.random() * 2 : 0),
        uvi: 8 + Math.random() * 4
      },
      daily
    };
  } catch (error) {
    console.error('Error fetching Meteo.lk data:', error);
    throw new Error(`Failed to fetch Meteo.lk data: ${error.message}`);
  }
};

/**
 * Get irrigation recommendation based on sensor data, weather, and crop/soil type
 */
async function getIrrigationRecommendation(userId, sensorData, cropType, soilType, fieldSize, plantingDate) {
    try {
        // Get latest weather data for the user's location
        const weatherData = await weatherService.getCurrentWeather(userId);
        
        console.log(`Generating irrigation recommendation for ${cropType} on ${soilType} soil (${fieldSize} sq.m)`);
        
        // Use Sri Lankan specific irrigation service if enabled in user preferences
        const user = await userService.getUserById(userId);
        const useLocalizedData = user?.preferences?.useLocalizedData || false;
        const region = user?.preferences?.region || 'default';
        
        if (useLocalizedData && region.toLowerCase().includes('sri lanka')) {
            console.log('Using Sri Lankan irrigation schedules for recommendation');
            return sriLankanIrrigation.getIrrigationRecommendation(
                cropType, 
                soilType, 
                fieldSize, 
                weatherData, 
                sensorData, 
                plantingDate
            );
        }
        
        // Otherwise use standard recommendation algorithm
        // ... existing recommendation code ...
    } catch (error) {
        console.error('Error getting irrigation recommendation:', error);
        throw new Error('Failed to get irrigation recommendation');
    }
}

/**
 * Get available crop types based on region
 */
async function getCropTypes(userId) {
    try {
        // Get user preferences to check region
        const user = await userService.getUserById(userId);
        const useLocalizedData = user?.preferences?.useLocalizedData || false;
        const region = user?.preferences?.region || 'default';
        
        if (useLocalizedData && region.toLowerCase().includes('sri lanka')) {
            console.log('Returning Sri Lankan crop types');
            // Return crop types specific to Sri Lanka
            return Object.keys(sriLankanIrrigation.CROP_FACTORS).map(cropName => ({
                name: cropName,
                waterNeed: sriLankanIrrigation.CROP_FACTORS[cropName].waterNeed,
                growthDuration: sriLankanIrrigation.CROP_FACTORS[cropName].growthDuration,
                waterRequirement: sriLankanIrrigation.CROP_FACTORS[cropName].waterRequirement
            }));
        }
        
        // Return default crop types if not using localized data
        return [
            { name: 'Corn', waterNeed: 'medium' },
            { name: 'Wheat', waterNeed: 'medium' },
            { name: 'Tomato', waterNeed: 'high' },
            { name: 'Potato', waterNeed: 'medium' },
            { name: 'Lettuce', waterNeed: 'high' },
            { name: 'Soybean', waterNeed: 'low' },
            { name: 'Cotton', waterNeed: 'low' }
        ];
    } catch (error) {
        console.error('Error getting crop types:', error);
        throw new Error('Failed to get crop types');
    }
}

/**
 * Get available soil types based on region
 */
async function getSoilTypes(userId) {
    try {
        // Get user preferences to check region
        const user = await userService.getUserById(userId);
        const useLocalizedData = user?.preferences?.useLocalizedData || false;
        const region = user?.preferences?.region || 'default';
        
        if (useLocalizedData && region.toLowerCase().includes('sri lanka')) {
            console.log('Returning Sri Lankan soil types');
            // Return soil types specific to Sri Lanka's dry zone
            return Object.entries(sriLankanIrrigation.DRY_ZONE_SOIL_TYPES).map(([name, properties]) => ({
                name: name,
                texture: properties.texture,
                waterRetention: properties.waterRetention,
                drainageRate: properties.drainageRate,
            }));
        }
        
        // Return default soil types if not using localized data
        return [
            { name: 'Clay', waterRetention: 'high', drainageRate: 'slow' },
            { name: 'Sandy', waterRetention: 'low', drainageRate: 'fast' },
            { name: 'Loam', waterRetention: 'medium', drainageRate: 'medium' },
            { name: 'Silt', waterRetention: 'medium-high', drainageRate: 'slow-medium' },
            { name: 'Peat', waterRetention: 'high', drainageRate: 'medium' }
        ];
    } catch (error) {
        console.error('Error getting soil types:', error);
        throw new Error('Failed to get soil types');
    }
}

/**
 * Get user's current growing season based on their preferences and location
 * 
 * @param {string} userId - User ID to get preferences
 * @returns {Promise<object>} Season information
 */
async function getUserCurrentSeason(userId) {
  try {
    // Get user preferences to check for region
    const user = await User.findById(userId);
    
    // Use Sri Lankan data if user has selected it
    if (user?.preferences?.useLocalizedData && 
        user?.preferences?.region?.includes('sri_lanka')) {
      const currentSeason = sriLankanIrrigation.getCurrentSeason();
      return {
        name: currentSeason,
        ...sriLankanIrrigation.DRY_ZONE_SEASONS[currentSeason]
      };
    }
    
    // Otherwise determine season based on month
    const month = new Date().getMonth();
    
    if ([2, 3, 4].includes(month)) {
      return { name: 'Spring', description: 'Spring growing season' };
    } else if ([5, 6, 7].includes(month)) {
      return { name: 'Summer', description: 'Summer growing season' };
    } else if ([8, 9, 10].includes(month)) {
      return { name: 'Fall', description: 'Fall growing season' };
    } else {
      return { name: 'Winter', description: 'Winter growing season' };
    }
  } catch (error) {
    console.error('Error determining current season:', error);
    return { name: 'Unknown', description: 'Unable to determine current season' };
  }
}

module.exports = {
  generateSmartSchedule,
  getAIPrediction,
  getRuleBasedRecommendation,
  getIrrigationRecommendation,
  getCropTypes,
  getSoilTypes,
  getUserCurrentSeason,
  getIrrigationSchedule: (cropType, soilType) => {
    // Existing function implementation
  },
  submitIrrigationFeedback: (irrigationId, rating, comments) => {
    // Existing function implementation  
  },
  getIrrigationHistory: (userId, startDate, endDate) => {
    // Existing function implementation
  },
  getIrrigationAnalytics: (userId, period) => {
    // Existing function implementation
  }
}; 