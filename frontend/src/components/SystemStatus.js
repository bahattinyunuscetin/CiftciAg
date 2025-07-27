import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    irrigation: 'operational',
    weather: 'operational',
    sensors: 'operational',
    database: 'operational'
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Simulate status updates every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return '#4caf50';
      case 'degraded':
        return '#ff9800';
      case 'down':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'down':
        return 'Down';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="system-status">
      <h2>System Status</h2>
      <div className="status-grid">
        <div className="status-item">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(status.irrigation) }} />
          <div className="status-info">
            <h3>Irrigation</h3>
            <p>{getStatusText(status.irrigation)}</p>
          </div>
        </div>
        <div className="status-item">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(status.weather) }} />
          <div className="status-info">
            <h3>Weather</h3>
            <p>{getStatusText(status.weather)}</p>
          </div>
        </div>
        <div className="status-item">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(status.sensors) }} />
          <div className="status-info">
            <h3>Sensors</h3>
            <p>{getStatusText(status.sensors)}</p>
          </div>
        </div>
        <div className="status-item">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(status.database) }} />
          <div className="status-info">
            <h3>Database</h3>
            <p>{getStatusText(status.database)}</p>
          </div>
        </div>
      </div>
      <div className="last-updated">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SystemStatus; 