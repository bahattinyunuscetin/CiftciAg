import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const WeatherContext = createContext();

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (!context) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
};

export const WeatherProvider = ({ children }) => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [location, setLocation] = useState({
        lat: 6.7976121,
        lon: 79.9290423,
        isAutomatic: false,
        name: 'Mount Lavinia, Sri Lanka'
    });

    const updateLocation = async (useAutomatic = false) => {
        try {
            if (useAutomatic) {
                setLoading(true);
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                
                const newLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    isAutomatic: true
                };

                // Get location name using reverse geocoding
                const response = await axios.get(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${newLocation.lat}&lon=${newLocation.lon}&limit=1&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
                );
                
                if (response.data && response.data[0]) {
                    newLocation.name = `${response.data[0].name}, ${response.data[0].country}`;
                }

                setLocation(newLocation);
                await fetchWeatherData(newLocation);
            } else {
                // Reset to default location
                const defaultLocation = {
                    lat: 6.7976121,
                    lon: 79.9290423,
                    isAutomatic: false,
                    name: 'Mount Lavinia, Sri Lanka'
                };
                setLocation(defaultLocation);
                await fetchWeatherData(defaultLocation);
            }
        } catch (err) {
            console.error('Location update error:', err);
            setError(err.message === 'User denied Geolocation' 
                ? 'Please enable location access to use automatic location detection.' 
                : 'Failed to detect location. Using default location.');
            
            // Fallback to default location
            const defaultLocation = {
                lat: 6.7976121,
                lon: 79.9290423,
                isAutomatic: false,
                name: 'Mount Lavinia, Sri Lanka'
            };
            setLocation(defaultLocation);
            await fetchWeatherData(defaultLocation);
        }
    };

    // Memoize fetchWeatherData to prevent infinite loops
    const fetchWeatherData = React.useCallback(async (coords = location) => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                params: coords
            };

            console.log('Fetching weather data for coordinates:', coords);

            // Fetch current weather
            try {
                const currentResponse = await axios.get(
                    'http://localhost:5000/api/weather/current',
                    config
                );
                console.log('Current Weather Response:', currentResponse.data);
                
                if (!currentResponse.data) {
                    console.warn('Current weather response is empty');
                } else {
                    // Validate the current weather data structure
                    const validCurrentWeather = {
                        temperature: currentResponse.data.temperature,
                        humidity: currentResponse.data.humidity,
                        windSpeed: currentResponse.data.windSpeed,
                        precipitation: currentResponse.data.precipitation,
                        conditions: currentResponse.data.conditions || 
                            (currentResponse.data.precipitation > 0 ? 'Rain' : 'Clear'),
                        forecast: currentResponse.data.forecast || []
                    };
                    
                    setCurrentWeather(validCurrentWeather);
                }
            } catch (currentWeatherError) {
                console.error('Failed to fetch current weather:', currentWeatherError);
                throw new Error('Failed to fetch current weather data');
            }

            // Fetch forecast
            try {
                const forecastResponse = await axios.get(
                    'http://localhost:5000/api/weather/forecast',
                    config
                );
                console.log('Forecast Response:', forecastResponse.data);
                
                if (!forecastResponse.data) {
                    console.warn('Forecast response is empty');
                } else if (!forecastResponse.data.forecast) {
                    console.warn('Forecast array is missing from response', forecastResponse.data);
                    // Create a fallback structure if necessary
                    setForecast({
                        location: forecastResponse.data.location || {
                            latitude: coords.lat,
                            longitude: coords.lon,
                            name: location.name
                        },
                        current: forecastResponse.data.current || {},
                        forecast: [] // Empty array as fallback
                    });
                } else {
                    setForecast(forecastResponse.data);
                }
            } catch (forecastError) {
                console.error('Failed to fetch forecast:', forecastError);
                throw new Error('Failed to fetch weather forecast data');
            }
        } catch (err) {
            console.error('Weather Context Error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch weather data');
        } finally {
            setLoading(false);
        }
    }, [location]);

    // Initial fetch and refresh interval
    useEffect(() => {
        fetchWeatherData();
        const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeatherData]);

    const value = {
        currentWeather,
        forecast,
        loading,
        error,
        location,
        updateLocation,
        refreshWeather: fetchWeatherData
    };

    return (
        <WeatherContext.Provider value={value}>
            {children}
        </WeatherContext.Provider>
    );
};

export default WeatherContext; 