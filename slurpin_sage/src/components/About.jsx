import React, { useEffect } from 'react';
import './About.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
// Import background images
import heroBg from '../assets/hero-bg.jpg';
import valuesBg from '../assets/values-bg.jpg';
import parallaxBg from '../assets/parallax-bg.jpg';

function About() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: 'ease-in-out',
      anchorPlacement: 'top-bottom'
    });
  }, []);

  // Use inline styles with imported images as fallback
  const heroStyle = {
    backgroundImage: `linear-gradient(rgba(82, 171, 90, 0.9), rgba(82, 171, 90, 0.9)), url(${heroBg})`
  };

  const valuesStyle = {
    backgroundImage: `linear-gradient(rgba(249, 249, 249, 0.97), rgba(249, 249, 249, 0.97)), url(${valuesBg})`
  };

  const parallaxStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${parallaxBg})`
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero" style={heroStyle} data-aos="fade-in">
        <div className="about-hero-content">
          <h1 data-aos="fade-up">Our Story</h1>
          <p data-aos="fade-up" data-aos-delay="200">Nourishing bodies and minds with nature's best ingredients since 2015.</p>
          <button className="learn-more-btn" data-aos="fade-up" data-aos-delay="300">Learn More</button>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="mission-text" data-aos="fade-right" data-aos-duration="1200">
          <h2>Our Mission</h2>
          <p>
            At Slurpin'Sage, we believe that what you put into your body matters. Our mission is to 
            create nutrition-packed, accessible, and convenient for everyone. We're committed to 
            sustainable practices and conscious sourcing. We've created a space that is not only 
            taste-tempting but also fuels your body with the nutrients it needs.
          </p>
          <p>
            Every smoothie we craft is a testament to our dedication to health, wellness, and 
            sustainability. We're not just selling drinks – we're promoting a lifestyle that values both 
            personal health and the health of our planet.
          </p>
        </div>
        <div className="mission-graphic" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="200">
          <div className="circular-graphic">
            <div className="inner-content">
              <h3>Nourish. Energize. Thrive.</h3>
              <p>Our guiding principles in every smoothie we create.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="core-values-section" style={valuesStyle}>
        <h2 data-aos="fade-up">Our Core Values</h2>
        <div className="values-container">
          <div className="value-card" data-aos="flip-up" data-aos-delay="100" data-aos-duration="1000">
            <div className="value-icon health-icon"></div>
            <h3>Health First</h3>
            <p>We prioritize your well-being by using only the freshest and nutritious ingredients in every smoothie we create.</p>
          </div>

          <div className="value-card" data-aos="flip-up" data-aos-delay="200" data-aos-duration="1000">
            <div className="value-icon sustainability-icon"></div>
            <h3>Sustainability</h3>
            <p>From compostable cups to eco-friendly farms, we're committed to making choices that protect our planet.</p>
          </div>

          <div className="value-card" data-aos="flip-up" data-aos-delay="300" data-aos-duration="1000">
            <div className="value-icon community-icon"></div>
            <h3>Community</h3>
            <p>We believe in building strong relationships with our customers while supporting the communities we serve.</p>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div className="journey-section">
        <h2 data-aos="fade-up">Our Journey</h2>
        <div className="timeline">
          <div className="timeline-item" data-aos="fade-right" data-aos-duration="1200">
            <div className="timeline-content">
              <h3>2021</h3>
              <p>Partnered with local farmers to source 80% of our ingredients locally and launched our community nutrition program.</p>
            </div>
          </div>

          <div className="timeline-item" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="300">
            <div className="timeline-content">
              <h3>Today</h3>
              <p>With 12 locations across the region, we continue to grow and expand while staying true to our core mission.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section with emoji avatars */}
      <div className="team-section">
        <h2 data-aos="fade-up">Meet Our Team</h2>
        <div className="team-container">
          <div className="team-member" data-aos="zoom-in" data-aos-delay="100">
            <div className="member-photo team-photo-1"></div>
            <h3>Sarah Johnson</h3>
            <p>Founder & CEO</p>
          </div>

          <div className="team-member" data-aos="zoom-in" data-aos-delay="200">
            <div className="member-photo team-photo-2"></div>
            <h3>Michael Chen</h3>
            <p>Head Chef</p>
          </div>

          <div className="team-member" data-aos="zoom-in" data-aos-delay="300">
            <div className="member-photo team-photo-3"></div>
            <h3>Emily Rodriguez</h3>
            <p>Nutritionist</p>
          </div>

          <div className="team-member" data-aos="zoom-in" data-aos-delay="400">
            <div className="member-photo team-photo-4"></div>
            <h3>David Thompson</h3>
            <p>Operations Manager</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="about-testimonials">
        <h2 data-aos="fade-up">What Our Customers Say</h2>
        <div className="testimonials-container">
          <div className="testimonial" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
            <div className="quote-mark">"</div>
            <p>Slurpin'Sage has completely transformed my morning routine. Their Green Goddess smoothie gives me the energy I need to power through the day, and I love knowing I'm putting something so healthy into my body!</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar avatar-1"></div>
              <span>Jessica M.</span>
            </div>
          </div>

          <div className="testimonial" data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000">
            <div className="quote-mark">"</div>
            <p>As an athlete, nutrition is crucial for my performance. Slurpin'Sage's protein-loaded smoothies have become an essential part of my training regimen. The flavors are amazing too!</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar avatar-2"></div>
              <span>Marcus T.</span>
            </div>
          </div>

          <div className="testimonial" data-aos="fade-up" data-aos-delay="300" data-aos-duration="1000">
            <div className="quote-mark">"</div>
            <p>I appreciate Slurpin'Sage's commitment to sustainability. From their compostable cups to their support of local farmers, they're making a positive impact on the environment while serving delicious smoothies!</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar avatar-3"></div>
              <span>Aiden K.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Image Parallax Section */}
      <div className="parallax-section" style={parallaxStyle}>
        <div className="parallax-content" data-aos="fade-up">
          <h2>Join Our Smoothie Revolution</h2>
          <p>Experience the perfect blend of taste, nutrition and sustainability</p>
          <button className="primary-btn">Visit Us Today</button>
        </div>
      </div>
    </div>
  );
}

export default About; 