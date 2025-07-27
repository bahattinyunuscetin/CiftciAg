const fs = require('fs');
const path = require('path');

// Set default environment variables
const defaults = {
    MONGODB_URI: 'mongodb://localhost:27017/smart-agriculture',
    JWT_SECRET: 'smart_agriculture_secret_key_2024',
    OPENWEATHER_API_KEY: '43d44ac8126f8e6cfe254a95ea5d2e55',
    PORT: '5000',
    NODE_ENV: 'development',
    FRONTEND_URL: 'http://localhost:3000'
};

// Ensure all defaults are set in process.env
Object.keys(defaults).forEach(key => {
    if (!process.env[key]) {
        process.env[key] = defaults[key];
    }
});

// Try to load environment variables from .env file
try {
    const envPath = path.resolve(__dirname, '.env');
    console.log('Reading .env file from:', envPath);
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Parse .env file line by line
        envContent.split('\n').forEach(line => {
            line = line.trim();
            
            // Skip comments and empty lines
            if (!line || line.startsWith('#')) return;
            
            // Remove any BOM or control characters
            line = line.replace(/^\uFEFF/, '').replace(/[^\x20-\x7E]/g, '');
            
            // Split by first equals sign
            const equalsIndex = line.indexOf('=');
            if (equalsIndex > 0) {
                const key = line.substring(0, equalsIndex).trim();
                let value = line.substring(equalsIndex + 1).trim();
                
                // Remove any quotes around the value
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                
                // Remove any trailing comments
                const commentIndex = value.indexOf('#');
                if (commentIndex > 0) {
                    value = value.substring(0, commentIndex).trim();
                }
                
                // Set environment variable
                process.env[key] = value;
                console.log(`Set ${key}=`, key.includes('KEY') ? value.substring(0, 4) + '...' : 'VALUE_SET');
            }
        });
    } else {
        console.log('.env file not found, using defaults');
    }
} catch (error) {
    console.error('Error loading .env file:', error);
    console.log('Continuing with default environment variables');
}

// Verify required environment variables
const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'OPENWEATHER_API_KEY'];
let missingVars = [];

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Using default values for missing variables');
}

// Export the config
module.exports = {
    mongodb: {
        uri: process.env.MONGODB_URI
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    weather: {
        apiKey: process.env.OPENWEATHER_API_KEY
    },
    server: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
}; 