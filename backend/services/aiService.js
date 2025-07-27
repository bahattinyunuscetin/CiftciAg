/**
 * AI Service for Smart Irrigation in Sri Lanka's Dry Zone
 * 
 * This service uses machine learning models to provide smart irrigation recommendations
 * based on Sri Lankan crop types, soil conditions, weather patterns, and historical data.
 * Specifically optimized for dry zone farming practices.
 */

const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();
const sriLankanIrrigation = require('./sriLankanIrrigationService');

class AIService {
    constructor() {
        this.modelEndpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:5001';
    }

    /**
     * Get crop recommendations based on location, weather, and soil data
     * 
     * @param {Object} params - Parameters for recommendation
     * @param {Object} params.location - User's location
     * @param {Object} params.weatherData - Current weather data
     * @param {Object} params.soilData - Soil data if available
     * @param {String} params.region - User's region preference
     * @returns {Promise<Object>} Crop recommendations
     */
    async suggestCropTypes(params) {
        try {
            console.log('Generating AI crop suggestions based on environmental conditions');
            
            const { location, weatherData, soilData, region } = params;
            
            // First try to determine if we should use Sri Lankan data
            const useSriLankanData = region && region.toLowerCase().includes('sri lanka');
            
            if (useSriLankanData) {
                return this.getSriLankanCropSuggestions(params);
            }
            
            // If we have soil data, use ML model for recommendations
            if (soilData && soilData.nitrogen && soilData.phosphorus && soilData.potassium) {
                // Call our ML model API
                const response = await axios.post(`${this.modelEndpoint}/predict/crop`, {
                    nitrogen: soilData.nitrogen,
                    phosphorus: soilData.phosphorus,
                    potassium: soilData.potassium,
                    temperature: weatherData.temperature,
                    humidity: weatherData.humidity,
                    ph: soilData.ph || 6.5,
                    rainfall: weatherData.precipitation || 100
                });
                
                // Transform the response to our format
                return {
                    suggestedCrops: [
                        {
                            name: response.data.crop,
                            confidence: response.data.confidence,
                            reason: 'Based on soil nutrient analysis'
                        },
                        ...(response.data.alternatives || []).map(alt => ({
                            name: alt.crop,
                            confidence: alt.confidence,
                            reason: 'Alternative based on soil conditions'
                        }))
                    ],
                    baseReason: 'Recommendations based on ML analysis of soil nutrients and weather conditions'
                };
            }
            
            // Fallback to rules-based recommendations based on season and weather
            return this.getSeasonBasedCropSuggestions(weatherData);
        } catch (error) {
            console.error('Error suggesting crops:', error);
            // Provide a fallback response
            return {
                suggestedCrops: [
                    { name: 'Maize', confidence: 60, reason: 'Versatile crop for various conditions' },
                    { name: 'Wheat', confidence: 55, reason: 'Common staple crop' },
                    { name: 'Soybean', confidence: 50, reason: 'Adaptable to many soil types' }
                ],
                baseReason: 'Default suggestions due to limited data'
            };
        }
    }
    
