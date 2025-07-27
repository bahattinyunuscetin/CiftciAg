import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import SystemStatus from './SystemStatus';
import AIConfiguration from './AIConfiguration';
import ReportsAnalysis from './ReportsAnalysis';
import AccessLogs from './AccessLogs';
import './AdminStyles.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('status');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if user is an admin
        if (!user || user.role !== 'admin') {
            setError('Access denied. Admin privileges required.');
            setTimeout(() => {
                navigate('/irrigation');
            }, 3000);
            return;
        }
        
        setLoading(false);
    }, [user, navigate]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'status':
                return <SystemStatus />;
            case 'config':
                return <AIConfiguration />;
            case 'reports':
                return <ReportsAnalysis />;
            case 'logs':
                return <AccessLogs />;
            default:
                return <SystemStatus />;
        }
    };

    if (loading) {
        return <div className="admin-loading">Loading admin dashboard...</div>;
    }

    if (error) {
        return <div className="admin-error">{error}</div>;
    }

    return (
        <div className="irrigation-container admin-dashboard">
            <div className="irrigation-schedule-container">
                <div className="page-header">
                    <h2>Smart Irrigation Management - Admin Panel</h2>
                    <p className="subtitle">
                        Monitor and configure the irrigation system
                    </p>
                </div>
                
                {/* Error Messages */}
                {error && <div className="alert-message error">{error}</div>}
                
                {/* Navigation Tabs */}
                <div className="irrigation-tabs">
                    <div className="nav-tabs-container">
                        <button 
                            className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
                            onClick={() => setActiveTab('status')}
                        >
                            System Status
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
                            onClick={() => setActiveTab('config')}
                        >
                            AI Configuration
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            Reports & Analysis
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            Access Logs
                        </button>
                        <button 
                            className="tab-button user-view"
                            onClick={() => navigate('/irrigation')}
                        >
                            Switch to User View
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="tab-content">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 