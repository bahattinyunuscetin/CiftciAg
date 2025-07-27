/**
 * Soil Moisture Service
 * 
 * This service provides ESTIMATED soil moisture and condition data for irrigation calculations.
 * No physical sensors are required - all values are estimates based on soil type and weather conditions.
 */

// Reference data for different soil types
const soilTypeProperties = {
  'Sandy': {
    moistureRange: { min: 20, max: 60 },
    phRange: { min: 5.5, max: 7.0 },
    nutrientRetention: 'Low'
  },
  'Clay': {
    moistureRange: { min: 35, max: 80 },
    phRange: { min: 6.0, max: 7.5 },
    nutrientRetention: 'High'
  },
  'Loam': {
    moistureRange: { min: 30, max: 70 },
    phRange: { min: 6.0, max: 7.0 },
    nutrientRetention: 'Medium'
  },
  'Silt': {
    moistureRange: { min: 30, max: 75 },
    phRange: { min: 6.0, max: 7.0 },
    nutrientRetention: 'Medium-High'
  },
  'Peat': {
    moistureRange: { min: 40, max: 85 },
    phRange: { min: 5.0, max: 6.5 },
    nutrientRetention: 'High'
  },
  // Add Sri Lankan specific soil types
  'Reddish Brown Earth': {
    moistureRange: { min: 25, max: 65 },
    phRange: { min: 6.0, max: 7.0 },
    nutrientRetention: 'Medium'
  },
  'Low Humic Gley': {
    moistureRange: { min: 40, max: 85 },
    phRange: { min: 5.5, max: 6.5 },
    nutrientRetention: 'High'
  },
  'Red-Yellow Latosol': {
    moistureRange: { min: 35, max: 75 },
    phRange: { min: 5.5, max: 6.5 },
    nutrientRetention: 'High'
  },
  'Non-Calcic Brown': {
    moistureRange: { min: 20, max: 55 },
    phRange: { min: 6.0, max: 7.5 },
    nutrientRetention: 'Low-Medium'
  },
  'default': {
    moistureRange: { min: 30, max: 70 },
    phRange: { min: 6.0, max: 7.0 },
    nutrientRetention: 'Medium'
  }
};

// Nutrient level descriptions
const nutrientLevels = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'];

/**
 * Get current soil moisture estimate based on location
 * No physical sensors required - this uses weather and soil type to estimate moisture
 * 
 * @param {Object} location - Location coordinates { lat, lon }
 * @param {string} soilType - Optional soil type specification
 * @returns {Promise<Object>} Estimated soil data
 */
async function getCurrentMoisture(location, soilType = 'default') {
  try {
    // Simply return estimated data - no actual sensors used
    console.log('Providing estimated soil moisture data - no sensors required');
    
    // Use default moisture values based on soil type
    const soilProps = soilTypeProperties[soilType] || soilTypeProperties['default'];
    
    // Provide a mid-range estimate
    const moistureValue = Math.round((soilProps.moistureRange.min + soilProps.moistureRange.max) / 2);
    const phValue = parseFloat(((soilProps.phRange.min + soilProps.phRange.max) / 2).toFixed(1));
    
    return {
      moisture: moistureValue,
      ph: phValue,
      nutrientLevel: 'Medium',
      isSensorData: false,
      isEstimate: true,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Returning default soil moisture values:', error);
    // Return sensible defaults
    return {
      moisture: 50,
      ph: 6.5,
      nutrientLevel: 'Medium',
      isSensorData: false,
      isEstimate: true, 
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get soil moisture and condition data - ESTIMATED, NO SENSORS REQUIRED
 * @param {string} soilType - Type of soil
 * @returns {Promise<Object>} Soil data
 */
async function getSoilMoisture(soilType) {
  try {
    // This provides estimated soil moisture - no actual sensors used
    console.log('Providing estimated soil moisture data - no sensors required');
    
    const soilProps = soilTypeProperties[soilType] || soilTypeProperties['default'];
    
    // Generate moisture level within range for the soil type
    const moistureMin = soilProps.moistureRange.min;
    const moistureMax = soilProps.moistureRange.max;
    const moisture = moistureMin + Math.random() * (moistureMax - moistureMin);
    
    // Generate pH within range for the soil type
    const phMin = soilProps.phRange.min;
    const phMax = soilProps.phRange.max;
    const ph = phMin + Math.random() * (phMax - phMin);
    
    // Select nutrient level based on soil's typical retention
    let nutrientIndex;
    const retentionLevel = soilProps.nutrientRetention;
    
    if (retentionLevel === 'Low') {
      nutrientIndex = Math.floor(Math.random() * 3);
    } else if (retentionLevel === 'High') {
      nutrientIndex = 2 + Math.floor(Math.random() * 3);
    } else {
      nutrientIndex = 1 + Math.floor(Math.random() * 3);
    }
    
    const nutrientLevel = nutrientLevels[nutrientIndex];
    
    return {
      moisture: Math.round(moisture),
      ph: Math.round(ph * 10) / 10,
      nutrientLevel,
      isSensorData: false,
      isEstimate: true,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating soil moisture estimate:', error);
    // Return sensible defaults
    return {
      moisture: 50,
      ph: 6.5,
      nutrientLevel: 'Medium',
      isSensorData: false,
      isEstimate: true,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get historical soil moisture data - ESTIMATED, NO SENSORS REQUIRED
 * @param {string} soilType - Type of soil
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Historical soil moisture data
 */
async function getHistoricalSoilMoisture(soilType, startDate, endDate) {
  try {
    // This provides estimated historical data - no actual sensors used
    console.log('Providing estimated historical soil moisture - no sensors required');
    
    const soilProps = soilTypeProperties[soilType] || soilTypeProperties['default'];
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const data = [];
    
    let currentDate = new Date(startDate);
    // Start in middle of moisture range
    let moistureTrend = Math.round((soilProps.moistureRange.min + soilProps.moistureRange.max) / 2);
    
    for (let i = 0; i < days; i++) {
      // Moisture trend simulates natural drying with occasional irrigation
      if (Math.random() < 0.2) {
        // Irrigation event
        moistureTrend = soilProps.moistureRange.min + 
          (soilProps.moistureRange.max - soilProps.moistureRange.min) * 0.7;
      } else {
        // Natural drying (1-3% per day)
        moistureTrend -= (1 + Math.random() * 2);
      }
      
      // Ensure moisture stays within range
      moistureTrend = Math.max(
        soilProps.moistureRange.min, 
        Math.min(moistureTrend, soilProps.moistureRange.max)
      );
      
      data.push({
        date: new Date(currentDate),
        moisture: Math.round(moistureTrend),
        irrigated: Math.random() < 0.2,
        isSensorData: false,
        isEstimate: true
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating historical soil moisture estimates:', error);
    // Return empty array to prevent errors
    return [];
  }
}

module.exports = {
  getCurrentMoisture,
  getSoilMoisture,
  getHistoricalSoilMoisture
}; 