/**
 * User Service
 * Handles operations related to users including preferences
 */

const User = require('../models/User');

/**
 * Get a user by their ID
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} The user object
 */
async function getUserById(userId) {
    try {
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    } catch (error) {
        console.error('Error getting user by ID:', error);
        throw new Error('Failed to get user');
    }
}

/**
 * Update user preferences
 * 
 * @param {string} userId - The user's ID
 * @param {Object} preferences - The preferences to update
 * @returns {Promise<Object>} The updated preferences
 */
async function updateUserPreferences(userId, preferences) {
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update user preferences
        user.preferences = {
            ...user.preferences, // Keep existing preferences
            ...preferences // Update with new preferences
        };
        
        await user.save();
        
        return user.preferences;
    } catch (error) {
        console.error('Error updating user preferences:', error);
        throw new Error('Failed to update user preferences');
    }
}

/**
 * Get user preferences
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} The user's preferences
 */
async function getUserPreferences(userId) {
    try {
        const user = await User.findById(userId).select('preferences');
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user.preferences || {};
    } catch (error) {
        console.error('Error getting user preferences:', error);
        throw new Error('Failed to get user preferences');
    }
}

module.exports = {
    getUserById,
    updateUserPreferences,
    getUserPreferences
}; 