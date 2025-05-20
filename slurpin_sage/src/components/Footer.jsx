import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-branding">
          <h3>SlurpinSage</h3>
          <p>Nourishing bodies and refreshing minds with nature's best ingredients since 2015.</p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-facebook"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-twitter"></i>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-pinterest"></i>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/menu">Menu</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Us</h4>
            <ul className="contact-info">
              <li><i className="fa fa-map-marker"></i> 123 Green Street, Healthy City, HC 12345</li>
              <li><i className="fa fa-phone"></i> (555) 123-4567</li>
              <li><i className="fa fa-envelope"></i> info@slurpinsage.com</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Hours</h4>
            <ul className="hours">
              <li>Monday - Friday: 7am - 8pm</li>
              <li>Saturday - Sunday: 8am - 7pm</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>We're committed to sustainability, health, and community. Our cups and straws are biodegradable.</p>
        <p>&copy; {new Date().getFullYear()} SlurpinSage. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