    /**
     * Get soil type recommendations based on location and available data
     * 
     * @param {Object} params - Parameters for recommendation
     * @param {Object} params.location - User's location
     * @param {Object} params.soilData - Soil data if available
     * @param {String} params.region - User's region preference 
     * @returns {Promise<Object>} Soil type recommendations
     */
    async suggestSoilTypes(params) {
        try {
            console.log('Generating AI soil type suggestions');
            
            const { location, soilData, region } = params;
            
            // Check if we should use Sri Lankan data
            const useSriLankanData = region && region.toLowerCase().includes('sri lanka');
            
            if (useSriLankanData) {
                return this.getSriLankanSoilSuggestions(params);
            }
            
            // If we have soil moisture, pH, etc. data, use it for analysis
            if (soilData && soilData.ph) {
                const soilTexture = this.determineSoilTexture(soilData);
                const soilCharacteristics = this.analyzeSoilCharacteristics(soilData);
                
                return {
                    suggestedSoils: [
                        {
                            name: soilTexture.primaryType,
                            confidence: soilTexture.confidence,
                            reason: `Based on pH ${soilData.ph} and observed characteristics`,
                            properties: soilCharacteristics
                        },
                        {
                            name: soilTexture.secondaryType,
                            confidence: soilTexture.secondaryConfidence,
                            reason: 'Alternative classification based on measurements',
                            properties: soilCharacteristics
                        }
                    ],
                    baseReason: 'Recommendations based on soil measurements and analysis'
                };
            }
            
            // Fallback to location-based suggestions using geographical data
            return this.getLocationBasedSoilSuggestions(location);
        } catch (error) {
            console.error('Error suggesting soil types:', error);
            // Provide a fallback response
            return {
                suggestedSoils: [
                    { name: 'Loam', confidence: 60, reason: 'Common soil type in many regions', properties: { waterRetention: 'medium', drainage: 'good' } },
                    { name: 'Clay Loam', confidence: 45, reason: 'Alternative soil consideration', properties: { waterRetention: 'high', drainage: 'moderate' } }
                ],
                baseReason: 'Default suggestions due to limited data'
            };
        }
    }

    /**
     * Get Sri Lankan crop suggestions based on region and season
     */
    getSriLankanCropSuggestions(params) {
        const { region, weatherData } = params;
        const currentSeason = sriLankanIrrigation.getCurrentSeason();
        const seasonInfo = sriLankanIrrigation.DRY_ZONE_SEASONS[currentSeason];
        
        // Get list of crops from Sri Lankan data
        const allCrops = Object.keys(sriLankanIrrigation.CROP_FACTORS);
        
        // Determine zone from region
        const zone = region.toLowerCase().includes('dry zone') ? 'dry' : 
                     region.toLowerCase().includes('wet zone') ? 'wet' : 'intermediate';
        
        // Calculate confidence based on crop suitability for current season and zone
        const suggestedCrops = [];
        
        // First add recommended seasonal crops with high confidence
        if (seasonInfo && seasonInfo.mainCrops) {
            seasonInfo.mainCrops.forEach(crop => {
                // Adjust confidence based on weather conditions
                let confidence = 90; // Base high confidence for seasonal recommended crops
                
                // Adjust for extreme weather
                if (weatherData) {
                    if (weatherData.temperature > 32 && crop === 'Rice') {
                        confidence -= 10; // Rice less ideal in extreme heat
                    }
                    if (weatherData.humidity < 40 && crop === 'Rice') {
                        confidence -= 15; // Rice needs humidity
                    }
                    if (weatherData.precipitation < 10 && currentSeason === 'Maha') {
                        confidence -= 15; // Less rainfall than expected in Maha season
                    }
                }
                
                suggestedCrops.push({
                    name: crop,
                    confidence,
                    reason: `Recommended crop for ${currentSeason} season in ${zone} zone`
                });
            });
        }
        
        // Add other crops with lower confidence
        allCrops.forEach(crop => {
            // Skip crops already added
            if (suggestedCrops.some(c => c.name === crop)) {
                return;
            }
            
            let confidence = 50; // Base confidence
            let reason = `Potential alternative crop for ${zone} zone`;
            
            // Adjust confidence based on crop water needs and current weather
            const cropInfo = sriLankanIrrigation.CROP_FACTORS[crop];
            if (cropInfo) {
                if (cropInfo.waterNeed === 'low' && weatherData && weatherData.precipitation < 20) {
                    confidence += 15;
                    reason = 'Drought-resistant crop suitable for current dry conditions';
                }
                
                if (cropInfo.waterNeed === 'high' && weatherData && weatherData.precipitation > 50) {
                    confidence += 15;
                    reason = 'Water-loving crop suitable for current wet conditions';
                }
            }
            
            suggestedCrops.push({ name: crop, confidence, reason });
        });
        
        // Sort by confidence and return top results
        return {
            suggestedCrops: suggestedCrops.sort((a, b) => b.confidence - a.confidence).slice(0, 5),
            baseReason: `Recommendations for ${currentSeason} season in Sri Lanka's ${zone} zone`,
            currentSeason: currentSeason
        };
    }
    
