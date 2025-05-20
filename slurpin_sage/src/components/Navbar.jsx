import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './auth/firebas';
import CartButton from './CartButton';
import LoginSignupPage from './auth/LoginSignupPage';
import './Navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      if (user) {
        setShowLoginModal(false); // Close modal when user logs in
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    setShowLoginModal(true);
    setIsMenuOpen(false);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="left-section">
          <h1 className="logo">SLURPIN'SAGE</h1>
        </div>

        <div className="nav-toggle" onClick={toggleMenu}>
          ☰
        </div>

        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={handleLinkClick}>Home</Link></li>
          <li><Link to="/menu" onClick={handleLinkClick}>Menu</Link></li>
          <li><Link to="/about" onClick={handleLinkClick}>About</Link></li>  
          <li><Link to="/contact" onClick={handleLinkClick}>Contact</Link></li>
          <li className="cart-icon">
            <CartButton />
          </li>
          {isLoggedIn ? (
            <li className="auth-link">
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          ) : (
            <li className="auth-link">
              <button onClick={handleLoginClick} className="login-btn">Login</button>
            </li>
          )}
        </ul>
      </nav>

      {showLoginModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>×</button>
            <LoginSignupPage />
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
