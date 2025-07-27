/**
 * Sri Lankan Irrigation Service for the Dry Zone
 * 
 * This service provides specialized irrigation recommendations for crops
 * grown in Sri Lanka's dry zone, taking into account local soil types,
 * seasonal patterns (Maha and Yala), and traditional farming practices.
 */

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
  },
  'Mung Bean': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 25, interval: 3 },
      vegetative: { waterAmount: 35, interval: 5 },
      flowering: { waterAmount: 45, interval: 4 },
      podFilling: { waterAmount: 35, interval: 5 },
      totalWaterRequirement: 350
    },
    'Non-Calcic Brown': {
      establishment: { waterAmount: 30, interval: 3 },
      vegetative: { waterAmount: 40, interval: 4 },
      flowering: { waterAmount: 50, interval: 3 },
      podFilling: { waterAmount: 40, interval: 4 },
      totalWaterRequirement: 400
    }
  },
  'Cowpea': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 25, interval: 3 },
      vegetative: { waterAmount: 35, interval: 5 },
      flowering: { waterAmount: 45, interval: 4 },
      podFilling: { waterAmount: 35, interval: 5 },
      totalWaterRequirement: 350
    }
  },
  'Groundnut': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 30, interval: 3 },
      vegetative: { waterAmount: 40, interval: 5 },
      flowering: { waterAmount: 50, interval: 4 },
      podFilling: { waterAmount: 45, interval: 5 },
      totalWaterRequirement: 500
    }
  },
  'Sesame': {
    'Reddish Brown Earth': {
      establishment: { waterAmount: 20, interval: 3 },
      vegetative: { waterAmount: 30, interval: 6 },
      flowering: { waterAmount: 40, interval: 5 },
      seedFilling: { waterAmount: 30, interval: 6 },
      totalWaterRequirement: 300
    }
  }
};

// Crop factors for calculations (when specific schedule not available)
const CROP_FACTORS = {
  'Rice': { 
    waterNeed: 'high', 
    rootDepth: 'shallow',
    growthStages: ['establishment', 'vegetative', 'reproductive', 'ripening'],
    stressThreshold: 0.2, // fraction of available soil water
    growthDuration: 120, // days
    waterRequirement: 1200 // mm per season
  },
  'Maize': { 
    waterNeed: 'medium', 
    rootDepth: 'medium',
    growthStages: ['establishment', 'vegetative', 'flowering', 'grain'],
    stressThreshold: 0.5,
    growthDuration: 100,
    waterRequirement: 500
  },
  'Mung Bean': { 
    waterNeed: 'low', 
    rootDepth: 'medium',
    growthStages: ['establishment', 'vegetative', 'flowering', 'podFilling'],
    stressThreshold: 0.6,
    growthDuration: 65,
    waterRequirement: 350
  },
  'Groundnut': { 
    waterNeed: 'medium', 
    rootDepth: 'medium',
    growthStages: ['establishment', 'vegetative', 'flowering', 'podFilling'],
    stressThreshold: 0.5,
    growthDuration: 110,
    waterRequirement: 500
  },
  'Chili': { 
    waterNeed: 'medium', 
    rootDepth: 'medium',
    growthStages: ['establishment', 'vegetative', 'flowering', 'fruiting'],
    stressThreshold: 0.4,
    growthDuration: 150,
    waterRequirement: 650
  },
  'Onion': { 
    waterNeed: 'medium', 
    rootDepth: 'shallow',
    growthStages: ['establishment', 'vegetative', 'bulb', 'maturity'],
    stressThreshold: 0.3,
    growthDuration: 120,
    waterRequirement: 450
  },
  'Cowpea': { 
    waterNeed: 'low', 
    rootDepth: 'medium',
    growthStages: ['establishment', 'vegetative', 'flowering', 'podFilling'],
    stressThreshold: 0.6,
    growthDuration: 75,
    waterRequirement: 350
  },
  'Sesame': { 
    waterNeed: 'low', 
    rootDepth: 'deep',
    growthStages: ['establishment', 'vegetative', 'flowering', 'seedFilling'],
    stressThreshold: 0.7,
    growthDuration: 90,
    waterRequirement: 300
  }
};