    /**
     * Get Sri Lankan soil suggestions based on region
     */
    getSriLankanSoilSuggestions(params) {
        const { region } = params;
        
        // Determine zone from region
        const zone = region.toLowerCase().includes('dry zone') ? 'dry' : 
                     region.toLowerCase().includes('wet zone') ? 'wet' : 'intermediate';
        
        // Get soil types from Sri Lankan data
        const allSoilTypes = Object.keys(sriLankanIrrigation.DRY_ZONE_SOIL_TYPES);
        
        const suggestedSoils = [];
        
        // Add soil types with confidence levels based on zone
        if (zone === 'dry') {
            // Dry zone typical soils in order of prevalence
            suggestedSoils.push({
                name: 'Reddish Brown Earth',
                confidence: 90,
                reason: 'Predominant soil type in Sri Lanka\'s dry zone',
                properties: sriLankanIrrigation.DRY_ZONE_SOIL_TYPES['Reddish Brown Earth']
            });
            
            suggestedSoils.push({
                name: 'Non-Calcic Brown',
                confidence: 75,
                reason: 'Common in drier regions of Sri Lanka',
                properties: sriLankanIrrigation.DRY_ZONE_SOIL_TYPES['Non-Calcic Brown']
            });
            
            suggestedSoils.push({
                name: 'Low Humic Gley',
                confidence: 60,
                reason: 'Found in low-lying areas of the dry zone',
                properties: sriLankanIrrigation.DRY_ZONE_SOIL_TYPES['Low Humic Gley']
            });
        } else if (zone === 'wet') {
            // Wet zone typical soils
            suggestedSoils.push({
                name: 'Red-Yellow Podzolic',
                confidence: 85,
                reason: 'Predominant in Sri Lanka\'s wet zone',
                properties: { texture: 'clayey', waterRetention: 'high', drainageRate: 'moderate' }
            });
            
            suggestedSoils.push({
                name: 'Red-Yellow Latosol',
                confidence: 70,
                reason: 'Common in wet zone uplands',
                properties: sriLankanIrrigation.DRY_ZONE_SOIL_TYPES['Red-Yellow Latosol'] 
            });
        } else {
            // Intermediate zone
            suggestedSoils.push({
                name: 'Reddish Brown Earth',
                confidence: 75,
                reason: 'Common in intermediate zone',
                properties: sriLankanIrrigation.DRY_ZONE_SOIL_TYPES['Reddish Brown Earth']
            });
            
            suggestedSoils.push({
                name: 'Immature Brown Loams',
                confidence: 70,
                reason: 'Found in parts of the intermediate zone',
                properties: { texture: 'loamy', waterRetention: 'medium', drainageRate: 'good' }
            });
        }
        
        // Add remaining soil types with lower confidence
        allSoilTypes.forEach(soil => {
            if (!suggestedSoils.some(s => s.name === soil)) {
                suggestedSoils.push({
                    name: soil,
                    confidence: 40,
                    reason: 'Less common but possible soil type',
                    properties: sriLankanIrrigation.DRY_ZONE_SOIL_TYPES[soil]
                });
            }
        });
        
        return {
            suggestedSoils: suggestedSoils.slice(0, 4), // Top 4 suggestions
            baseReason: `Soil recommendations for Sri Lanka's ${zone} zone`
        };
    }
    
