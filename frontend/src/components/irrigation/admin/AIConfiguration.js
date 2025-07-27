import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import './AdminStyles.css';

const AIConfiguration = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [configData, setConfigData] = useState({
        weatherSource: 'openweather',
        updateFrequency: 'hourly',
        modelType: 'standard',
        conservationMode: 'balanced',
        evaporationConstants: '0.75, 0.8, 1.2, 0.95'
    });
    const [regions, setRegions] = useState([]);
    const [newRegion, setNewRegion] = useState('');

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/admin/irrigation/config`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setConfigData(response.data.config);
                setRegions(response.data.regions);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching configuration data:', error);
                setError('Failed to load configuration data');
                setLoading(false);
            }
        };

        fetchConfigData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setConfigData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setSaveSuccess(false);
        try {
            setLoading(true);
            await axios.put(
                `${API_BASE_URL}/admin/irrigation/config`, 
                configData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setSaveSuccess(true);
            setLoading(false);
            // Clear success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving configuration:', error);
            setError('Failed to save configuration');
            setLoading(false);
        }
    };

    const handleAddRegion = async () => {
        if (newRegion.trim() === '') return;
        
        try {
            setLoading(true);
            const response = await axios.post(
                `${API_BASE_URL}/admin/irrigation/regions`, 
                {
                    name: newRegion,
                    active: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            // Update regions with the response from server
            setRegions([...regions, response.data]);
            setNewRegion('');
            setLoading(false);
        } catch (error) {
            console.error('Error adding region:', error);
            setError('Failed to add region');
            setLoading(false);
        }
    };

    const toggleRegionStatus = async (id) => {
        try {
            setLoading(true);
            const region = regions.find(r => r.id === id);
            const response = await axios.put(
                `${API_BASE_URL}/admin/irrigation/regions/${id}`, 
                {
                    active: !region.active
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            // Update regions state with the new data
            setRegions(regions.map(region => 
                region.id === id ? response.data : region
            ));
            setLoading(false);
        } catch (error) {
            console.error('Error updating region status:', error);
            setError('Failed to update region status');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="admin-loading">Loading configuration data...</div>;
    }

    if (error) {
        return <div className="admin-error">{error}</div>;
    }

    return (
        <div className="admin-config-tab">
            <h3>AI Irrigation System Configuration</h3>
            
            <div className="config-section">
                <h4>Model Configuration</h4>
                {error && <div className="admin-error">{error}</div>}
                {saveSuccess && <div className="admin-success">Configuration saved successfully!</div>}
                <form className="config-form" onSubmit={handleSaveConfig}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Weather Data Source</label>
                            <select 
                                className="form-select"
                                name="weatherSource"
                                value={configData.weatherSource}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <option value="openweather">OpenWeatherMap API</option>
                                <option value="meteomatics">Meteomatics</option>
                                <option value="visualcrossing">Visual Crossing</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Weather Update Frequency</label>
                            <select 
                                className="form-select"
                                name="updateFrequency"
                                value={configData.updateFrequency}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <option value="hourly">Hourly</option>
                                <option value="3hour">Every 3 Hours</option>
                                <option value="6hour">Every 6 Hours</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>AI Recommendation Model</label>
                            <select 
                                className="form-select"
                                name="modelType"
                                value={configData.modelType}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <option value="standard">Standard</option>
                                <option value="enhanced">Enhanced</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Conservation Mode</label>
                            <select 
                                className="form-select"
                                name="conservationMode"
                                value={configData.conservationMode}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <option value="balanced">Balanced</option>
                                <option value="water-saving">Water Saving Preference</option>
                                <option value="yield">Yield Maximization</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Default Evaporation Constants</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            name="evaporationConstants"
                            value={configData.evaporationConstants}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <small className="form-text text-muted">Comma-separated values for crop stages</small>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="save-config-btn"
                        disabled={loading}
                    >
                        Save Configuration
                    </button>
                </form>
            </div>
            
            <div className="config-section">
                <h4>Regional Data Settings</h4>
                <div className="region-config">
                    <div className="form-group">
                        <label>Add New Region</label>
                        <div className="region-add-form">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Region Name"
                                value={newRegion}
                                onChange={(e) => setNewRegion(e.target.value)}
                                disabled={loading}
                            />
                            <button 
                                className="add-region-btn"
                                onClick={handleAddRegion}
                                type="button"
                                disabled={loading || newRegion.trim() === ''}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                    
                    <table className="region-table">
                        <thead>
                            <tr>
                                <th>Region Name</th>
                                <th>Active</th>
                                <th>Data Available</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regions.map(region => (
                                <tr key={region.id}>
                                    <td>{region.name}</td>
                                    <td>
                                        <span className={`status-badge ${region.active ? 'active' : 'inactive'}`}>
                                            {region.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{region.dataAvailable}</td>
                                    <td>
                                        <button className="admin-small-btn">Edit</button>
                                        <button 
                                            className="admin-small-btn danger"
                                            onClick={() => toggleRegionStatus(region.id)}
                                            disabled={loading}
                                        >
                                            {region.active ? 'Disable' : 'Enable'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AIConfiguration; 