// Soil characteristics specific to Sri Lanka's dry zone
const DRY_ZONE_SOIL_TYPES = {
  'Reddish Brown Earth': {
    texture: 'loamy',
    infiltrationRate: 15, // mm/hour
    fieldCapacity: 0.25, // volume fraction
    wiltingPoint: 0.1,
    availableWaterCapacity: 0.15,
    drainageRate: 'moderate',
    waterRetention: 'medium'
  },
  'Low Humic Gley': {
    texture: 'clay loam',
    infiltrationRate: 8,
    fieldCapacity: 0.32,
    wiltingPoint: 0.15,
    availableWaterCapacity: 0.17,
    drainageRate: 'poor',
    waterRetention: 'high'
  },
  'Red-Yellow Latosol': {
    texture: 'clay',
    infiltrationRate: 5,
    fieldCapacity: 0.35,
    wiltingPoint: 0.18,
    availableWaterCapacity: 0.17,
    drainageRate: 'moderate',
    waterRetention: 'high'
  },
  'Non-Calcic Brown': {
    texture: 'sandy loam',
    infiltrationRate: 25,
    fieldCapacity: 0.18,
    wiltingPoint: 0.08,
    availableWaterCapacity: 0.1,
    drainageRate: 'rapid',
    waterRetention: 'low'
  },
  'Grumusol': {
    texture: 'heavy clay',
    infiltrationRate: 3,
    fieldCapacity: 0.4,
    wiltingPoint: 0.2,
    availableWaterCapacity: 0.2,
    drainageRate: 'very poor',
    waterRetention: 'very high'
  },
  'Alluvial': {
    texture: 'silty loam',
    infiltrationRate: 20,
    fieldCapacity: 0.28,
    wiltingPoint: 0.12,
    availableWaterCapacity: 0.16,
    drainageRate: 'good',
    waterRetention: 'medium'
  }
};

// Seasonal information for Sri Lanka's dry zone
const DRY_ZONE_SEASONS = {
  'Maha': {
    months: [9, 10, 11, 0, 1, 2], // Oct-Mar (0=Jan)
    rainfall: 'moderate to high',
    mainCrops: ['Rice', 'Maize', 'Groundnut', 'Chili'],
    irrigationNeed: 'supplementary',
    description: 'Main cultivation season with Northeast monsoon rains'
  },
  'Yala': {
    months: [3, 4, 5, 6, 7, 8], // Apr-Sep
    rainfall: 'low to moderate',
    mainCrops: ['Rice', 'Mung Bean', 'Cowpea', 'Onion', 'Chili'],
    irrigationNeed: 'essential',
    description: 'Secondary cultivation season relying heavily on irrigation'
  }
};

/**
 * Determine current cultivation season in Sri Lanka
 * 
 * @returns {string} Current season ('Maha' or 'Yala')
 */
const getDetermineSeason = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  
  if (month >= 9 || month <= 2) {
    return 'Maha'; // October to March (Northeast monsoon)
  } else {
    return 'Yala'; // April to September (Southwest monsoon)
  }
};

/**
 * Determine growth stage based on planting date
 * 
 * @param {string} cropType - Type of crop
 * @param {string} plantingDate - Date the crop was planted (ISO string)
 * @returns {string} Current growth stage
 */
const determineGrowthStage = (cropType, plantingDate) => {
  if (!plantingDate) {
    // If no planting date provided, make educated guess based on season
    return estimateGrowthStageFromSeason(cropType, getDetermineSeason());
  }
  
  const today = new Date();
  const plantDate = new Date(plantingDate);
  const daysSincePlanting = Math.floor((today - plantDate) / (1000 * 60 * 60 * 24));
  
  // Get crop info
  const cropInfo = CROP_FACTORS[cropType];
  if (!cropInfo) {
    console.warn(`No crop factors available for ${cropType}, using generic stages`);
    // Generic stages if crop type not specifically handled
    if (daysSincePlanting < 15) return 'establishment';
    if (daysSincePlanting < 45) return 'vegetative';
    if (daysSincePlanting < 75) return 'reproductive';
    return 'maturity';
  }
  
  // Calculate proportions of growth duration
  const totalDuration = cropInfo.growthDuration;
  const progress = daysSincePlanting / totalDuration;
  
  // Determine stage based on progress through growth cycle
  if (progress < 0.2) return cropInfo.growthStages[0]; // First 20% of growth
  if (progress < 0.5) return cropInfo.growthStages[1]; // 20-50% of growth
  if (progress < 0.8) return cropInfo.growthStages[2]; // 50-80% of growth
  return cropInfo.growthStages[3]; // Final stage
};

