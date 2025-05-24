import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const MobileNav = () => {
  const { cartItems } = useCart();
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="nav_mobilenav">
      <div className="nav_container_mobilenav">
        <Link to="/" className="nav_item_mobilenav">
          <svg className="nav_icon_mobilenav" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m-4-2h4" />
          </svg>
          <span className="nav_label_mobilenav">Home</span>
        </Link>
        <Link to="/menu" className="nav_item_mobilenav">
          <svg className="nav_icon_mobilenav" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span className="nav_label_mobilenav">Menu</span>
        </Link>
        <Link to="/cart" className="nav_item_mobilenav">
          <div className="nav_cart_icon_container_mobilenav">
            <svg className="nav_icon_mobilenav" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartItemCount > 0 && (
              <span className="nav_cart_badge_mobilenav">{cartItemCount}</span>
            )}
          </div>
          <span className="nav_label_mobilenav nav_cart_label_mobilenav">Cart</span>
        </Link>
        <Link to="/account" className="nav_item_mobilenav">
          <svg className="nav_icon_mobilenav" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="nav_label_mobilenav">Account</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNav;