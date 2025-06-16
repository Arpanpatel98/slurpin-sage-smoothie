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
// import TermsAndConditions from './components/PolicyPage.jsx';

import Home from './pages/Home';
import { CartProvider } from './context/CartContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import CartPage from './pages/CartPage';
import OrderSuccess from './components/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import AdminLayout from './pages/admin/AdminLayout';
import './App.css';
import TermsAndConditions from './components/TermsAndConditions';
import CancellationRefundPolicy from './components/CancellationRefundPolicy';
import ShippingDeliveryPolicy from './components/ShippingDeliveryPolicy';
import PrivacyPolicy from './components/PrivacyPolicy';

// Add MainLayout component
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

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
          <Routes>
            {/* Admin routes with AdminLayout */}
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* Other routes with MainLayout */}
            <Route path="/" element={
              <MainLayout>
                <Home />
              </MainLayout>
            } />
            <Route path="/menu" element={
              <MainLayout>
                <Menu />
              </MainLayout>
            } />
            <Route path="/about" element={
              <MainLayout>
                <About />
              </MainLayout>
            } />
            <Route path="/contact" element={
              <MainLayout>
                <ContactForm />
              </MainLayout>
            } />
            <Route path="/cart" element={
              <MainLayout>
                <CartPage />
              </MainLayout>
            } />
            {/* <Route path="/item/:id" element={<ItemDec />} /> */}
            <Route path="/products/:category/:productId" element={
              <MainLayout>
                <ProductPage />
              </MainLayout>
            } />
            <Route path="/order-success" element={
              <MainLayout>
                <OrderSuccess />
              </MainLayout>
            } />
            <Route path="/orders" element={
              <MainLayout>
                <OrderHistory />
              </MainLayout>
            } />
            <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/cancellation-refund" element={<CancellationRefundPolicy />} />
          <Route path="/shipping-delivery" element={<ShippingDeliveryPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;