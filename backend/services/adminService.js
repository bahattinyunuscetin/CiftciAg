const User = require('../models/User');
const mongoose = require('mongoose');

class AdminService {
    // Get system metrics
    async getSystemMetrics() {
        try {
            const metrics = {
                totalUsers: await User.countDocuments(),
                usersByRole: {
                    farmers: await User.countDocuments({ role: 'farmer' }),
                    experts: await User.countDocuments({ role: 'expert' }),
                    admins: await User.countDocuments({ role: 'admin' })
                },
                databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                lastUpdated: new Date()
            };
            return metrics;
        } catch (error) {
            console.error('Error getting system metrics:', error);
            throw new Error('Failed to fetch system metrics');
        }
    }

    // Get all users
    async getAllUsers() {
        try {
            return await User.find({}, '-password').sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Failed to fetch users');
        }
    }

    // Get user by ID
    async getUserById(userId) {
        try {
            const user = await User.findById(userId, '-password');
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    // Update user
    async updateUser(userId, updateData) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');
            
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Delete user
    async deleteUser(userId) {
        try {
            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return { message: 'User deleted successfully' };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Backup database (placeholder - implement based on your backup strategy)
    async backupDatabase() {
        try {
            // This is a placeholder. Implement your actual backup strategy here
            // For example, you might want to use mongodump or another backup solution
            console.log('Database backup initiated');
            return { message: 'Database backup initiated', timestamp: new Date() };
        } catch (error) {
            console.error('Error backing up database:', error);
            throw new Error('Failed to backup database');
        }
    }

    // Clear application cache (placeholder - implement based on your caching strategy)
    async clearCache() {
        try {
            // This is a placeholder. Implement your actual cache clearing logic here
            console.log('Cache clearing initiated');
            return { message: 'Cache cleared successfully', timestamp: new Date() };
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw new Error('Failed to clear cache');
        }
    }
}

module.exports = new AdminService(); 