/**
 * Estimate growth stage from current season when planting date is unknown
 * 
 * @param {string} cropType - Type of crop
 * @param {string} season - Current season ('Maha' or 'Yala')
 * @returns {string} Estimated growth stage
 */
const estimateGrowthStageFromSeason = (cropType, season) => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  
  // Get crop stages
  const cropInfo = CROP_FACTORS[cropType];
  let stages = ['establishment', 'vegetative', 'reproductive', 'maturity'];
  if (cropInfo && cropInfo.growthStages) {
    stages = cropInfo.growthStages;
  }
  
  if (season === 'Maha') {
    // Maha season (October to March)
    if (month >= 9 && month <= 10) return stages[0]; // Oct-Nov: early season
    if (month >= 11 || month === 0) return stages[1]; // Dec-Jan: mid season
    if (month >= 1 && month <= 2) return stages[2]; // Feb-Mar: late season
  } else {
    // Yala season (April to September)
    if (month >= 3 && month <= 4) return stages[0]; // Apr-May: early season
    if (month >= 5 && month <= 6) return stages[1]; // Jun-Jul: mid season
    if (month >= 7 && month <= 8) return stages[2]; // Aug-Sep: late season
  }
  
  return stages[1]; // Default to vegetative stage if cannot determine
};

/**
 * Generate irrigation recommendation based on inputs
 * 
 * @param {string} cropType - Type of crop
 * @param {string} soilType - Type of soil
 * @param {number} fieldSize - Size of the field in square meters
 * @param {object} weatherData - Current and forecast weather data
 * @param {object} soilData - Current soil moisture and condition data
 * @param {string} plantingDate - Date the crop was planted (ISO string)
 * @returns {object} Irrigation recommendation
 */
