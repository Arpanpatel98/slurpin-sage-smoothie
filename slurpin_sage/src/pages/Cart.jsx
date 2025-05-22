import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryInformation from '../components/DeliveryInformation';
import './Cart.css';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const navigate = useNavigate();

  const loadCartItems = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCartItems(parsedCart);
          calculateTotal(parsedCart);
        } else {
          setCartItems([]);
          setTotal(0);
        }
      } else {
        setCartItems([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      setCartItems([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    loadCartItems();

    // Load saved addresses from local storage
    const savedAddresses = localStorage.getItem('savedAddresses');
    if (savedAddresses) {
      const parsedAddresses = JSON.parse(savedAddresses);
      setSavedAddresses(parsedAddresses);
      // Automatically select the first address if any exist
      if (parsedAddresses.length > 0) {
        setSelectedAddressId(parsedAddresses[0].id);
      }
    }

    const handleCartUpdate = () => {
      loadCartItems();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    calculateTotal(updatedItems);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    calculateTotal(updatedItems);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    setTotal(0);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleCheckout = () => {
    alert('Checkout functionality coming soon!');
  };

  // Static values for demo
  const subtotal = total;
  const tax = (subtotal * 0.08).toFixed(2);
  const deliveryFee = 0;
  const grandTotal = (subtotal + parseFloat(tax) + deliveryFee).toFixed(2);

  return (
    <div className="cart-main-layout">
      <div className="cart-left">
        <h2 className="cart-section-title">Your Order</h2>
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <button onClick={() => navigate('/menu')} className="continue-shopping">
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item-block">
                <div className="cart-item-img-wrap">
                  <img 
                    src={`/${item.image || 'greensmoothie.jpg'}`} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/greensmoothie.jpg';
                    }}
                  />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-ingredients">{item.ingredients}</div>
                </div>
                <div className="cart-item-price">${item.price.toFixed(2)}</div>
                <div className="cart-item-qty-controls">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <div className="cart-item-total">${(item.price * item.quantity).toFixed(2)}</div>
                <button className="cart-item-remove" onClick={() => removeItem(item.id)} aria-label="Remove item">×</button>
              </div>
            ))
          )}
        </div>

        <DeliveryInformation 
          savedAddresses={savedAddresses}
          selectedAddressId={selectedAddressId}
          setSelectedAddressId={setSelectedAddressId}
        />
      </div>

      <div className="cart-right">
        <div className="order-summary-box">
          <h2 className="cart-section-title">Order Summary</h2>
          <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Tax</span><span>${tax}</span></div>
          <div className="summary-row"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
          <div className="summary-row total"><span>Total</span><span>${grandTotal}</span></div>

          {/* Promo Code */}
          <div className="promo-code-row">
            <input type="text" placeholder="Promo Code" className="promo-input" />
            <button className="promo-apply">Apply</button>
          </div>

          <button className="place-order-btn" onClick={handleCheckout}>Place Order</button>
          <div className="order-terms">By placing your order, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</div>
        </div>
      </div>
    </div>
  );
} 