    /**
     * Get season-based crop suggestions
     */
    getSeasonBasedCropSuggestions(weatherData) {
        // Determine current season based on month
        const month = new Date().getMonth();
        let season;
        
        if ([2, 3, 4].includes(month)) {
            season = 'spring';
        } else if ([5, 6, 7].includes(month)) {
            season = 'summer';
        } else if ([8, 9, 10].includes(month)) {
            season = 'fall';
        } else {
            season = 'winter';
        }
        
        // Create suggestions based on season and weather conditions
        const suggestions = [];
        
        if (season === 'spring') {
            suggestions.push(
                { name: 'Maize', confidence: 85, reason: 'Ideal spring crop with good market value' },
                { name: 'Wheat', confidence: 80, reason: 'Well-suited to spring planting conditions' },
                { name: 'Potato', confidence: 75, reason: 'Productive early spring crop' },
                { name: 'Tomato', confidence: 70, reason: 'High-value spring vegetable crop' }
            );
        } else if (season === 'summer') {
            suggestions.push(
                { name: 'Tomato', confidence: 85, reason: 'High-yielding summer crop' },
                { name: 'Cotton', confidence: 80, reason: 'Thrives in hot summer conditions' },
                { name: 'Soybean', confidence: 75, reason: 'Heat-tolerant summer legume' },
                { name: 'Lettuce', confidence: 70, reason: 'Fast-growing summer vegetable' }
            );
        } else if (season === 'fall') {
            suggestions.push(
                { name: 'Wheat', confidence: 85, reason: 'Ideal for fall planting' },
                { name: 'Potato', confidence: 80, reason: 'Good fall crop with storage potential' },
                { name: 'Soybean', confidence: 75, reason: 'Late season legume option' },
                { name: 'Lettuce', confidence: 70, reason: 'Quick-growing fall crop' }
            );
        } else {
            suggestions.push(
                { name: 'Wheat', confidence: 80, reason: 'Winter wheat variety' },
                { name: 'Potato', confidence: 70, reason: 'Early winter potential in mild climates' },
                { name: 'Lettuce', confidence: 65, reason: 'Protected winter crop option' }
            );
        }
        
        // Adjust based on current weather if available
        if (weatherData) {
            // Adjust for temperature
            if (weatherData.temperature > 30) {
                // For hot conditions, boost heat-tolerant crops
                suggestions.forEach(crop => {
                    if (['Cotton', 'Soybean', 'Tomato'].includes(crop.name)) {
                        crop.confidence += 10;
                        crop.reason += ' (well-suited to current hot conditions)';
                    }
                });
                
                // Add a drought-tolerant option
                if (!suggestions.some(c => c.name === 'Sorghum')) {
                    suggestions.push({
                        name: 'Sorghum', 
                        confidence: 75, 
                        reason: 'Heat and drought-tolerant crop for current conditions'
                    });
                }
            }
            
            // Adjust for precipitation
            if (weatherData.precipitation < 10) { // Dry conditions
                suggestions.forEach(crop => {
                    if (['Cotton', 'Sorghum'].includes(crop.name)) {
                        crop.confidence += 5;
                    } else if (['Lettuce', 'Potato'].includes(crop.name)) {
                        crop.confidence -= 10;
                    }
                });
            } else if (weatherData.precipitation > 50) { // Wet conditions
                suggestions.forEach(crop => {
                    if (['Rice', 'Lettuce'].includes(crop.name)) {
                        crop.confidence += 10;
                    } else if (['Cotton', 'Sorghum'].includes(crop.name)) {
                        crop.confidence -= 10;
                    }
                });
                
                // Add rice as an option for wet conditions
                if (!suggestions.some(c => c.name === 'Rice')) {
                    suggestions.push({
                        name: 'Rice', 
                        confidence: 80, 
                        reason: 'Ideal for current wet conditions'
                    });
                }
            }
        }
        
        // Sort by confidence and return
        return {
            suggestedCrops: suggestions.sort((a, b) => b.confidence - a.confidence),
            baseReason: `Recommendations for ${season} season based on typical growing patterns`
        };
    }
    