async function getIrrigationRecommendation(cropType, soilType, fieldSize, weatherData, soilData, plantingDate) {
  try {
    console.log(`Generating Sri Lankan irrigation recommendation for ${cropType} on ${soilType} soil (${fieldSize} sq.m)`);
    
    // Standardize crop and soil type keys
    const cropKey = cropType.charAt(0).toUpperCase() + cropType.slice(1);
    const soilKey = soilType.charAt(0).toUpperCase() + soilType.slice(1);
    
    // Check if we have a predefined schedule for this crop and soil combination
    if (!DRY_ZONE_IRRIGATION_SCHEDULES[cropKey] ||
        !DRY_ZONE_IRRIGATION_SCHEDULES[cropKey][soilKey]) {
      console.log(`No specific schedule found for ${cropKey} on ${soilKey}, using algorithmic approach`);
      return generateAlgorithmicRecommendation(cropType, soilType, fieldSize, weatherData, soilData, plantingDate);
    }
    
    // Use the Sri Lankan dry zone specific schedules
    const schedule = DRY_ZONE_IRRIGATION_SCHEDULES[cropKey][soilKey];
    const currentSeason = getDetermineSeason();
    const growthStage = determineGrowthStage(cropKey, plantingDate);
    console.log(`Current season: ${currentSeason}, Growth stage: ${growthStage}`);
    
    // Get schedule parameters for current growth stage
    let stageSchedule = {};
    if (cropKey === 'Rice') {
      // Rice has specific stages
      if (growthStage === 'establishment') stageSchedule = schedule.landPreparation;
      else if (growthStage === 'vegetative') stageSchedule = schedule.vegetative;
      else if (growthStage === 'reproductive') stageSchedule = schedule.reproductive;
      else stageSchedule = schedule.ripening;
    } else {
      // Other crops use standard stages
      if (schedule[growthStage]) {
        stageSchedule = schedule[growthStage];
      } else {
        // Fallback to closest stage if exact match not found
        const stages = Object.keys(schedule).filter(key => 
          key !== 'totalWaterRequirement');
        if (stages.length > 0) {
          stageSchedule = schedule[stages[0]];
        }
      }
    }
    
    // Calculate base water amount from schedule
    let waterAmount = cropKey === 'Rice' ? stageSchedule.waterDepth : stageSchedule.waterAmount;
    let intervalDays = stageSchedule.interval || 3; // Default to 3 days if not specified
    
    // Adjust for current weather conditions
    // Temperature adjustment
    const tempFactor = 1 + ((weatherData.temperature - 28) * 0.03); // Baseline 28°C for dry zone
    waterAmount *= tempFactor;
    
    // Humidity adjustment
    const humidityFactor = 1 - (weatherData.humidity * 0.003); // Lower factor for humid conditions
    waterAmount *= humidityFactor;
    
    // Precipitation adjustment
    if (weatherData.precipitation > 5) {
      // Significant rainfall - reduce irrigation
      const precipitationReduction = Math.min(0.8, weatherData.precipitation / waterAmount);
      waterAmount *= (1 - precipitationReduction);
      
      // Maybe skip irrigation if precipitation is substantial
      if (weatherData.precipitation > waterAmount * 0.7) {
        return {
          shouldIrrigate: false,
          waterAmount: 0,
          duration: 0,
          nextIrrigation: new Date(Date.now() + intervalDays * 86400000).toISOString(),
          reason: `Natural rainfall of ${weatherData.precipitation}mm is sufficient. Next scheduled irrigation in ${intervalDays} days.`,
          confidence: 85,
          waterSavings: 100,
          tips: generateDryZoneTips(cropType, soilType, weatherData, currentSeason)
        };
      }
    }
    
    // Adjust for soil moisture if data available
    if (soilData && soilData.moisture) {
      // Soil moisture is typically reported as percentage
      const soilMoistureReduction = Math.min(0.5, soilData.moisture / 100);
      waterAmount *= (1 - soilMoistureReduction);
    }
    
    // Ensure minimum threshold met
    waterAmount = Math.max(waterAmount, 5); // Minimum 5mm
    
    // Round for presentation
    waterAmount = Math.round(waterAmount * 10) / 10;
    
    // Calculate duration based on application rate
    // Typical application rates:
    // - Drip: 2-4 mm/hour
    // - Sprinkler: 5-15 mm/hour
    // - Flood: 30-50 mm/hour
    const applicationType = cropKey === 'Rice' ? 'flood' : 'sprinkler';
    const applicationRate = applicationType === 'drip' ? 3 : 
                           applicationType === 'sprinkler' ? 10 : 40;
    
    const duration = Math.ceil(waterAmount / applicationRate * 60); // Convert to minutes
    
    // Calculate water savings compared to traditional practices
    // Traditional methods often over-irrigate by 30-50%
    const traditionalAmount = cropKey === 'Rice' ? 
      stageSchedule.waterDepth * 1.4 : stageSchedule.waterAmount * 1.3;
    const waterSavings = Math.round(((traditionalAmount - waterAmount) / traditionalAmount) * 100);
    
    // Determine optimal start time (early morning for most crops, avoid middle of day)
    const startTime = new Date();
    startTime.setHours(6, 0, 0, 0); // 6:00 AM default
    
    // If it's already past 6 AM, schedule for tomorrow
    if (new Date().getHours() >= 6) {
      startTime.setDate(startTime.getDate() + 1);
    }
    
    // Adjust for rice which can be irrigated throughout the day
    if (cropKey === 'Rice') {
      // If afternoon now, can still irrigate today
      if (new Date().getHours() >= 6 && new Date().getHours() < 16) {
        startTime.setDate(startTime.getDate() - 1); // Set back to today
        startTime.setHours(17, 0, 0, 0); // 5:00 PM
      }
    }
    
    // Generate recommendation
    return {
      shouldIrrigate: true,
      waterAmount: waterAmount,
      duration: duration,
      intervalDays: intervalDays,
      startTime: startTime.toISOString(),
      growthStage: growthStage,
      season: currentSeason,
      waterSavings: waterSavings,
      confidence: 90,
      applicationType: applicationType,
      tips: generateDryZoneTips(cropType, soilType, weatherData, currentSeason)
    };
  } catch (error) {
    console.error('Error generating Sri Lankan irrigation recommendation:', error);
    // Fallback to standard algorithm
    return generateAlgorithmicRecommendation(cropType, soilType, fieldSize, weatherData, soilData, plantingDate);
  }
}

/**
 * Fallback method using algorithmic approach when specific schedules aren't available
 */
