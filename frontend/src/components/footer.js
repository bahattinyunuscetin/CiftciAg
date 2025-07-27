import React, { useState } from 'react';
import './footer.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, 
  faEnvelope, 
  faLocationDot, 
  faComment,
  faPaperPlane,
  faLeaf,
  faSeedling,
  faTractor,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { 
  faFacebook, 
  faYoutube, 
  faTelegram 
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    
    // Simulate API call
    const submitFeedback = async () => {
      try {
        // Here you would typically make an API call
        // For now, we'll simulate a successful submission
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setNotification({
          show: true,
          type: 'success',
          message: 'Thank you for your feedback! We appreciate your input.'
        });
        
        setFeedbackMessage("");
      } catch (error) {
        setNotification({
          show: true,
          type: 'error',
          message: 'Sorry, there was an error submitting your feedback. Please try again.'
        });
      }
    };

    submitFeedback();
  };

  // Close notification after 5 seconds
  React.useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  return (
    <footer className="site-footer">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <FontAwesomeIcon 
            icon={notification.type === 'success' ? faCheckCircle : faTimesCircle} 
            className="notification-icon"
          />
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      <div className="footer-container">
        <div className="footer-info">
          <h3>
            <FontAwesomeIcon icon={faLeaf} style={{ marginRight: '8px' }} />
            Smart Agriculture
          </h3>
          <p><FontAwesomeIcon icon={faPhone} /> +94 112 618 498</p>
          <p><FontAwesomeIcon icon={faEnvelope} /> sams2025@gmail.com</p>
          <p><FontAwesomeIcon icon={faLocationDot} /> Department of Agriculture, Sri Lanka</p>
          
          <div className="quick-links">
            <a href="/chat">
              <FontAwesomeIcon icon={faComment} /> Live Support
            </a>
            <a href="/crops">
              <FontAwesomeIcon icon={faSeedling} /> Crop Guide
            </a>
            <a href="/equipment">
              <FontAwesomeIcon icon={faTractor} /> Equipment
            </a>
          </div>
          
          <div className="social-icons">
            <a href="https://www.facebook.com/groups/smartagriculture/" target="_blank" rel="noopener noreferrer" title="Facebook">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            <a href="https://www.youtube.com/channel/smartagriculture" target="_blank" rel="noopener noreferrer" title="YouTube">
              <FontAwesomeIcon icon={faYoutube} />
            </a>
            <a href="https://t.me/smartagriculturesl" target="_blank" rel="noopener noreferrer" title="Telegram">
              <FontAwesomeIcon icon={faTelegram} />
            </a>
          </div>
        </div>
        
        <div className="footer-feedback">
          <h3>
            <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '8px' }} />
            Share Your Thoughts
          </h3>
          <form onSubmit={handleSubmitFeedback}>
            <textarea 
              placeholder="Help us grow better! Share your feedback or suggestions..." 
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              required
            ></textarea>
            <button type="submit">
              <FontAwesomeIcon icon={faPaperPlane} /> Send Feedback
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="legal-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} Smart Agriculture Management System
        </div>
      </div>
    </footer>
  );
};

export default Footer;