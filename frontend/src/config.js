// API Base URL - Use environment variable if available, otherwise fallback to localhost
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

// Other configuration constants can be added here
export const DEFAULT_WEATHER_UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds
export const DEFAULT_SCHEDULE_UPDATE_INTERVAL = 60000; // 1 minute 