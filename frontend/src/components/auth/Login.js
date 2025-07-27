import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faLock, 
    faLeaf,
    faEnvelope,
    faSeedling
} from '@fortawesome/free-solid-svg-icons';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <FontAwesomeIcon icon={faLeaf} className="auth-icon" />
                    <h2>Welcome to SAMS</h2>
                    <p>Smart Agriculture Management System</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">
                            <FontAwesomeIcon icon={faEnvelope} />
                            <span>Email</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <FontAwesomeIcon icon={faLock} />
                            <span>Password</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="auth-button"
                    >
                        <FontAwesomeIcon icon={faSeedling} />
                        <span>{loading ? 'Logging in...' : 'Login'}</span>
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Register</Link></p>
                    <Link to="/forgot-password" className="forgot-password">
                        Forgot Password?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login; 