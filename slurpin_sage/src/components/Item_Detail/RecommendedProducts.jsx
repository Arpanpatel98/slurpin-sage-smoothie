import React from 'react';
import './recommended-products copy.css';

function RecommendedProducts() {
  const products = [
    {
      name: 'Berry Blast',
      description: 'Strawberry, blueberry, raspberry, yogurt, and honey blended with almond milk.',
      price: '$8.49',
      bgColor: '#b8d3b8',
      svgColor: '#b8d3b8'
    },
    {
      name: 'Green Goddess',
      description: 'Spinach, kale, banana, mango, and chia seeds blended with coconut water.',
      price: '$7.99',
      bgColor: '#8aba8a',
      svgColor: '#8aba8a'
    },
    {
      name: 'Tropical Paradise',
      description: 'Pineapple, mango, coconut milk, and banana for a tropical getaway.',
      price: '$ вздох7.99',
      bgColor: '#dce7dc',
      svgColor: '#dce7dc'
    }
  ];

  return (
    <section className="recommended-products_Item_des">
      <div className="container_Item_des">
        <h2 className="section-title_Item_des">You May Also Like</h2>
        <div className="products-grid_Item_des">
          {products.map((product, i) => (
            <div key={i} className="product-card_Item_des">
              <div className="product-image_Item_des" style={{ backgroundColor: product.bgColor }}>
                <svg className="product-svg_Item_des" viewBox="0 0 200 200" fill="currentColor">
                  <path d="M140,60H60c-5.52,0-10,4.48-10,10v60c0,5.52,4.48,10,10,10h80c5.52,0,10-4.48,10-10V70C150,64.48,145.52,60,140,60z" fill={product.svgColor}></path>
                  <path d="M120,80H80c-2.76,0-5,2.24-5,5v30c0,2.76,2.24,5,5,5h40c2.76,0,5-2.24,5-5V85C125,82.24,122.76,80,120,80z" fill={i === 0 ? '#8aba8a' : i === 1 ? '#4d9e4d' : '#b8d3b8'}></path>
                  <path d="M100,50L100,50c-2.76,0-5,2.24-5,5v10h10V55C105,52.24,102.76,50,100,50z" fill={i === 0 ? '#4d9e4d' : i === 1 ? '#3c7d3c' : '#8aba8a'}></path>
                  <path d="M115,50L115,50c-2.76,0-5,2.24-5,5v10h10V55C120,52.24,117.76,50,115,50z" fill={i === 0 ? '#4d9e4d' : i === 1 ? '#3c7d3c' : '#8aba8a'}></path>
                  <path d="M85,50L85,50c-2.76,0-5,2.24-5,5v10h10V55C90,52.24,87.76,50,85,50z" fill={i === 0 ? '#4d9e4d' : i === 1 ? '#3c7d3c' : '#8aba8a'}></path>
                </svg>
              </div>
              <div className="product-details_Item_des">
                <h3 className="product-title_Item_des">{product.name}</h3>
                <p className="product-description_Item_des">{product.description}</p>
                <div className="product-footer_Item_des">
                  <span className="product-price_Item_des">{product.price}</span>
                  <button className="view-button_Item_des">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RecommendedProducts;