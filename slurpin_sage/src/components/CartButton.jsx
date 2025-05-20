import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartButton.css';

const CartButton = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  return (
    <button 
      className="cart-button" 
      onClick={() => navigate('/checkout')}
      aria-label="Shopping cart"
    >
      <i className="fas fa-shopping-cart"></i>
      {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
    </button>
  );
};

export default CartButton; 