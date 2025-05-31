import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scroll.css';

const slides = [
  {
    image: 'scroll.jpg',
    heading: 'Our Smoothies That Do More Than Just Taste Good',
    text: "At Slurp, our smoothies are more than just a tasty treat—they're a powerhouse of nutrition packed into every vibrant blend. Packed with real fruits and wholesome goodness, our smoothies are the perfect blend of flavor and fuel.",
  },
  {
    image: 'smooothies.png',
    heading: "Fuel Your Day With Nature's Best",
    text: "Enjoy pure, feel-good sips with no additives, just real ingredients. Whether you're starting your day or recovering post-workout, our smoothies are your best companion.",
  },
  {
    image: 'scrolll.png',
    heading: 'Healthy, Tasty, and Always Fresh',
    text: "Crafted with care and packed with fresh ingredients, our bowls nourish your body and delight your taste buds. Sip smart, live better.",
  }
];

export default function Scroll() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // change every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const { image, heading, text } = slides[currentSlide];

  const handleExploreClick = () => {
    navigate('/menu');
  };

  return (
    <div className="scroll-container">
      <div className="scroll-content">
        <img src={image} alt="Smoothie" className="smoothie-image" />
        <div className="text-section">
          <h2><span className="highlight">{heading}</span></h2>
          <p>{text}</p>
          <button className="explore-button" onClick={handleExploreClick}>
            Explore Our Menu
          </button>
        </div>
      </div>
    </div>
  );
}
