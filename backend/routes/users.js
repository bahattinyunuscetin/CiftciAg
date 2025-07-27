const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// @route   POST /api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user
        user = new User({
            username,
            email,
            password
        });
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        await user.save();
        
        // Create JWT token
        const payload = {
            user: {
                id: user.id
            }
        };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/login
// @desc    Login user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Create JWT token
        const payload = {
            user: {
                id: user.id
            }
        };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/users/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return preferences or default values
        res.json(user.preferences || {
            useLocalizedData: false,
            region: 'default',
            measurementSystem: 'metric',
            language: 'en'
        });
    } catch (err) {
        console.error('Error fetching preferences:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update preferences
        user.preferences = req.body;
        await user.save();
        
        res.json(user.preferences);
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return the profile data or default values
        const profileData = {
            name: user.username || '',
            email: user.email || '',
            phone: user.profile?.phone || '',
            nic: user.profile?.nic || '',
            farmSize: user.profile?.farmSize || '',
            farmLocation: user.profile?.farmLocation || '',
            preferredCrops: user.profile?.preferredCrops || '',
            designation: user.profile?.designation || '',
            company: user.profile?.company || ''
        };
        
        res.json(profileData);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Destructure profile data
        const { name, email, phone, nic, farmSize, farmLocation, preferredCrops, designation, company } = req.body;
        
        // Update basic user info
        if (name) user.username = name;
        if (email) user.email = email;
        
        // Update or create profile object
        if (!user.profile) user.profile = {};
        
        if (phone !== undefined) user.profile.phone = phone;
        if (nic !== undefined) user.profile.nic = nic;
        if (farmSize !== undefined) user.profile.farmSize = farmSize;
        if (farmLocation !== undefined) user.profile.farmLocation = farmLocation;
        if (preferredCrops !== undefined) user.profile.preferredCrops = preferredCrops;
        if (designation !== undefined) user.profile.designation = designation;
        if (company !== undefined) user.profile.company = company;
        
        await user.save();
        
        // Return updated profile data
        res.json({
            name: user.username,
            email: user.email,
            phone: user.profile.phone,
            nic: user.profile.nic,
            farmSize: user.profile.farmSize,
            farmLocation: user.profile.farmLocation,
            preferredCrops: user.profile.preferredCrops,
            designation: user.profile.designation,
            company: user.profile.company
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/experts
// @desc    Get all experts
// @access  Public
router.get('/experts', async (req, res) => {
    try {
        // Find all users with expert role
        const experts = await User.find({ role: 'expert' })
            .select('-password')
            .sort({ createdAt: -1 }); // Sort by newest first
        
        res.json(experts);
    } catch (err) {
        console.error('Error fetching experts:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/users/experts/:id
// @desc    Remove expert role (change to farmer)
// @access  Admin only
router.delete('/experts/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Expert not found' });
        }
        
        if (user.role !== 'expert') {
            return res.status(400).json({ message: 'User is not an expert' });
        }
        
        // Change role to farmer
        user.role = 'farmer';
        await user.save();
        
        // Create system log
        const systemLog = {
            user: req.user.username,
            userId: req.user._id,
            activity: 'Expert role removed',
            details: {
                targetUser: user.username,
                targetUserId: user._id,
                previousRole: 'expert',
                newRole: 'farmer'
            },
            status: 'Success'
        };
        
        // Check if SystemLog model is available
        if (mongoose && mongoose.model) {
            try {
                const SystemLog = mongoose.model('SystemLog');
                await new SystemLog(systemLog).save();
            } catch (logErr) {
                console.error('Error creating system log:', logErr);
            }
        }
        
        res.json({ message: 'Expert role removed successfully' });
    } catch (err) {
        console.error('Error removing expert role:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 