// Hero.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();

  const handleOrderClick = () => {
    navigate('/menu');
  };

  useEffect(() => {
    // Add animation classes after component mounts
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');
    const heroBackground = document.querySelector('.hero-background');
    
    if (heroContent) heroContent.classList.add('animate-fade-in-left');
    if (heroImage) heroImage.classList.add('animate-fade-in-right');
    if (heroBackground) heroBackground.classList.add('animate-fade-in');
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-overlay"></div>
        <div className="shape-divider">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>
      <div className="floating-elements">
        <img src="/leaf-icon.jpeg" alt="" className="float-element leaf-1" />
        <img src="/leaf-icon.jpeg" alt="" className="float-element leaf-2" />
        <img src="/leaf-icon.jpeg" alt="" className="float-element leaf-3" />
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span>100% Organic Ingredients</span>
            <div className="badge-shine"></div>
          </div>
          <h1 className="animate-title">
            <span className="title-line">Refresh Your Day</span>
            <span className="gradient-text">With Nature's</span>
            <span className="highlight-text">Best Smoothies</span>
          </h1>
          <div className="hero-buttons">
          <button className="order-btn primary" onClick={handleOrderClick}>
            <span className="btn-text">Explore Menu</span>
            <span className="btn-icon">→</span>
            <div className="btn-shine"></div>
          </button>
          <button className="learn-btn secondary" onClick={() => navigate('/about')}>
            <span>Learn More</span>
            <div className="btn-outline"></div>
          </button>
        </div>
        </div>
        <div className="hero-image">
          <div className="image-container">
            <div className="image-wrapper">
              <img src="/smooothies.png" alt="Fresh Smoothies" className="main-image floating-animation" />
              <div className="image-shine"></div>
            </div>
            <div className="image-decorations">
              <div className="decoration-circle circle-1"></div>
              <div className="decoration-circle circle-2"></div>
              <div className="decoration-circle circle-3"></div>
              <div className="sparkle sparkle-1"></div>
              <div className="sparkle sparkle-2"></div>
              <div className="sparkle sparkle-3"></div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;