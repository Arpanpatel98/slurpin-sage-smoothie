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
    
    if (heroContent) heroContent.classList.add('animate-fade-in-left');
    if (heroImage) heroImage.classList.add('animate-fade-in-right');
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="animate-title">Fresh & Healthy <span>Smoothies</span></h1>
        <p className="animate-text">Discover our delicious range of smoothies made from 100% organic ingredients. Nourish your body with vitamins, minerals, and antioxidants that boost your energy and support your health goals.</p>
        <div className="hero-buttons">
          <button className="order-btn primary pulse-animation" onClick={handleOrderClick}>Order Now</button>
          <button className="learn-btn secondary" onClick={() => navigate('/about')}>Learn More</button>
        </div>
      </div>
      <div className="hero-image">
        <img src="/hero-image.png" alt="Delicious Smoothies" className="floating-animation" />
      </div>
    </section>
  );
};

export default Hero;