function generateAlgorithmicRecommendation(cropType, soilType, fieldSize, weatherData, soilData, plantingDate) {
  try {
    console.log(`Using algorithmic approach for ${cropType} on ${soilType}`);
    
    // Standardize keys
    const cropKey = cropType.charAt(0).toUpperCase() + cropType.slice(1);
    const soilKey = soilType.charAt(0).toUpperCase() + soilType.slice(1);
    
    // Get crop factors
    const cropInfo = CROP_FACTORS[cropKey] || {
      waterNeed: 'medium',
      rootDepth: 'medium',
      stressThreshold: 0.5,
      growthDuration: 100,
      waterRequirement: 500
    };
    
    // Get soil properties
    const soilInfo = DRY_ZONE_SOIL_TYPES[soilKey] || {
      fieldCapacity: 0.25,
      wiltingPoint: 0.1,
      availableWaterCapacity: 0.15,
      drainageRate: 'moderate'
    };
    
    // Determine growth stage
    const growthStage = determineGrowthStage(cropKey, plantingDate);
    const currentSeason = getDetermineSeason();
    
    // Base water amount depending on crop water need
    let baseWaterAmount;
    switch(cropInfo.waterNeed) {
      case 'high': baseWaterAmount = 40; break;
      case 'medium': baseWaterAmount = 25; break;
      case 'low': baseWaterAmount = 15; break;
      default: baseWaterAmount = 25;
    }
    
    // Adjust for growth stage
    let stageMultiplier;
    switch(growthStage) {
      case 'establishment': stageMultiplier = 0.8; break;
      case 'vegetative': stageMultiplier = 1.0; break;
      case 'reproductive':
      case 'flowering': stageMultiplier = 1.2; break;
      case 'ripening':
      case 'fruiting':
      case 'grain':
      case 'maturity': stageMultiplier = 0.7; break;
      default: stageMultiplier = 1.0;
    }
    
    // Adjust for soil water capacity
    const soilMultiplier = 1 / (soilInfo.availableWaterCapacity * 10);
    
    // Calculate base water amount
    let waterAmount = baseWaterAmount * stageMultiplier * soilMultiplier;
    
    // Adjust for weather
    // Temperature adjustment
    const tempAdjustment = (weatherData.temperature - 28) * 0.03;
    waterAmount *= (1 + tempAdjustment);
    
    // Humidity adjustment
    const humidityAdjustment = 1 - (weatherData.humidity * 0.003);
    waterAmount *= humidityAdjustment;
    
    // Precipitation adjustment
    if (weatherData.precipitation > 5) {
      const precipReduction = Math.min(0.8, weatherData.precipitation / waterAmount);
      waterAmount *= (1 - precipReduction);
      
      // Skip if precipitation is substantial
      if (weatherData.precipitation > waterAmount * 0.7) {
        return {
          shouldIrrigate: false,
          waterAmount: 0,
          duration: 0,
          nextIrrigation: new Date(Date.now() + 3 * 86400000).toISOString(),
          reason: `Natural rainfall of ${weatherData.precipitation}mm is sufficient.`,
          confidence: 85,
          waterSavings: 100,
          tips: generateDryZoneTips(cropType, soilType, weatherData, currentSeason)
        };
      }
    }
    
    // Adjust for soil moisture if available
    if (soilData && soilData.moisture) {
      const moistureReduction = Math.min(0.5, soilData.moisture / 100);
      waterAmount *= (1 - moistureReduction);
    }
    
    // Round for presentation
    waterAmount = Math.round(waterAmount * 10) / 10;
    
    // Determine optimal interval based on soil and crop
    let intervalDays;
    if (soilInfo.drainageRate === 'rapid' || soilInfo.drainageRate === 'good') {
      intervalDays = 2;
    } else if (soilInfo.drainageRate === 'poor' || soilInfo.drainageRate === 'very poor') {
      intervalDays = 4;
    } else {
      intervalDays = 3;
    }
    
    // Adjust interval for crop stress threshold
    intervalDays = Math.round(intervalDays * (1 / cropInfo.stressThreshold));
    
    // Determine application type
    const applicationType = cropKey === 'Rice' ? 'flood' : 
                           cropInfo.waterNeed === 'high' ? 'sprinkler' : 'drip';
    
    // Calculate duration
    const applicationRate = applicationType === 'drip' ? 3 : 
                           applicationType === 'sprinkler' ? 10 : 40;
    const duration = Math.ceil(waterAmount / applicationRate * 60);
    
    // Determine start time
    const startTime = new Date();
    startTime.setHours(6, 0, 0, 0);
    if (new Date().getHours() >= 6) {
      startTime.setDate(startTime.getDate() + 1);
    }
    
    // Calculate water savings (estimated)
    const traditionalAmount = waterAmount * 1.3;
    const waterSavings = Math.round(((traditionalAmount - waterAmount) / traditionalAmount) * 100);
    
    return {
      shouldIrrigate: true,
      waterAmount: waterAmount,
      duration: duration,
      intervalDays: intervalDays,
      startTime: startTime.toISOString(),
      growthStage: growthStage,
      season: currentSeason,
      waterSavings: waterSavings,
      confidence: 80,
      applicationType: applicationType,
      tips: generateDryZoneTips(cropType, soilType, weatherData, currentSeason)
    };
  } catch (error) {
    console.error('Error in algorithmic irrigation recommendation:', error);
    
    // Return a simplified recommendation as ultimate fallback
    return {
      shouldIrrigate: true,
      waterAmount: 20,
      duration: 30,
      intervalDays: 3,
      startTime: new Date(new Date().setHours(6, 0, 0, 0)).toISOString(),
      confidence: 60,
      tips: [{ type: 'general', text: 'Consider consulting with a local agricultural expert for more precise irrigation advice.' }]
    };
  }
}