    /**
     * Get location-based soil type suggestions
     */
    getLocationBasedSoilSuggestions(location) {
        // This would ideally use a geospatial database with soil type data
        // For now, we'll use a simplified approach based on latitude
        
        if (!location || !location.lat) {
            return {
                suggestedSoils: [
                    { name: 'Loam', confidence: 60, reason: 'Common balanced soil type', properties: { waterRetention: 'medium', drainage: 'good' } },
                    { name: 'Clay Loam', confidence: 55, reason: 'Common in many agricultural regions', properties: { waterRetention: 'high', drainage: 'moderate' } },
                    { name: 'Sandy Loam', confidence: 50, reason: 'Alternative soil option', properties: { waterRetention: 'low', drainage: 'excellent' } }
                ],
                baseReason: 'Default suggestions with no location data'
            };
        }
        
        const { lat, lon } = location;
        const suggestions = [];
        
        // Very simplified soil distribution by latitude
        // This would be replaced by actual soil maps or APIs in production
        if (Math.abs(lat) < 15) { // Near equator - tropical regions
            suggestions.push(
                { name: 'Red Laterite', confidence: 75, reason: 'Common in tropical regions', properties: { waterRetention: 'medium', drainage: 'good' } },
                { name: 'Clay', confidence: 70, reason: 'Found in tropical lowlands', properties: { waterRetention: 'high', drainage: 'poor' } },
                { name: 'Sandy Loam', confidence: 65, reason: 'Present in tropical uplands', properties: { waterRetention: 'low', drainage: 'excellent' } }
            );
        } else if (Math.abs(lat) < 30) { // Subtropical regions
            suggestions.push(
                { name: 'Loam', confidence: 75, reason: 'Common in subtropical regions', properties: { waterRetention: 'medium', drainage: 'good' } },
                { name: 'Clay Loam', confidence: 70, reason: 'Found in subtropical valleys', properties: { waterRetention: 'high', drainage: 'moderate' } },
                { name: 'Silt Loam', confidence: 65, reason: 'Present in subtropical plains', properties: { waterRetention: 'medium-high', drainage: 'moderate' } }
            );
        } else if (Math.abs(lat) < 50) { // Temperate regions
            suggestions.push(
                { name: 'Silt Loam', confidence: 75, reason: 'Common in temperate regions', properties: { waterRetention: 'medium-high', drainage: 'moderate' } },
                { name: 'Sandy Clay Loam', confidence: 70, reason: 'Found in temperate uplands', properties: { waterRetention: 'medium', drainage: 'good' } },
                { name: 'Clay', confidence: 65, reason: 'Present in temperate basins', properties: { waterRetention: 'high', drainage: 'poor' } }
            );
        } else { // Higher latitudes
            suggestions.push(
                { name: 'Peat', confidence: 75, reason: 'Common in northern regions', properties: { waterRetention: 'very high', drainage: 'poor' } },
                { name: 'Sandy Loam', confidence: 65, reason: 'Found in northern highlands', properties: { waterRetention: 'low', drainage: 'excellent' } },
                { name: 'Clay Loam', confidence: 60, reason: 'Present in northern valleys', properties: { waterRetention: 'high', drainage: 'moderate' } }
            );
        }
        
        return {
            suggestedSoils: suggestions,
            baseReason: 'Suggestions based on geographic location and typical soil distribution'
        };
    }
    
    /**
     * Determine soil texture based on soil measurement data
     */
    determineSoilTexture(soilData) {
        // This would use actual soil texture classification algorithms
        // For now, we'll use a simplified approach based on pH and moisture
        
        let primaryType = 'Loam'; // Default
        let secondaryType = 'Sandy Loam';
        let confidence = 60;
        let secondaryConfidence = 40;
        
        if (soilData.ph < 5.5) {
            // Acidic soils
            primaryType = 'Sandy Loam';
            secondaryType = 'Sandy Clay Loam';
            confidence = 65;
            
            if (soilData.organicMatter && soilData.organicMatter > 3) {
                primaryType = 'Peat';
                confidence = 70;
            }
        } else if (soilData.ph < 6.5) {
            // Slightly acidic
            primaryType = 'Loam';
            secondaryType = 'Sandy Clay Loam';
            confidence = 65;
        } else if (soilData.ph < 7.5) {
            // Neutral
            primaryType = 'Clay Loam';
            secondaryType = 'Silt Loam';
            confidence = 70;
        } else {
            // Alkaline
            primaryType = 'Clay';
            secondaryType = 'Clay Loam';
            confidence = 65;
        }
        
        // Adjust based on moisture if available
        if (soilData.moisture) {
            if (soilData.moisture > 75) {
                // Very wet soil
                if (primaryType !== 'Clay') {
                    secondaryType = primaryType;
                    primaryType = 'Clay';
                    secondaryConfidence = confidence;
                    confidence = 75;
                } else {
                    confidence += 10;
                }
            } else if (soilData.moisture < 30) {
                // Very dry soil
                if (primaryType !== 'Sandy Loam') {
                    secondaryType = primaryType;
                    primaryType = 'Sandy Loam';
                    secondaryConfidence = confidence;
                    confidence = 70;
                } else {
                    confidence += 10;
                }
            }
        }
        
        return {
            primaryType,
            secondaryType,
            confidence,
            secondaryConfidence
        };
    }
    
