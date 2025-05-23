import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './ContactForm.css';

const ContactForm = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
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
      setSubmitStatus({
        type: 'error',
        message: 'Please login or signup to submit the form'
      });
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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

  return (
    <div className="contact-page">
      {/* Header Section */}
      <div className="contact-header">
        <h1>Get In Touch</h1>
        <p>We'd love to hear from you! Reach out with questions, feedback, or just to say hello.</p>
      </div>

      {/* Contact Cards Section */}
      <div className="contact-cards-container">
        <div className="contact-card">
          <div className="contact-icon">
            <i className="fas fa-phone"></i>
          </div>
          <h3>Call Us</h3>
          <p>Our friendly team is here to help</p>
          <a href="tel:+919876543210">+91 98765 43210</a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <h3>Email Us</h3>
          <p>We'll respond as soon as possible</p>
          <a href="mailto:hello@slurpinsage.com">hello@slurpinsage.com</a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3>Visit Us</h3>
          <p>Come say hello at our store</p>
          <address>123 Green Street, Healthyville, CA 92210</address>
        </div>
      </div>

      {/* Message and Location Section */}
      <div className="contact-content-container">
        {/* Message Form Section */}
        <div className="message-section">
          <h2>Send Us a Message</h2>
          <p>Have a question about our smoothies, ingredients, or locations? Fill out the form below and we'll get back to you as soon as possible.</p>
          
          {submitStatus.message && (
            <div className={`submit-status ${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}

          {!user && (
            <div className="login-notice">
              Please <a href="/login">login</a> or <a href="/signup">signup</a> to submit the form.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
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
              <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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
              {phoneError && <div className="form-error">{phoneError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <div className="custom-select">
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

            <div className="form-group">
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

            <div className="form-group checkbox-group">
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
              className="send-message-btn"
              disabled={loading || !user}
            >
              {loading ? 'Sending...' : 'Send Message'}
              {!loading && <i className="fas fa-arrow-right"></i>}
            </button>
          </form>
        </div>

        {/* Location Section */}
        <div className="location-section">
          <h2>Find Us</h2>
          <p>Visit our flagship store in downtown Healthyville. We're open 7 days a week from 7am to 8pm.</p>
          
          <div className="store-details">
            <h3>SlurpinSage - Flagship Store</h3>
            <address>123 Green Street, Healthyville, CA 92210</address>
            
            <div className="store-hours">
              <h4>Hours:</h4>
              <ul>
                <li><span>Monday - Friday:</span> 7am - 8pm</li>
                <li><span>Saturday:</span> 8am - 8pm</li>
                <li><span>Sunday:</span> 9am - 6pm</li>
              </ul>
            </div>
            
            <div className="store-contact">
              <h4>Contact:</h4>
              <p><span>Phone:</span> +91 98765 43210</p>
              <p><span>Email:</span> <a href="mailto:flagship@slurpinsage.com">flagship@slurpinsage.com</a></p>
            </div>
            
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="directions-btn">
              <i className="fas fa-directions"></i> Get Directions
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-container">
          <details className="faq-item">
            <summary>Do you offer catering services?</summary>
            <div className="faq-content">
              <p>Yes, we offer catering for events of all sizes. Please contact us at least 48 hours in advance to discuss your needs and place an order.</p>
            </div>
          </details>
          
          <details className="faq-item">
            <summary>Can I customize my smoothie?</summary>
            <div className="faq-content">
              <p>Absolutely! You can customize any of our smoothies with additional ingredients or substitutions. Just let us know your preferences when ordering.</p>
            </div>
          </details>
          
          <details className="faq-item">
            <summary>Do you have options for dietary restrictions?</summary>
            <div className="faq-content">
              <p>We offer a variety of options for different dietary needs including vegan, gluten-free, dairy-free, and low-sugar options. Our staff can help you find the perfect smoothie for your dietary requirements.</p>
            </div>
          </details>
          
          <details className="faq-item">
            <summary>How can I join your rewards program?</summary>
            <div className="faq-content">
              <p>You can join our rewards program by downloading our mobile app or signing up in-store. You'll earn points with every purchase that can be redeemed for free smoothies and exclusive offers.</p>
            </div>
          </details>
          
          <details className="faq-item">
            <summary>Are you hiring?</summary>
            <div className="faq-content">
              <p>We're always looking for passionate team members! Check our Careers page for current openings or drop by the store with your resume.</p>
            </div>
          </details>
        </div>
        
        <div className="extra-help">
          <p>Don't see your question here?</p>
          <button className="ask-directly-btn">
            Ask Us Directly <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
