import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faTwitter, faPinterest } from '@fortawesome/free-brands-svg-icons';
import { faMapMarkerAlt, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
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
              <FontAwesomeIcon icon={faFacebookF} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faPinterest} />
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
              {/* <li><Link to="/signup">Sign Up</Link></li> */}
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Us</h4>
            <ul className="contact-info">
              <li>
                <FontAwesomeIcon icon={faMapMarkerAlt} />2081, 16C main 1st floor HAL 2nd stage Kodihalli, Indiranagar 560008
              </li>
              <li>
                <FontAwesomeIcon icon={faPhone} />  +91 8347459583
              </li>
              <li>
                <FontAwesomeIcon icon={faEnvelope} /> payal.patel@slurpinsage.com
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Hours</h4>
            <ul className="hours">
              <li>Monday - Friday: 7am - 8pm</li>
              <li>Saturday - Sunday: 8am - 7pm</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Terms and Conditions</h4>
            <ul>
              <li>
                <Link to="/terms" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link to="/cancellation-refund" target="_blank" rel="noopener noreferrer">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-delivery" target="_blank" rel="noopener noreferrer">
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>We're committed to sustainability, health, and community. Our cups and straws are biodegradable.</p>
        <p>© {new Date().getFullYear()} SlurpinSage. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;