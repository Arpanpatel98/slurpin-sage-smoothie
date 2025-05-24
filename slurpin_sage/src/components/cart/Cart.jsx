import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import RecommendedProduct from './RecommendedProduct';
import OrderSummary from './OrderSummary';
import ProductCustomization from './ProductCustomizationModal';

const recommendedProducts = [
  {
    id: 'tropical-twist',
    name: 'Tropical Twist',
    description: 'A refreshing blend of mango, pineapple, and coconut water.',
    price: 6.99,
    gradient: 'yellow',
  },
  {
    id: 'green-glow',
    name: 'Green Glow',
    description: 'Spinach, kale, apple, and ginger for a vibrant boost.',
    price: 7.49,
    gradient: 'purple',
  },
  {
    id: 'berry-blast',
    name: 'Berry Blast',
    description: 'Mixed berries, banana, and almond milk for a sweet treat.',
    price: 6.49,
    gradient: 'blue',
  },
];

const Cart = () => {
  const { cartItems, showCustomization } = useCart();

  return (
    <div className="container_cart">
      <div className="slide_up_global" style={{ animationDelay: '0.1s' }}>
        <h2 className="title_cart">Your Cart</h2>
        <Link to="/menu" className="continue_shopping_cart">
          <svg className="continue_icon_cart" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Continue Shopping
        </Link>
      </div>
      <div className="progress_container_cart slide_up_global" style={{ animationDelay: '0.2s' }}>
        <span className="progress_label_cart">Cart</span>
        <span className="progress_inactive_cart">Checkout</span>
        <span className="progress_inactive_cart">Order Confirmation</span>
      </div>
      <div className="progress_bar_cart slide_up_global" style={{ animationDelay: '0.3s' }}>
        <div className="progress_fill_cart" style={{ width: '33.33%' }}></div>
      </div>
      {cartItems.length === 0 ? (
        <div className="empty_cart slide_up_global" style={{ animationDelay: '0.4s' }}>
          <p className="empty_message_cart">Your cart is empty.</p>
          <Link to="/menu" className="shop_button_cart">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="layout_cart">
          <div className="items_container_cart custom_scrollbar_global">
            {cartItems.map((item, index) => (
              <CartItem key={item.id} item={item} index={index} />
            ))}
            {/* <div className="slide_up_global" style={{ animationDelay: '0.5s' }}>
              <h3 className="title_cart">Recommended For You</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {recommendedProducts.map((product) => (
                  <RecommendedProduct key={product.id} product={product} />
                ))}
              </div>
            </div> */}
          </div>
          <OrderSummary />
        </div>
      )}
      {showCustomization && <ProductCustomization />}
    </div>
  );
};

export default Cart;