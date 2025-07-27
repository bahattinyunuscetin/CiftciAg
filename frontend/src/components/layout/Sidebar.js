import React, { Link } from 'react';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="nav-item">
        <Link to="/settings/profile" className="nav-link">
          <i className="fas fa-user-cog"></i>
          <span>Profile Settings</span>
        </Link>
      </div>

      <div className="nav-item">
        <Link to="/settings/regional" className="nav-link">
          <i className="fas fa-globe-asia"></i>
          <span>Regional Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 