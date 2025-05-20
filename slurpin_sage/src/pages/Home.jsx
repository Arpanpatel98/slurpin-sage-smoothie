import React from 'react';
import Hero from '../components/Hero';
import PopularItems from '../components/PopularItems';
import WhyChoose from '../components/WhyChoose';
import Testimonials from '../components/Testimonials';

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <PopularItems />
      <WhyChoose />
      <Testimonials />
    </div>
  );
};

export default Home; 