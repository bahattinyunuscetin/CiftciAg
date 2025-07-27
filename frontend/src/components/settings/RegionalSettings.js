import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import './RegionalSettings.css';

// Flag components for language selection
const LanguageOption = ({ language, name, flag, selected, onChange }) => (
    <div 
        className={`language-option ${selected ? 'selected' : ''}`}
        onClick={() => onChange(language)}
    >
        <div className="language-flag">{flag}</div>
        <div className="language-name">{name}</div>
    </div>
);

const RegionalSettings = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState({
        useLocalizedData: false,
        region: 'default',
        measurementSystem: 'metric',
        language: 'en'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [regions, setRegions] = useState([
        { id: 'default', name: 'Default (Global Data)' },
        { id: 'sri_lanka_dry_zone', name: 'Sri Lanka - Dry Zone' },
        { id: 'sri_lanka_wet_zone', name: 'Sri Lanka - Wet Zone' },
        { id: 'sri_lanka_intermediate', name: 'Sri Lanka - Intermediate Zone' }
    ]);
    
    useEffect(() => {
        fetchUserPreferences();
    }, []);
    
    const fetchUserPreferences = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/users/preferences`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data) {
                setPreferences(prevPrefs => ({
                    ...prevPrefs,
                    ...response.data
                }));
            }
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            setError('Failed to load your regional settings');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences(prevPrefs => ({
            ...prevPrefs,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLanguageChange = (language) => {
        setPreferences(prevPrefs => ({
            ...prevPrefs,
            language
        }));
    };
    
    const savePreferences = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/users/preferences`, preferences, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSuccess('Regional settings updated successfully');
            
            // If language changed, notify to refresh
            const currentLanguage = localStorage.getItem('language');
            if (currentLanguage !== preferences.language) {
                localStorage.setItem('language', preferences.language);
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            setError('Failed to update your regional settings');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="regional-settings-container">
            <div className="settings-card">
                <div className="settings-header">
                    <h3>Regional Settings</h3>
                </div>
                <div className="settings-body">
                    {error && <div className="alert-message error">{error}</div>}
                    {success && <div className="alert-message success">{success}</div>}
                    
                    {loading ? (
                        <div className="loading-message">Loading your settings...</div>
                    ) : (
                        <form onSubmit={savePreferences}>
                            <div className="settings-section">
                                <h4>Language</h4>
                                <p className="section-description">
                                    Choose your preferred language. Changes will apply after page refresh.
                                </p>
                                
                                <div className="language-options">
                                    <LanguageOption 
                                        language="en" 
                                        name="English" 
                                        flag="🇬🇧" 
                                        selected={preferences.language === 'en'}
                                        onChange={handleLanguageChange}
                                    />
                                    <LanguageOption 
                                        language="si" 
                                        name="සිංහල (Sinhala)" 
                                        flag="🇱🇰" 
                                        selected={preferences.language === 'si'}
                                        onChange={handleLanguageChange}
                                    />
                                    <LanguageOption 
                                        language="ta" 
                                        name="தமிழ் (Tamil)" 
                                        flag="🇱🇰" 
                                        selected={preferences.language === 'ta'}
                                        onChange={handleLanguageChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="settings-section">
                                <h4>Regional Data</h4>
                                <div className="toggle-option">
                                    <div className="toggle-switch">
                                        <input 
                                            type="checkbox"
                                            id="useLocalizedData"
                                            name="useLocalizedData"
                                            checked={preferences.useLocalizedData}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="useLocalizedData"></label>
                                    </div>
                                    <div className="toggle-label">
                                        <span>Use Sri Lankan agricultural data</span>
                                        <small>Get crop, soil and seasonal data specific to Sri Lanka</small>
                                    </div>
                                </div>
                                
                                <div className={`region-selector ${!preferences.useLocalizedData ? 'disabled' : ''}`}>
                                    <label htmlFor="region">Choose your region:</label>
                                    <select 
                                        name="region"
                                        id="region"
                                        value={preferences.region}
                                        onChange={handleChange}
                                        disabled={!preferences.useLocalizedData}
                                    >
                                        {regions.map(region => (
                                            <option key={region.id} value={region.id}>
                                                {region.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="settings-section">
                                <h4>Measurement System</h4>
                                <div className="measurement-options">
                                    <div 
                                        className={`measurement-option ${preferences.measurementSystem === 'metric' ? 'selected' : ''}`}
                                        onClick={() => handleChange({ target: { name: 'measurementSystem', value: 'metric' } })}
                                    >
                                        <div className="measurement-icon">📏</div>
                                        <div className="measurement-details">
                                            <span className="measurement-name">Metric</span>
                                            <span className="measurement-desc">Millimeters (mm), Celsius (°C)</span>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className={`measurement-option ${preferences.measurementSystem === 'imperial' ? 'selected' : ''}`}
                                        onClick={() => handleChange({ target: { name: 'measurementSystem', value: 'imperial' } })}
                                    >
                                        <div className="measurement-icon">📏</div>
                                        <div className="measurement-details">
                                            <span className="measurement-name">Imperial</span>
                                            <span className="measurement-desc">Inches (in), Fahrenheit (°F)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="button-container">
                                <button 
                                    className="save-button" 
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegionalSettings; 