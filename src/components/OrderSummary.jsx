import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './OrderSummary.css';

const OrderSummary = () => {
  const { cart, total, applyPromoCode, promoCode, promoError, discount, clearCart } = useContext(CartContext);
  const [promoInput, setPromoInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const navigate = useNavigate();

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    
    setIsApplying(true);
    try {
      await applyPromoCode(promoInput);
      setPromoInput('');
    } catch (error) {
      console.error('Error applying promo code:', error);
    } finally {
      setIsApplying(false);
    }
  };
  

  const handleCheckout = () => {
      navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="order-summary empty">
        <h2>Your cart is empty</h2>
        <p>Add some delicious items to your cart to see the order summary.</p>
      </div>
    );
  }

  return (
    <div className="order-summary">
      <h2>Order Summary</h2>
      
      <div className="summary-items">
        {cart.map((item) => (
          <div key={item.id} className="summary-item">
            <span className="item-name">{item.name}</span>
            <span className="item-quantity">x{item.quantity}</span>
            <span className="item-price">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="promo-code-section">
        <form onSubmit={handlePromoSubmit} className="promo-form">
          <div className="promo-input-group">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter promo code"
              className="promo-input"
            />
            <button 
              type="submit" 
              className="apply-btn"
              disabled={isApplying || !promoInput.trim()}
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {promoError && (
            <div className="promo-error">
              {promoError}
            </div>
          )}
          {promoCode && !promoError && (
            <div className="promo-success">
              Promo code applied: {promoCode}
            </div>
          )}
        </form>
      </div>

      <div className="summary-totals">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{total}</span>
        </div>
        {discount > 0 && (
          <div className="summary-row discount">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Total</span>
          <span>₹{total - discount}</span>
        </div>
      </div>

      <button 
        className="checkout-btn"
        onClick={handleCheckout}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default OrderSummary; 