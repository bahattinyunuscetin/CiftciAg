import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faLock, 
    faLeaf,
    faEnvelope,
    faUserPlus,
    faIdCard,
    faBriefcase,
    faBuilding
} from '@fortawesome/free-solid-svg-icons';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'farmer',
        nic: '',
        designation: '',
        company: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await register(formData);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create an account. Please try again.');
        }
        setLoading(false);
    };

    // Check if expert role is selected
    const isExpert = formData.role === 'expert';

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <FontAwesomeIcon icon={faLeaf} className="auth-icon" />
                    <h2>Join SAMS</h2>
                    <p>Smart Agriculture Management System</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">
                            <FontAwesomeIcon icon={faUser} />
                            <span>Username</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Choose a username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            <FontAwesomeIcon icon={faEnvelope} />
                            <span>Email</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="nic">
                            <FontAwesomeIcon icon={faIdCard} />
                            <span>NIC (National Identity Card)</span>
                        </label>
                        <input
                            type="text"
                            id="nic"
                            name="nic"
                            value={formData.nic}
                            onChange={handleChange}
                            required
                            placeholder="Enter your NIC number"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">
                            <FontAwesomeIcon icon={faUser} />
                            <span>Role</span>
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="form-select"
                        >
                            <option value="farmer">Farmer</option>
                            <option value="expert">Agricultural Expert</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    {isExpert && (
                        <>
                            <div className="form-group">
                                <label htmlFor="designation">
                                    <FontAwesomeIcon icon={faBriefcase} />
                                    <span>Designation</span>
                                </label>
                                <input
                                    type="text"
                                    id="designation"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    required={isExpert}
                                    placeholder="Enter your designation"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="company">
                                    <FontAwesomeIcon icon={faBuilding} />
                                    <span>Company</span>
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    required={isExpert}
                                    placeholder="Enter your company name"
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="password">
                            <FontAwesomeIcon icon={faLock} />
                            <span>Password</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            <FontAwesomeIcon icon={faLock} />
                            <span>Confirm Password</span>
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="auth-button"
                    >
                        <FontAwesomeIcon icon={faUserPlus} />
                        <span>{loading ? 'Creating Account...' : 'Register'}</span>
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register; 