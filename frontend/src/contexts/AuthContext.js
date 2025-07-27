import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios defaults
    axios.defaults.baseURL = API_BASE_URL;

    // Add request interceptor to add token to all requests
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Add response interceptor to handle token expiration
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                logout();
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            if (token && userData) {
                try {
                    const user = JSON.parse(userData);
                    setUser(user);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('auth/login', {
                email,
                password
            });

            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            
            return response.data;
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            throw error.response?.data || { message: 'An error occurred during login' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/auth/register', userData);
            
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            
            return response.data;
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            throw error.response?.data || { message: 'An error occurred during registration' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 