import React, { useState } from 'react';
import './Testimonials.css';

const testimonialData = [
  {
    id: 1,
    rating: 5,
    text: "The Green Goddess smoothie has become my daily ritual. I've noticed a significant boost in my energy levels since I've started having it!",
    name: "Jane Doe",
    role: "Fitness Enthusiast",
    image: "/avatar1.jpg"
  },
  {
    id: 2,
    rating: 5,
    text: "As a fitness trainer, I recommend SlurpinSage to all my clients. Their protein-packed options are excellent!",
    name: "Mike Smith",
    role: "Personal Trainer",
    image: "/avatar2.jpg"
  },
  {
    id: 3,
    rating: 5,
    text: "I love that SlurpinSage uses all organic ingredients. My kids love the taste and I love knowing they're getting proper nutrition!",
    name: "Amy Johnson",
    role: "Mother of Two",
    image: "/avatar3.jpg"
  },
  {
    id: 4,
    rating: 5,
    text: "The mobile ordering app is so convenient, and the rewards program is generous. Best smoothie shop in town!",
    name: "Robert Lee",
    role: "Tech Professional",
    image: "/avatar4.jpg"
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonialData.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonialData.length - 1 ? 0 : prevIndex + 1
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i} className="star">★</span>);
    }
    return <div className="rating">{stars}</div>;
  };

  return (
    <section className="testimonial-section">
      <h2 className="testimonial-heading">Don't just take our word for it <span>Hear from our satisfied customers</span></h2>

      <div className="testimonial-carousel">
        <div className="testimonial-cards">
          {testimonialData.map((testimonial, index) => (
            <div 
              key={testimonial.id} 
              className={`testimonial-card ${currentIndex === index ? 'active' : ''}`}
            >
              {renderStars(testimonial.rating)}
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="author-image" 
                />
                <div className="author-info">
                  <p className="author-name">{testimonial.name}</p>
                  <p className="author-role">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="testimonial-nav">
          <button className="nav-button prev" onClick={handlePrevious}>❮</button>
          <button className="nav-button next" onClick={handleNext}>❯</button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
