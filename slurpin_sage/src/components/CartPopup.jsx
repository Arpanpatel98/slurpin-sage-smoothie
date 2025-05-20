import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPopup.css';

const CartPopup = ({ item, onClose }) => {
  const navigate = useNavigate();
  const { updateQuantity, removeFromCart, cartItems } = useCart();
  const [quantity, setQuantity] = useState(item ? (item.quantity || 1) : 1);
  const [animateQuantity, setAnimateQuantity] = useState(false);

  // Return early if no item provided
  if (!item) {
    return null;
  }

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    updateQuantity(item.id, newQuantity);
    setAnimateQuantity(true);
    setTimeout(() => setAnimateQuantity(false), 300);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      updateQuantity(item.id, newQuantity);
      setAnimateQuantity(true);
      setTimeout(() => setAnimateQuantity(false), 300);
    } else {
      removeFromCart(item.id);
      onClose();
    }
  };

  const handleViewCart = () => {
    navigate('/checkout');
    onClose();
  };

  const handleContinueShopping = () => {
    onClose();
  };

  // Calculate cart item count
  const cartItemCount = cartItems ? cartItems.reduce((count, item) => count + item.quantity, 0) : 0;
  
  // Calculate subtotal for this item
  const itemSubtotal = item.price * quantity;

  return (
    <div className="cart-popup-overlay" onClick={onClose}>
      <div className="cart-popup" onClick={(e) => e.stopPropagation()}>
        <div className="cart-popup-header">
          <h3>Added to Cart</h3>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        
        <div className="cart-popup-content">
          <div className="item-image-container">
            <div className="item-image">
              <img 
                src={`/${item.image || "greensmoothie.jpg"}`} 
                alt={item.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/greensmoothie.jpg";
                }}
              />
            </div>
          </div>
          
          <div className="item-details">
            <h4>{item.name}</h4>
            <p className="item-variant">{item.size || 'Regular'} {item.type ? `/ ${item.type}` : ''}</p>
            <p className="item-price">₹{item.price.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="quantity-section">
          <p>Quantity</p>
          <div className="quantity-control">
            <button 
              className="qty-btn" 
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className={`qty-value ${animateQuantity ? 'animate' : ''}`}>{quantity}</span>
            <button 
              className="qty-btn" 
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="total-section">
          <span>Total</span>
          <span className="total-value">₹{itemSubtotal.toFixed(2)}</span>
        </div>
        
        <div className="cart-popup-actions">
          <button 
            className="view-cart-btn" 
            onClick={handleViewCart}
          >
            View Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
          </button>
          <button 
            className="continue-shopping-btn" 
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPopup; 