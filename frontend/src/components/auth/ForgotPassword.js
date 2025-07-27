import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEnvelope,
    faArrowLeft,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');
            setLoading(true);
            
            // TODO: Implement password reset email sending logic here
            // This would typically involve calling your backend API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
            
            setSuccess('Password reset link has been sent to your email');
            setEmail('');
        } catch (err) {
            setError('Failed to send reset link. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive a password reset link</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

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
                            placeholder="Enter your email address"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="auth-button"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                        <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login" className="back-to-login">
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Back to Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 