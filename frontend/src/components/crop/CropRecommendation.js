import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSoilTypes } from '../../services/irrigationService';
import { API_BASE_URL } from '../../config';
import './CropRecommendation.css';

const CropRecommendation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [soilTypes, setSoilTypes] = useState([]);
    const [selectedSoil, setSelectedSoil] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState(null);
    const [regionInfo, setRegionInfo] = useState(null);
    const [searchMessage, setSearchMessage] = useState('');

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    // Get user's location and soil types on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setSearchMessage('Getting your location...');
            
            try {
                // Get user's location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            setLocation({
                                lat: latitude,
                                lon: longitude
                            });
                            
                            setSearchMessage('Analyzing regional soil and climate conditions...');
                            
                            // Get region info
                            try {
                                const token = localStorage.getItem('token');
                                const regionResponse = await axios.get(`${API_BASE_URL}/irrigation/region-info`, {
                                    params: {
                                        lat: latitude,
                                        lon: longitude
                                    },
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });
                                
                                if (regionResponse.data) {
                                    setRegionInfo(regionResponse.data);
                                }
                            } catch (regionError) {
                                console.error('Error fetching region info:', regionError);
                            }
                            
                            // Fetch soil types using the service function
                            try {
                                const soilTypesData = await getSoilTypes();
                                if (soilTypesData && soilTypesData.soilTypes) {
                                    setSoilTypes(soilTypesData.soilTypes);
                                } else {
                                    // Use the array directly if it's not wrapped in a soilTypes property
                                    setSoilTypes(Array.isArray(soilTypesData) ? soilTypesData : []);
                                }
                                setLoading(false);
                                setSearchMessage('');
                            } catch (soilError) {
                                console.error('Error fetching soil types:', soilError);
                                setError('Failed to fetch soil types. Please try again later.');
                                setLoading(false);
                                setSearchMessage('');
                            }
                        },
                        (locationError) => {
                            console.error('Error getting location:', locationError);
                            setError('Location access denied. Please enable location services and refresh the page.');
                            setLoading(false);
                            setSearchMessage('');
                        }
                    );
                } else {
                    setError('Geolocation is not supported by your browser. Please use a different browser.');
                    setLoading(false);
                    setSearchMessage('');
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setError('Something went wrong. Please try again later.');
                setLoading(false);
                setSearchMessage('');
            }
        };
        
        fetchInitialData();
    }, []);
    
    // Handle soil type selection
    const handleSoilChange = (e) => {
        setSelectedSoil(e.target.value);
    };
    
    // Handle form submission to get crop recommendations
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedSoil) {
            setError('Please select a soil type to get recommendations.');
            return;
        }
        
        if (!location) {
            setError('Location data is missing. Please refresh and allow location access.');
            return;
        }
        
        setSubmitting(true);
        setError('');
        setSearchMessage('Analyzing best crops for your conditions...');
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/irrigation/recommend-crops`, {
                params: {
                    lat: location.lat,
                    lon: location.lon,
                    soilType: selectedSoil
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data && response.data.recommendations) {
                setRecommendations(response.data.recommendations);
                setSearchMessage('');
            } else {
                setError('No recommendations found. Please try a different soil type.');
                setSearchMessage('');
            }
            
            setSubmitting(false);
        } catch (error) {
            console.error('Error fetching crop recommendations:', error);
            setError('Failed to get crop recommendations. Please try again later.');
            setSubmitting(false);
            setSearchMessage('');
        }
    };
    
    // Handle navigation to irrigation plan
    const handleCreateIrrigationPlan = (cropName) => {
        navigate('/irrigation/new', { 
            state: { 
                selectedCrop: cropName,
                soilType: selectedSoil
            } 
        });
    };

    return (
        <div className="crop-recommendation">
            <div className="crop-recommendation-header">
                <h1>Crop Recommendation</h1>
                <p>Get personalized crop recommendations based on your location and soil conditions</p>
            </div>
            
            {loading ? (
                <div className="recommendation-loading">
                    <div className="spinner"></div>
                    <p>{searchMessage || 'Loading...'}</p>
                </div>
            ) : error ? (
                <div className="recommendation-alert error">
                    <span className="alert-icon">⚠️</span>
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    {regionInfo && (
                        <div className="location-info">
                            <h3>Location Analysis</h3>
                            <div className="location-details">
                                <div className="location-detail">
                                    <span className="detail-label">Region:</span>
                                    <span className="detail-value">{regionInfo.region}</span>
                                </div>
                                <div className="location-detail">
                                    <span className="detail-label">Climate Zone:</span>
                                    <span className="detail-value">{regionInfo.climateZone}</span>
                                </div>
                                <div className="location-detail">
                                    <span className="detail-label">Growing Season:</span>
                                    <span className="detail-value">{regionInfo.growingSeason}</span>
                                </div>
                                <div className="location-detail">
                                    <span className="detail-label">Current Status:</span>
                                    <span className="detail-value status">
                                        {regionInfo.isActiveGrowingSeason 
                                            ? <span className="active-season">Active Growing Season</span> 
                                            : <span className="inactive-season">Off-Season Period</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <form className="recommendation-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="soilType">Select Your Soil Type:</label>
                            <select 
                                id="soilType" 
                                value={selectedSoil} 
                                onChange={handleSoilChange}
                                required
                            >
                                <option value="">-- Select Soil Type --</option>
                                {soilTypes.map((soil) => (
                                    <option 
                                        key={soil.id || soil._id} 
                                        value={soil.name}
                                    >
                                        {soil.name} - {soil.description || soil.waterRetention}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={submitting}
                        >
                            {submitting ? 'Getting Recommendations...' : 'Get Crop Recommendations'}
                        </button>
                    </form>
                    
                    {submitting && (
                        <div className="recommendation-loading">
                            <div className="spinner"></div>
                            <p>{searchMessage || 'Processing your request...'}</p>
                        </div>
                    )}
                    
                    {recommendations.length > 0 && (
                        <div className="recommendations-container">
                            <h2>Recommended Crops</h2>
                            <p className="recommendations-subtitle">
                                Based on your {selectedSoil} soil type and {regionInfo?.region || 'local'} location
                            </p>
                            
                            <div className="crop-recommendations">
                                {recommendations.map((crop, index) => (
                                    <div key={index} className="crop-card">
                                        <div className="crop-image">
                                            {crop.imageUrl ? (
                                                <img 
                                                    src={crop.imageUrl} 
                                                    alt={crop.name} 
                                                    onError={(e) => {
                                                        e.target.onerror = null; 
                                                        e.target.src = '/images/crops/default-crop.jpg';
                                                    }}
                                                />
                                            ) : (
                                                <div className="crop-image-placeholder">
                                                    <span>{crop.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="confidence-indicator">
                                                <span className="confidence-label">Match:</span>
                                                <span className="confidence-value">{crop.confidence}%</span>
                                            </div>
                                        </div>
                                        
                                        <div className="crop-details">
                                            <h3 className="crop-name">{crop.name}</h3>
                                            <p className="crop-description">{crop.description}</p>
                                            
                                            <div className="crop-stats">
                                                <div className="crop-stat">
                                                    <span className="stat-label">Growing Season:</span>
                                                    <span className="stat-value">{crop.growingSeason}</span>
                                                </div>
                                                <div className="crop-stat">
                                                    <span className="stat-label">Water Needs:</span>
                                                    <span className="stat-value">{crop.waterNeeds}</span>
                                                </div>
                                                <div className="crop-stat">
                                                    <span className="stat-label">Growth Period:</span>
                                                    <span className="stat-value">{crop.growthPeriod}</span>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                className="create-plan-button"
                                                onClick={() => handleCreateIrrigationPlan(crop.name)}
                                            >
                                                Create Irrigation Plan
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {isAdmin && (
                        <div className="admin-controls">
                            <h3>Admin Controls</h3>
                            <div className="admin-buttons">
                                <button 
                                    className="admin-button" 
                                    onClick={() => navigate('/admin/crops')}
                                >
                                    Manage Crop Database
                                </button>
                                <button 
                                    className="admin-button" 
                                    onClick={() => navigate('/admin/recommendation-analytics')}
                                >
                                    View Recommendation Analytics
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CropRecommendation; 