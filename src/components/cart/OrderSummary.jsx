import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";

const OrderSummary = ({ onProceedToCheckout }) => {
  const {
    cartItems,
    promoCode,
    applyPromoCode,
    calculateTotals,
    checkStockStatus,
    outOfStockItems,
  } = useCart();
  const [inputCode, setInputCode] = useState(promoCode?.code || "");
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [hasOutOfStock, setHasOutOfStock] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const { subtotal, addIns, discount, tax, total } = calculateTotals();

  useEffect(() => {
    const checkStock = async () => {
      setIsCheckingStock(true);
      const { hasOutOfStock } = await checkStockStatus();
      setHasOutOfStock(hasOutOfStock);
      setIsCheckingStock(false);
    };
    checkStock();
  }, [cartItems]);

  const handleApplyPromo = async () => {
    if (!inputCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    try {
      setIsApplyingPromo(true);
      setPromoError(null);
      await applyPromoCode(inputCode);
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setIsApplyingPromo(false);
    }
  };
  function isWithinWorkingHours() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (day >= 1 && day <= 5) {
      // Monday to Friday: 7:00–20:00
      return totalMinutes >= 7 * 60 && totalMinutes <= 20 * 60;
    } else {
      // Saturday & Sunday: 8:00–19:00
      return totalMinutes >= 8 * 60 && totalMinutes <= 19 * 60;
    }
  }
  const handleProceedToCheckout = async () => {
    if (isWithinWorkingHours()) {
      const { hasOutOfStock } = await checkStockStatus();
      if (!hasOutOfStock) {
        onProceedToCheckout();
      }
    }
  };

  return (
    <div className="summary_container_cart">
      <div
        className="summary_ordersummary fade_in_global"
        style={{ animationDelay: "0.2s" }}
      >
        <h3 className="title_ordersummary">Order Summary</h3>
        <div className="breakdown_ordersummary">
          <div className="item_ordersummary">
            <span className="label_ordersummary">
              Subtotal ({cartItems.length} items)
            </span>
            <span className="value_ordersummary">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="item_ordersummary">
            <span className="label_ordersummary">Toppings & Add-ins</span>
            <span className="value_ordersummary">₹{addIns.toFixed(2)}</span>
          </div>
          <div className="item_ordersummary">
            <span className="label_ordersummary">Discount</span>
            <span className="discount_value_ordersummary">
              -₹{discount.toFixed(2)}
            </span>
          </div>
          <div className="item_ordersummary">
            <span className="label_ordersummary">Estimated Tax</span>
            <span className="value_ordersummary">₹{tax.toFixed(2)}</span>
          </div>
          <div className="divider_ordersummary">
            <div className="total_container_ordersummary">
              <span className="total_label_ordersummary">Total</span>
              <span className="total_value_ordersummary">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {hasOutOfStock && (
          <div className="out-of-stock-message_ordersummary">
            <p>Some items in your cart are out of stock:</p>
            <ul>
              {outOfStockItems.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
            <p>Please remove these items to proceed with checkout.</p>
          </div>
        )}

        <div className="promo_container_ordersummary">
          <label className="promo_label_ordersummary">Promo Code</label>
          <div className="promo_form_ordersummary">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setPromoError(null);
              }}
              placeholder="Enter promo code"
              className="promo_input_ordersummary"
              disabled={isApplyingPromo}
            />
            <button
              onClick={handleApplyPromo}
              className="promo_button_ordersummary"
              disabled={isApplyingPromo}
            >
              {isApplyingPromo ? "Applying..." : "Apply"}
            </button>
          </div>
          {promoError && (
            <div className="promo_error_ordersummary">
              {/* <svg className="promo_error_icon_ordersummary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg> */}
              {promoError}
            </div>
          )}
          {promoCode && !promoError && (
            <div className="promo_success_ordersummary">
              <svg
                className="promo_success_icon_ordersummary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Promo code {promoCode.code} applied!
              {promoCode.type === "percentage" &&
                ` (${promoCode.originalDiscount}% off)`}
            </div>
          )}
        </div>
        <button
          className={`checkout_button_ordersummary ${
            !isWithinWorkingHours() || (hasOutOfStock || isCheckingStock) ? "disabled" : ""
          }`}
          onClick={handleProceedToCheckout}
          disabled={!isWithinWorkingHours() || (hasOutOfStock || isCheckingStock) }
        >
          {isCheckingStock ? "Checking Stock..." : "Proceed to Checkout"}
          {!hasOutOfStock && !isCheckingStock && (
            <svg
              className="checkout_icon_ordersummary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          )}
        </button>
        {!isWithinWorkingHours() && (
          <div className="warning">
            <p className="text-sm text-red-600 p-3">Checkout is only available during working hours.</p>
          </div>
        )}
        <div className="payment_methods_ordersummary">
          <span className="payment_label_ordersummary">We accept:</span>
          <div className="payment_icons_ordersummary">
            <svg
              className="payment_icon_ordersummary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm-8 12H5v-2h6v2zm8 0h-6v-2h6v2zm0-4H5V7h14v5z" />
            </svg>
            <svg
              className="payment_icon_ordersummary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm-7 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>
        </div>
        <div className="secure_checkout_ordersummary">
          <svg
            className="secure_icon_ordersummary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 11c0-1.1-.9-2-2-2s-2 .9-2 2 2 4 2 4m2-4c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m-6 5v-1a2 2 0 012-2h4a2 2 0 012 2v1M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
            />
          </svg>
          Secure Checkout
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
