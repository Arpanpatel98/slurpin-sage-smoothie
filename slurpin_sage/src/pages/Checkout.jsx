import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, total, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Format price to display as currency
  const formatPrice = (price) => {
    return `₹${price.toFixed(2)}`;
  };

  // Handle quantity change
  const handleQuantityChange = (id, newQuantity) => {
    updateQuantity(id, newQuantity);
  };

  // Handle place order button
  const handlePlaceOrder = () => {
    // In a real application, you would send the order to a backend
    setOrderPlaced(true);
    
    // Reset cart after successful order
    setTimeout(() => {
      clearCart();
      navigate('/');
    }, 3000);
  };

  // If cart is empty, show message
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-container empty-cart">
        <h1>Your cart is empty</h1>
        <button className="continue-shopping" onClick={() => navigate('/menu')}>
          Continue Shopping
        </button>
      </div>
    );
  }

  // If order is placed, show confirmation
  if (orderPlaced) {
    return (
      <div className="checkout-container order-confirmation">
        <h1>Thank you for your order!</h1>
        <p>Your order has been placed successfully.</p>
        <p>You will be redirected to the home page shortly...</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
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
            <div className="item-details">
              <h2>{item.name}</h2>
              <p>{item.ingredients}</p>
            </div>
            <div className="item-price">
              {formatPrice(item.price)}
            </div>
            <div className="quantity-controls">
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
              >
                -
              </button>
              <div className="quantity-display">{item.quantity}</div>
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <div className="item-total">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="order-summary">
        <div className="total">
          <h2>Total</h2>
          <h2>{formatPrice(total)}</h2>
        </div>
        <button 
          className="place-order-btn"
          onClick={handlePlaceOrder}
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default Checkout; 