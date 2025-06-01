import React from 'react';
import './WhyChoose.css';

function WhyChoose() {
  return (
    <section className="why-choose-section">
      <div className="section-header">
        <h2>Why Choose SlurpinSage</h2>
        
        <p className="subtitle">
          We're committed to providing delicious, nutritious options that fuel your body and please your taste buds.
        </p>
      </div>
      
      <div className="cards-container">
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-leaf"></i>
          </div>
          <h3>100% Organic</h3>
          <p>We source only the freshest, organic ingredients from local farms to ensure maximum nutrition and flavor.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-apple-alt"></i>
          </div>
          <h3>Nutrient Rich</h3>
          <p>Each item on our menu is carefully crafted to provide a balance of vitamins, minerals, and antioxidants.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-heart"></i>
          </div>
          <h3>Health Focused</h3>
          <p>Our recipes are designed to support your wellness journey, whether you're detoxing, boosting immunity, or recovering.</p>
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;
