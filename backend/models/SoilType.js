const mongoose = require('mongoose');

const soilTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    waterRetention: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true
    },
    drainage: {
        type: String,
        enum: ['Slow', 'Medium', 'Fast'],
        required: true
    },
    fieldCapacity: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    wiltingPoint: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    infiltrationRate: {
        type: Number,
        required: true,
        min: 0
    },
    commonCrops: {
        type: [String],
        default: []
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
soilTypeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to create sample soil types
soilTypeSchema.statics.createSampleSoilTypes = async function() {
    const soilCount = await this.estimatedDocumentCount();
    
    if (soilCount > 0) {
        console.log('Soil types already exist, skipping sample data creation');
        return;
    }
    
    const sampleSoilTypes = [
        {
            name: 'Clay',
            description: 'Heavy soil with fine particles that holds water well but drains slowly.',
            waterRetention: 'High',
            drainage: 'Slow',
            fieldCapacity: 0.40,
            wiltingPoint: 0.20,
            infiltrationRate: 2.5,
            commonCrops: ['Rice', 'Wheat', 'Broccoli', 'Cabbage']
        },
        {
            name: 'Sandy',
            description: 'Light soil with large particles that drains quickly but retains little water.',
            waterRetention: 'Low',
            drainage: 'Fast',
            fieldCapacity: 0.15,
            wiltingPoint: 0.05,
            infiltrationRate: 25.0,
            commonCrops: ['Carrots', 'Potatoes', 'Sweet Potatoes', 'Radishes']
        },
        {
            name: 'Loam',
            description: 'Medium-textured soil with balanced properties, ideal for many crops.',
            waterRetention: 'Medium',
            drainage: 'Medium',
            fieldCapacity: 0.30,
            wiltingPoint: 0.12,
            infiltrationRate: 12.0,
            commonCrops: ['Tomatoes', 'Corn', 'Peppers', 'Beans']
        },
        {
            name: 'Sandy Loam',
            description: 'Well-draining soil with mostly sand and some silt and clay.',
            waterRetention: 'Medium',
            drainage: 'Fast',
            fieldCapacity: 0.20,
            wiltingPoint: 0.08,
            infiltrationRate: 15.0,
            commonCrops: ['Strawberries', 'Melons', 'Lettuce', 'Peanuts']
        },
        {
            name: 'Clay Loam',
            description: 'Balanced soil with more clay, offering good nutrient retention.',
            waterRetention: 'High',
            drainage: 'Medium',
            fieldCapacity: 0.35,
            wiltingPoint: 0.15,
            infiltrationRate: 8.0,
            commonCrops: ['Soybeans', 'Wheat', 'Pumpkins', 'Okra']
        },
        {
            name: 'Silt Loam',
            description: 'Smooth, fertile soil with good water retention and drainage.',
            waterRetention: 'Medium',
            drainage: 'Medium',
            fieldCapacity: 0.28,
            wiltingPoint: 0.10,
            infiltrationRate: 10.0,
            commonCrops: ['Corn', 'Soybeans', 'Wheat', 'Vegetables']
        },
        {
            name: 'Silty Clay',
            description: 'Soil with high silt and clay content, good for water and nutrient retention.',
            waterRetention: 'High',
            drainage: 'Slow',
            fieldCapacity: 0.38,
            wiltingPoint: 0.18,
            infiltrationRate: 5.0,
            commonCrops: ['Rice', 'Wheat', 'Legumes']
        }
    ];
    
    try {
        await this.insertMany(sampleSoilTypes);
        console.log('Sample soil types created successfully');
    } catch (error) {
        console.error('Error creating sample soil types:', error);
    }
};

module.exports = mongoose.model('SoilType', soilTypeSchema); 