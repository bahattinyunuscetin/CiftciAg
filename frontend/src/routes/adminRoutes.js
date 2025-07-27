import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import SystemSettings from '../components/admin/SystemSettings';
import IrrigationTypesManager from '../components/admin/IrrigationTypesManager';
import PrivateRoute from './PrivateRoute';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <AdminDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/users"
                element={
                    <PrivateRoute>
                        <UserManagement />
                    </PrivateRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <PrivateRoute>
                        <SystemSettings />
                    </PrivateRoute>
                }
            />
            <Route
                path="/irrigation-types"
                element={
                    <PrivateRoute>
                        <IrrigationTypesManager />
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
};

export default AdminRoutes; 