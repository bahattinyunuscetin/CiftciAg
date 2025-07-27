import React, { useState, useEffect } from 'react';
import { getCropTypes, getSoilTypes } from '../../services/irrigationService';
import { createCropType, updateCropType, deleteCropType, createSoilType, updateSoilType, deleteSoilType } from '../../services/adminService';
import './IrrigationTypes.css';

const IrrigationTypes = () => {
    const [cropTypes, setCropTypes] = useState([]);
    const [soilTypes, setSoilTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('crops');
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        waterNeed: 'Medium',
        rootDepth: '',
        waterRequirement: 0,
        stressThreshold: 0.5,
        waterRetention: 'Medium',
        drainage: 'Medium',
        fieldCapacity: 0.3,
        wiltingPoint: 0.12,
        infiltrationRate: 15
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const [crops, soils] = await Promise.all([
                getCropTypes(),
                getSoilTypes()
            ]);
            setCropTypes(crops);
            setSoilTypes(soils);
            setError('');
        } catch (err) {
            console.error('Error fetching types:', err);
            setError('Failed to load types. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (activeTab === 'crops') {
                if (editingType) {
                    await updateCropType(editingType._id, formData);
                } else {
                    await createCropType(formData);
                }
            } else {
                if (editingType) {
                    await updateSoilType(editingType._id, formData);
                } else {
                    await createSoilType(formData);
                }
            }
            await fetchTypes();
            resetForm();
            setError('');
        } catch (err) {
            console.error('Error saving type:', err);
            setError(err.message || 'Failed to save type. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData(type);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this type?')) return;
        
        try {
            setLoading(true);
            if (activeTab === 'crops') {
                await deleteCropType(id);
            } else {
                await deleteSoilType(id);
            }
            await fetchTypes();
            setError('');
        } catch (err) {
            console.error('Error deleting type:', err);
            setError(err.message || 'Failed to delete type. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            waterNeed: 'Medium',
            rootDepth: '',
            waterRequirement: 0,
            stressThreshold: 0.5,
            waterRetention: 'Medium',
            drainage: 'Medium',
            fieldCapacity: 0.3,
            wiltingPoint: 0.12,
            infiltrationRate: 15
        });
        setEditingType(null);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="irrigation-types">
            <h2>Manage Irrigation Types</h2>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'crops' ? 'active' : ''}`}
                    onClick={() => setActiveTab('crops')}
                >
                    Crop Types
                </button>
                <button 
                    className={`tab ${activeTab === 'soils' ? 'active' : ''}`}
                    onClick={() => setActiveTab('soils')}
                >
                    Soil Types
                </button>
            </div>

            <form onSubmit={handleSubmit} className="type-form">
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {activeTab === 'crops' ? (
                    <>
                        <div className="form-group">
                            <label>Water Need:</label>
                            <select
                                name="waterNeed"
                                value={formData.waterNeed}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Root Depth (cm):</label>
                            <input
                                type="text"
                                name="rootDepth"
                                value={formData.rootDepth}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Water Requirement (mm/day):</label>
                            <input
                                type="number"
                                name="waterRequirement"
                                value={formData.waterRequirement}
                                onChange={handleInputChange}
                                required
                                min="0"
                                step="0.1"
                            />
                        </div>

                        <div className="form-group">
                            <label>Stress Threshold:</label>
                            <input
                                type="number"
                                name="stressThreshold"
                                value={formData.stressThreshold}
                                onChange={handleInputChange}
                                required
                                min="0"
                                max="1"
                                step="0.1"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label>Water Retention:</label>
                            <select
                                name="waterRetention"
                                value={formData.waterRetention}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Drainage:</label>
                            <select
                                name="drainage"
                                value={formData.drainage}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="Slow">Slow</option>
                                <option value="Medium">Medium</option>
                                <option value="Fast">Fast</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Field Capacity:</label>
                            <input
                                type="number"
                                name="fieldCapacity"
                                value={formData.fieldCapacity}
                                onChange={handleInputChange}
                                required
                                min="0"
                                max="1"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Wilting Point:</label>
                            <input
                                type="number"
                                name="wiltingPoint"
                                value={formData.wiltingPoint}
                                onChange={handleInputChange}
                                required
                                min="0"
                                max="1"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Infiltration Rate (mm/hour):</label>
                            <input
                                type="number"
                                name="infiltrationRate"
                                value={formData.infiltrationRate}
                                onChange={handleInputChange}
                                required
                                min="0"
                                step="0.1"
                            />
                        </div>
                    </>
                )}

                <div className="form-actions">
                    <button type="submit" className="submit-btn">
                        {editingType ? 'Update' : 'Add'} {activeTab === 'crops' ? 'Crop' : 'Soil'} Type
                    </button>
                    {editingType && (
                        <button type="button" className="cancel-btn" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="types-list">
                <h3>Existing {activeTab === 'crops' ? 'Crop' : 'Soil'} Types</h3>
                <div className="types-grid">
                    {(activeTab === 'crops' ? cropTypes : soilTypes).map(type => (
                        <div key={type._id} className="type-card">
                            <h4>{type.name}</h4>
                            <p>{type.description}</p>
                            <div className="type-details">
                                {activeTab === 'crops' ? (
                                    <>
                                        <p>Water Need: {type.waterNeed}</p>
                                        <p>Root Depth: {type.rootDepth}</p>
                                        <p>Water Requirement: {type.waterRequirement} mm/day</p>
                                        <p>Stress Threshold: {type.stressThreshold}</p>
                                    </>
                                ) : (
                                    <>
                                        <p>Water Retention: {type.waterRetention}</p>
                                        <p>Drainage: {type.drainage}</p>
                                        <p>Field Capacity: {type.fieldCapacity}</p>
                                        <p>Wilting Point: {type.wiltingPoint}</p>
                                        <p>Infiltration Rate: {type.infiltrationRate} mm/hour</p>
                                    </>
                                )}
                            </div>
                            <div className="type-actions">
                                <button 
                                    className="edit-btn"
                                    onClick={() => handleEdit(type)}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDelete(type._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IrrigationTypes; 