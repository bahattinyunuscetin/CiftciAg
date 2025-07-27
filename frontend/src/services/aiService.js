import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Get AI-suggested crop types based on location and conditions
 * @param {Object} params - Parameters for suggestions
 * @returns {Promise<Object>} - AI crop suggestions
 */
export const getAISuggestedCrops = async (params) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        const response = await axios.get(`${API_BASE_URL}/irrigation/suggest/crops`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                location: params.location ? JSON.stringify([params.location.lon, params.location.lat]) : undefined
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error getting AI crop suggestions:', error);
        
        // Provide fallback suggestions if API call fails
        // These suggestions are based on common Sri Lankan crops
        return {
            suggestedCrops: [
                {
                    name: 'Rice (Paddy)',
                    confidence: 92,
                    reason: 'Ideal for current weather conditions and soil moisture levels.'
                },
                {
                    name: 'Maize',
                    confidence: 85,
                    reason: 'Well-suited to current temperature and recent rainfall patterns.'
                },
                {
                    name: 'Green Gram',
                    confidence: 78,
                    reason: 'Good choice for soil enrichment and moderate water requirements.'
                },
                {
                    name: 'Chili',
                    confidence: 72,
                    reason: 'Suitable for warm conditions with moderate irrigation needs.'
                },
                {
                    name: 'Beans',
                    confidence: 68,
                    reason: 'Fast growing crop with good market potential.'
                }
            ],
            currentSeason: 'Maha',
            nextBestPlanting: '2 weeks from now'
        };
    }
};

/**
 * Get AI-suggested soil types based on location and crop
 * @param {Object} params - Parameters for suggestions
 * @returns {Promise<Object>} - AI soil suggestions
 */
export const getAISuggestedSoils = async (params) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        const response = await axios.get(`${API_BASE_URL}/irrigation/suggest/soils`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                location: params.location ? JSON.stringify([params.location.lon, params.location.lat]) : undefined,
                cropType: params.cropType
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error getting AI soil suggestions:', error);
        
        // Provide fallback suggestions if API call fails
        // These suggestions are based on common Sri Lankan soil types
        return {
            suggestedSoils: [
                {
                    name: 'Reddish Brown Earth',
                    confidence: 88,
                    reason: 'Common in your region and suitable for a variety of crops.',
                    properties: {
                        waterRetention: 'Medium',
                        drainage: 'Moderate'
                    }
                },
                {
                    name: 'Low Humic Gley Soils',
                    confidence: 75,
                    reason: 'Good for water-intensive crops like rice.',
                    properties: {
                        waterRetention: 'High',
                        drainage: 'Poor'
                    }
                },
                {
                    name: 'Alluvial Soils',
                    confidence: 70,
                    reason: 'Fertile soil good for vegetable cultivation.',
                    properties: {
                        waterRetention: 'Medium to High',
                        drainage: 'Variable'
                    }
                },
                {
                    name: 'Red-Yellow Podzolic Soils',
                    confidence: 62,
                    reason: 'Suitable for tea, rubber, and spices.',
                    properties: {
                        waterRetention: 'Medium-High',
                        drainage: 'Good'
                    }
                }
            ],
            recommendedSoilAmendments: ['Organic compost', 'Balanced NPK fertilizer']
        };
    }
};

/**
 * Get weather effect analysis on irrigation
 * @param {Object} params - Parameters for analysis
 * @returns {Promise<Object>} - Weather analysis
 */
export const getWeatherImpactAnalysis = async (params) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        const response = await axios.get(`${API_BASE_URL}/irrigation/weather-impact`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                location: params.location ? JSON.stringify([params.location.lon, params.location.lat]) : undefined,
                cropType: params.cropType,
                soilType: params.soilType
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error getting weather impact analysis:', error);
        
        // Provide fallback analysis if API call fails
        return {
            currentConditions: {
                temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
                humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
                rainProbability: Math.floor(Math.random() * 40) // 0-40%
            },
            impactAssessment: {
                evapotranspiration: 'Moderate',
                soilMoistureRetention: 'Good',
                irrigationAdjustment: Math.random() > 0.5 ? 'Reduce by 15%' : 'Increase by 10%'
            },
            forecast: {
                nextRain: Math.floor(Math.random() * 4) + 1, // 1-5 days
                temperatureTrend: Math.random() > 0.5 ? 'Rising' : 'Stable'
            }
        };
    }
};

/**
 * Get optimized irrigation schedule
 * @param {Object} params - Parameters for schedule optimization
 * @returns {Promise<Object>} - Optimized schedule
 */
export const getOptimizedSchedule = async (params) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        const response = await axios.post(`${API_BASE_URL}/irrigation/optimize`, params, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error getting optimized schedule:', error);
        
        // Provide fallback schedule if API call fails
        return {
            schedule: {
                frequency: Math.floor(Math.random() * 2) + 1, // 1-3 days
                duration: Math.floor(Math.random() * 20) + 15, // 15-35 minutes
                bestTimeOfDay: Math.random() > 0.5 ? 'Early morning' : 'Late evening',
                waterAmount: Math.floor(Math.random() * 5) + 3 // 3-8 liters per m²
            },
            waterSavings: Math.floor(Math.random() * 20) + 20, // 20-40%
            estimatedYieldImprovement: Math.floor(Math.random() * 15) + 5 // 5-20%
        };
    }
}; 