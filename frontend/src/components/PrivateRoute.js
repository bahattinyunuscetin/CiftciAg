import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ element, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Support both ways of using the component - either with children or with element prop
    return user ? (element || children) : <Navigate to="/login" />;
};

export default PrivateRoute; 