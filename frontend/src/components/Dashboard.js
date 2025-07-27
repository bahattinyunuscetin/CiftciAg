import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState('');
    const isGuest = !user;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome{user ? `, ${user.username}!` : ' to SAMS!'}</h1>
                {isGuest && (
                    <div className="guest-banner">
                        <p>You're browsing as a guest. <a href="/login">Login</a> or <a href="/register">Register</a> for full access to all features.</p>
                    </div>
                )}
                <p className="dashboard-date">{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>

            {loading ? (
                <div className="dashboard-loading">Loading dashboard data...</div>
            ) : error ? (
                <div className="dashboard-error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        Retry Loading Data
                    </button>
                </div>
            ) : (
                <div className="dashboard-grid">
                    {/* Quick Actions Card */}
                    <div className="dashboard-card quick-actions-card">
                        <h2>Quick Actions</h2>
                        <div className="quick-actions">
                            {/* Weather Insights - Requires Login */}
                            <button 
                                onClick={() => isGuest ? navigate('/login') : navigate('/weather')} 
                                className={`weather-action ${isGuest ? 'restricted' : ''}`}
                            >
                                <span className="icon">🌤️</span>
                                Weather Insights
                                {isGuest && <span className="login-required">Login Required</span>}
                            </button>
                            
                            {/* Get Crop Recommendation - Requires Login */}
                            <button 
                                onClick={() => isGuest ? navigate('/login') : navigate('/crop-recommendation')}
                                className={isGuest ? 'restricted' : ''}
                            >
                                <span className="icon">🌱</span>
                                Get Crop Recommendation
                                {isGuest && <span className="login-required">Login Required</span>}
                            </button>
                            
                            {/* Disease Detection - Requires Login */}
                            <button 
                                onClick={() => isGuest ? navigate('/login') : navigate('/disease-detection')}
                                className={isGuest ? 'restricted' : ''}
                            >
                                <span className="icon">🔍</span>
                                Detect Plant Disease
                                {isGuest && <span className="login-required">Login Required</span>}
                            </button>
                            
                            {/* Irrigation - Available for Guest (Limited) */}
                            <button onClick={() => navigate('/irrigation')}>
                                <span className="icon">💧</span>
                                Manage Irrigation
                                {isGuest && <span className="guest-access">Limited Access</span>}
                            </button>
                            
                            {/* Knowledge Base - Available for Guest */}
                            <button onClick={() => navigate('/knowledge')}>
                                <span className="icon">📚</span>
                                Knowledge Base
                                {isGuest && <span className="guest-access">Guest Access</span>}
                            </button>
                            
                            {/* User Guide - Available for Guest */}
                            <button onClick={() => navigate('/user-guide')} className="user-guide-action">
                                <span className="icon">📖</span>
                                User Guide
                                {isGuest && <span className="guest-access">Guest Access</span>}
                            </button>
                        </div>
                    </div>

                    {/* About Platform Card */}
                    <div className="dashboard-card about-card">
                        <h2>About Our Platform</h2>
                        <div className="about-content">
                            <p>
                            We've developed an intelligent farming platform specifically designed to address Sri Lanka's dry zone challenges. Our system transforms unpredictable weather patterns, water scarcity, and pest threats into manageable variables through advanced data analytics and predictive technologies. By bridging the gap between traditional farming wisdom and cutting-edge agri-tech, we empower farmers to make data-driven decisions for sustainable agriculture.
                            </p>
                            
                            <h3>What We Offer:</h3>
                            <ul className="offer-list">
                                <li>Hyperlocal Weather Adaptation</li>
                                <li>Smart Water Management</li>
                                <li>Pest Prediction System</li>
                                <li>Crop Optimization</li>
                                <li>Expert farming knowledge base</li>
                            </ul>

                            <h3>Our Mission:</h3>
                            <p>
                                To empower farmers with technology that makes agriculture more productive, 
                                sustainable, and profitable through data-driven insights and automation.
                            </p>
                            
                            {isGuest && (
                                <div className="registration-cta">
                                    <h3>Ready to get started?</h3>
                                    <p>Create an account to access all features and personalized recommendations.</p>
                                    <button onClick={() => navigate('/register')} className="register-button">
                                        Register Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;