/**
 * Generate water saving tips specific to Sri Lanka's dry zone
 */
function generateDryZoneTips(cropType, soilType, weatherData, season) {
  const tips = [];
  
  // Standardize keys
  const cropKey = cropType.charAt(0).toUpperCase() + cropType.slice(1);
  const soilKey = soilType.charAt(0).toUpperCase() + soilType.slice(1);
  
  // Season-specific tips
  if (season === 'Maha') {
    tips.push({
      type: 'seasonal',
      text: 'During Maha season with regular rainfall, consider supplementary irrigation only when rainfall is insufficient.'
    });
  } else {
    tips.push({
      type: 'seasonal',
      text: "During Yala season's drier conditions, mulching can significantly reduce evaporation and conserve soil moisture."
    });
  }
  
  // Crop-specific tips
  if (cropKey === 'Rice') {
    tips.push({
      type: 'crop',
      text: 'For paddy cultivation, maintain 2-3 cm water level during critical growth stages and practice alternate wetting and drying when possible.'
    });
  } else if (['Mung Bean', 'Cowpea', 'Groundnut'].includes(cropKey)) {
    tips.push({
      type: 'crop',
      text: `${cropKey} has moderate drought tolerance. Focus irrigation during flowering and pod development stages for better yields.`
    });
  } else if (cropKey === 'Chili') {
    tips.push({
      type: 'crop',
      text: 'Chili requires regular irrigation during flowering and fruit development. Drip irrigation can reduce water usage by 30-40%.'
    });
  }
  
  // Soil-specific tips
  if (soilKey === 'Reddish Brown Earth') {
    tips.push({
      type: 'soil',
      text: 'Reddish Brown Earth soils have moderate water retention. Incorporate organic matter to improve moisture holding capacity.'
    });
  } else if (soilKey === 'Low Humic Gley') {
    tips.push({
      type: 'soil',
      text: 'Low Humic Gley soils have high water retention but poor drainage. Avoid overwatering to prevent waterlogging issues.'
    });
  } else if (soilKey === 'Non-Calcic Brown') {
    tips.push({
      type: 'soil',
      text: 'Non-Calcic Brown soils have lower water retention. Consider more frequent but lighter irrigation applications.'
    });
  }
  
  // Weather-specific tips
  if (weatherData.temperature > 32) {
    tips.push({
      type: 'weather',
      text: 'During high temperatures, irrigate in the early morning to minimize evaporation losses and reduce plant stress.'
    });
  }
  
  if (weatherData.forecast && weatherData.forecast.some(day => day.precipitation > 20)) {
    tips.push({
      type: 'weather',
      text: 'Significant rainfall is expected. Consider pausing irrigation and adjusting your schedule accordingly.'
    });
  }
  
  // General water conservation tips
  tips.push({
    type: 'general',
    text: 'Consider contour bunding and check dams for rainwater harvesting during Maha season to store water for Yala season use.'
  });
  
  // Return a subset of tips (3-4) to avoid overwhelming the user
  return tips.slice(0, Math.floor(Math.random() * 2) + 3);
}

module.exports = {
  getIrrigationRecommendation,
  generateDryZoneTips,
  getDetermineSeason,
  determineGrowthStage,
  DRY_ZONE_IRRIGATION_SCHEDULES,
  CROP_FACTORS,
  DRY_ZONE_SOIL_TYPES,
  DRY_ZONE_SEASONS
}; 