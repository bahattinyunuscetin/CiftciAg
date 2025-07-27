const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const IrrigationSchedule = require('../models/IrrigationSchedule');
const CropType = require('../models/CropType');
const SoilType = require('../models/SoilType');
const { generateSmartSchedule, getAIPrediction } = require('../services/irrigationService');
const { check, validationResult } = require('express-validator');
const Weather = require('../services/weatherService');
const SoilMoisture = require('../services/soilMoistureService');
const AIService = require('../services/aiService');
const irrigationService = require('../services/irrigationService');
const User = require('../models/User');
const aiService = require('../services/aiService');
const userService = require('../services/userService');
const sriLankanIrrigationService = require('../services/sriLankanIrrigationService');

// Helper function to get weather data
const getWeatherData = async (location) => {
    try {
        return await Weather.getCurrentWeather(location);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return {
            temperature: 25,
            humidity: 60,
            precipitation: 0,
            windSpeed: 5,
            conditions: 'Clear'
        };
    }
};

// Helper function to get soil moisture data
const getSoilMoistureData = async (location) => {
    try {
        return await SoilMoisture.getCurrentMoisture(location);
    } catch (error) {
        console.error('Error fetching soil moisture data:', error);
        return null;
    }
};

// Create a new irrigation schedule
router.post('/schedule', auth, async (req, res) => {
    try {
        const { cropType, soilType, location, feedback, fieldSize, plantingDate } = req.body;

        // Validate required inputs
        if (!cropType || !soilType || !location) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Get weather data for location
        const weatherData = await getWeatherData(location);
        if (!weatherData) {
            return res.status(500).json({ message: 'Failed to fetch weather data' });
        }

        // Get soil moisture data if available
        let soilMoisture = null;
        try {
            const soilData = await getSoilMoistureData(location);
            soilMoisture = soilData ? soilData.moisture : null;
        } catch (error) {
            console.log('Soil moisture data not available, using estimates');
        }

        // Get user preferences for regional data
        const user = await User.findById(req.user.id);
        const useLocalizedData = user?.preferences?.useLocalizedData || false;
        const region = user?.preferences?.region || 'default';
        
        // Determine which irrigation service to use based on user preferences
        let irrigationSchedule;
        const isSriLankanRegion = region && region.toLowerCase().includes('sri_lanka');
        
        if (useLocalizedData && isSriLankanRegion) {
            // Use Sri Lankan irrigation service
            console.log('Using Sri Lankan irrigation service for schedule generation');
            irrigationSchedule = await sriLankanIrrigationService.getIrrigationSchedule({
                cropType,
                soilType,
                weatherData,
                soilMoisture,
                feedback,
                region,
                fieldSize: fieldSize || 1000,
                plantingDate: plantingDate || new Date().toISOString()
            });
        } else {
            // Use standard irrigation service
            console.log('Using standard irrigation service for schedule generation');
            irrigationSchedule = await irrigationService.getIrrigationSchedule({
                cropType,
                soilType,
                weatherData,
                soilMoisture,
                feedback
            });
        }

        // Store the irrigation schedule in the database
        const schedule = new IrrigationSchedule({
            user: req.user.id,
            cropType,
            soilType,
            weatherData: {
                temperature: weatherData.temperature,
                precipitation: weatherData.precipitation,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                conditions: weatherData.conditions
            },
            schedule: irrigationSchedule,
            location: {
                type: 'Point',
                coordinates: [location.lon, location.lat]
            },
            timestamp: new Date()
        });

        await schedule.save();
        
        // Add some water-saving tips
        const tips = generateWaterSavingTips(cropType, soilType, weatherData, irrigationSchedule);
        
        res.json({
            timestamp: schedule.timestamp,
            recommendation: {
                ...irrigationSchedule,
                tips
            }
        });
    } catch (error) {
        console.error('Error generating irrigation schedule:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all irrigation schedules for a user
router.get('/schedules', auth, async (req, res) => {
    try {
        const schedules = await IrrigationSchedule.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(schedules);
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
    }
});

// Update an irrigation schedule
router.put('/schedule/:id', auth, async (req, res) => {
    try {
        const schedule = await IrrigationSchedule.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json(schedule);
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(400).json({ message: 'Failed to update schedule', error: error.message });
    }
});

// Delete an irrigation schedule
router.delete('/schedule/:id', auth, async (req, res) => {
    try {
        const schedule = await IrrigationSchedule.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
    }
});

// Get irrigation recommendation based on weather
router.post('/recommendation', auth, async (req, res) => {
    try {
        const { temperature, humidity, conditions, forecast } = req.body;
        
        // Basic irrigation recommendation logic
        let shouldIrrigate = false;
        let reason = '';
        let duration = 0;

        // Check current conditions
        if (conditions.toLowerCase().includes('rain') || conditions.toLowerCase().includes('snow')) {
            shouldIrrigate = false;
            reason = 'Precipitation detected';
        } else if (humidity > 85) {
            shouldIrrigate = false;
            reason = 'High humidity';
        } else if (temperature > 30) {
            shouldIrrigate = true;
            duration = 30;
            reason = 'High temperature';
        } else if (humidity < 40) {
            shouldIrrigate = true;
            duration = 20;
            reason = 'Low humidity';
        } else {
            shouldIrrigate = false;
            reason = 'Normal conditions';
        }

        // Check forecast for upcoming rain
        const upcomingRain = forecast.some(item => 
            item.weather[0].main.toLowerCase().includes('rain') ||
            item.weather[0].main.toLowerCase().includes('snow')
        );

        if (upcomingRain) {
            shouldIrrigate = false;
            reason = 'Rain expected in the next few hours';
        }

        res.json({
            shouldIrrigate,
            reason,
            duration,
            nextCheck: new Date(Date.now() + 3600000).toISOString() // Check again in 1 hour
        });
    } catch (error) {
        console.error('Irrigation recommendation error:', error);
        res.status(500).json({ message: 'Failed to get recommendation', error: error.message });
    }
});

/**
 * Smart Irrigation Scheduling Endpoint
 * Generates irrigation recommendations based on weather data and AI
 */
router.post('/smart-schedule', auth, async (req, res) => {
    try {
        const { location, cropType, soilType, feedback } = req.body;
        
        if (!location || !location.lat || !location.lon) {
            return res.status(400).json({ 
                message: 'Valid location with latitude and longitude is required' 
            });
        }
        
        const schedule = await generateSmartSchedule({
            location,
            cropType: cropType || 'default',
            soilType: soilType || 'default',
            feedback,
            userId: req.user._id
        });
        
        res.json(schedule);
    } catch (error) {
        console.error('Smart schedule error:', error);
        
        // Handle weather API dependency failure with specific status code
        if (error.status === 424) {
            return res.status(424).json({
                message: 'Failed to retrieve weather data necessary for irrigation scheduling',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to generate smart irrigation schedule', 
            error: error.message 
        });
    }
});

/**
 * Submit feedback on irrigation recommendation
 */
router.post('/feedback', auth, async (req, res) => {
    try {
        const { scheduleId, cropType, soilType, feedbackType, feedbackValue, actualSoilMoisture } = req.body;
        
        if (!feedbackType || !feedbackValue) {
            return res.status(400).json({
                message: 'Feedback type and value are required'
            });
        }
        
        // Create feedback object
        const feedback = {
            userId: req.user._id,
            scheduleId,
            cropType,
            soilType,
            feedbackType,
            feedbackValue,
            actualSoilMoisture,
            createdAt: new Date()
        };
        
        // In a production system, we would store this in a database
        // For now, we'll just log it
        console.log('Received irrigation feedback:', feedback);
        
        // Return success
        res.json({
            message: 'Feedback received successfully',
            feedback
        });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
});

/**
 * Get historical irrigation data for user's farm
 */
router.get('/history', auth, async (req, res) => {
    try {
        const { startDate, endDate, cropType } = req.query;
        
        // Build query
        const query = { userId: req.user._id };
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (cropType) {
            query.cropType = cropType;
        }
        
        // Get irrigation history
        const history = await IrrigationSchedule.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        
        // Calculate some analytics
        const analytics = {
            totalSchedules: history.length,
            averageDuration: history.reduce((sum, item) => sum + item.duration, 0) / history.length || 0,
            mostWateredCrop: getMostFrequentValue(history.map(item => item.cropType))
        };
        
        res.json({
            history,
            analytics
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            message: 'Failed to fetch irrigation history',
            error: error.message
        });
    }
});

/**
 * Get detailed analytics for irrigation efficiency
 */
router.get('/analytics', auth, async (req, res) => {
    try {
        const { period } = req.query;
        let startDate;
        
        // Determine date range based on period
        switch(period) {
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
        }
        
        // Get schedules for the period
        const schedules = await IrrigationSchedule.find({
            userId: req.user._id,
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });
        
        // Calculate analytics
        const analytics = {
            totalWaterUsed: schedules.reduce((sum, s) => sum + (s.duration * s.fieldSize * 0.06), 0), // Rough estimation
            schedulesCount: schedules.length,
            averageDuration: schedules.reduce((sum, s) => sum + s.duration, 0) / schedules.length || 0,
            waterEfficiency: 0.8, // Placeholder - would be calculated from actual data
            cropTypeBreakdown: calculateCropTypeBreakdown(schedules),
            waterUsageByDay: calculateWaterUsageByDay(schedules, startDate),
            recommendations: generateEfficiencyRecommendations(schedules)
        };
        
        res.json(analytics);
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            message: 'Failed to generate irrigation analytics',
            error: error.message
        });
    }
});

// Get all crop types
router.get('/crop-types', auth, async (req, res) => {
    try {
        const cropTypes = await CropType.find({ active: true })
            .select('name description waterNeed rootDepth waterRequirement stressThreshold')
            .sort({ name: 1 });
        res.json(cropTypes);
    } catch (error) {
        console.error('Get crop types error:', error);
        res.status(500).json({ message: 'Failed to fetch crop types', error: error.message });
    }
});

// Get all soil types
router.get('/soil-types', auth, async (req, res) => {
    try {
        const soilTypes = await SoilType.find({ active: true })
            .select('name description waterRetention drainage commonCrops')
            .sort('name');
        
        res.json({
            success: true,
            count: soilTypes.length,
            soilTypes: soilTypes.map(soil => ({
                id: soil._id,
                name: soil.name,
                description: soil.description,
                waterRetention: soil.waterRetention,
                drainage: soil.drainage,
                commonCrops: soil.commonCrops
            }))
        });
    } catch (error) {
        console.error('Error fetching soil types:', error);
        res.status(500).json({ message: 'Error fetching soil types' });
    }
});

// Admin routes for managing crop types
router.post('/admin/crop-types', auth, isAdmin, async (req, res) => {
    try {
        const cropType = new CropType(req.body);
        await cropType.save();
        res.status(201).json(cropType);
    } catch (error) {
        console.error('Create crop type error:', error);
        res.status(400).json({ message: 'Failed to create crop type', error: error.message });
    }
});

router.put('/admin/crop-types/:id', auth, isAdmin, async (req, res) => {
    try {
        const cropType = await CropType.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!cropType) {
            return res.status(404).json({ message: 'Crop type not found' });
        }
        res.json(cropType);
    } catch (error) {
        console.error('Update crop type error:', error);
        res.status(400).json({ message: 'Failed to update crop type', error: error.message });
    }
});

router.delete('/admin/crop-types/:id', auth, isAdmin, async (req, res) => {
    try {
        const cropType = await CropType.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { new: true }
        );
        if (!cropType) {
            return res.status(404).json({ message: 'Crop type not found' });
        }
        res.json({ message: 'Crop type deleted successfully' });
    } catch (error) {
        console.error('Delete crop type error:', error);
        res.status(500).json({ message: 'Failed to delete crop type', error: error.message });
    }
});

// Admin routes for managing soil types
router.post('/admin/soil-types', auth, isAdmin, async (req, res) => {
    try {
        const soilType = new SoilType(req.body);
        await soilType.save();
        res.status(201).json(soilType);
    } catch (error) {
        console.error('Create soil type error:', error);
        res.status(400).json({ message: 'Failed to create soil type', error: error.message });
    }
});

router.put('/admin/soil-types/:id', auth, isAdmin, async (req, res) => {
    try {
        const soilType = await SoilType.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!soilType) {
            return res.status(404).json({ message: 'Soil type not found' });
        }
        res.json(soilType);
    } catch (error) {
        console.error('Update soil type error:', error);
        res.status(400).json({ message: 'Failed to update soil type', error: error.message });
    }
});

router.delete('/admin/soil-types/:id', auth, isAdmin, async (req, res) => {
    try {
        const soilType = await SoilType.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { new: true }
        );
        if (!soilType) {
            return res.status(404).json({ message: 'Soil type not found' });
        }
        res.json({ message: 'Soil type deleted successfully' });
    } catch (error) {
        console.error('Delete soil type error:', error);
        res.status(500).json({ message: 'Failed to delete soil type', error: error.message });
    }
});

