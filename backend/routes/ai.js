const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const aiService = require('../services/aiService');
const multer = require('multer');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get crop recommendation
router.post('/recommend-crop', auth, async (req, res) => {
    try {
        const soilData = req.body;
        
        if (!soilData || !soilData.nitrogen || !soilData.phosphorus || !soilData.potassium) {
            return res.status(400).json({ 
                message: 'Missing required soil data',
                details: 'Please provide nitrogen, phosphorus, and potassium values'
            });
        }

        const recommendation = await aiService.getCropRecommendation(soilData);
        res.json(recommendation);
    } catch (error) {
        console.error('Crop recommendation error:', error);
        res.status(500).json({ 
            message: 'Error getting crop recommendation',
            details: error.message
        });
    }
});

// Detect plant disease
router.post('/detect-disease', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No image provided',
                details: 'Please upload an image file'
            });
        }

        const result = await aiService.detectDisease(req.file.buffer);
        res.json(result);
    } catch (error) {
        console.error('Disease detection error:', error);
        res.status(500).json({ 
            message: 'Error detecting plant disease',
            details: error.message
        });
    }
});

// Get soil analysis
router.post('/analyze-soil', auth, async (req, res) => {
    try {
        const soilData = req.body;
        
        if (!soilData) {
            return res.status(400).json({ 
                message: 'No soil data provided',
                details: 'Please provide soil test data'
            });
        }

        const analysis = await aiService.getSoilAnalysis(soilData);
        res.json(analysis);
    } catch (error) {
        console.error('Soil analysis error:', error);
        res.status(500).json({ 
            message: 'Error analyzing soil',
            details: error.message
        });
    }
});

// Get yield prediction
router.post('/predict-yield', auth, async (req, res) => {
    try {
        const cropData = req.body;
        
        if (!cropData || !cropData.crop || !cropData.area) {
            return res.status(400).json({ 
                message: 'Missing required crop data',
                details: 'Please provide crop type and area'
            });
        }

        const prediction = await aiService.getYieldPrediction(cropData);
        res.json(prediction);
    } catch (error) {
        console.error('Yield prediction error:', error);
        res.status(500).json({ 
            message: 'Error predicting crop yield',
            details: error.message
        });
    }
});

module.exports = router; 