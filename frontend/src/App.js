import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WeatherProvider } from './contexts/WeatherContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import WeatherForecast from './components/weather/WeatherForecast';
import IrrigationSchedule from './components/irrigation/IrrigationSchedule';
import IrrigationAdminDashboard from './components/irrigation/admin/AdminDashboard';
import KnowledgeBase from './components/knowledge/KnowledgeBase';
import ArticleView from './components/knowledge/ArticleView';
import CropRecommendation from './components/crop/CropRecommendation';
import DiseaseDetection from './components/disease/DiseaseDetection';
import FontAwesomeTest from './components/irrigation/admin/FontAwesomeTest';
import './App.css';
import Layout from './components/Layout';
import RegionalSettings from './components/settings/RegionalSettings';
import Profile from './components/settings/Profile';
import UserGuide from './pages/UserGuide';
import SystemStatus from './components/SystemStatus';

function App() {
  return (
    <AuthProvider>
      <WeatherProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/weather" element={<WeatherForecast />} />
              <Route path="/user-guide" element={<UserGuide />} />
              <Route path="/system-status" element={<SystemStatus />} />
              <Route path="/irrigation" element={<IrrigationSchedule />} />
              <Route
                path="/irrigation/admin"
                element={<AdminRoute element={<IrrigationAdminDashboard />} />}
              />
              <Route
                path="/crop-recommendation"
                element={<PrivateRoute element={<CropRecommendation />} />}
              />
              <Route
                path="/disease-detection"
                element={<PrivateRoute element={<DiseaseDetection />} />}
              />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route
                path="/knowledge/article/:id"
                element={<PrivateRoute element={<ArticleView />} />}
              />
              <Route
                path="/settings/profile"
                element={<PrivateRoute element={<Profile />} />}
              />
              <Route
                path="/settings/regional"
                element={<PrivateRoute element={<RegionalSettings />} />}
              />
              <Route
                path="/admin/*"
                element={<AdminRoute element={<AdminDashboard />} />}
              />
              <Route path="/fontawesome-test" element={<FontAwesomeTest />} />
            </Routes>
          </Layout>
        </Router>
      </WeatherProvider>
    </AuthProvider>
  );
}

export default App;
