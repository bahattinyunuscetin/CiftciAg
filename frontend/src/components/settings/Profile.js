import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        nic: '',
        farmSize: '',
        farmLocation: '',
        preferredCrops: '',
        designation: '',
        company: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    // Check if user is an expert
    const isExpert = user?.role === 'expert';
    
    useEffect(() => {
        fetchUserProfile();
    }, []);
    
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data) {
                setProfileData(response.data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setError('Could not load your profile information');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };
    
    const saveProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/users/profile`, profileData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSuccess('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Could not update your profile');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h3>My Profile</h3>
                    <button 
                        className={`edit-button ${isEditing ? 'cancel' : ''}`}
                        onClick={() => setIsEditing(!isEditing)}
                        type="button"
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
                
                {error && <div className="alert-message error">{error}</div>}
                {success && <div className="alert-message success">{success}</div>}
                
                {loading ? (
                    <div className="loading-message">Loading your profile...</div>
                ) : (
                    <form onSubmit={saveProfile}>
                        <div className="profile-section">
                            <div className="profile-field">
                                <label>Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                ) : (
                                    <p>{profileData.name || 'Not provided'}</p>
                                )}
                            </div>
                            
                            <div className="profile-field">
                                <label>Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                ) : (
                                    <p>{profileData.email || 'Not provided'}</p>
                                )}
                            </div>
                            
                            <div className="profile-field">
                                <label>Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <p>{profileData.phone || 'Not provided'}</p>
                                )}
                            </div>
                            
                            <div className="profile-field">
                                <label>NIC (National Identity Card)</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="nic"
                                        value={profileData.nic}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    <p>{profileData.nic || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                        
                        {isExpert && (
                            <div className="profile-section">
                                <h4>Professional Information</h4>
                                
                                <div className="profile-field">
                                    <label>Designation</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="designation"
                                            value={profileData.designation}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        <p>{profileData.designation || 'Not provided'}</p>
                                    )}
                                </div>
                                
                                <div className="profile-field">
                                    <label>Company</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="company"
                                            value={profileData.company}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        <p>{profileData.company || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {!isExpert && (
                            <div className="profile-section">
                                <h4>Farm Information</h4>
                                
                                <div className="profile-field">
                                    <label>Farm Size (square meters)</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            name="farmSize"
                                            value={profileData.farmSize}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        <p>{profileData.farmSize ? `${profileData.farmSize} sq meters` : 'Not provided'}</p>
                                    )}
                                </div>
                                
                                <div className="profile-field">
                                    <label>Farm Location</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="farmLocation"
                                            value={profileData.farmLocation}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        <p>{profileData.farmLocation || 'Not provided'}</p>
                                    )}
                                </div>
                                
                                <div className="profile-field">
                                    <label>Preferred Crops</label>
                                    {isEditing ? (
                                        <textarea
                                            name="preferredCrops"
                                            value={profileData.preferredCrops}
                                            onChange={handleChange}
                                            placeholder="E.g. Rice, Chili, Onion"
                                        />
                                    ) : (
                                        <p>{profileData.preferredCrops || 'None specified'}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {isEditing && (
                            <div className="button-container">
                                <button 
                                    type="submit" 
                                    className="save-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile; 