    /**
     * Analyze soil characteristics based on measurements
     */
    analyzeSoilCharacteristics(soilData) {
        // Calculate water retention and drainage classifications
        let waterRetention = 'medium';
        let drainage = 'moderate';
        
        if (soilData.moisture) {
            if (soilData.moisture > 70) {
                waterRetention = 'high';
                drainage = 'poor';
            } else if (soilData.moisture < 30) {
                waterRetention = 'low';
                drainage = 'good';
            }
        }
        
        if (soilData.texture) {
            if (soilData.texture.includes('sand')) {
                drainage = 'excellent';
                waterRetention = 'low';
            } else if (soilData.texture.includes('clay')) {
                drainage = 'poor';
                waterRetention = 'high';
            }
        }
        
        return {
            waterRetention,
            drainage,
            ph: soilData.ph,
            fertility: soilData.ph > 5.5 && soilData.ph < 7.5 ? 'moderate to high' : 'low to moderate'
        };
    }

    async getCropRecommendation(soilData) {
        try {
            console.log('Getting crop recommendation for soil data:', soilData);
            
            const response = await axios.post(`${this.modelEndpoint}/predict/crop`, {
                nitrogen: soilData.nitrogen,
                phosphorus: soilData.phosphorus,
                potassium: soilData.potassium,
                temperature: soilData.temperature,
                humidity: soilData.humidity,
                ph: soilData.ph,
                rainfall: soilData.rainfall
            });

            return {
                recommendedCrop: response.data.crop,
                confidence: response.data.confidence,
                alternatives: response.data.alternatives || []
            };
        } catch (error) {
            console.error('Error getting crop recommendation:', error);
            throw new Error('Failed to get crop recommendation: ' + error.message);
        }
    }

    async detectDisease(imageData) {
        try {
            console.log('Detecting plant disease from image');
            
            const formData = new FormData();
            formData.append('image', imageData);

            const response = await axios.post(`${this.modelEndpoint}/predict/disease`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return {
                disease: response.data.disease,
                confidence: response.data.confidence,
                treatment: response.data.treatment,
                preventiveMeasures: response.data.preventiveMeasures
            };
        } catch (error) {
            console.error('Error detecting plant disease:', error);
            throw new Error('Failed to detect plant disease: ' + error.message);
        }
    }

    async getSoilAnalysis(soilData) {
        try {
            console.log('Analyzing soil data:', soilData);
            
            const response = await axios.post(`${this.modelEndpoint}/analyze/soil`, soilData);

            return {
                soilType: response.data.soilType,
                fertility: response.data.fertility,
                recommendations: response.data.recommendations,
                nutrients: response.data.nutrients
            };
        } catch (error) {
            console.error('Error analyzing soil:', error);
            throw new Error('Failed to analyze soil: ' + error.message);
        }
    }

    async getYieldPrediction(cropData) {
        try {
            console.log('Predicting crop yield:', cropData);
            
            const response = await axios.post(`${this.modelEndpoint}/predict/yield`, {
                crop: cropData.crop,
                area: cropData.area,
                soilType: cropData.soilType,
                season: cropData.season,
                irrigation: cropData.irrigation,
                fertilizers: cropData.fertilizers
            });

            return {
                estimatedYield: response.data.yield,
                confidenceInterval: response.data.confidenceInterval,
                factors: response.data.factors
            };
        } catch (error) {
            console.error('Error predicting yield:', error);
            throw new Error('Failed to predict crop yield: ' + error.message);
        }
    }
}

module.exports = new AIService(); 