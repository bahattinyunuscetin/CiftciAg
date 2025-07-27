const mongoose = require('mongoose');

const cropTypeSchema = new mongoose.Schema({
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
    waterNeed: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true
    },
    rootDepth: {
        type: String,
        required: true
    },
    waterRequirement: {
        type: Number,
        required: true,
        min: 0
    },
    stressThreshold: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    // New fields for crop recommendations
    waterNeeds: {
        type: String,
        enum: ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'],
        default: function() {
            // Map from waterNeed if not explicitly set
            const mapping = {
                'Low': 'Low',
                'Medium': 'Medium',
                'High': 'High'
            };
            return mapping[this.waterNeed] || 'Medium';
        }
    },
    suitableSoils: {
        type: [String],
        default: ['Loam', 'Clay Loam']
    },
    growingSeason: {
        type: String,
        default: 'Year-round'
    },
    growthPeriod: {
        type: String,
        default: '3-4 months'
    },
    yieldEstimate: {
        type: String,
        default: 'Varies by region and conditions'
    },
    regions: {
        type: [String],
        default: ['all'] // 'all' means suitable for all regions
    },
    imageUrl: {
        type: String,
        default: '/images/crops/default-crop.jpg'
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
cropTypeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to create sample crop types
cropTypeSchema.statics.createSampleCrops = async function() {
    const cropCount = await this.estimatedDocumentCount();
    
    if (cropCount > 0) {
        console.log('Crop types already exist, skipping sample data creation');
        return;
    }
    
    const sampleCrops = [
        {
            name: 'Rice',
            description: 'A staple grain crop grown in flooded fields.',
            waterNeed: 'High',
            rootDepth: '30-40 cm',
            waterRequirement: 900,
            stressThreshold: 0.7,
            waterNeeds: 'High',
            suitableSoils: ['Clay', 'Clay Loam', 'Silty Clay'],
            growingSeason: 'Wet season',
            growthPeriod: '3-4 months',
            yieldEstimate: '4-6 tons/hectare',
            regions: ['sri-lanka', 'india', 'southeast-asia', 'tropical'],
            imageUrl: '/images/crops/rice.jpg'
        },
        {
            name: 'Corn (Maize)',
            description: 'Versatile grain crop used for food, feed, and fuel.',
            waterNeed: 'Medium',
            rootDepth: '60-90 cm',
            waterRequirement: 600,
            stressThreshold: 0.6,
            waterNeeds: 'Medium-High',
            suitableSoils: ['Loam', 'Sandy Loam', 'Silt Loam'],
            growingSeason: 'Warm season',
            growthPeriod: '3-5 months',
            yieldEstimate: '5-8 tons/hectare',
            regions: ['all'],
            imageUrl: '/images/crops/corn.jpg'
        },
        {
            name: 'Tomatoes',
            description: 'Popular fruit vegetable grown for culinary uses.',
            waterNeed: 'Medium',
            rootDepth: '40-60 cm',
            waterRequirement: 450,
            stressThreshold: 0.5,
            waterNeeds: 'Medium',
            suitableSoils: ['Loam', 'Sandy Loam', 'Clay Loam'],
            growingSeason: 'Warm season',
            growthPeriod: '3-4 months',
            yieldEstimate: '20-30 tons/hectare',
            regions: ['all'],
            imageUrl: '/images/crops/tomatoes.jpg'
        },
        {
            name: 'Carrots',
            description: 'Root vegetable known for its orange color and nutritional value.',
            waterNeed: 'Medium',
            rootDepth: '30-45 cm',
            waterRequirement: 350,
            stressThreshold: 0.5,
            waterNeeds: 'Medium',
            suitableSoils: ['Sandy', 'Sandy Loam', 'Loam'],
            growingSeason: 'Cool season',
            growthPeriod: '2-3 months',
            yieldEstimate: '15-25 tons/hectare',
            regions: ['all'],
            imageUrl: '/images/crops/carrots.jpg'
        },
        {
            name: 'Tea',
            description: 'Perennial crop grown for its leaves used to make tea.',
            waterNeed: 'Medium',
            rootDepth: '60-90 cm',
            waterRequirement: 700,
            stressThreshold: 0.6,
            waterNeeds: 'Medium-High',
            suitableSoils: ['Loam', 'Sandy Loam', 'Acidic soil'],
            growingSeason: 'Year-round',
            growthPeriod: 'Perennial',
            yieldEstimate: '1500-3000 kg/hectare/year',
            regions: ['sri-lanka', 'india'],
            imageUrl: '/images/crops/tea.jpg'
        },
        {
            name: 'Coconut',
            description: 'Tropical palm tree grown for its fruit, oil, and many other uses.',
            waterNeed: 'Medium',
            rootDepth: '100-150 cm',
            waterRequirement: 500,
            stressThreshold: 0.5,
            waterNeeds: 'Medium',
            suitableSoils: ['Sandy', 'Sandy Loam', 'Loam'],
            growingSeason: 'Year-round',
            growthPeriod: 'Perennial',
            yieldEstimate: '50-75 nuts/tree/year',
            regions: ['sri-lanka', 'india', 'southeast-asia', 'tropical'],
            imageUrl: '/images/crops/coconut.jpg'
        },
        {
            name: 'Green Beans',
            description: 'Nutritious legume vegetable with edible pods.',
            waterNeed: 'Medium',
            rootDepth: '30-45 cm',
            waterRequirement: 400,
            stressThreshold: 0.5,
            waterNeeds: 'Medium',
            suitableSoils: ['Loam', 'Sandy Loam', 'Clay Loam'],
            growingSeason: 'Warm season',
            growthPeriod: '2 months',
            yieldEstimate: '8-12 tons/hectare',
            regions: ['all'],
            imageUrl: '/images/crops/greenbeans.jpg'
        },
        {
            name: 'Sweet Potatoes',
            description: 'Root vegetable with nutritious tubers and edible leaves.',
            waterNeed: 'Medium',
            rootDepth: '40-60 cm',
            waterRequirement: 400,
            stressThreshold: 0.4,
            waterNeeds: 'Medium-Low',
            suitableSoils: ['Sandy', 'Sandy Loam', 'Loam'],
            growingSeason: 'Warm season',
            growthPeriod: '3-5 months',
            yieldEstimate: '10-15 tons/hectare',
            regions: ['all'],
            imageUrl: '/images/crops/sweetpotatoes.jpg'
        }
    ];
    
    try {
        await this.insertMany(sampleCrops);
        console.log('Sample crop types created successfully');
    } catch (error) {
        console.error('Error creating sample crop types:', error);
    }
};

module.exports = mongoose.model('CropType', cropTypeSchema); 