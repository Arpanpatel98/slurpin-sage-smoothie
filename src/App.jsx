import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Menu from './components/Menu';
import About from './components/About.jsx';
import Footer from './components/Footer';
import PopularItems from './components/PopularItems';
import ContactForm from './components/ContactForm';
// import ItemDec from './pages/itemdec/itemdec';
import ProductPage from './pages/item_dec';
// import Checkout from './pages/Checkout';

import Home from './pages/Home';
import { CartProvider } from './context/CartContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import CartPage from './pages/CartPage';
import OrderSuccess from './components/OrderSuccess';
import './App.css';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
    });
  }, []);

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<ContactForm />} />
              <Route path="/cart" element={<CartPage />} />
              {/* <Route path="/item/:id" element={<ItemDec />} /> */}
              <Route path="/products/:category/:productId" element={<ProductPage />} />
              <Route path="/order-success" element={<OrderSuccess />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App; 