// Helper functions for analytics
function getMostFrequentValue(array) {
    const counts = {};
    let maxCount = 0;
    let maxValue = null;
    
    for (const value of array) {
        counts[value] = (counts[value] || 0) + 1;
        if (counts[value] > maxCount) {
            maxCount = counts[value];
            maxValue = value;
        }
    }
    
    return maxValue;
}

function calculateCropTypeBreakdown(schedules) {
    const breakdown = {};
    
    schedules.forEach(schedule => {
        breakdown[schedule.cropType] = (breakdown[schedule.cropType] || 0) + 1;
    });
    
    return Object.entries(breakdown).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / schedules.length) * 100)
    }));
}

function calculateWaterUsageByDay(schedules, startDate) {
    const usageByDay = {};
    const daysArray = [];
    
    // Initialize all days in the period with zero usage
    const currentDate = new Date(startDate);
    const endDate = new Date();
    
    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        usageByDay[dateString] = 0;
        daysArray.push(dateString);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate usage for each day
    schedules.forEach(schedule => {
        const dateString = new Date(schedule.createdAt).toISOString().split('T')[0];
        if (usageByDay[dateString] !== undefined) {
            usageByDay[dateString] += schedule.duration * schedule.fieldSize * 0.06; // Rough estimation
        }
    });
    
    // Convert to array for easier consumption by frontend charts
    return daysArray.map(day => ({
        date: day,
        usage: usageByDay[day]
    }));
}

