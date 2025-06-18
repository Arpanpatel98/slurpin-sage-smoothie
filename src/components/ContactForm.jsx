import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import LoginSignupPage from './auth/LoginSignupPage';
import './ContactForm.css';

const ContactForm = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    newsletter: false
  });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        // Pre-fill email if user is logged in
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (name === 'phone') setPhoneError('');
  };

  // Indian phone validation: 10 digits, starts with 6-9
  const isValidIndianPhone = (phone) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!isValidIndianPhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian phone number starting with 6-9.');
      return;
    }

    setLoading(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const contactData = {
        ...formData,
        subject,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'new'
      };

      await addDoc(collection(db, 'contacts'), contactData);

      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your message! We will get back to you soon.'
      });

      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: '',
        newsletter: false
      });
      setSubject('');
      setPhoneError('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit form. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setSubmitStatus({
      type: 'success',
      message: 'Successfully logged in! You can now submit the form.'
    });
  };

  return (
    <div className="contact-page_contact">
      {/* Header Section */}
      <div className="contact-header_contact">
        <h1>Get In Touch</h1>
        <p>We'd love to hear from you! Reach out with questions, feedback, or just to say hello.</p>
      </div>

      {/* Contact Cards Section */}
      <div className="contact-cards-container_contact">
        <div className="contact-card_contact">
          <div className="contact-icon_contact">
            <i className="fas fa-phone"></i>
          </div>
          <h3>Call Us</h3>
          <p>Our friendly team is here to help</p>
          <a href="tel:+918347459583">+91 83474 59583</a>
        </div>

        <div className="contact-card_contact">
          <div className="contact-icon_contact">
            <i className="fas fa-envelope"></i>
          </div>
          <h3>Email Us</h3>
          <p>We'll respond as soon as possible</p>
          <a href="mailto:payal.patel@slurpinsage.com">payal.patel@slurpinsage.com</a>
        </div>

        <div className="contact-card_contact">
          <div className="contact-icon_contact">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3>Visit Us</h3>
          <p>Come say hello at our store</p>
          <address>2081, 16C main 1st floor HAL 2nd stage Kodihalli, Indiranagar 560008</address>
        </div>
      </div>

      {/* Message and Location Section */}
      <div className="contact-content-container_contact">
        {/* Message Form Section */}
        <div className="message-section_contact">
          <h2>Send Us a Message</h2>
          <p>Have a question about our smoothies, ingredients, or locations? Fill out the form below and we'll get back to you as soon as possible.</p>
          
          {submitStatus.message && (
            <div className={`submit-status_contact ${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}

          {!user && (
            <div className="login-notice_contact">
              Please login or signup to submit the form.
              <button 
                className="login-btn_contact"
                onClick={() => setShowLoginModal(true)}
              >
                Login / Signup
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="contact-form_contact">
            <div className="form-row_contact">
              <div className="form-group_contact">
                <label htmlFor="firstName">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  name="firstName"
                  placeholder="Your first name" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group_contact">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  name="lastName"
                  placeholder="Your last name" 
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group_contact">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                placeholder="your.email@example.com" 
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading || user}
              />
            </div>

            <div className="form-group_contact">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone"
                placeholder="9876543210" 
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[6-9]{1}[0-9]{9}"
                maxLength={10}
                disabled={loading}
              />
              {phoneError && <div className="form-error_contact">{phoneError}</div>}
            </div>

            <div className="form-group_contact">
              <label htmlFor="subject">Subject</label>
              <div className="custom-select_contact">
                <select 
                  id="subject" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="" disabled>Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Question</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group_contact">
              <label htmlFor="message">Message</label>
              <textarea 
                id="message" 
                name="message"
                placeholder="How can we help you?" 
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={loading}
              ></textarea>
            </div>

            <div className="form-group_contact checkbox-group_contact">
              <input 
                type="checkbox" 
                id="newsletter" 
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="newsletter">Subscribe to our newsletter for updates on new flavors and promotions</label>
            </div>

            <button 
              type="submit" 
              className="send-message-btn_contact"
              disabled={loading || !user}
            >
              {loading ? 'Sending...' : 'Send Message'}
              {!loading && <i className="fas fa-arrow-right"></i>}
            </button>
          </form>
        </div>

        {/* Location Section */}
        <div className="location-section_contact">
          <h2>Find Us</h2>
          <p>Visit our flagship store in downtown Healthyville. We're open 7 days a week from 7am to 8pm.</p>
          
          <div className="store-details_contact">
            <h3>SlurpinSage - Flagship Store</h3>
            <address>123 Green Street, Healthyville, CA 92210</address>
            
            <div className="store-hours_contact">
              <h4>Hours:</h4>
              <ul>payal.patel@slurpinsage.com
                <li><span>Monday - Friday:</span> 7am - 8pm</li>
                <li><span>Saturday:</span> 8am - 8pm</li>
                <li><span>Sunday:</span> 9am - 6pm</li>
              </ul>
            </div>
            
            <div className="store-contact_contact">
              <h4>Contact:</h4>
              <p><span>Phone:</span> +91 98765 43210</p>
              <p><span>Email:</span> <a href="mailto:payal.patel@slurpinsage.com">payal.patel@slurpinsage.com</a></p>
            </div>
            
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="directions-btn_contact">
              <i className="fas fa-directions"></i> Get Directions
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section_contact">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-container_contact">
          <details className="faq-item_contact">
            <summary>Do you offer catering services?</summary>
            <div className="faq-content_contact">
              <p>Yes, we offer catering for events of all sizes. Please contact us at least 48 hours in advance to discuss your needs and place an order.</p>
            </div>
          </details>
          
          <details className="faq-item_contact">
            <summary>Can I customize my smoothie?</summary>
            <div className="faq-content_contact">
              <p>Absolutely! You can customize any of our smoothies with additional ingredients or substitutions. Just let us know your preferences when ordering.</p>
            </div>
          </details>
          
          <details className="faq-item_contact">
            <summary>Do you have options for dietary restrictions?</summary>
            <div className="faq-content_contact">
              <p>We offer a variety of options for different dietary needs including vegan, gluten-free, dairy-free, and low-sugar options. Our staff can help you find the perfect smoothie for your dietary requirements.</p>
            </div>
          </details>
          
          <details className="faq-item_contact">
            <summary>How can I join your rewards program?</summary>
            <div className="faq-content_contact">
              <p>You can join our rewards program by downloading our mobile app or signing up in-store. You'll earn points with every purchase that can be redeemed for free smoothies and exclusive offers.</p>
            </div>
          </details>
          
          <details className="faq-item_contact">
            <summary>Are you hiring?</summary>
            <div className="faq-content_contact">
              <p>We're always looking for passionate team members! Check our Careers page for current openings or drop by the store with your resume.</p>
            </div>
          </details>
        </div>
        
        <div className="extra-help_contact">
          <p>Don't see your question here?</p>
          <button className="ask-directly-btn_contact">
            Ask Us Directly <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close_loginSignup" onClick={() => setShowLoginModal(false)}>×</button>
            <LoginSignupPage onSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactForm;
