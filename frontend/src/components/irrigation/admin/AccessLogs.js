import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import './AdminStyles.css';

const AccessLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({
        activity: 'all',
        search: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalLogs: 0,
        logsPerPage: 10
    });

    useEffect(() => {
        fetchLogs();
    }, [pagination.currentPage, filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Maximum number of retries
            const MAX_RETRIES = 2;
            let retries = 0;
            let success = false;
            
            while (!success && retries <= MAX_RETRIES) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/admin/irrigation/logs`, {
                        params: {
                            page: pagination.currentPage,
                            limit: pagination.logsPerPage,
                            activity: filter.activity,
                            search: filter.search || undefined
                        },
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        timeout: 10000 // 10 second timeout
                    });
                    
                    // Make sure we have valid data
                    if (response && response.data && Array.isArray(response.data.logs)) {
                        setLogs(response.data.logs);
                        setPagination(prev => ({
                            ...prev,
                            totalPages: response.data.totalPages || 1,
                            totalLogs: response.data.totalLogs || 0
                        }));
                        success = true;
                    } else {
                        throw new Error('Invalid data format received');
                    }
                } catch (retryError) {
                    retries++;
                    console.error(`Error fetching logs (attempt ${retries}/${MAX_RETRIES}):`, retryError);
                    
                    if (retries <= MAX_RETRIES) {
                        // Wait before retrying (increasing with each retry)
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                    } else {
                        throw retryError; // Re-throw to be caught by outer catch
                    }
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs after retries:', error);
            
            // Provide a more helpful error message
            let errorMessage = 'Failed to load system logs';
            
            if (error.response) {
                // Server responded with an error status
                if (error.response.status === 401 || error.response.status === 403) {
                    errorMessage = 'You do not have permission to access logs. Please check your credentials.';
                } else if (error.response.status === 500) {
                    errorMessage = 'Server error while loading logs. The system may be under maintenance.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Log service is currently unavailable. Please try again later.';
                }
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'Network error while loading logs. Please check your connection.';
            }
            
            setError(errorMessage);
            
            // Still show empty logs to allow UI interactions
            setLogs([]);
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Reset to first page when filter changes
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Fetching will be triggered by the useEffect due to filter change
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({
                ...prev,
                currentPage: newPage
            }));
        }
    };

    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const handleResetLogs = async () => {
        if (!window.confirm('This will clear all existing log data including mock entries. Only new real system activities will be recorded going forward. Continue?')) {
            return;
        }
        
        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE_URL}/admin/irrigation/logs/reset`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.success) {
                // Show success message
                setError('');
                alert(response.data.message);
                // Refetch logs to show the updated data
                fetchLogs();
            }
        } catch (error) {
            console.error('Error resetting logs:', error);
            setError('Failed to reset logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add the handler function for clearing all logs
    const handleClearAllLogs = async () => {
        if (!window.confirm('WARNING: This will permanently delete ALL system logs. This action cannot be undone. Continue?')) {
            return;
        }
        
        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE_URL}/admin/irrigation/logs/clear-all`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data.success) {
                setError('');
                alert(response.data.message);
                fetchLogs();
            }
        } catch (error) {
            console.error('Error clearing all logs:', error);
            setError('Failed to clear all logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && logs.length === 0) {
        return <div className="admin-loading">Loading system logs...</div>;
    }

    return (
        <div className="admin-logs-tab">
            <h3>System Access Logs</h3>
            
            {error && <div className="admin-error">{error}</div>}
            
            <div className="logs-actions">
                <button 
                    className="clear-all-logs-btn"
                    onClick={handleClearAllLogs}
                    disabled={loading}
                >
                    <i className="fas fa-trash"></i> Clear All Logs
                </button>
            </div>
            
            <div className="log-filters">
                <form onSubmit={handleSearch} className="form-row">
                    <div className="form-group">
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search logs..." 
                            name="search"
                            value={filter.search}
                            onChange={handleFilterChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <select 
                            className="form-select"
                            name="activity"
                            value={filter.activity}
                            onChange={handleFilterChange}
                            disabled={loading}
                        >
                            <option value="all">All Activity</option>
                            <option value="login">Login/Logout</option>
                            <option value="recommendations">Recommendations</option>
                            <option value="settings">Settings Changes</option>
                            <option value="errors">Errors</option>
                        </select>
                    </div>
                    <button 
                        className="filter-logs-btn" 
                        type="submit"
                        disabled={loading}
                    >
                        Filter
                    </button>
                </form>
            </div>
            
            <div className="logs-table-container">
                {logs.length > 0 ? (
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Activity</th>
                                <th>IP Address</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={log.id || index}>
                                    <td>{formatDateTime(log.timestamp)}</td>
                                    <td>{log.user}</td>
                                    <td>{log.activity}</td>
                                    <td>{log.ipAddress}</td>
                                    <td>
                                        <span className={`log-status ${log.status.toLowerCase()}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="no-logs-message">
                        No logs found matching your criteria.
                    </div>
                )}
            </div>
            
            {/* Add Reset Logs button */}
            {logs.some(log => ['farmer1', 'admin@example.com', 'JohnDoe', 'sri_farmer', 'tech_support', 'irrigation_expert'].includes(log.user)) && (
                <div className="reset-logs-container">
                    <div className="mock-data-warning">
                        <i className="fas fa-exclamation-triangle"></i> Mock data detected in logs
                    </div>
                    <button 
                        className="reset-logs-btn"
                        onClick={handleResetLogs}
                        disabled={loading}
                    >
                        Clear Mock Data
                    </button>
                </div>
            )}

            <div className="logs-pagination">
                <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || loading}
                >
                    Previous
                </button>
                <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages} 
                    ({pagination.totalLogs} total logs)
                </span>
                <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AccessLogs; 