function generateEfficiencyRecommendations(schedules) {
    // Simple recommendations based on patterns
    const recommendations = [];
    
    // Check for overly frequent irrigation
    const dailyScheduleCount = {};
    schedules.forEach(schedule => {
        const dateString = new Date(schedule.createdAt).toISOString().split('T')[0];
        dailyScheduleCount[dateString] = (dailyScheduleCount[dateString] || 0) + 1;
    });
    
    const daysWithMultipleSchedules = Object.values(dailyScheduleCount).filter(count => count > 1).length;
    if (daysWithMultipleSchedules > 3) {
        recommendations.push({
            type: 'frequency',
            message: 'Consider reducing irrigation frequency to improve water efficiency.'
        });
    }
    
    // Check for long duration irrigations
    const longDurationCount = schedules.filter(s => s.duration > 40).length;
    if (longDurationCount > schedules.length * 0.3) {
        recommendations.push({
            type: 'duration',
            message: 'Consider shorter, more frequent irrigation cycles for better water absorption.'
        });
    }
    
    // Add general recommendation
    recommendations.push({
        type: 'general',
        message: 'Implement soil moisture sensors for more precise irrigation timing.'
    });
    
    return recommendations;
}

// @route   GET api/irrigation/schedule
// @desc    Get irrigation schedule based on crop, soil, and weather
// @access  Private
router.get('/schedule', [
  auth,
  check('cropType', 'Crop type is required').notEmpty(),
  check('soilType', 'Soil type is required').notEmpty(),
  check('fieldSize', 'Field size is required').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { cropType, soilType, fieldSize } = req.query;
    
    // Get current weather data
    const weatherData = await Weather.getCurrentWeather();
    
    // Get soil moisture data
    const soilData = await SoilMoisture.getSoilMoisture(soilType);
    
    // Get AI recommendation
    const aiRecommendation = await AIService.getIrrigationRecommendation(
      cropType, 
      soilType, 
      fieldSize,
      weatherData,
      soilData
    );
    
    // Format response
    const response = {
      recommendation: {
        waterAmount: aiRecommendation.waterAmount, // Liters per square meter
        duration: aiRecommendation.duration, // Minutes
        startTime: aiRecommendation.startTime, // ISO date string
        frequency: aiRecommendation.frequency, // Days
        waterSavings: aiRecommendation.waterSavings, // Percentage compared to traditional
        confidence: aiRecommendation.confidence // 0-100%
      },
      weather: {
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        precipitation: weatherData.precipitation,
        windSpeed: weatherData.windSpeed,
        forecast: weatherData.forecast
      },
      soilCondition: {
        moisture: soilData.moisture,
        ph: soilData.ph,
        nutrientLevel: soilData.nutrientLevel
      },
      tips: aiRecommendation.tips
    };

    // Save recommendation to database
    const irrigationRecord = new IrrigationSchedule({
      userId: req.user._id,
      cropType,
      soilType,
      fieldSize,
      recommendation: response.recommendation,
      weather: response.weather,
      soilCondition: response.soilCondition
    });

    await irrigationRecord.save();
    
    return res.json(response);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   POST api/irrigation/feedback
// @desc    Submit feedback on irrigation recommendation
// @access  Private
router.post('/feedback', [
  auth,
  check('irrigationId', 'Irrigation ID is required').notEmpty(),
  check('rating', 'Rating is required').isNumeric(),
  check('comments', 'Comments are required').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { irrigationId, rating, comments } = req.body;
    
    // Find the irrigation record
    const irrigation = await IrrigationSchedule.findById(irrigationId);
    
    if (!irrigation) {
      return res.status(404).json({ msg: 'Irrigation record not found' });
    }
    
    // Check if user owns the record
    if (irrigation.userId.toString() !== req.user._id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Add feedback to the record
    irrigation.feedback = {
      rating,
      comments,
      date: Date.now()
    };
    
    // Send feedback to AI service to improve recommendations
    await AIService.submitFeedback(irrigationId, rating, comments);
    
    await irrigation.save();
    
    return res.json(irrigation);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/irrigation/history
// @desc    Get irrigation history for a user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate, cropType, soilType } = req.query;
    
    // Build filter
    const filter = { userId: req.user._id };
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (cropType) {
      filter.cropType = cropType;
    }
    
    if (soilType) {
      filter.soilType = soilType;
    }
    
    const irrigations = await IrrigationSchedule.find(filter).sort({ createdAt: -1 });
    
    return res.json(irrigations);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/irrigation/analytics
// @desc    Get irrigation analytics and insights
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Default to 30 days
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get irrigation records for the period
    const irrigations = await IrrigationSchedule.find({
      userId: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Get AI analysis of irrigation patterns
    const analytics = await AIService.getIrrigationAnalytics(
      req.user._id,
      irrigations,
      period
    );
    
    return res.json(analytics);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/irrigation/types/crop
// @desc    Get available crop types
// @access  Private
router.get('/types/crop', auth, async (req, res) => {
  try {
    // Comprehensive Sri Lankan crop types
    const cropTypes = [
      // Food Crops
      { id: 1, name: 'Rice (Paddy)', waterRequirement: 'High', season: 'Both Maha and Yala', category: 'Food Crop', description: 'Staple food; cultivated in both Wet and Dry Zones using irrigation' },
      { id: 2, name: 'Maize', waterRequirement: 'Medium', season: 'Primarily Maha', category: 'Food Crop' },
      { id: 3, name: 'Millet', waterRequirement: 'Low', season: 'Primarily Yala', category: 'Food Crop' },
      { id: 4, name: 'Green Gram', waterRequirement: 'Low-Medium', season: 'Both Maha and Yala', category: 'Food Crop', description: 'Pulse crop' },
      { id: 5, name: 'Cowpea', waterRequirement: 'Low-Medium', season: 'Both Maha and Yala', category: 'Food Crop', description: 'Pulse crop' },
      
      // Cash Crops
      { id: 6, name: 'Tea', waterRequirement: 'Medium-High', season: 'Year-round', category: 'Cash Crop', description: 'Grown in the central highlands (Nuwara Eliya, Kandy)' },
      { id: 7, name: 'Rubber', waterRequirement: 'Medium-High', season: 'Year-round', category: 'Cash Crop', description: 'Found in the Wet Zone (Kegalle, Kalutara)' },
      { id: 8, name: 'Coconut', waterRequirement: 'Medium', season: 'Year-round', category: 'Cash Crop', description: 'Grown in the Intermediate and Coastal Zones (Puttalam, Kurunegala)' },
      
      // Horticultural Crops
      { id: 9, name: 'Carrot', waterRequirement: 'Medium', season: 'Cool season', category: 'Vegetable', description: 'Hill country vegetable' },
      { id: 10, name: 'Beans', waterRequirement: 'Medium', season: 'Both seasons', category: 'Vegetable', description: 'Hill country vegetable' },
      { id: 11, name: 'Leeks', waterRequirement: 'Medium', season: 'Cool season', category: 'Vegetable', description: 'Hill country vegetable' },
      { id: 12, name: 'Eggplant', waterRequirement: 'Medium', season: 'Both seasons', category: 'Vegetable', description: 'Low country vegetable' },
      { id: 13, name: 'Tomato', waterRequirement: 'Medium', season: 'Both seasons', category: 'Vegetable', description: 'Low country vegetable' },
      { id: 14, name: 'Okra', waterRequirement: 'Medium', season: 'Warm season', category: 'Vegetable', description: 'Low country vegetable' },
      { id: 15, name: 'Banana', waterRequirement: 'High', season: 'Year-round', category: 'Fruit' },
      { id: 16, name: 'Mango', waterRequirement: 'Medium', season: 'Seasonal', category: 'Fruit' },
      { id: 17, name: 'Papaya', waterRequirement: 'Medium', season: 'Year-round', category: 'Fruit' },
      { id: 18, name: 'Pineapple', waterRequirement: 'Medium', season: 'Year-round', category: 'Fruit' },
      
      // Spices and Condiments
      { id: 19, name: 'Pepper', waterRequirement: 'Medium-High', season: 'Year-round', category: 'Spice' },
      { id: 20, name: 'Cinnamon', waterRequirement: 'Medium', season: 'Year-round', category: 'Spice', description: 'Especially in the Southern coastal belt' },
      { id: 21, name: 'Cloves', waterRequirement: 'Medium-High', season: 'Year-round', category: 'Spice' },
      { id: 22, name: 'Cardamom', waterRequirement: 'Medium-High', season: 'Year-round', category: 'Spice' },
      { id: 23, name: 'Nutmeg', waterRequirement: 'Medium', season: 'Year-round', category: 'Spice' },
      
      // Industrial Crops
      { id: 24, name: 'Sugarcane', waterRequirement: 'High', season: 'Year-round', category: 'Industrial Crop', description: 'Mostly in dry regions (e.g., Monaragala)' },
      { id: 25, name: 'Tobacco', waterRequirement: 'Medium', season: 'Dry season', category: 'Industrial Crop', description: 'Northern and Eastern areas' },
      
      // Existing crops from the previous implementation
      { id: 26, name: 'Mung Bean', waterRequirement: 'Low-Medium', season: 'Primarily Yala', category: 'Food Crop' },
      { id: 27, name: 'Groundnut', waterRequirement: 'Medium', season: 'Primarily Maha', category: 'Food Crop' },
      { id: 28, name: 'Chili', waterRequirement: 'Medium-High', season: 'Both Maha and Yala', category: 'Spice' },
      { id: 29, name: 'Onion', waterRequirement: 'Medium', season: 'Primarily Yala', category: 'Vegetable' },
      { id: 30, name: 'Sesame', waterRequirement: 'Low', season: 'Primarily Yala', category: 'Industrial Crop' }
    ];
    
    return res.json(cropTypes);
  } catch (err) {
    console.error('Error fetching crop types:', err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/irrigation/types/soil
// @desc    Get available soil types
// @access  Private
router.get('/types/soil', auth, async (req, res) => {
  try {
    // Comprehensive Sri Lankan soil types
    const soilTypes = [
      { 
        id: 1, 
        name: 'Red-Yellow Podzolic Soils', 
        waterRetention: 'Medium-High', 
        drainageRate: 'Good',
        description: 'Found in Wet Zone (Central hills and southwestern lowlands). Acidic, well-drained, high in organic matter. Suitable for tea, rubber, spices (pepper, cardamom).'
      },
      { 
        id: 2, 
        name: 'Reddish Brown Earth', 
        waterRetention: 'Medium', 
        drainageRate: 'Moderate',
        description: 'Found in Dry Zone (North Central, Eastern, Northern, and parts of Southern Sri Lanka). Moderately fertile, well-drained, loamy texture. Suitable for paddy (with irrigation), maize, millet, groundnuts.'
      },
      { 
        id: 3, 
        name: 'Low Humic Gley Soils', 
        waterRetention: 'High', 
        drainageRate: 'Poor',
        description: 'Found in valley bottoms, waterlogged areas (mainly in the Wet Zone). Poor drainage, high clay content. Ideal for paddy (wetland rice cultivation).'
      },
      { 
        id: 4, 
        name: 'Grumusols (Black Soils)', 
        waterRetention: 'High', 
        drainageRate: 'Poor to moderate',
        description: 'Found in parts of the Dry Zone (e.g., Jaffna Peninsula). Rich in nutrients, high clay content. Good for onion, tobacco, chillies.'
      },
      {
        id: 5,
        name: 'Alluvial Soils',
        waterRetention: 'Medium to High',
        drainageRate: 'Variable',
        description: 'Found in river valleys and flood plains. Fertile, recently deposited, variable texture. Suitable for vegetables, fruits, paddy, sugarcane.'
      },
      {
        id: 6,
        name: 'Red-Yellow Latosols',
        waterRetention: 'Medium',
        drainageRate: 'Good',
        description: 'Found in Intermediate Zone. Well-drained, moderate fertility. Suitable for coconut, vegetables.'
      },
      { 
        id: 7, 
        name: 'Non-Calcic Brown', 
        waterRetention: 'Low to Medium', 
        drainageRate: 'Good',
        description: 'Found in upland areas, suitable for drought-resistant crops.'
      }
    ];
    
    return res.json(soilTypes);
  } catch (err) {
    console.error('Error fetching soil types:', err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   POST api/irrigation/types/crop
// @desc    Add new crop type (admin only)
// @access  Private/Admin
router.post('/types/crop', [
  auth,
  check('name', 'Name is required').notEmpty(),
  check('waterRequirement', 'Water requirement is required').notEmpty()
], async (req, res) => {
  // This would typically be implemented with a database and admin check
  return res.status(501).json({ msg: 'Not implemented yet' });
});

// @route   POST api/irrigation/types/soil
// @desc    Add new soil type (admin only)
// @access  Private/Admin
router.post('/types/soil', [
  auth,
  check('name', 'Name is required').notEmpty(),
  check('waterRetention', 'Water retention is required').notEmpty(),
  check('drainageRate', 'Drainage rate is required').notEmpty()
], async (req, res) => {
  // This would typically be implemented with a database and admin check
  return res.status(501).json({ msg: 'Not implemented yet' });
});

/**
 * @route   GET api/irrigation/current-season
 * @desc    Get information about current growing season
 * @access  Private
 */
router.get('/current-season', auth, async (req, res) => {
  try {
    const currentSeason = await irrigationService.getUserCurrentSeason(req.user.id);
    res.json(currentSeason);
  } catch (error) {
    console.error('Error getting current season:', error);
    res.status(500).json({ message: 'Failed to get current season information' });
  }
});

/**
 * @route   GET api/irrigation/suggest/crops
 * @desc    Get AI-suggested crop types based on location, weather, and soil data
 * @access  Private
 */
router.get('/suggest/crops', auth, async (req, res) => {
    try {
        // Get user preferences to determine region settings
        const user = await User.findById(req.user.id);
        const userPreferences = user.preferences || {};
        
        // Get location from query params or user's default
        const location = req.query.location ? JSON.parse(req.query.location) : user.farmLocation?.coordinates;
        
        // Fetch current weather data
        const weatherData = await getWeatherData({ lat: location[1], lon: location[0] });
        
        // Fetch soil moisture data if available
        let soilData = null;
        try {
            soilData = await getSoilMoistureData({ lat: location[1], lon: location[0] });
        } catch (error) {
            console.log('Soil data not available, continuing with suggestion');
        }
        
        // Get AI recommendations for crops
        const cropSuggestions = await aiService.suggestCropTypes({
            location: { lat: location[1], lon: location[0] },
            weatherData,
            soilData,
            region: userPreferences.region || 'default'
        });
        
        res.json(cropSuggestions);
    } catch (error) {
        console.error('Error getting crop suggestions:', error);
        res.status(500).json({ message: 'Server error getting crop suggestions' });
    }
});

/**
 * @route   GET api/irrigation/suggest/soils
 * @desc    Get AI-suggested soil types based on location and available data
 * @access  Private
 */
router.get('/suggest/soils', auth, async (req, res) => {
    try {
        // Get user preferences to determine region settings
        const user = await User.findById(req.user.id);
        const userPreferences = user.preferences || {};
        
        // Get location from query params or user's default
        const location = req.query.location ? JSON.parse(req.query.location) : user.farmLocation?.coordinates;
        
        // Fetch soil moisture data if available
        let soilData = null;
        try {
            soilData = await getSoilMoistureData({ lat: location[1], lon: location[0] });
        } catch (error) {
            console.log('Soil data not available, continuing with suggestion');
        }
        
        // Get AI recommendations for soil types
        const soilSuggestions = await aiService.suggestSoilTypes({
            location: { lat: location[1], lon: location[0] },
            soilData,
            region: userPreferences.region || 'default'
        });
        
        res.json(soilSuggestions);
    } catch (error) {
        console.error('Error getting soil suggestions:', error);
        res.status(500).json({ message: 'Server error getting soil suggestions' });
    }
});

// Helper function to generate water-saving tips
function generateWaterSavingTips(cropType, soilType, weatherData, schedule) {
    const tips = [];
    
    // Weather-based tips
    if (weatherData.precipitation > 0) {
        tips.push({
            text: 'Rain is expected soon. Consider delaying irrigation to take advantage of natural rainfall.',
            type: 'weather'
        });
    }
    
    if (weatherData.windSpeed > 15) {
        tips.push({
            text: 'High winds can increase water loss through evaporation. Irrigate during low-wind periods.',
            type: 'weather'
        });
    }
    
    // Crop-specific tips
    if (cropType.toLowerCase().includes('rice')) {
        tips.push({
            text: 'Consider alternate wetting and drying (AWD) method for rice to save water while maintaining yield.',
            type: 'crop'
        });
    }
    
    // Soil-specific tips
    if (soilType.toLowerCase().includes('sandy')) {
        tips.push({
            text: 'Sandy soils drain quickly. Consider shorter, more frequent irrigation sessions to prevent water loss.',
            type: 'soil'
        });
    } else if (soilType.toLowerCase().includes('clay')) {
        tips.push({
            text: 'Clay soils hold water longer. Avoid over-irrigation to prevent waterlogging and root diseases.',
            type: 'soil'
        });
    }
    
    // General water conservation tips
    tips.push({
        text: 'Irrigate early morning or evening to minimize evaporation losses.',
        type: 'seasonal'
    });
    
    // Add mulching tip for most crops except paddy
    if (!cropType.toLowerCase().includes('rice')) {
        tips.push({
            text: 'Apply organic mulch around plants to retain soil moisture and reduce irrigation frequency.',
            type: 'seasonal'
        });
    }
    
    return tips.slice(0, 4); // Return max 4 tips
}

// Add this new route for crop recommendations

// Get crop recommendations based on location and soil type
router.get('/recommend-crops', auth, async (req, res) => {
    try {
        const { lat, lon, soilType } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ message: 'Location coordinates are required' });
        }
        
        if (!soilType) {
            return res.status(400).json({ message: 'Soil type is required' });
        }
        
        // In a production environment, this would use advanced algorithms and real data
        // to recommend crops based on soil type, location, climate data, etc.
        
        // For now, this is a mock implementation that returns recommendations
        // based on basic rules and sample data
        
        // Determine region based on coordinates for more accurate recommendations
        let region = 'unknown';
        
        // Sri Lanka coordinates approximately (5.8° to 9.9° N, 79.6° to 81.9° E)
        if (lat >= 5.8 && lat <= 9.9 && lon >= 79.6 && lon <= 81.9) {
            region = 'sri-lanka';
        } 
        // India approximately (8° to 37° N, 68° to 97° E)
        else if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97) {
            region = 'india';
        }
        // Southeast Asia
        else if (lat >= -10 && lat <= 23 && lon >= 95 && lon <= 140) {
            region = 'southeast-asia';
        }
        // Default to tropical region for similar coordinates
        else if (Math.abs(lat) <= 23.5) {
            region = 'tropical';
        }
        // Northern hemisphere temperate
        else if (lat > 23.5) {
            region = 'north-temperate';
        }
        // Southern hemisphere temperate
        else {
            region = 'south-temperate';
        }
        
        // Get crop recommendations based on region and soil type
        const recommendations = await getCropRecommendations(region, soilType);
        
        // Log this activity
        if (region === 'sri-lanka') {
            console.log(`Generated Sri Lankan specific crop recommendations for ${soilType} soil at coordinates: ${lat}, ${lon}`);
        } else {
            console.log(`Generated crop recommendations for ${soilType} soil at coordinates: ${lat}, ${lon}`);
        }
        
        res.json({
            success: true,
            location: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                region
            },
            soilType,
            recommendations
        });
        
    } catch (error) {
        console.error('Error generating crop recommendations:', error);
        res.status(500).json({ message: 'Error generating crop recommendations' });
    }
});

// Helper function to get crop recommendations
async function getCropRecommendations(region, soilType) {
    try {
        // Get all available crop types
        const cropTypes = await CropType.find({});
        
        // Filter and rank crops based on soil suitability and region
        const recommendations = cropTypes
            .filter(crop => {
                // Check if this crop grows in this soil type
                if (!crop.suitableSoils || !crop.suitableSoils.length) return true; // If no soil data, include by default
                return crop.suitableSoils.some(soil => 
                    soil.toLowerCase() === soilType.toLowerCase() || 
                    soil.toLowerCase() === 'all' || 
                    soilType.toLowerCase().includes(soil.toLowerCase()) ||
                    soil.toLowerCase().includes(soilType.toLowerCase())
                );
            })
            .map(crop => {
                // Calculate confidence score based on various factors
                let confidence = 70; // Base confidence
                
                // Adjust for soil match
                if (crop.suitableSoils && crop.suitableSoils.length) {
                    const exactMatch = crop.suitableSoils.some(soil => 
                        soil.toLowerCase() === soilType.toLowerCase()
                    );
                    confidence += exactMatch ? 15 : 0;
                }
                
                // Adjust for region match
                if (crop.regions && crop.regions.length) {
                    const regionMatch = crop.regions.some(r => 
                        r.toLowerCase() === region.toLowerCase() || 
                        r.toLowerCase() === 'all'
                    );
                    confidence += regionMatch ? 10 : -10;
                }
                
                // Return recommendation object
                return {
                    id: crop._id,
                    name: crop.name,
                    description: crop.description,
                    confidence: Math.min(Math.max(confidence, 60), 98), // Keep between 60-98%
                    growingSeason: crop.growingSeason || 'Year-round',
                    waterNeeds: crop.waterNeeds || 'Medium',
                    growthPeriod: crop.growthPeriod || '3-4 months',
                    yieldEstimate: crop.yieldEstimate,
                    imageUrl: crop.imageUrl
                };
            })
            .sort((a, b) => b.confidence - a.confidence) // Sort by confidence score
            .slice(0, 6); // Get top 6 recommendations
        
        // If we have very few recommendations, add some generic ones based on the soil type
        if (recommendations.length < 3) {
            const genericCrops = getGenericCropsForSoil(soilType, region);
            recommendations.push(...genericCrops);
        }
        
        return recommendations;
    } catch (error) {
        console.error('Error in getCropRecommendations:', error);
        // Return a few generic recommendations as fallback
        return getGenericCropsForSoil('all', region).slice(0, 3);
    }
}

// Helper function for generic crop recommendations
function getGenericCropsForSoil(soilType, region) {
    const soilTypeLower = soilType.toLowerCase();
    const genericCrops = [];
    
    // Add crops based on soil type
    if (soilTypeLower.includes('clay') || soilTypeLower === 'clay') {
        genericCrops.push(
            { 
                name: 'Rice', 
                confidence: 90, 
                waterNeeds: 'High',
                description: 'Rice thrives in clay soils due to their water retention properties.',
                growingSeason: 'Wet season', 
                growthPeriod: '3-4 months'
            },
            { 
                name: 'Broccoli', 
                confidence: 85, 
                waterNeeds: 'Medium',
                description: 'Broccoli grows well in heavy clay soils with good nutrition.',
                growingSeason: 'Cool season', 
                growthPeriod: '2-3 months'
            }
        );
    }
    
    if (soilTypeLower.includes('loam') || soilTypeLower === 'loam') {
        genericCrops.push(
            { 
                name: 'Tomatoes', 
                confidence: 92, 
                waterNeeds: 'Medium',
                description: 'Tomatoes thrive in well-draining loamy soil with balanced nutrients.',
                growingSeason: 'Warm season', 
                growthPeriod: '3-4 months'
            },
            { 
                name: 'Maize (Corn)', 
                confidence: 88, 
                waterNeeds: 'Medium-High',
                description: 'Corn develops strong root systems in loamy soil, supporting tall stalks.',
                growingSeason: 'Warm season', 
                growthPeriod: '3-4 months'
            }
        );
    }
    
    if (soilTypeLower.includes('sandy') || soilTypeLower === 'sandy') {
        genericCrops.push(
            { 
                name: 'Carrots', 
                confidence: 91, 
                waterNeeds: 'Medium',
                description: 'Sandy soil allows carrots to develop straight roots without obstacles.',
                growingSeason: 'Cool season', 
                growthPeriod: '2-3 months'
            },
            { 
                name: 'Sweet Potatoes', 
                confidence: 89, 
                waterNeeds: 'Medium-Low',
                description: 'Sweet potatoes excel in sandy soils with good drainage.',
                growingSeason: 'Warm season', 
                growthPeriod: '3-5 months'
            }
        );
    }
    
    // Add region-specific crops
    if (region === 'sri-lanka') {
        genericCrops.push(
            { 
                name: 'Tea', 
                confidence: 86, 
                waterNeeds: 'Medium-High',
                description: 'Tea is well-suited to Sri Lanka\'s highland climate and soil conditions.',
                growingSeason: 'Year-round', 
                growthPeriod: 'Perennial'
            },
            { 
                name: 'Coconut', 
                confidence: 88, 
                waterNeeds: 'Medium',
                description: 'Coconut palms thrive in Sri Lanka\'s coastal regions with sandy soils.',
                growingSeason: 'Year-round', 
                growthPeriod: 'Perennial'
            }
        );
    } else if (region === 'india' || region === 'southeast-asia' || region === 'tropical') {
        genericCrops.push(
            { 
                name: 'Turmeric', 
                confidence: 85, 
                waterNeeds: 'Medium',
                description: 'Turmeric grows well in warm, humid conditions with well-draining soil.',
                growingSeason: 'Warm season', 
                growthPeriod: '8-10 months'
            },
            { 
                name: 'Banana', 
                confidence: 87, 
                waterNeeds: 'High',
                description: 'Bananas thrive in tropical conditions with rich, well-draining soil.',
                growingSeason: 'Year-round', 
                growthPeriod: 'Perennial'
            }
        );
    }
    
    // Always include some universally adaptable crops
    genericCrops.push(
        { 
            name: 'Green Beans', 
            confidence: 80, 
            waterNeeds: 'Medium',
            description: 'Green beans adapt to a wide range of soil conditions and climates.',
            growingSeason: 'Warm season', 
            growthPeriod: '2 months'
        },
        { 
            name: 'Okra', 
            confidence: 78, 
            waterNeeds: 'Medium',
            description: 'Okra is heat-tolerant and adapts to various soil types.',
            growingSeason: 'Warm season', 
            growthPeriod: '2-3 months'
        }
    );
    
    // Return only unique crop names
    const uniqueCrops = [];
    const cropNames = new Set();
    
    genericCrops.forEach(crop => {
        if (!cropNames.has(crop.name)) {
            cropNames.add(crop.name);
            uniqueCrops.push(crop);
        }
    });
    
    return uniqueCrops;
}

// Add an endpoint to get region information
router.get('/region-info', auth, async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ message: 'Location coordinates are required' });
        }
        
        // Determine region based on coordinates
        let region = 'Unknown';
        let climateZone = 'Unknown';
        let growingSeason = 'Unknown';
        
        // Sri Lanka coordinates approximately (5.8° to 9.9° N, 79.6° to 81.9° E)
        if (lat >= 5.8 && lat <= 9.9 && lon >= 79.6 && lon <= 81.9) {
            region = 'Sri Lanka';
            
            if (lat > 8.5) {
                climateZone = 'Northern Dry Zone';
                growingSeason = 'Maha (Oct-Mar)';
            } else if (lon < 80.2) {
                climateZone = 'Western Wet Zone';
                growingSeason = 'Year-round with monsoon variations';
            } else if (lon > 81) {
                climateZone = 'Eastern Dry Zone';
                growingSeason = 'Maha (Oct-Mar), Yala (May-Aug)';
            } else {
                climateZone = 'Central Highlands';
                growingSeason = 'Year-round with seasonal variations';
            }
        } 
        // India approximately
        else if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97) {
            region = 'India';
            
            // Simplified zones for India
            if (lat > 28) {
                climateZone = 'Northern India';
                growingSeason = 'Kharif (Jul-Oct), Rabi (Oct-Mar)';
            } else if (lon < 77) {
                climateZone = 'Western India';
                growingSeason = 'Kharif (Jun-Oct), Rabi (Oct-Mar)';
            } else if (lon > 85) {
                climateZone = 'Eastern India';
                growingSeason = 'Kharif (Jun-Oct), Rabi (Oct-Mar)';
            } else {
                climateZone = 'Central/Southern India';
                growingSeason = 'Kharif (Jun-Oct), Rabi (Oct-Mar)';
            }
        }
        // Southeast Asia
        else if (lat >= -10 && lat <= 23 && lon >= 95 && lon <= 140) {
            region = 'Southeast Asia';
            climateZone = 'Tropical';
            growingSeason = 'Wet season (varies by location)';
        }
        // Default to tropical/temperate regions
        else if (Math.abs(lat) <= 23.5) {
            region = 'Tropical Region';
            climateZone = 'Tropical';
            growingSeason = 'Year-round with wet and dry seasons';
        } else if (lat > 23.5) {
            region = 'Northern Hemisphere';
            climateZone = 'Temperate';
            growingSeason = 'Spring-Summer (Mar-Sep)';
        } else {
            region = 'Southern Hemisphere';
            climateZone = 'Temperate';
            growingSeason = 'Spring-Summer (Sep-Mar)';
        }
        
        // Get current month to determine active growing season
        const currentMonth = new Date().getMonth();
        let isActiveGrowingSeason = true; // Default to true
        
        // For temperate regions, check if we're in growing season
        if (climateZone === 'Temperate') {
            if (region === 'Northern Hemisphere' && (currentMonth < 2 || currentMonth > 8)) {
                isActiveGrowingSeason = false;
            } else if (region === 'Southern Hemisphere' && (currentMonth > 2 && currentMonth < 8)) {
                isActiveGrowingSeason = false;
            }
        }
        
        res.json({
            region,
            climateZone,
            growingSeason,
            isActiveGrowingSeason,
            coordinates: {
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            }
        });
        
    } catch (error) {
        console.error('Error getting region information:', error);
        res.status(500).json({ message: 'Error getting region information' });
    }
});

module.exports = router; 