import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWeather } from '../../contexts/WeatherContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import { 
    getSmartIrrigationSchedule, 
    getCropTypes, 
    getSoilTypes,
    submitIrrigationFeedback,
    getIrrigationHistory,
    getIrrigationAnalytics,
    getAISuggestedCrops,
    getAISuggestedSoils
} from '../../services/irrigationService';
import './IrrigationSchedule.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


const Chart = ({ data, type }) => {

    
    if (type === 'bar') {
        const maxValue = Math.max(...data.map(item => item.value));
        
        return (
            <div className="chart-container">
                {data.map((item, index) => (
                    <div key={index} className="chart-bar-container">
                        <div 
                            className="chart-bar" 
                            style={{ 
                                height: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: `rgba(46, 204, 113, ${0.5 + (item.value / maxValue) * 0.5})`
                            }}
                        >
                            <span className="chart-value">{item.value.toFixed(1)}</span>
                        </div>
                        <div className="chart-label">{item.label}</div>
                    </div>
                ))}
            </div>
        );
    }
    
    return <div>Unsupported chart type</div>;
};

const IrrigationSchedule = () => {
    const { location } = useWeather();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [cropTypes, setCropTypes] = useState([]);
    const [soilTypes, setSoilTypes] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState('');
    const [selectedSoil, setSelectedSoil] = useState('');
    
    // AI suggestion states
    const [cropSuggestions, setCropSuggestions] = useState([]);
    const [soilSuggestions, setSoilSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [fieldSize, setFieldSize] = useState(1000);
    
    // New state variables for enhanced features
    const [activeTab, setActiveTab] = useState('schedule');
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedback, setFeedback] = useState({
        scheduleId: '',
        feedbackType: 'duration',
        feedbackValue: '',
        actualSoilMoisture: ''
    });
    const [history, setHistory] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('month');
    const [detailedView, setDetailedView] = useState(false);
    const [showWaterSavingTips, setShowWaterSavingTips] = useState(false);
    const [historyFilter, setHistoryFilter] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        cropType: ''
    });
    const [usingSriLankanData, setUsingSriLankanData] = useState(false);
    const [currentSeason, setCurrentSeason] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [sensorData, setSensorData] = useState(null);

    // Feedback for recommendation
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // New state for info panel visibility
    const [showInfoPanel, setShowInfoPanel] = useState(true);

    // New state variable to manage AI suggestions visibility
    const [showAISuggestions, setShowAISuggestions] = useState(false);

    // Update these variable references to match
    const cropType = selectedCrop;
    const soilType = selectedSoil;
    const handleCropTypeChange = (e) => setSelectedCrop(e.target.value);
    const handleSoilTypeChange = (e) => setSelectedSoil(e.target.value);
    const scheduleResults = schedule;
    const selectedCropName = cropTypes.find(c => c._id === selectedCrop)?.name || selectedCrop;
    const selectedSoilName = soilTypes.find(s => s._id === selectedSoil)?.name || selectedSoil;

    const isGuest = !user;

    const fetchCropAndSoilTypes = async () => {
        try {
            setLoading(true);
            
            // Get user preferences to highlight Sri Lankan features when enabled
            const token = localStorage.getItem('token');
            const userResponse = await axios.get(`${API_BASE_URL}/users/preferences`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const useLocalizedData = userResponse?.data?.useLocalizedData || false;
            const region = userResponse?.data?.region || 'default';
            const usingSriLankanData = useLocalizedData && region.toLowerCase().includes('sri lanka');
            
            // Set to component state
            setUsingSriLankanData(usingSriLankanData);
            
            // Fetch crop types from the correct endpoint
            const cropResponse = await axios.get(`${API_BASE_URL}/irrigation/types/crop`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Fetch soil types from the correct endpoint
            const soilResponse = await axios.get(`${API_BASE_URL}/irrigation/types/soil`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Set the crop and soil types from the response
            setCropTypes(cropResponse.data);
            setSoilTypes(soilResponse.data);
            
            console.log("Loaded crop types:", cropResponse.data);
            console.log("Loaded soil types:", soilResponse.data);
            
            // If using Sri Lankan data, also fetch current season
            if (usingSriLankanData) {
                const seasonResponse = await axios.get(`${API_BASE_URL}/irrigation/current-season`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCurrentSeason(seasonResponse.data);
            }
            
        } catch (error) {
            console.error('Error fetching crop and soil types', error);
            setError('Failed to load crop and soil types. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCropAndSoilTypes();
    }, []);

    const formatOptimalTime = (timeCode) => {
        if (timeCode === 'morning') {
            return 'Early Morning (before 7 AM)';
        } else if (timeCode === 'evening') {
            return 'Evening (after 5 PM)';
        } else {
            return 'Any time of day';
        }
    };

    const renderConfidenceBadge = (confidence) => {
        let badgeClass = 'confidence-badge ';
        
        if (confidence >= 80) {
            badgeClass += 'high';
        } else if (confidence >= 60) {
            badgeClass += 'medium';
        } else {
            badgeClass += 'low';
        }
        
        return <span className={badgeClass}>{confidence}% confident</span>;
    };

    // Admin navigation function
    const navigateToAdmin = () => {
        navigate('/irrigation/admin');
    };

    // Function to select a suggested crop
    const selectAISuggestedCrop = (cropName) => {
        setSelectedCrop(cropName);
    };

    // Function to select a suggested soil
    const selectAISuggestedSoil = (soilName) => {
        setSelectedSoil(soilName);
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await getIrrigationHistory(historyFilter);
            setHistory(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load irrigation history.');
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const data = await getIrrigationAnalytics(analyticsPeriod);
            setAnalytics(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to load irrigation analytics.');
            setLoading(false);
        }
    };
    
    // Load history or analytics data when tab changes
    useEffect(() => {
        if (activeTab === 'history' && !history) {
            fetchHistory();
        } else if (activeTab === 'analytics' && !analytics) {
            fetchAnalytics();
        }
    }, [activeTab]);
    
    // Handle field size input change
    const handleFieldSizeChange = (e) => {
        const value = e.target.value;
        setFieldSize(value);
    };
    
    // Function to generate default weather data based on location, season and time of year
    const getDefaultWeatherData = () => {
        // Get current date to determine season
        const currentDate = new Date();
        const month = currentDate.getMonth();
        
        // Check if we have location data
        if (!location || !location.lat || !location.lon) {
            console.warn('Location data unavailable, using generic weather data');
            return generateGenericWeatherData(month);
        }
        
        // Determine region based on coordinates
        let region = 'unknown';
        
        // Sri Lanka coordinates approximately (5.8° to 9.9° N, 79.6° to 81.9° E)
        if (location.lat >= 5.8 && location.lat <= 9.9 && location.lon >= 79.6 && location.lon <= 81.9) {
            // Further refine Sri Lankan regions
            if (location.lat > 8.5) {
                region = 'sri-lanka-north'; // Northern region
            } else if (location.lon < 80.2) {
                region = 'sri-lanka-west'; // Western coastal region
            } else if (location.lon > 81) {
                region = 'sri-lanka-east'; // Eastern coastal region
            } else {
                region = 'sri-lanka-central'; // Central highlands
            }
        } 
        // India approximately (8° to 37° N, 68° to 97° E)
        else if (location.lat >= 8 && location.lat <= 37 && location.lon >= 68 && location.lon <= 97) {
            region = 'india';
        }
        // Southeast Asia
        else if (location.lat >= -10 && location.lat <= 23 && location.lon >= 95 && location.lon <= 140) {
            region = 'southeast-asia';
        }
        // Default to tropical region for similar coordinates
        else if (Math.abs(location.lat) <= 23.5) {
            region = 'tropical';
        }
        // Northern hemisphere temperate
        else if (location.lat > 23.5) {
            region = 'north-temperate';
        }
        // Southern hemisphere temperate
        else {
            region = 'south-temperate';
        }
        
        console.log(`Generating weather data for region: ${region} at coordinates: ${location.lat}, ${location.lon}`);
        
        return generateRegionSpecificWeather(region, month);
    };

    // Helper function to generate weather based on region and month
    const generateRegionSpecificWeather = (region, month) => {
        let condition, temperature, humidity, windSpeed, precipitation, icon;
        
        switch (region) {
            case 'sri-lanka-north':
                // Northern Sri Lanka - drier, especially during southwest monsoon
                if (month >= 4 && month <= 8) { // May-Sep: Southwest monsoon (dry in north)
                    condition = 'Sunny';
                    temperature = 33;
                    humidity = 65;
                    windSpeed = 12;
                    precipitation = 15;
                    icon = '☀️';
                } else if (month >= 11 || month <= 1) { // Dec-Feb: Northeast monsoon (wet in north)
                    condition = 'Heavy Rain';
                    temperature = 27;
                    humidity = 85;
                    windSpeed = 15;
                    precipitation = 80;
                    icon = '🌧️';
                } else { // Inter-monsoon periods
                    condition = 'Partly Cloudy';
                    temperature = 31;
                    humidity = 70;
                    windSpeed = 10;
                    precipitation = 40;
                    icon = '⛅';
                }
                break;
                
            case 'sri-lanka-west':
                // Western Sri Lanka - affected by southwest monsoon
                if (month >= 4 && month <= 8) { // May-Sep: Southwest monsoon (wet season)
                    condition = 'Heavy Rain';
                    temperature = 28;
                    humidity = 88;
                    windSpeed = 14;
                    precipitation = 85;
                    icon = '🌧️';
                } else if (month >= 11 || month <= 1) { // Dec-Feb: Northeast monsoon (relatively dry)
                    condition = 'Partly Cloudy';
                    temperature = 30;
                    humidity = 75;
                    windSpeed = 8;
                    precipitation = 30;
                    icon = '⛅';
                } else { // Inter-monsoon periods
                    condition = 'Thunderstorms';
                    temperature = 31;
                    humidity = 80;
                    windSpeed = 12;
                    precipitation = 60;
                    icon = '⛈️';
                }
                break;
                
            case 'sri-lanka-east':
                // Eastern Sri Lanka - affected by northeast monsoon
                if (month >= 4 && month <= 8) { // May-Sep: Southwest monsoon (relatively dry)
                    condition = 'Sunny';
                    temperature = 32;
                    humidity = 70;
                    windSpeed = 10;
                    precipitation = 20;
                    icon = '☀️';
                } else if (month >= 11 || month <= 1) { // Dec-Feb: Northeast monsoon (wet season)
                    condition = 'Heavy Rain';
                    temperature = 26;
                    humidity = 90;
                    windSpeed = 18;
                    precipitation = 90;
                    icon = '🌧️';
                } else { // Inter-monsoon periods
                    condition = 'Scattered Showers';
                    temperature = 30;
                    humidity = 75;
                    windSpeed = 12;
                    precipitation = 50;
                    icon = '🌦️';
                }
                break;
                
            case 'sri-lanka-central':
                // Central highlands - cooler temperatures, varied precipitation
                if (month >= 4 && month <= 8) { // May-Sep: Southwest monsoon
                    condition = 'Moderate Rain';
                    temperature = 24;
                    humidity = 85;
                    windSpeed = 12;
                    precipitation = 70;
                    icon = '🌧️';
                } else if (month >= 11 || month <= 1) { // Dec-Feb: Northeast monsoon
                    condition = 'Light Rain';
                    temperature = 22;
                    humidity = 80;
                    windSpeed = 10;
                    precipitation = 60;
                    icon = '🌦️';
                } else { // Inter-monsoon periods
                    condition = 'Foggy';
                    temperature = 23;
                    humidity = 82;
                    windSpeed = 8;
                    precipitation = 45;
                    icon = '🌫️';
                }
                break;
                
            case 'india':
                // Simplified India weather (would need to be much more specific in a real app)
                if (month >= 5 && month <= 8) { // Jun-Sep: Monsoon season
                    condition = 'Heavy Rain';
                    temperature = 29;
                    humidity = 85;
                    windSpeed = 12;
                    precipitation = 80;
                    icon = '🌧️';
                } else if (month >= 11 || month <= 1) { // Dec-Feb: Winter
                    condition = 'Sunny';
                    temperature = 22;
                    humidity = 55;
                    windSpeed = 8;
                    precipitation = 5;
                    icon = '☀️';
                } else if (month >= 2 && month <= 4) { // Mar-May: Summer/Heat
                    condition = 'Hot';
                    temperature = 38;
                    humidity = 45;
                    windSpeed = 14;
                    precipitation = 10;
                    icon = '🔥';
                } else { // Oct-Nov: Post-monsoon
                    condition = 'Partly Cloudy';
                    temperature = 28;
                    humidity = 60;
                    windSpeed = 10;
                    precipitation = 25;
                    icon = '⛅';
                }
                break;
                
            case 'tropical':
                // Generic tropical weather patterns
                if (month % 12 < 6) { // Roughly dividing year in wet/dry seasons
                    condition = 'Thunderstorms';
                    temperature = 31;
                    humidity = 85;
                    windSpeed = 10;
                    precipitation = 75;
                    icon = '⛈️';
                } else {
                    condition = 'Partly Cloudy';
                    temperature = 33;
                    humidity = 70;
                    windSpeed = 8;
                    precipitation = 30;
                    icon = '⛅';
                }
                break;
                
            case 'north-temperate':
                // Northern hemisphere seasons
                if (month >= 11 || month <= 1) { // Winter
                    condition = 'Snow';
                    temperature = 0;
                    humidity = 65;
                    windSpeed = 12;
                    precipitation = 30;
                    icon = '❄️';
                } else if (month >= 2 && month <= 4) { // Spring
                    condition = 'Rainy';
                    temperature = 15;
                    humidity = 70;
                    windSpeed = 14;
                    precipitation = 50;
                    icon = '🌧️';
                } else if (month >= 5 && month <= 7) { // Summer
                    condition = 'Sunny';
                    temperature = 28;
                    humidity = 55;
                    windSpeed = 8;
                    precipitation = 20;
                    icon = '☀️';
                } else { // Fall/Autumn
                    condition = 'Cloudy';
                    temperature = 18;
                    humidity = 65;
                    windSpeed = 15;
                    precipitation = 40;
                    icon = '☁️';
                }
                break;
                
            case 'south-temperate':
                // Southern hemisphere (seasons reversed)
                if (month >= 5 && month <= 7) { // Winter
                    condition = 'Rain';
                    temperature = 10;
                    humidity = 75;
                    windSpeed = 18;
                    precipitation = 45;
                    icon = '🌧️';
                } else if (month >= 8 && month <= 10) { // Spring
                    condition = 'Partly Cloudy';
                    temperature = 18;
                    humidity = 65;
                    windSpeed = 12;
                    precipitation = 35;
                    icon = '⛅';
                } else if (month >= 11 || month <= 1) { // Summer
                    condition = 'Sunny';
                    temperature = 30;
                    humidity = 60;
                    windSpeed = 10;
                    precipitation = 15;
                    icon = '☀️';
                } else { // Fall/Autumn
                    condition = 'Mild';
                    temperature = 20;
                    humidity = 70;
                    windSpeed = 14;
                    precipitation = 30;
                    icon = '🌤️';
                }
                break;
                
            default: // Unknown region - fall back to generic data
                return generateGenericWeatherData(month);
        }
        
        // Generate forecast based on current conditions with some variation
        const forecast = [
            { day: 'Today', condition: condition, temperature: temperature },
            { 
                day: 'Tomorrow', 
                condition: Math.random() > 0.7 ? getRelatedCondition(condition) : condition,
                temperature: temperature + (Math.random() > 0.5 ? 1 : -1) 
            },
            { 
                day: 'Day 3', 
                condition: Math.random() > 0.5 ? getRelatedCondition(condition) : condition,
                temperature: temperature + (Math.random() > 0.5 ? 2 : -2) 
            }
        ];
        
        return {
            condition,
            temperature,
            humidity,
            windSpeed,
            precipitation,
            icon,
            forecast
        };
    };

    // Function to generate generic weather data when location is unknown
    const generateGenericWeatherData = (month) => {
        // Default weather conditions based on season
        let condition, temperature, humidity, windSpeed, precipitation, icon;
        
        // Very simplified seasonal patterns
        if (month >= 11 || month <= 1) { // Winter
            condition = 'Cold';
            temperature = 15;
            humidity = 70;
            windSpeed = 12;
            precipitation = 40;
            icon = '❄️';
        } else if (month >= 2 && month <= 4) { // Spring
            condition = 'Mild';
            temperature = 22;
            humidity = 65;
            windSpeed = 10;
            precipitation = 35;
            icon = '🌦️';
        } else if (month >= 5 && month <= 7) { // Summer
            condition = 'Hot';
            temperature = 30;
            humidity = 60;
            windSpeed = 8;
            precipitation = 20;
            icon = '☀️';
        } else { // Fall/Autumn
            condition = 'Cool';
            temperature = 18;
            humidity = 75;
            windSpeed = 14;
            precipitation = 45;
            icon = '🍂';
        }
        
        return {
            condition,
            temperature,
            humidity,
            windSpeed,
            precipitation,
            icon,
            forecast: [
                { day: 'Today', condition: condition, temperature: temperature },
                { day: 'Tomorrow', condition: condition, temperature: temperature + (Math.random() > 0.5 ? 1 : -1) },
                { day: 'Day 3', condition: condition, temperature: temperature + (Math.random() > 0.5 ? 2 : -2) }
            ]
        };
    };

    // Helper function to get related weather conditions for forecasts
    const getRelatedCondition = (condition) => {
        const conditionMap = {
            'Sunny': ['Partly Cloudy', 'Clear', 'Hot'],
            'Clear': ['Sunny', 'Partly Cloudy'],
            'Hot': ['Sunny', 'Clear', 'Partly Cloudy'],
            'Partly Cloudy': ['Cloudy', 'Sunny', 'Light Rain'],
            'Cloudy': ['Partly Cloudy', 'Overcast', 'Light Rain'],
            'Overcast': ['Cloudy', 'Light Rain'],
            'Foggy': ['Cloudy', 'Misty'],
            'Misty': ['Foggy', 'Light Rain'],
            'Light Rain': ['Cloudy', 'Moderate Rain', 'Showers'],
            'Moderate Rain': ['Light Rain', 'Heavy Rain'],
            'Heavy Rain': ['Moderate Rain', 'Thunderstorms'],
            'Showers': ['Light Rain', 'Partly Cloudy'],
            'Thunderstorms': ['Heavy Rain', 'Scattered Showers'],
            'Scattered Showers': ['Light Rain', 'Partly Cloudy'],
            'Rainy': ['Light Rain', 'Moderate Rain'],
            'Snow': ['Light Snow', 'Cold'],
            'Light Snow': ['Snow', 'Cold'],
            'Cold': ['Snow', 'Cloudy'],
            'Mild': ['Partly Cloudy', 'Sunny']
        };
        
        const relatedConditions = conditionMap[condition] || ['Partly Cloudy', 'Sunny', 'Cloudy'];
        return relatedConditions[Math.floor(Math.random() * relatedConditions.length)];
    };

    // Update the handleSubmit function to ensure weather data is available
    const handleSubmit = async () => {
        if (!cropType || !soilType || fieldSize <= 0) return;
        
        try {
            setLoading(true);
            setError('');
            
            const scheduleData = await getSmartIrrigationSchedule({
                cropType: cropType,
                soilType: soilType,
                location: {
                    lat: location.lat,
                    lon: location.lon
                },
                fieldSize: fieldSize
            });
            
            // Check if weather data is missing or empty, fill with default data
            if (!scheduleData.weather || Object.keys(scheduleData.weather).length === 0) {
                console.log('Weather data unavailable, using default data');
                scheduleData.weather = getDefaultWeatherData();
            }
            
            setSchedule(scheduleData);
            
            // Initialize feedback with schedule ID if available
            if (scheduleData && scheduleData._id) {
                setFeedback(prev => ({
                    ...prev,
                    scheduleId: scheduleData._id
                }));
            }
        } catch (error) {
            console.error('Error fetching irrigation schedule:', error);
            setError('Failed to generate irrigation schedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle feedback submission
    const handleFeedbackSubmit = async (isPositive) => {
        try {
            await submitIrrigationFeedback({
                scheduleId: schedule ? schedule._id : '',
                cropType: selectedCrop,
                soilType: selectedSoil,
                rating: isPositive ? 5 : 2,
                comment: isPositive ? 'Helpful recommendation' : 'Not helpful for my needs'
            });
            
            // Show a temporary success message
            setError('Thanks for your feedback!');
            setTimeout(() => setError(''), 3000);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            setError('Failed to submit feedback.');
        }
    };
    
    // Handle feedback form input changes
    const handleFeedbackChange = (e) => {
        const { name, value } = e.target;
        setFeedback(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Toggle feedback form visibility
    const toggleFeedbackForm = () => {
        setShowFeedbackForm(!showFeedbackForm);
    };
    
    // Submit recommendation feedback (1-5 stars)
    const submitFeedback = () => {
        // Save feedback to backend
        console.log('Submitting feedback:', { rating: feedbackRating, comment: feedbackComment });
        setFeedbackSubmitted(true);
    };
    
    // Fetch AI suggestions when location is available or when component mounts
    useEffect(() => {
        const fetchAISuggestions = async () => {
            if (!location) return;
            
            try {
                setLoadingSuggestions(true);
                setError('');
                
                // Import the AI service functions
                const { getAISuggestedCrops, getAISuggestedSoils } = await import('../../../src/services/aiService');
                
                // Fetch AI crop suggestions using the service
                const cropSuggestionsData = await getAISuggestedCrops({
                    location: {
                        lat: location.lat,
                        lon: location.lon
                    }
                });
                
                // Fetch AI soil suggestions using the service
                const soilSuggestionsData = await getAISuggestedSoils({
                    location: {
                        lat: location.lat,
                        lon: location.lon
                    },
                    cropType: selectedCrop // Pass currently selected crop if any
                });
                
                // Update state with the suggestions
                setCropSuggestions(cropSuggestionsData.suggestedCrops || []);
                setSoilSuggestions(soilSuggestionsData.suggestedSoils || []);
                
                console.log("AI crop suggestions:", cropSuggestionsData);
                console.log("AI soil suggestions:", soilSuggestionsData);
                
                // Auto-select the top suggestions if nothing is selected yet
                if (!selectedCrop && cropSuggestionsData.suggestedCrops && cropSuggestionsData.suggestedCrops.length > 0) {
                    const topCrop = cropSuggestionsData.suggestedCrops[0].name;
                    setSelectedCrop(topCrop);
                }
                
                if (!selectedSoil && soilSuggestionsData.suggestedSoils && soilSuggestionsData.suggestedSoils.length > 0) {
                    const topSoil = soilSuggestionsData.suggestedSoils[0].name;
                    setSelectedSoil(topSoil);
                }
                
                // Check if we have current season data
                if (cropSuggestionsData.currentSeason) {
                    setCurrentSeason({
                        name: cropSuggestionsData.currentSeason,
                        description: `Current growing season in your region`
                    });
                }
                
            } catch (error) {
                console.error('Error fetching AI suggestions:', error);
                setError('Failed to get AI suggestions. Using default options.');
            } finally {
                setLoadingSuggestions(false);
            }
        };
        
        fetchAISuggestions();
    }, [location, selectedCrop]);

    const renderScheduleTab = () => {
        return (
            <div className="schedule-tab">
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="ai-suggestions-container">
                            <h4 className="mb-3">AI-Recommended Settings</h4>
                            
                            <div className="ai-suggestions-section">
                                {loadingSuggestions ? (
                                    <div className="text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading suggestions...</span>
                                        </div>
                                        <p>Analyzing environmental conditions...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="crop-suggestions mb-4">
                                            <h5>AI Crop Recommendations</h5>
                                            {cropSuggestions.length > 0 ? (
                                                <div className="suggestions-list">
                                                    {cropSuggestions.slice(0, 3).map((suggestion, index) => (
                                                        <div 
                                                            key={index} 
                                                            className={`suggestion-card ${selectedCrop === suggestion.name ? 'selected' : ''}`}
                                                            onClick={() => selectAISuggestedCrop(suggestion.name)}
                                                        >
                                                            <div className="suggestion-header">
                                                                <h6>{suggestion.name}</h6>
                                                                {renderConfidenceBadge(suggestion.confidence)}
                                                            </div>
                                                            <p className="suggestion-reason">{suggestion.reason}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>No AI crop suggestions available</p>
                                            )}
                                        </div>
                                        
                                        <div className="soil-suggestions mb-4">
                                            <h5>AI Soil Recommendations</h5>
                                            {soilSuggestions.length > 0 ? (
                                                <div className="suggestions-list">
                                                    {soilSuggestions.slice(0, 3).map((suggestion, index) => (
                                                        <div 
                                                            key={index} 
                                                            className={`suggestion-card ${selectedSoil === suggestion.name ? 'selected' : ''}`}
                                                            onClick={() => selectAISuggestedSoil(suggestion.name)}
                                                        >
                                                            <div className="suggestion-header">
                                                                <h6>{suggestion.name}</h6>
                                                                {renderConfidenceBadge(suggestion.confidence)}
                                                            </div>
                                                            <p className="suggestion-reason">{suggestion.reason}</p>
                                                            {suggestion.properties && (
                                                                <div className="soil-properties">
                                                                    <small>
                                                                        <strong>Water Retention:</strong> {suggestion.properties.waterRetention} <br />
                                                                        <strong>Drainage:</strong> {suggestion.properties.drainage}
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>No AI soil suggestions available</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Add clear dropdown menus for crop and soil selection */}
                            <div className="manual-selection mt-4">
                                <h5 className="selection-heading">Select Your Crop and Soil Type</h5>
                                
                                <div className="form-group mb-3">
                                    <label htmlFor="cropSelect" className="form-label">Crop Type:</label>
                                    <select 
                                        id="cropSelect" 
                                        className="form-select"
                                        value={selectedCrop}
                                        onChange={handleCropTypeChange}
                                        disabled={loading}
                                    >
                                        <option value="">-- Select a Crop Type --</option>
                                        
                                        {/* Group crops by category */}
                                        {cropTypes.length > 0 && (
                                            <>
                                                <optgroup label="Food Crops">
                                                    {cropTypes
                                                        .filter(crop => crop.category === 'Food Crop')
                                                        .map((crop, index) => (
                                                            <option key={`food-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                                
                                                <optgroup label="Cash Crops">
                                                    {cropTypes
                                                        .filter(crop => crop.category === 'Cash Crop')
                                                        .map((crop, index) => (
                                                            <option key={`cash-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                                
                                                <optgroup label="Vegetables">
                                                    {cropTypes
                                                        .filter(crop => crop.category === 'Vegetable')
                                                        .map((crop, index) => (
                                                            <option key={`veg-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                                
                                                <optgroup label="Fruits">
                                                    {cropTypes
                                                        .filter(crop => crop.category === 'Fruit')
                                                        .map((crop, index) => (
                                                            <option key={`fruit-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                                
                                                <optgroup label="Spices">
                                                    {cropTypes
                                                        .filter(crop => crop.category === 'Spice')
                                                        .map((crop, index) => (
                                                            <option key={`spice-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                                
                                                <optgroup label="Industrial Crops">
                                                    {cropTypes
                                                        .filter(crop => crop.category === 'Industrial Crop')
                                                        .map((crop, index) => (
                                                            <option key={`industrial-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                                
                                                {/* For crops without a category */}
                                                <optgroup label="Other Crops">
                                                    {cropTypes
                                                        .filter(crop => !crop.category)
                                                        .map((crop, index) => (
                                                            <option key={`other-${index}`} value={crop.name}>
                                                                {crop.name}
                                                            </option>
                                                        ))
                                                    }
                                                </optgroup>
                                            </>
                                        )}
                                    </select>
                                </div>
                                
                                <div className="form-group mb-3">
                                    <label htmlFor="soilSelect" className="form-label">Soil Type:</label>
                                    <select 
                                        id="soilSelect" 
                                        className="form-select"
                                        value={selectedSoil}
                                        onChange={handleSoilTypeChange}
                                        disabled={loading}
                                    >
                                        <option value="">-- Select a Soil Type --</option>
                                        {soilTypes.map((soil, index) => (
                                            <option key={index} value={soil.name}>
                                                {soil.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group mb-3">
                                    <label htmlFor="fieldSizeInput" className="form-label">Field Size (m²):</label>
                                    <input
                                        id="fieldSizeInput"
                                        type="number"
                                        className="form-control"
                                        value={fieldSize}
                                        onChange={handleFieldSizeChange}
                                        min="10"
                                        max="1000000"
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    className="generate-button"
                                    onClick={handleSubmit}
                                    disabled={loading || !cropType || !soilType || fieldSize <= 0}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Irrigation Schedule'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-6">
                        {!schedule && loading ? (
                            <div className="loading-indicator">
                                <div className="spinner"></div>
                                <p>Generating your irrigation schedule...</p>
                            </div>
                        ) : schedule ? (
                            <div className="schedule-results">
                                <h4 className="mb-3">Your Irrigation Schedule</h4>
                                <div className="recommendation-card">
                                    <div className="recommendation-header">
                                        <h5 className="card-title">
                                            {selectedCropName} in {selectedSoilName} Soil
                                        </h5>
                                        <div className="weather-summary">
                                            <span className="weather-icon">
                                                {schedule.weather && schedule.weather.icon ? 
                                                    schedule.weather.icon : 
                                                    schedule.weather && schedule.weather.condition ? 
                                                        getWeatherIcon(schedule.weather.condition) : '☀️'}
                                            </span>
                                            <span className="weather-temp">
                                                {schedule.weather && schedule.weather.temperature && 
                                                    `${schedule.weather.temperature}°C`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="main-recommendation">
                                        <div className="watering-instruction">
                                            <span className="water-icon">💧</span>
                                            <div className="instruction-detail">
                                                <div className="instruction-primary">
                                                    Water for <strong>{schedule.recommendation && schedule.recommendation.duration ? 
                                                        schedule.recommendation.duration : '0'}</strong> minutes
                                                </div>
                                                <div className="instruction-secondary">
                                                    Best time: {schedule.recommendation && schedule.recommendation.optimalTime ? 
                                                        formatOptimalTime(schedule.recommendation.optimalTime) : 'Any time'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="watering-plan-content">
                                        <div className="watering-main">
                                            <div className="recommendation-details mt-4">
                                                <h6>Additional Information</h6>
                                                <div className="detail-item">
                                                    <span className="detail-label">Water Amount:</span>
                                                    <span className="detail-value">
                                                        {schedule.recommendation && schedule.recommendation.waterAmount ? 
                                                            `${Math.ceil(Number(schedule.recommendation.waterAmount) * Number(fieldSize)/100)} liters` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Soil Moisture:</span>
                                                    <span className="detail-value">{schedule.soilCondition && schedule.soilCondition.moisture ? `${schedule.soilCondition.moisture}%` : 'N/A'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Next Watering:</span>
                                                    <span className="detail-value">
                                                        {schedule.recommendation && schedule.recommendation.nextWatering ? 
                                                            schedule.recommendation.nextWatering : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Water Savings:</span>
                                                    <span className="detail-value water-savings">
                                                        {schedule.recommendation && schedule.recommendation.waterSavings ? 
                                                            `-${schedule.recommendation.waterSavings}% vs traditional` : 'N/A'}
                                                    </span>
                                                </div>

                                                <div className="feedback-section mt-3">
                                                    <h5>Was this recommendation helpful?</h5>
                                                    <div className="simple-feedback-buttons">
                                                        <button 
                                                            className="feedback-btn"
                                                            onClick={() => handleFeedbackSubmit(true)}
                                                        >
                                                            <span>👍</span> Yes, it was useful
                                                        </button>
                                                        <button 
                                                            className="feedback-btn"
                                                            onClick={() => handleFeedbackSubmit(false)}
                                                        >
                                                            <span>👎</span> No, needs improvement
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="watering-amount">
                                            <div className="weather-visual">
                                                <div className="visual-header">
                                                    {schedule.weather && schedule.weather.condition ? 
                                                        (schedule.weather.condition === 'Rain' || schedule.weather.condition === 'Rainy' || schedule.weather.condition === 'Heavy Rain' ? 
                                                            'Rain Expected' : 
                                                        schedule.weather.condition === 'Partly Cloudy' ? 
                                                            'Partly Cloudy' : 
                                                        schedule.weather.condition === 'Cloudy' ? 
                                                            'Cloudy Weather' : 
                                                        schedule.weather.condition === 'Stormy' ? 
                                                            'Stormy Conditions' : 
                                                        schedule.weather.condition === 'Snowy' ? 
                                                            'Snow Expected' : 
                                                        schedule.weather.condition === 'Foggy' ? 
                                                            'Foggy Conditions' : 
                                                            'Clear Skies') : 
                                                        'Current Weather Conditions'}
                                                </div>
                                                <div className="visual-icon">
                                                    {schedule.weather && schedule.weather.icon ? 
                                                        schedule.weather.icon : 
                                                        schedule.weather && schedule.weather.condition ? 
                                                            getWeatherIcon(schedule.weather.condition) : '🌤️'}
                                                </div>
                                                <div className="visual-details">
                                                    <div data-label="Humidity:">
                                                        {schedule.weather && schedule.weather.humidity && `${schedule.weather.humidity}%`}
                                                    </div>
                                                    <div data-label="Wind:">
                                                        {schedule.weather && schedule.weather.windSpeed && `${schedule.weather.windSpeed} km/h`}
                                                    </div>
                                                    <div data-label="Precipitation:">
                                                        {schedule.weather && schedule.weather.precipitation && `${schedule.weather.precipitation}%`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="select-prompt">
                                <div className="prompt-content">
                                    <div className="prompt-icon">💧🌱</div>
                                    <h5>Get Your Smart Irrigation Plan</h5>
                                    <p>Select a crop type and soil type to generate your personalized irrigation schedule.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to get appropriate weather icon
    const getWeatherIcon = (condition) => {
        condition = condition.toLowerCase();
        if (condition.includes('rain') || condition.includes('shower')) return '🌧️';
        if (condition.includes('partly cloudy')) return '⛅';
        if (condition.includes('cloud')) return '☁️';
        if (condition.includes('storm') || condition.includes('thunder')) return '⛈️';
        if (condition.includes('snow') || condition.includes('blizzard')) return '❄️';
        if (condition.includes('fog') || condition.includes('mist')) return '🌫️';
        return '☀️'; // Default to sunny
    };

    if (loading && !schedule && !history && !analytics) {
        return <div className="loading">Loading irrigation data...</div>;
    }

    return (
        <div className="irrigation-container">
            <h1 className="page-title">Irrigation Management</h1>
            
            {isGuest && (
                <div className="guest-notification">
                    <div className="guest-message">
                        <h3>Guest Access Mode</h3>
                        <p>You are viewing irrigation schedules in guest mode with limited features. 
                        <Link to="/login">Login</Link> or <Link to="/register">Register</Link> for 
                        full access to create, edit, and analyze your own irrigation schedules.</p>
                    </div>
                </div>
            )}
            
            {/* Info Panel - No Sensors Required */}
            {showInfoPanel && (
                <div className="info-panel">
                    <div className="info-content">
                        <h4>Simple Smart Irrigation - No Sensors Required</h4>
                        <p>This system works without any physical sensors. All recommendations are based on:</p>
                        <ul>
                            <li>Your selected crop type</li>
                            <li>Your selected soil type</li>
                            <li>Weather data for your location</li>
                        </ul>
                        <p>Just choose your crops and get watering instructions - no equipment needed!</p>
                        <button 
                            className="close-info-btn" 
                            onClick={() => setShowInfoPanel(false)}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
            
            {/* Main Container */}
            <div className="irrigation-schedule-container">
                <div className="page-header">
                    <h2>Smart Irrigation Management</h2>
                    <p className="subtitle">
                        Get simple watering plans for your crops based on local weather and soil conditions
                    </p>
                    {user && user.role === 'admin' && (
                        <button 
                            className="admin-view-btn"
                            onClick={navigateToAdmin}
                        >
                            Switch to Admin View
                        </button>
                    )}
                </div>
                
                {/* Sri Lankan data badge when enabled */}
                {usingSriLankanData && (
                    <div className="sri-lankan-data-badge mb-3">
                        <div className="alert alert-success">
                            <strong>Sri Lankan Agricultural Data Active</strong>
                            {currentSeason && (
                                <div className="current-season-info mt-2">
                                    <p><strong>Current Season:</strong> {currentSeason.name}</p>
                                    <p>{currentSeason.description}</p>
                                    {currentSeason.mainCrops && (
                                        <p><strong>Recommended Crops:</strong> {currentSeason.mainCrops.join(', ')}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Messages */}
                {error && <div className="alert alert-danger">{error}</div>}
                
                {/* Navigation Tabs */}
                <div className="irrigation-tabs">
                    <div className="nav-tabs-container">
                        <button 
                            className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                            onClick={() => setActiveTab('schedule')}
                        >
                            Today's Plan
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            History
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            Analytics
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="tab-content">
                        {/* Schedule Tab */}
                        {activeTab === 'schedule' && renderScheduleTab()}
                        
                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="history-tab">
                                {loading ? (
                                    <div className="loading-indicator">
                                        <div className="spinner"></div>
                                        <p>Loading history data...</p>
                                    </div>
                                ) : history ? (
                                    <div className="history-content">
                                        <div className="history-filters mb-4">
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label>Start Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="form-control"
                                                            value={historyFilter.startDate}
                                                            onChange={(e) => setHistoryFilter({...historyFilter, startDate: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label>End Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="form-control"
                                                            value={historyFilter.endDate}
                                                            onChange={(e) => setHistoryFilter({...historyFilter, endDate: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label>Crop Type</label>
                                                        <select 
                                                            className="form-select"
                                                            value={historyFilter.cropType}
                                                            onChange={(e) => setHistoryFilter({...historyFilter, cropType: e.target.value})}
                                                        >
                                                            <option value="">All Crops</option>
                                                            {cropTypes.map((crop, index) => (
                                                                <option key={index} value={crop.name}>
                                                                    {crop.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-md-3 d-flex align-items-end">
                                                    <button 
                                                        className="btn btn-primary w-100"
                                                        onClick={fetchHistory}
                                                    >
                                                        Filter
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {history.length > 0 ? (
                                            <div className="history-table-container">
                                                <table className="table history-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Crop</th>
                                                            <th>Soil</th>
                                                            <th>Duration</th>
                                                            <th>Water Amount</th>
                                                            <th>Water Saved</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {history.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                                                <td>{item.cropType}</td>
                                                                <td>{item.soilType}</td>
                                                                <td>{item.duration} min</td>
                                                                <td>{item.waterAmount} liters</td>
                                                                <td className="water-saved-cell">
                                                                    {item.waterSaved} liters
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="no-history">
                                                <p>No irrigation history found for the selected filters.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="error-message">
                                        <p>Failed to load history. Please try again.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                            <div className="analytics-tab">
                                {loading ? (
                                    <div className="loading-indicator">
                                        <div className="spinner"></div>
                                        <p>Loading analytics data...</p>
                                    </div>
                                ) : analytics ? (
                                    <div className="analytics-content">
                                        <div className="analytics-header mb-4">
                                            <div className="period-selector">
                                                <label>Time Period:</label>
                                                <select 
                                                    className="form-select"
                                                    value={analyticsPeriod}
                                                    onChange={(e) => setAnalyticsPeriod(e.target.value)}
                                                >
                                                    <option value="week">Last Week</option>
                                                    <option value="month">Last Month</option>
                                                    <option value="year">Last Year</option>
                                                </select>
                                                <button 
                                                    className="btn btn-primary ms-2"
                                                    onClick={fetchAnalytics}
                                                >
                                                    Update
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="analytics-summary mb-4">
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div className="summary-card">
                                                        <div className="summary-icon">💧</div>
                                                        <div className="summary-data">
                                                            <div className="summary-value">
                                                                {analytics && analytics.totalWaterUsed !== undefined ? 
                                                                    analytics.totalWaterUsed.toLocaleString() : 'N/A'}
                                                            </div>
                                                            <div className="summary-label">Total Water (L)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="summary-card">
                                                        <div className="summary-icon">🌱</div>
                                                        <div className="summary-data">
                                                            <div className="summary-value">
                                                                {analytics && analytics.irrigationEvents !== undefined ? 
                                                                    analytics.irrigationEvents : 'N/A'}
                                                            </div>
                                                            <div className="summary-label">Irrigation Events</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="summary-card">
                                                        <div className="summary-icon">⏱️</div>
                                                        <div className="summary-data">
                                                            <div className="summary-value">
                                                                {analytics && analytics.avgDuration !== undefined ? 
                                                                    analytics.avgDuration : 'N/A'}
                                                            </div>
                                                            <div className="summary-label">Avg Duration (min)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="summary-card">
                                                        <div className="summary-icon">🌊</div>
                                                        <div className="summary-data">
                                                            <div className="summary-value">
                                                                {analytics && analytics.waterSaved !== undefined ? 
                                                                    analytics.waterSaved.toLocaleString() : 'N/A'}
                                                            </div>
                                                            <div className="summary-label">Water Saved (L)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="analytics-charts">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="chart-container">
                                                        <h5>Water Usage by Crop Type</h5>
                                                        {analytics && analytics.waterUsageByType ? (
                                                            <Chart 
                                                                data={Object.entries(analytics.waterUsageByType).map(([label, value]) => ({ label, value }))} 
                                                                type="bar" 
                                                            />
                                                        ) : (
                                                            <div className="no-data-message">No water usage data available</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="chart-container">
                                                        <h5>Water Savings Over Time</h5>
                                                        {analytics && analytics.savingsOverTime ? (
                                                            <Chart 
                                                                data={Object.entries(analytics.savingsOverTime).map(([label, value]) => ({ label, value }))} 
                                                                type="bar" 
                                                            />
                                                        ) : (
                                                            <div className="no-data-message">No savings data available</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="water-saving-tips mt-4">
                                            <button 
                                                className="btn btn-outline-primary"
                                                onClick={() => setShowWaterSavingTips(!showWaterSavingTips)}
                                            >
                                                {showWaterSavingTips ? 'Hide Water Saving Tips' : 'Show Water Saving Tips'}
                                            </button>
                                            
                                            {showWaterSavingTips && (
                                                <div className="tips-container mt-3">
                                                    <h5>Water Conservation Tips</h5>
                                                    <ul className="tips-list">
                                                        <li>Water early in the morning or late in the evening to reduce evaporation</li>
                                                        <li>Use mulch around plants to retain soil moisture</li>
                                                        <li>Collect rainwater for irrigation</li>
                                                        <li>Group plants with similar water requirements together</li>
                                                        <li>Check and repair leaks in irrigation systems regularly</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="error-message">
                                        <p>Failed to load analytics. Please try again.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Disable actions for guest users */}
            <div className="irrigation-actions">
                <button 
                    onClick={handleSubmit} 
                    className="create-btn"
                    disabled={isGuest}
                >
                    {isGuest ? 'Login to Create Schedule' : 'Create New Schedule'}
                </button>
                {/* ... other action buttons ... */}
            </div>
            
            {/* Mark certain features as unavailable to guests */}
            {isGuest && schedule && (
                <div className="guest-restriction-notice">
                    <p>Editing and saving schedules is only available to registered users.</p>
                    <Link to="/register" className="register-link">Register Now</Link>
                </div>
            )}
            
            {/* For any table of schedules, add a notice about limited data for guests */}
            {isGuest && (
                <div className="guest-data-notice">
                    <p>Viewing sample data. Register to create and manage your own irrigation schedules.</p>
                </div>
            )}
        </div>
    );
};

export default IrrigationSchedule; 