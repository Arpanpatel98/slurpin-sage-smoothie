import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import SuccessPopup from "./SuccessPopup";
import useAuth from "./useAuth";
import "./loginsignup.css";

const LoginSignupPage = ({ onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
  };

  const handlePopupClose = () => {
    setShowSuccessPopup(false);
    if (onClose) {
      onClose();
    }
    navigate('/');
  };

  return (
    <div className="auth-container">
      <SuccessPopup
        isOpen={showSuccessPopup}
        message={successMessage}
        onClose={handlePopupClose}
      />
      <div id="recaptcha-container"></div>
      <div className={`auth-box ${isMobile ? 'mobile-view' : ''}`}>
        <div className="auth-left">
          {/* <div className="blob blob-1">
            <svg viewBox="0 0 200 200" width="600" height="600">
              <path fill="#ff00ff" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.4,-45.8C87,-32.5,89.2,-16.3,88.4,-0.7C87.6,14.9,83.8,29.7,76.2,42.2C68.6,54.7,57.2,64.9,43.8,71.2C30.4,77.5,15.2,79.9,0.7,78.8C-13.8,77.7,-27.6,73.1,-40.2,66.2C-52.8,59.3,-64.2,50.1,-72.1,37.8C-80,25.5,-84.4,10.2,-83.2,-4.4C-82,-19,-75.2,-32.9,-65.8,-43.5C-56.4,-54.1,-44.4,-61.4,-31.8,-67.8C-19.2,-74.2,-6,-79.7,5.7,-77.8C17.4,-75.9,34.8,-66.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className="blob blob-2">
            <svg viewBox="0 0 200 200" width="600" height="600">
              <path fill="#ff00ff" d="M39.9,-65.7C54.1,-60.0,69.5,-53.8,77.8,-42.8C86.1,-31.8,87.3,-16,85.8,-1.2C84.3,13.6,80.1,27.2,72.4,38.4C64.7,49.6,53.5,58.4,40.8,64.2C28.1,70,14.1,72.8,-0.7,73.9C-15.5,75,-31,74.4,-44.2,68.8C-57.4,63.2,-68.3,52.6,-75.2,39.4C-82.1,26.2,-85,10.4,-83.6,-4.8C-82.2,-20,-76.5,-34.6,-67.2,-46.2C-57.9,-57.8,-45,-66.4,-31.4,-71.4C-17.8,-76.4,-3.6,-77.8,9.2,-74.8C22,-71.8,44,-64.4,39.9,-65.7Z" transform="translate(100 100)" />
            </svg>
          </div> */}
          <div className="brand-container">
            <div className="brand-header">
              <svg className="brand-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7,3C5.9,3,5,3.9,5,5v1h14V5c0-1.1-0.9-2-2-2H7z M5,8v12c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V8H5z M9,10h2v8H9V10z M13,10h2v8h-2V10z" />
              </svg>
              <span className="brand-name">SlurpinSage</span>
            </div>
            <h1 className="brand-title">Welcome Back!</h1>
            <p className="brand-subtitle">
              Sign in to access your account and enjoy our healthy, delicious smoothies.
            </p>
            <div className="smoothie-animation">
              <svg className="float" width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M280 120H120L100 350H300L280 120Z" fill="white" stroke="#244326" strokeWidth="8"></path>
                <path d="M120 160L130 310H270L280 160H120Z" fill="#92ca94"></path>
                <circle cx="160" cy="210" r="15" fill="#FF6B6B" className="pulse"></circle>
                <circle cx="220" cy="240" r="12" fill="#FFD166" className="pulse delay-300"></circle>
                <circle cx="190" cy="280" r="18" fill="#FF6B6B" className="pulse delay-100"></circle>
                <circle cx="230" cy="190" r="10" fill="#FFD166" className="pulse delay-200"></circle>
                <path d="M110 120C110 114.477 114.477 110 120 110H280C285.523 110 290 114.477 290 120V130H110V120Z" fill="#244326"></path>
                <path d="M200 70V130" stroke="#244326" strokeWidth="12" strokeLinecap="round"></path>
                <path d="M200 70C200 70 180 50 200 30C220 10 240 30 240 30" stroke="#244326" strokeWidth="12" strokeLinecap="round"></path>
                <circle cx="150" cy="200" r="5" fill="white" opacity="0.6" className="pulse delay-400"></circle>
                <circle cx="210" cy="220" r="4" fill="white" opacity="0.6" className="pulse delay-200"></circle>
                <circle cx="180" cy="260" r="6" fill="white" opacity="0.6" className="pulse delay-300"></circle>
                <circle cx="240" cy="190" r="3" fill="white" opacity="0.6" className="pulse delay-500"></circle>
              </svg>
            </div>
            <div className="account-prompt">
              <p className="prompt-sub">New to SlurpinSage?</p>
              <p className="prompt-bold">Create an account to start your healthy journey!</p>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-tabs">
          <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
          <button
              className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
            
            
          </div>
          {activeTab === "login" ? (
            <LoginForm setSuccessMessage={handleSuccess} setShowSuccessPopup={setShowSuccessPopup} />
          ) : (
            <SignupForm setSuccessMessage={handleSuccess} setShowSuccessPopup={setShowSuccessPopup} />
          )}
          <div className="back-home" onClick={handlePopupClose}>← Back to Home</div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignupPage;