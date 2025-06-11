import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartButton.css';

const CartButton = ({ onCartClick }) => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
    navigate('/Cart');
  };
  
  return (
    <button 
      className="cart-button" 
      onClick={handleCartClick}
      aria-label="Shopping cart"
    >
      <i className="fas fa-shopping-cart" style={{ color: 'white' }}></i>
      {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
    </button>
  );
};

export default CartButton; 