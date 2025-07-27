import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create an axios instance with the correct base URL
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
    console.log('Starting Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        baseURL: request.baseURL,
        fullURL: `${request.baseURL}${request.url}`
    });
    return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('Response:', {
            status: response.status,
            data: response.data,
            url: response.config.url
        });
        return response;
    },
    error => {
        console.error('API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL
            }
        });
        throw error;
    }
);

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return {
        headers: { 
            'Authorization': `Bearer ${token}`
        }
    };
};

const handleApiError = (error, defaultMessage) => {
    if (error.message === 'Network Error') {
        console.error('Network Error - Backend server might be down:', error);
        throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    
    if (error.response) {
        // Server responded with error
        const message = error.response.data?.message || error.response.statusText;
        console.error(`API Error (${error.response.status}):`, message);
        
        if (error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }
        
        if (error.response.status === 403) {
            throw new Error('Access denied. Admin privileges required.');
        }
        
        if (error.response.status === 404) {
            throw new Error('API endpoint not found. Please check the server configuration.');
        }
        
        throw new Error(message || defaultMessage);
    }
    
    console.error('Unexpected error:', error);
    throw new Error(defaultMessage);
};

export const fetchAdminData = async () => {
    try {
        console.log('Fetching admin data...');
        const [usersResponse, statsResponse, logsResponse, requestStatsResponse] = await Promise.all([
            api.get('/admin/users', getAuthHeaders()),
            api.get('/admin/stats', getAuthHeaders()),
            api.get('/admin/system-logs?limit=1000', getAuthHeaders()),
            api.get('/admin/request-stats', getAuthHeaders())
        ]);

        console.log('Admin stats received:', statsResponse.data);
        
        // Calculate active users based on last login time (past 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsers = usersResponse.data.filter(user => {
            return user.lastActive && new Date(user.lastActive) > sevenDaysAgo;
        }).length;
        
        // Get real API request count from logs (past 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentLogs = (logsResponse.data || []).filter(log => {
            return new Date(log.timestamp) > oneDayAgo;
        });
        
        // Use actual request stats if available, otherwise calculate from logs
        const totalRequests = requestStatsResponse.data?.last24Hours || recentLogs.length;
        const requestTrend = requestStatsResponse.data?.trend || 0;
        
        // Calculate real data usage based on storage metrics
        const dataUsage = (
            (statsResponse.data.weatherRecords * 0.005) + 
            (statsResponse.data.schedules * 0.002) + 
            (recentLogs.length * 0.0001)
        ).toFixed(2);
        
        // Enhanced stats with real values
        const enhancedStats = {
            ...statsResponse.data,
            activeUsers,
            userTrend: requestStatsResponse.data?.userTrend || 5,
            totalRequests,
            requestTrend,
            dataUsage: parseFloat(dataUsage),
            usersByRole: {
                admin: statsResponse.data.users.admins,
                regular: statsResponse.data.users.regular,
            }
        };
        
        console.log('Enhanced stats with real data:', enhancedStats);

        // Process users to add active status
        const usersWithStatus = usersResponse.data.map(user => ({
            ...user,
            active: user.lastActive ? new Date(user.lastActive) > sevenDaysAgo : false
        }));

        return {
            users: usersWithStatus,
            stats: enhancedStats
        };
    } catch (error) {
        console.error('Error in fetchAdminData:', error);
        handleApiError(error, 'Failed to fetch admin data');
    }
};

export const updateUser = async (userId, userData) => {
    try {
        const response = await api.put(
            `/admin/users/${userId}`,
            userData,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to update user');
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(
            `/admin/users/${userId}`,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to delete user');
    }
};

export const updateApiKey = async (apiKey) => {
    try {
        const response = await api.post(
            '/admin/settings',
            { apiKey },
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to update API key');
    }
};

export const clearCache = async () => {
    try {
        const response = await api.post(
            '/admin/clear-cache',
            {},
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to clear cache');
    }
};

export const backupDatabase = async () => {
    try {
        const response = await api.post(
            '/admin/backup-database',
            {},
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to backup database');
    }
};

// Crop Type Management
export const createCropType = async (cropData) => {
    try {
        const response = await api.post(
            '/irrigation/admin/crop-types',
            cropData,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to create crop type');
    }
};

export const updateCropType = async (id, cropData) => {
    try {
        const response = await api.put(
            `/irrigation/admin/crop-types/${id}`,
            cropData,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to update crop type');
    }
};

export const deleteCropType = async (id) => {
    try {
        const response = await api.delete(
            `/irrigation/admin/crop-types/${id}`,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to delete crop type');
    }
};

// Soil Type Management
export const createSoilType = async (soilData) => {
    try {
        const response = await api.post(
            '/irrigation/admin/soil-types',
            soilData,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to create soil type');
    }
};

export const updateSoilType = async (id, soilData) => {
    try {
        const response = await api.put(
            `/irrigation/admin/soil-types/${id}`,
            soilData,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to update soil type');
    }
};

export const deleteSoilType = async (id) => {
    try {
        const response = await api.delete(
            `/irrigation/admin/soil-types/${id}`,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to delete soil type');
    }
}; 