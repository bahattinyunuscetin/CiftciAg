const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const IrrigationSchedule = require('../models/IrrigationSchedule');
const Weather = require('../models/Weather');
const SystemLog = require('../models/SystemLog');
const ReportData = require('../models/ReportData');
const { handleBackupDatabase } = require('../services/adminService');
const IrrigationFeedback = require('../models/IrrigationFeedback');
const mongoose = require('mongoose');

// Debug middleware for admin routes
router.use((req, res, next) => {
    console.log('Admin Route Request:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
    });
    next();
});

// Apply auth and admin middleware to all routes
router.use(auth, isAdmin);

// Get all users
router.get('/users', async (req, res) => {
    try {
        console.log('Fetching users...');
        const users = await User.find().select('-password');
        console.log(`Found ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Irrigation Admin Routes

// Get irrigation system status
router.get('/irrigation/status', auth, isAdmin, async (req, res) => {
    try {
        // Get real-time status of irrigation system components
        const scheduleCount = await IrrigationSchedule.countDocuments();
        const activeUsers = await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }});
        const weatherRecords = await Weather.countDocuments();
        
        // Calculate today's recommendations
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const recommendationsToday = await IrrigationSchedule.countDocuments({ 
            createdAt: { $gte: todayStart }
        });
        
        // Calculate water saved (estimate)
        const schedules = await IrrigationSchedule.find().sort({ createdAt: -1 }).limit(100);
        const waterSaved = schedules.reduce((total, schedule) => {
            return total + (schedule.waterSaved || 0);
        }, 0);
        
        // Get system uptime - in real app this would come from actual system metrics
        const systemStartTime = global.systemStartTime || new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
        const uptime = getSystemUptime(systemStartTime);
        
        // System resources - in a real app, these would come from actual system metrics
        const resources = getSystemResources();
        
        // Determine service status
        const apiStatus = 'operational'; // In a real app, you'd check API health
        const dbStatus = mongoose.connection.readyState === 1 ? 'operational' : 'degraded';
        const aiStatus = 'operational'; // In a real app, you'd check AI model health
        const weatherStatus = weatherRecords > 0 ? 'operational' : 'degraded';
        
        // Log activity
        await SystemLog.create({
            user: req.user.name,
            activity: 'System Status Check',
            status: 'success',
            details: { requestFrom: req.ip || 'Unknown' }
        });
        
        res.json({
            services: {
                api: apiStatus,
                database: dbStatus,
                ai: aiStatus,
                weather: weatherStatus
            },
            statistics: {
                activeUsers,
                recommendationsToday,
                apiRequests: recommendationsToday * 3, // Estimate based on recommendations
                waterSaved
            },
            resources,
            uptime
        });
    } catch (error) {
        console.error('Error fetching system status:', error);
        
        // Log error
        await SystemLog.create({
            user: req.user ? req.user.name : 'Unknown',
            activity: 'System Status Check',
            status: 'error',
            details: { error: error.message }
        });
        
        res.status(500).json({ message: 'Error fetching system status' });
    }
});

// Process irrigation system actions
router.post('/irrigation/actions', auth, isAdmin, async (req, res) => {
    try {
        const { action } = req.body;
        
        if (!action) {
            return res.status(400).json({ message: 'Action is required' });
        }
        
        let result = { success: true, message: `${action} completed successfully` };
        
        // Handle different actions
        switch (action) {
            case 'refreshWeather':
                // In a real app this would trigger weather data refresh
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
                await SystemLog.create({
                    user: req.user.name,
                    activity: 'Refresh Weather Data',
                    status: 'success',
                    details: { trigger: 'manual', by: req.user.name }
                });
                break;
                
            case 'refreshAI':
                // In a real app this would trigger AI model refresh
                await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate work
                await SystemLog.create({
                    user: req.user.name,
                    activity: 'Refresh AI Models',
                    status: 'success',
                    details: { modelsRefreshed: ['crop', 'irrigation', 'soil'] }
                });
                break;
                
            case 'clearCache':
                // In a real app this would clear system caches
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work
                await SystemLog.create({
                    user: req.user.name,
                    activity: 'Clear System Cache',
                    status: 'success',
                    details: { cacheType: 'all' }
                });
                break;
                
            case 'resetStats':
                // Reset statistics (not actual DB data)
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
                await SystemLog.create({
                    user: req.user.name,
                    activity: 'Reset System Statistics',
                    status: 'success',
                    details: { resetType: 'statistics only' }
                });
                break;
                
            case 'purgeTemp':
                // Purge temporary files
                await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate work
                await SystemLog.create({
                    user: req.user.name,
                    activity: 'Purge Temporary Files',
                    status: 'success',
                    details: { filesRemoved: Math.floor(Math.random() * 50) + 10 }
                });
                break;
                
            default:
                result = { success: false, message: `Unknown action: ${action}` };
                await SystemLog.create({
                    user: req.user.name,
                    activity: `Unknown System Action: ${action}`,
                    status: 'error',
                    details: { unknownAction: action }
                });
        }
        
        res.json(result);
    } catch (error) {
        console.error(`Error processing action:`, error);
        
        // Log error
        await SystemLog.create({
            user: req.user ? req.user.name : 'Unknown',
            activity: `System Action: ${req.body.action || 'unknown'}`,
            status: 'error',
            details: { error: error.message }
        });
        
        res.status(500).json({ 
            success: false, 
            message: 'Error processing action',
            error: error.message 
        });
    }
});

// Utility function to calculate system uptime
function getSystemUptime(startTime) {
    const now = new Date();
    const uptimeMs = now - startTime;
    
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
}

// Utility function to generate system resources (would be real metrics in production)
function getSystemResources() {
    // In a real app, these would come from actual system metrics
    // For demo, we'll generate values between certain ranges
    return {
        cpuUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
        memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
        diskUsage: Math.floor(Math.random() * 20) + 45, // 45-65%
        networkUsage: Math.floor(Math.random() * 60) + 20 // 20-80%
    };
}

// Get irrigation system configuration
router.get('/irrigation/config', async (req, res) => {
    try {
        // Get current system configuration
        // In a real app, you'd fetch this from a configuration store or database
        
        // Default configuration
        const config = {
            weatherSource: 'openweather',
            updateFrequency: 'hourly',
            modelType: 'standard',
            conservationMode: 'balanced',
            evaporationConstants: '0.75, 0.8, 1.2, 0.95'
        };
        
        // Get regions from database
        const regions = [
            { id: 1, name: 'Sri Lanka - Dry Zone', active: true, dataAvailable: 'Crops, Soils, Seasons' },
            { id: 2, name: 'Sri Lanka - Wet Zone', active: true, dataAvailable: 'Crops, Soils, Seasons' },
            { id: 3, name: 'Sri Lanka - Intermediate Zone', active: true, dataAvailable: 'Crops, Soils, Seasons' }
        ];
        
        res.json({
            config,
            regions
        });
    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).json({ message: 'Error fetching configuration' });
    }
});

// Update irrigation system configuration
router.put('/irrigation/config', async (req, res) => {
    try {
        const configData = req.body;
        
        // In a real app, you'd validate and store the configuration
        // This could be in a database, configuration store, or env variables
        console.log('Updating system configuration:', configData);
        
        // For demo purpose, we're just returning success
        res.json({ 
            message: 'Configuration updated successfully',
            config: configData
        });
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ message: 'Error updating configuration' });
    }
});

// Add new region
router.post('/irrigation/regions', async (req, res) => {
    try {
        const { name, active } = req.body;
        
        // In a real app, you'd save this to a database
        // For demo purposes, we'll just return a mock response
        const newRegion = {
            id: Date.now(), // Generate a unique ID
            name,
            active: active || true,
            dataAvailable: 'New Region'
        };
        
        res.status(201).json(newRegion);
    } catch (error) {
        console.error('Error adding region:', error);
        res.status(500).json({ message: 'Error adding region' });
    }
});

// Update region status
router.put('/irrigation/regions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;
        
        // In a real app, you'd update the region in your database
        // For demo purposes, we'll just return a mock response
        const updatedRegion = {
            id: Number(id),
            name: `Region ${id}`, // In a real app, you'd fetch the actual name
            active: active,
            dataAvailable: 'Updated Region'
        };
        
        res.json(updatedRegion);
    } catch (error) {
        console.error('Error updating region:', error);
        res.status(500).json({ message: 'Error updating region' });
    }
});

// Get system stats
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, adminCount, scheduleCount, weatherRecords] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            IrrigationSchedule.countDocuments(),
            Weather.countDocuments()
        ]);

        res.json({
            users: {
                total: totalUsers,
                admins: adminCount,
                regular: totalUsers - adminCount
            },
            schedules: scheduleCount,
            weatherRecords: weatherRecords
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching system statistics' });
    }
});

// Update user
router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, email, role } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (role) user.role = role;

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Prevent deleting yourself
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// Update API key
router.post('/settings', async (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey) {
            return res.status(400).json({ message: 'API key is required' });
        }

        // Store API key in environment variable or secure configuration
        process.env.WEATHER_API_KEY = apiKey;
        
        res.json({ message: 'API key updated successfully' });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ message: 'Error updating API key' });
    }
});

// Clear cache
router.post('/clear-cache', async (req, res) => {
    try {
        // Clear Weather data cache
        await Weather.deleteMany({});
        
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ message: 'Error clearing cache' });
    }
});

// Backup database
router.post('/backup-database', async (req, res) => {
    try {
        // Implementation depends on your backup strategy
        // This is a simple example that returns collections data
        const [users, schedules, weather] = await Promise.all([
            User.find().select('-password'),
            IrrigationSchedule.find(),
            Weather.find()
        ]);

        const backup = {
            timestamp: new Date(),
            data: {
                users,
                schedules,
                weather
            }
        };

        res.json(backup);
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ message: 'Error creating database backup' });
    }
});

// Get reports summary for the admin dashboard
router.get('/irrigation/reports/summary', async (req, res) => {
    try {
        // Get real user count and trend (past 30 days vs previous 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setDate(today.getDate() - 60);
        
        // Get user count now
        const totalUsers = await User.countDocuments();
        
        // Get field counts for current and previous periods
        const currentPeriodFields = await IrrigationSchedule.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        const previousPeriodFields = await IrrigationSchedule.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });
        
        // Calculate field trend
        const fieldsTrend = previousPeriodFields > 0 
            ? Math.round(((currentPeriodFields - previousPeriodFields) / previousPeriodFields) * 100) 
            : 0;
        
        // Get schedules for water savings calculation
        const currentPeriodSchedules = await IrrigationSchedule.find({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        const previousPeriodSchedules = await IrrigationSchedule.find({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });
        
        // Calculate water savings
        const currentWaterSaved = currentPeriodSchedules.reduce((total, s) => {
            return total + (s.waterSaved || s.fieldSize * 5 || 0);
        }, 0);
        
        const previousWaterSaved = previousPeriodSchedules.reduce((total, s) => {
            return total + (s.waterSaved || s.fieldSize * 5 || 0);
        }, 0);
        
        // Calculate water savings trend
        const waterTrend = previousWaterSaved > 0 
            ? Math.round(((currentWaterSaved - previousWaterSaved) / previousWaterSaved) * 100) 
            : 0;
        
        // Generate monthly usage data for the past year
        const monthlyUsage = await generateMonthlyUsageData();
        
        // Collect satisfaction data where available (otherwise default to placeholder value)
        const satisfactionData = await IrrigationFeedback.find({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        let satisfactionScore = 92; // Default placeholder
        let satisfactionTrend = 4;  // Default placeholder
        
        if (satisfactionData.length > 0) {
            // Calculate real satisfaction if we have feedback data
            const totalRatings = satisfactionData.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
            satisfactionScore = Math.round((totalRatings / (satisfactionData.length * 5)) * 100);
            
            // Get previous period satisfaction
            const prevSatisfactionData = await IrrigationFeedback.find({
                createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
            });
            
            if (prevSatisfactionData.length > 0) {
                const prevTotalRatings = prevSatisfactionData.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
                const prevSatisfactionScore = Math.round((prevTotalRatings / (prevSatisfactionData.length * 5)) * 100);
                satisfactionTrend = satisfactionScore - prevSatisfactionScore;
            }
        }
        
        // Prepare report data
        const reportData = {
            totalUsers,
            userTrend: 5, // Assuming we don't track historical user counts
            activeFields: currentPeriodFields,
            fieldsTrend,
            waterSaved: currentWaterSaved,
            waterTrend,
            satisfaction: satisfactionScore,
            satisfactionTrend,
            monthlyUsage,
            chartData: Object.entries(monthlyUsage).map(([label, value]) => {
                const maxValue = Math.max(...Object.values(monthlyUsage), 1);
                return {
                    label,
                    value,
                    percentage: Math.round((value / maxValue) * 100)
                };
            })
        };
        
        res.json(reportData);
    } catch (error) {
        console.error('Error generating reports summary:', error);
        res.status(500).json({ message: 'Error generating reports summary' });
    }
});

// Helper function to generate monthly usage data
async function generateMonthlyUsageData() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyUsage = {};
    
    // Initialize with zeros
    monthNames.forEach(month => {
        monthlyUsage[month] = 0;
    });
    
    // Get data for the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Get all schedules from the past year
    const schedules = await IrrigationSchedule.find({
        createdAt: { $gte: oneYearAgo }
    });
    
    // Aggregate water usage by month
    schedules.forEach(schedule => {
        const month = monthNames[schedule.createdAt.getMonth()];
        const waterUsed = schedule.waterAmount || schedule.fieldSize * 3 || 0;
        monthlyUsage[month] += waterUsed;
    });
    
    return monthlyUsage;
}

// Generate custom reports based on filters
router.post('/irrigation/reports/generate', async (req, res) => {
    try {
        const { reportType, region, startDate, endDate } = req.body;
        
        // Log this activity
        router.logActivity(req.user || 'Anonymous', `Generated ${reportType} report`, 'Success', req.ip, { region, startDate, endDate });
        
        // Parse dates
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        // Build base query for schedules
        const query = {};
        
        // Add date range if provided
        if (startDate && endDate) {
            query.createdAt = {
                $gte: startDateTime,
                $lte: endDateTime
            };
        }
        
        // Add region filter if not "all"
        if (region && region !== 'all') {
            query.region = region;
        }
        
        // Get real user and field statistics
        const totalUsers = await User.countDocuments();
        const activeFields = await IrrigationSchedule.countDocuments(query);
        
        // Get schedules for the period
        const schedules = await IrrigationSchedule.find(query);
        
        // Calculate water savings from real schedules
        const waterSaved = schedules.reduce((total, s) => {
            return total + (s.waterSaved || s.fieldSize * 5 || 0);
        }, 0);
        
        // Get previous period dates (same duration, shifted back)
        const duration = endDateTime - startDateTime;
        const prevEndDateTime = new Date(startDateTime);
        const prevStartDateTime = new Date(startDateTime - duration);
        
        // Get previous period data for trend calculations
        const prevQuery = { ...query };
        if (startDate && endDate) {
            prevQuery.createdAt = {
                $gte: prevStartDateTime,
                $lte: prevEndDateTime
            };
        }
        
        const prevSchedules = await IrrigationSchedule.find(prevQuery);
        const prevWaterSaved = prevSchedules.reduce((total, s) => {
            return total + (s.waterSaved || s.fieldSize * 5 || 0);
        }, 0);
        
        // Calculate trends
        const prevActiveFields = prevSchedules.length;
        const fieldsTrend = prevActiveFields > 0 
            ? Math.round(((activeFields - prevActiveFields) / prevActiveFields) * 100) 
            : 0;
        
        const waterTrend = prevWaterSaved > 0 
            ? Math.round(((waterSaved - prevWaterSaved) / prevWaterSaved) * 100) 
            : 0;
        
        // Initialize report data with real values
        let reportData = {
            totalUsers,
            userTrend: 5, // Assuming we don't track user growth by selected time period
            activeFields,
            fieldsTrend,
            waterSaved,
            waterTrend,
            satisfaction: 92, // Placeholder until we have real satisfaction data
            satisfactionTrend: 4,
        };
        
        // Process data based on report type
        switch(reportType) {
            case 'usage': {
                // Calculate monthly usage
                const monthlyUsage = {};
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                // Initialize with zeros
                monthNames.forEach(month => {
                    monthlyUsage[month] = 0;
                });
                
                // Fill with real data
                schedules.forEach(schedule => {
                    const month = monthNames[schedule.createdAt.getMonth()];
                    const waterUsed = schedule.waterAmount || schedule.fieldSize * 3 || 0;
                    monthlyUsage[month] += waterUsed;
                });
                
                // Generate chart data
                reportData.monthlyUsage = monthlyUsage;
                reportData.chartData = Object.entries(monthlyUsage).map(([label, value]) => {
                    const maxValue = Math.max(...Object.values(monthlyUsage), 1);
                    return {
                        label,
                        value,
                        percentage: Math.round((value / maxValue) * 100)
                    };
                });
                break;
            }
            case 'crops': {
                // Calculate real crop distribution from schedules
                const cropDistribution = {};
                
                schedules.forEach(schedule => {
                    if (schedule.cropType) {
                        cropDistribution[schedule.cropType] = (cropDistribution[schedule.cropType] || 0) + 1;
                    }
                });
                
                // If no real data, add sample data
                if (Object.keys(cropDistribution).length === 0) {
                    cropDistribution.Rice = 0;
                    cropDistribution.Tea = 0;
                    cropDistribution.Vegetables = 0;
                    cropDistribution.Coconut = 0;
                    cropDistribution.Other = 0;
                }
                
                // Calculate totals for percentages
                const totalCrops = Object.values(cropDistribution).reduce((sum, count) => sum + count, 0) || 1;
                
                // Generate chart data
                reportData.cropDistribution = cropDistribution;
                reportData.chartData = Object.entries(cropDistribution).map(([label, value]) => {
                    const percentage = Math.round((value / totalCrops) * 100);
                    return {
                        label,
                        value,
                        percentage
                    };
                });
                break;
            }
            case 'water': {
                // Calculate water savings by month
                const waterSavingsByMonth = {};
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                // Initialize with zeros
                monthNames.forEach(month => {
                    waterSavingsByMonth[month] = 0;
                });
                
                // Fill with real data
                schedules.forEach(schedule => {
                    const month = monthNames[schedule.createdAt.getMonth()];
                    const savings = schedule.waterSaved || schedule.fieldSize * 2 || 0;
                    waterSavingsByMonth[month] += savings;
                });
                
                // Generate chart data
                reportData.waterSavingsByMonth = waterSavingsByMonth;
                reportData.chartData = Object.entries(waterSavingsByMonth).map(([label, value]) => {
                    const maxValue = Math.max(...Object.values(waterSavingsByMonth), 1);
                    return {
                        label,
                        value,
                        percentage: Math.round((value / maxValue) * 100)
                    };
                });
                break;
            }
            case 'feedback': {
                // For feedback, we don't have real data yet, so use placeholder
                // In a real application, you would calculate this from actual feedback data
                const feedback = {
                    Excellent: 0,
                    Good: 0,
                    Average: 0,
                    Poor: 0
                };
                
                reportData.feedback = feedback;
                reportData.chartData = Object.entries(feedback).map(([label, value]) => ({
                    label,
                    value,
                    percentage: value
                }));
                break;
            }
        }
        
        res.json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Export endpoint for downloading reports
router.get('/irrigation/reports/export', async (req, res) => {
    try {
        const { format, reportType, region, startDate, endDate } = req.query;
        
        // Log this activity
        router.logActivity(req.user || 'Anonymous', `Exported ${reportType} report as ${format}`, 'Success', req.ip, { region, startDate, endDate });
        
        // In a real app, you would generate and return the actual file
        // For this demo, we'll just return a success message
        res.json({
            success: true,
            message: `Report exported as ${format}`,
            reportType,
            region,
            dateRange: { startDate, endDate }
        });
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ message: 'Error exporting report' });
    }
});

// Get system access logs with enhanced error handling
router.get('/irrigation/logs', async (req, res) => {
    try {
        // Log this action (using actual logger rather than mock data)
        router.logActivity(req.user || 'Anonymous', 'Viewed system logs');
        
        const { page = 1, limit = 10, activity = 'all', search = '', status = 'all', startDate, endDate } = req.query;
        
        // Build query filters
        const query = {};
        
        // Filter by activity type
        if (activity !== 'all') {
            query.activity = { $regex: activity, $options: 'i' };
        }
        
        // Filter by status
        if (status !== 'all') {
            query.status = status;
        }
        
        // Filter by date range
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Search across multiple fields
        if (search) {
            query.$or = [
                { user: { $regex: search, $options: 'i' } },
                { activity: { $regex: search, $options: 'i' } },
                { ipAddress: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Count total logs matching the query
        const totalLogs = await SystemLog.countDocuments(query);
        
        // Calculate pagination
        const totalPages = Math.ceil(totalLogs / limit);
        const skip = (page - 1) * limit;
        
        // Get logs for current page with sorting
        const logs = await SystemLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Use lean for better performance
            
        // Format logs for response
        const formattedLogs = logs.map(log => ({
            id: log._id,
            user: log.user,
            activity: log.activity,
            ipAddress: log.ipAddress || 'Unknown',
            timestamp: log.timestamp,
            status: log.status,
            details: log.details
        }));
        
        res.json({
            logs: formattedLogs,
            totalLogs,
            totalPages,
            currentPage: parseInt(page),
            logsPerPage: parseInt(limit)
        });
    } catch (error) {
        console.error('Error fetching system logs:', error);
        res.status(500).json({ 
            message: 'Error fetching system logs', 
            error: error.message 
        });
    }
});

// Clear mock system logs and start fresh
router.post('/irrigation/logs/reset', async (req, res) => {
    try {
        // Delete all existing logs (which may include mock data)
        await SystemLog.deleteMany({});
        
        // Create a single real initialization log
        const initLog = new SystemLog({
            user: req.user.username || req.user.email || 'admin',
            userId: req.user._id,
            activity: 'System logs reset',
            status: 'Success',
            ipAddress: req.ip || req.connection.remoteAddress,
            details: { 
                action: 'reset_logs',
                reason: 'Removing mock data',
                userAgent: req.headers['user-agent']
            },
            timestamp: new Date()
        });
        
        await initLog.save();
        
        // Log this activity
        router.logActivity(req.user, 'Reset system logs', 'Success', req.ip, {
            action: 'clear_mock_data',
            timestamp: new Date()
        });
        
        res.json({ 
            success: true, 
            message: 'All system logs cleared. Now only recording real user activities.'
        });
    } catch (error) {
        console.error('Error resetting system logs:', error);
        res.status(500).json({ 
            message: 'Error resetting system logs', 
            error: error.message 
        });
    }
});

// Clear all system logs 
router.post('/irrigation/logs/clear-all', async (req, res) => {
    try {
        // Delete all existing logs
        await SystemLog.deleteMany({});
        
        // Create a single initialization log
        const initLog = new SystemLog({
            user: req.user.username || req.user.email || 'admin',
            userId: req.user._id,
            activity: 'All system logs cleared',
            status: 'Success',
            ipAddress: req.ip || req.connection.remoteAddress,
            details: { 
                action: 'clear_all_logs',
                timestamp: new Date()
            },
            timestamp: new Date()
        });
        
        await initLog.save();
        
        res.json({ 
            success: true, 
            message: 'All system logs have been cleared.'
        });
    } catch (error) {
        console.error('Error clearing all system logs:', error);
        res.status(500).json({ 
            message: 'Error clearing system logs', 
            error: error.message 
        });
    }
});

// Add a utility function to log system activities
router.logActivity = async (user, activity, status = 'Success', ipAddress = '', details = {}) => {
    try {
        const log = new SystemLog({
            user: typeof user === 'string' ? user : user.email || user.username,
            userId: typeof user === 'string' ? null : user._id,
            activity,
            status,
            ipAddress,
            details,
            timestamp: new Date()
        });
        
        await log.save();
        console.log(`Logged activity: ${activity} by ${log.user}`);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Get system logs for admin dashboard
router.get('/system-logs', auth, isAdmin, async (req, res) => {
    try {
        const { limit = 1000 } = req.query;
        
        // Get logs for current page with sorting
        const logs = await SystemLog.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();
            
        res.json(logs);
    } catch (error) {
        console.error('Error fetching system logs:', error);
        res.status(500).json({ 
            message: 'Error fetching system logs', 
            error: error.message 
        });
    }
});

// Get request statistics for admin dashboard
router.get('/request-stats', auth, isAdmin, async (req, res) => {
    try {
        // Get current date and previous dates for comparisons
        const now = new Date();
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(now.getDate() - 1);
        
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(now.getDate() - 2);
        
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(now.getDate() - 60);
        
        // Count API requests in different time periods
        const [last24Hours, previous24Hours, currentMonthUsers, previousMonthUsers] = await Promise.all([
            SystemLog.countDocuments({
                timestamp: { $gte: oneDayAgo },
                activity: { $regex: /^(GET|POST|PUT|DELETE)/, $options: 'i' }
            }),
            SystemLog.countDocuments({
                timestamp: { $gte: twoDaysAgo, $lt: oneDayAgo },
                activity: { $regex: /^(GET|POST|PUT|DELETE)/, $options: 'i' }
            }),
            User.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            }),
            User.countDocuments({
                createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
            })
        ]);
        
        // Calculate trends
        let trend = 0;
        if (previous24Hours > 0) {
            trend = Math.round(((last24Hours - previous24Hours) / previous24Hours) * 100);
        }
        
        let userTrend = 0;
        if (previousMonthUsers > 0) {
            userTrend = Math.round(((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100);
        }
        
        res.json({
            last24Hours,
            previous24Hours,
            trend,
            userTrend,
            currentMonthUsers,
            previousMonthUsers
        });
    } catch (error) {
        console.error('Error fetching request stats:', error);
        res.status(500).json({ 
            message: 'Error fetching request statistics', 
            error: error.message 
        });
    }
});

module.exports = router; 