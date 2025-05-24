import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

const OrderSummary = () => {
  const { cartItems, promoCode, applyPromoCode, calculateTotals } = useCart();
  const [inputCode, setInputCode] = useState(promoCode?.code || '');
  const { subtotal, addIns, discount, tax, total } = calculateTotals();

  const handleApplyPromo = () => {
    applyPromoCode(inputCode);
  };

  return (
    <div className="summary_container_cart">
      <div className="summary_ordersummary fade_in_global" style={{ animationDelay: '0.2s' }}>
        <h3 className="title_ordersummary">Order Summary</h3>
        <div className="breakdown_ordersummary">
          <div className="item_ordersummary">
            <span className="label_ordersummary">Subtotal ({cartItems.length} items)</span>
            <span className="value_ordersummary">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="item_ordersummary">
            <span className="label_ordersummary">Toppings & Add-ins</span>
            <span className="value_ordersummary">₹{addIns.toFixed(2)}</span>
          </div>
          <div className="item_ordersummary">
            <span className="label_ordersummary">Discount</span>
            <span className="discount_value_ordersummary">-₹{discount.toFixed(2)}</span>
          </div>
          <div className="item_ordersummary">
            <span className="label_ordersummary">Estimated Tax</span>
            <span className="value_ordersummary">₹{tax.toFixed(2)}</span>
          </div>
          <div className="divider_ordersummary">
            <div className="total_container_ordersummary">
              <span className="total_label_ordersummary">Total</span>
              <span className="total_value_ordersummary">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="rewards_container_ordersummary">
          <div className="rewards_header_ordersummary">
            <div className="rewards_title_container_ordersummary">
              <svg className="rewards_icon_ordersummary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="rewards_title_ordersummary">Smoothie Points</span>
            </div>
            <span className="rewards_points_ordersummary">150 pts</span>
          </div>
          <p className="rewards_text_ordersummary">You're 50 points away from a free smoothie!</p>
          <div className="progress_container_ordersummary">
            <div className="progress_bar_ordersummary">
              <div className="progress_fill_ordersummary" style={{ width: '75%' }}></div>
            </div>
            <div className="progress_labels_ordersummary">
              <span className="progress_current_ordersummary">150</span>
              <span className="progress_goal_ordersummary">200</span>
            </div>
          </div>
        </div>
        <div className="promo_container_ordersummary">
          <label className="promo_label_ordersummary">Promo Code</label>
          <div className="promo_form_ordersummary">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter promo code"
              className="promo_input_ordersummary"
            />
            <button onClick={handleApplyPromo} className="promo_button_ordersummary">
              Apply
            </button>
          </div>
          {promoCode && (
            <div className="promo_success_ordersummary">
              <svg className="promo_success_icon_ordersummary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Promo code {promoCode.code} applied!
            </div>
          )}
        </div>
        <button className="checkout_button_ordersummary">
          Proceed to Checkout
          <svg className="checkout_icon_ordersummary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <div className="payment_methods_ordersummary">
          <span className="payment_label_ordersummary">We accept:</span>
          <div className="payment_icons_ordersummary">
            <svg className="payment_icon_ordersummary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm-8 12H5v-2h6v2zm8 0h-6v-2h6v2zm0-4H5V7h14v5z" />
            </svg>
            <svg className="payment_icon_ordersummary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm-7 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>
        </div>
        <div className="secure_checkout_ordersummary">
          <svg className="secure_icon_ordersummary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.1-.9-2-2-2s-2 .9-2 2 2 4 2 4m2-4c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m-6 5v-1a2 2 0 012-2h4a2 2 0 012 2v1M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
          </svg>
          Secure Checkout
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;