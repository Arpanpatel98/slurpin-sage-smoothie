import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useImageLoader } from '../../hooks/useImageLoader';

const CartItem = ({ item, index }) => {
  const { updateQuantity, removeFromCart, setShowCustomization, outOfStockItems } = useCart();
  const [error, setError] = useState('');
  const [stockMessage, setStockMessage] = useState('');

  // Default image URL from Firebase Storage
  const DEFAULT_IMAGE_URL =
    "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469";

  const { imageSrc, isLoading } = useImageLoader(item.image, DEFAULT_IMAGE_URL);

  useEffect(() => {
    // Check if this item has a stock message
    const outOfStockItem = outOfStockItems.find(outOfStockItem => outOfStockItem.id === item.id);
    if (outOfStockItem) {
      setStockMessage(outOfStockItem.message);
    } else {
      setStockMessage('');
    }
  }, [outOfStockItems, item.id]);

  const handleEdit = () => {
    setShowCustomization({
      product: {
        ...item,
        customized: true,
      },
      mode: 'edit',
    });
  };

  const handleQuantityChange = async (newQuantity) => {
    try {
      setError('');
      await updateQuantity(item.id, newQuantity);
    } catch (err) {
      setError(err.message);
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="item_cartitem fade_in_global" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="item_container_cartitem">
        <div className="image_container_cartitem">
          <img
            src={imageSrc}
            alt={item.name}
            className="image_cartitem"
            style={{ opacity: isLoading ? 0.5 : 1 }}
          />
        </div>
        <div className="details_cartitem">
          <div className="header_cartitem">
            <div>
              <h3 className="name_cartitem">{item.name}</h3>
              <p className="size_base_cartitem">
                {item.quantity > 1 ? 'Large' : 'Regular'} / {item.base}
              </p>
            </div>
            <div>
              <span className="price_cartitem">₹{item.price.toFixed(2)}</span>
            </div>
          </div>
          {stockMessage && (
            <div className="stock_message_cartitem">
              {stockMessage}
            </div>
          )}
          <div className="addons_cartitem">
            {item.toppings.map((topping) => (
              <span key={topping.id} className="addon_tag_cartitem">
                {topping.name}
              </span>
            ))}
            {item.boosters.map((booster) => (
              <span key={booster.id} className="addon_tag_cartitem">
                {booster.name}
              </span>
            ))}
          </div>
          {item.specialInstructions && (
            <div className="special_instructions_cartitem">
              <div className="special_instructions_header_cartitem">
                <svg
                  className="special_instructions_icon_cartitem"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="special_instructions_label_cartitem">Special Instructions</span>
                <svg
                  className="special_instructions_edit_icon_cartitem"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <div className="special_instructions_content_cartitem">
                <p className="special_instructions_text_cartitem">{item.specialInstructions}</p>
              </div>
            </div>
          )}
          <div className="actions_cartitem">
            <div className="quantity_container_cartitem">
              <button
                className="quantity_button_cartitem"
                onClick={() => handleQuantityChange(item.quantity - 1)}
              >
                <svg
                  className="quantity_icon_cartitem"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <input
                type="number"
                className="quantity_input_cartitem quantity_input_global"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                min="1"
                max={item.stock || 10}
              />
              <button
                className="quantity_button_cartitem"
                onClick={() => handleQuantityChange(item.quantity + 1)}
              >
                <svg
                  className="quantity_icon_cartitem"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            {error && <div className="error_message_cartitem">{error}</div>}
            <div className="buttons_cartitem">
              <button className="edit_button_cartitem" onClick={handleEdit}>
                <svg
                  className="action_icon_cartitem"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Edit
              </button>
              <button
                className="remove_button_cartitem"
                onClick={() => removeFromCart(item.id)}
              >
                <svg
                  className="action_icon_cartitem"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;