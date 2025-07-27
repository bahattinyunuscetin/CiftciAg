const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['farmer', 'admin', 'expert'],
        default: 'farmer'
    },
    farmLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    preferences: {
        useLocalizedData: {
            type: Boolean,
            default: false
        },
        region: {
            type: String,
            default: 'default'
        },
        measurementSystem: {
            type: String,
            enum: ['metric', 'imperial'],
            default: 'metric'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    profile: {
        phone: {
            type: String,
            default: ''
        },
        nic: {
            type: String,
            default: ''
        },
        farmSize: {
            type: Number,
            default: 0
        },
        farmLocation: {
            type: String,
            default: ''
        },
        preferredCrops: {
            type: String,
            default: ''
        },
        designation: {
            type: String,
            default: ''
        },
        company: {
            type: String,
            default: ''
        }
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 