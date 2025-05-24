import React from 'react';
import { useCart } from '../../context/CartContext';

const RecommendedProduct = ({ product }) => {
  const { setShowCustomization } = useCart();

  return (
    <div className="product_recommendedproduct">
      <div className={`image_container_recommendedproduct gradient_${product.gradient}_recommendedproduct`}>
        <div className="icon_container_recommendedproduct">
          <svg className="icon_recommendedproduct" viewBox="0 0 24 24" fill="none">
            <path d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.34998 9.6499V11.3499C4.34998 15.5699 7.77998 18.9999 12 18.9999C16.22 18.9999 19.65 15.5699 19.65 11.3499V9.6499" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className="details_recommendedproduct">
        <div className="header_recommendedproduct">
          <h4 className="name_recommendedproduct">{product.name}</h4>
          <span className="price_recommendedproduct">₹{product.price}</span>
        </div>
        <p className="description_recommendedproduct">{product.description}</p>
        <button
          className="add_button_recommendedproduct"
          onClick={() => setShowCustomization({ product, mode: 'add' })}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default RecommendedProduct;