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
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import OrderDetails from './pages/admin/OrderDetails';
import './App.css';

// Add AdminLayout component
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

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
            <Route path="/admin" element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } />
            <Route path="/admin/orders/:orderId" element={
              <AdminLayout>
                <OrderDetails />
              </AdminLayout>
            } />

            {/* Other routes with MainLayout */}
            <Route path="/" element={
              <MainLayout>
                <Home />
              </MainLayout>
            } />
            <Route path="/menu" element={<Menu />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/cart" element={<CartPage />} />
            {/* <Route path="/item/:id" element={<ItemDec />} /> */}
            <Route path="/products/:category/:productId" element={<ProductPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;