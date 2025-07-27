require('dotenv').config({ path: './.env' });
const config = require('../config');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { apiLogger, errorLogger } = require('./middleware/logger');

// Route imports
const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const irrigationRoutes = require('./routes/irrigation');
const articleRoutes = require('./routes/articleRoutes');
const userRoutes = require('./routes/users');
const userguideRoutes = require('./routes/userguide');

// Model imports
const SystemLog = require('./models/SystemLog');
const ReportData = require('./models/ReportData');

// Initialize Express app
const app = express();

// MongoDB connection setup
mongoose.set('strictQuery', false);

// Security middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request and response logging middleware
app.use(apiLogger);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/irrigation', irrigationRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/userguide', userguideRoutes);

// Health endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    version: '1.0.0',
    services: ['auth', 'weather', 'admin', 'ai', 'irrigation', 'articles', 'users', 'userguide']
  });
});

app.get('/health', (req, res) => {
  res.json({
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
    console.log('Initializing data models...');
    
    // Track system start time for uptime calculations
    global.systemStartTime = new Date();
    console.log('System start time recorded:', global.systemStartTime);
    
    try {
      await SystemLog.createInitialLogs();
      console.log('SystemLog model initialized successfully');
    } catch (err) {
      console.error('Error initializing SystemLog model:', err);
    }
    
    try {
      await ReportData.createSampleReports();
      console.log('ReportData model initialized successfully');
    } catch (err) {
      console.error('Error initializing ReportData model:', err);
    }
    
    console.log('All data models initialized successfully');

  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(config.server.port, () => {
    console.log(`Server running on port ${config.server.port}`);
  });
};

startServer();