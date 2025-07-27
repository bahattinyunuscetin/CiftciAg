import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLeaf,
  faUser,
  faSignOutAlt,
  faSignInAlt,
  faUserPlus,
  faCog,
  faChartLine,
  faBook,
  faTint,
  faCloudSun,
  faSeedling
} from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const settingsDropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
                setShowSettingsDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <FontAwesomeIcon icon={faLeaf} className="brand-icon" />
                    <Link to="/" className="brand-text">SAMS</Link>
                </div>
                
                <div className="navbar-menu">
                    <Link to="/dashboard" className="nav-link">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/knowledge" className="nav-link">
                        <FontAwesomeIcon icon={faBook} />
                        <span>Knowledge Base</span>
                    </Link>
                    <Link to="/irrigation" className="nav-link">
                        <FontAwesomeIcon icon={faTint} />
                        <span>Irrigation</span>
                    </Link>
                    
                    {user && (
                        <>
                            <Link to="/weather" className="nav-link">
                                <FontAwesomeIcon icon={faCloudSun} />
                                <span>Weather</span>
                            </Link>
                            <Link to="/crop-recommendation" className="nav-link">
                                <FontAwesomeIcon icon={faSeedling} />
                                <span>Crop Recommendations</span>
                            </Link>
                        </>
                    )}
                </div>

                <div className="navbar-right">
                    {user ? (
                        <div className="user-section">
                            <div className="settings-dropdown" ref={settingsDropdownRef}>
                                <button 
                                    className="settings-btn"
                                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                                >
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>{user.username}</span>
                                    <FontAwesomeIcon icon={faCog} className="settings-icon" />
                                </button>

                                {showSettingsDropdown && (
                                    <div className="dropdown-menu">
                                        <Link to="/settings/profile" onClick={() => setShowSettingsDropdown(false)}>
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>Profile</span>
                                        </Link>
                                        <Link to="/settings/regional" onClick={() => setShowSettingsDropdown(false)}>
                                            <FontAwesomeIcon icon={faCog} />
                                            <span>Regional Settings</span>
                                        </Link>
                                        {user.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setShowSettingsDropdown(false)}>
                                                <FontAwesomeIcon icon={faChartLine} />
                                                <span>Admin Dashboard</span>
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="logout-btn">
                                            <FontAwesomeIcon icon={faSignOutAlt} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="login-btn">
                                <FontAwesomeIcon icon={faSignInAlt} />
                                <span>Login</span>
                            </Link>
                            <Link to="/register" className="register-btn">
                                <FontAwesomeIcon icon={faUserPlus} />
                                <span>Register</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 