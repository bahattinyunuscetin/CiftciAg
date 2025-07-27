const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
console.log('Reading .env file from:', envPath);

try {
    if (!fs.existsSync(envPath)) {
        console.error('.env file does not exist at:', envPath);
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('.env file content length:', envContent.length);
    console.log('.env file first few lines:', envContent.split('\n').slice(0, 5).join('\n'));

    // Parse .env file manually
    const config = {};
    envContent.split('\n').forEach((line, index) => {
        // Skip comments and empty lines
        if (!line || line.startsWith('#')) return;
        
        console.log(`Processing line ${index + 1}:`, line);
        
        // Split by first equals sign
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            
            // Remove any trailing comments
            const valueParts = value.split('#');
            config[key] = valueParts[0].trim();
            
            // Also set in process.env
            process.env[key] = config[key];
            
            console.log(`Set ${key}=`, config[key] ? (key.includes('KEY') ? config[key].substring(0, 4) + '...' : 'VALUE_SET') : 'undefined');
        } else {
            console.log(`Skipping line ${index + 1}, invalid format:`, line);
        }
    });

    console.log('Config loaded:', {
        MONGODB_URI: config.MONGODB_URI ? `${config.MONGODB_URI.substring(0, 20)}...` : undefined,
        OPENWEATHER_API_KEY: config.OPENWEATHER_API_KEY ? `${config.OPENWEATHER_API_KEY.substring(0, 4)}...` : undefined,
        JWT_SECRET: config.JWT_SECRET ? 'CONFIGURED' : undefined
    });

    module.exports = config;
} catch (error) {
    console.error('Error loading .env file:', error);
    process.exit(1);
} 