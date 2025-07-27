import React from 'react';
import { useWeather } from '../../contexts/WeatherContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSun, 
    faCloudSun, 
    faCloud, 
    faCloudRain, 
    faCloudShowersHeavy, 
    faBolt, 
    faSnowflake, 
    faSmog,
    faWind,
    faDroplet,
    faTemperatureHalf
} from '@fortawesome/free-solid-svg-icons';
import './WeatherForecast.css';

const WeatherForecast = () => {
    const { currentWeather, forecast, loading, error, location, updateLocation } = useWeather();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleLocationToggle = () => {
        updateLocation(!location.isAutomatic);
    };

    if (loading) {
        return <div className="weather-loading">Loading weather data...</div>;
    }

    if (error) {
        return (
            <div className="weather-error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-button">
                    Retry Loading Data
                </button>
            </div>
        );
    }

    // Helper function to determine weather icon based on condition description
    const getWeatherIcon = (condition) => {
        if (!condition) return faSun; // default clear sky
        
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('thunderstorm') || conditionLower.includes('thunder')) return faBolt;
        if (conditionLower.includes('drizzle')) return faCloudRain;
        if (conditionLower.includes('heavy rain') || conditionLower.includes('shower')) return faCloudShowersHeavy;
        if (conditionLower.includes('rain')) return faCloudRain;
        if (conditionLower.includes('snow')) return faSnowflake;
        if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze')) return faSmog;
        if (conditionLower.includes('overcast')) return faCloud;
        if (conditionLower.includes('cloud')) return faCloudSun;
        if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return faSun;
        
        return faSun; // default
    };

    return (
        <div className="weather-forecast">
            <div className="location-control">
                <h1>
                    <FontAwesomeIcon icon={getWeatherIcon(currentWeather?.conditions)} className="location-icon" />
                    {location.name}
                </h1>
                <button 
                    className={`location-toggle ${location.isAutomatic ? 'automatic' : 'manual'}`}
                    onClick={handleLocationToggle}
                >
                    {location.isAutomatic ? 'Using Current Location • Switch to Default' : 'Using Default Location • Switch to Current'}
                </button>
            </div>

            {/* Current Weather */}
            {currentWeather && (
                <div className="current-weather">
                    <h2>Current Weather</h2>
                    <div className="weather-main">
                        <div className="weather-icon-container">
                            <FontAwesomeIcon 
                                icon={getWeatherIcon(currentWeather.conditions)} 
                                className="weather-icon" 
                            />
                        </div>
                        <div className="weather-info">
                            <div className="temperature">
                                {Math.round(currentWeather.temperature)}°C
                            </div>
                            <div className="description">
                                {currentWeather.conditions || (currentWeather.precipitation > 0 ? 'Rainy' : 'Clear')}
                            </div>
                        </div>
                    </div>
                    <div className="weather-details">
                        <div className="detail">
                            <span className="label">
                                <FontAwesomeIcon icon={faDroplet} className="detail-icon" /> Humidity
                            </span>
                            <span className="value">{currentWeather.humidity}%</span>
                        </div>
                        <div className="detail">
                            <span className="label">
                                <FontAwesomeIcon icon={faWind} className="detail-icon" /> Wind Speed
                            </span>
                            <span className="value">{currentWeather.windSpeed} m/s</span>
                        </div>
                        <div className="detail">
                            <span className="label">
                                <FontAwesomeIcon icon={faCloudRain} className="detail-icon" /> Precipitation
                            </span>
                            <span className="value">{currentWeather.precipitation} mm</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Forecast */}
            {forecast && forecast.forecast && (
                <div className="forecast-section">
                    <h2>Forecast</h2>
                    <div className="forecast-grid">
                        {forecast.forecast.map((item, index) => (
                            <div key={index} className="forecast-card">
                                <div className="forecast-date">
                                    {formatDate(item.date)}
                                </div>
                                <FontAwesomeIcon 
                                    icon={getWeatherIcon(item.condition)} 
                                    className="forecast-icon" 
                                />
                                <div className="forecast-temp">
                                    <FontAwesomeIcon icon={faTemperatureHalf} className="temp-icon" />
                                    {Math.round(item.temperature)}°C
                                </div>
                                <div className="forecast-desc">
                                    {item.condition || (item.precipitation > 0 ? 'Rainy' : 'Clear')}
                                </div>
                                <div className="forecast-details">
                                    <div>
                                        <span><FontAwesomeIcon icon={faDroplet} /> Humidity</span>
                                        <span>{item.humidity}%</span>
                                    </div>
                                    <div>
                                        <span><FontAwesomeIcon icon={faWind} /> Wind</span>
                                        <span>{item.windSpeed} m/s</span>
                                    </div>
                                    <div>
                                        <span><FontAwesomeIcon icon={faCloudRain} /> Rain</span>
                                        <span>{item.precipitation} mm</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherForecast; 