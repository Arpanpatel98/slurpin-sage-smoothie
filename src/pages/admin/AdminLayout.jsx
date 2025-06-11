import React, { useEffect, useState } from 'react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { getToken } from 'firebase/messaging';
import { messaging } from '../../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import AdminDashboard from './AdminDashboard';
import OrderDetails from './OrderDetails';
import AdminProducts from './AdminProducts';
import EditProduct from './EditProduct';
import AddProduct from './AddProduct';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const auth = getAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarExpanded(true);
      } else {
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Test Firestore access
  const testFirestoreAccess = async () => {
    try {
      const testRef = doc(db, 'test', 'test');
      await setDoc(testRef, { test: true });
      console.log('Firestore write test successful');
      return true;
    } catch (error) {
      console.error('Firestore write test failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchAndStoreFCMToken = async () => {
      try {
        const currentUser = auth.currentUser;
        console.log('Current user:', currentUser);

        if (!currentUser) {
          console.log('No user logged in');
          return;
        }

        // Check if VAPID key exists
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        console.log('VAPID Key exists:', !!vapidKey);

        const newToken = await getToken(messaging, {
          vapidKey: vapidKey
        });
        console.log('New FCM Token received:', newToken);

        // Check existing token
        const userTokenRef = doc(db, 'fcmTokens', currentUser.uid);
        const tokenDoc = await getDoc(userTokenRef);

        if (tokenDoc.exists()) {
          const existingToken = tokenDoc.data().token;
          console.log('Existing token found:', existingToken);

          // Only update if tokens are different
          if (existingToken !== newToken) {
            console.log('Token has changed, updating...');
            await setDoc(userTokenRef, {
              token: newToken,
              userId: currentUser.uid,
              email: currentUser.email,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            console.log('FCM token updated successfully');
          } else {
            console.log('Token unchanged, no update needed');
          }
        } else {
          // No existing token, create new one
          console.log('No existing token found, creating new one...');
          await setDoc(userTokenRef, {
            token: newToken,
            userId: currentUser.uid,
            email: currentUser.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('New FCM token stored successfully');
        }

      } catch (error) {
        console.error('Error in fetchAndStoreFCMToken:', error);
        if (error.code) {
          console.error('Error code:', error.code);
        }
        if (error.message) {
          console.error('Error message:', error.message);
        }
      }
    };

    // Add auth state listener to ensure we have a user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Auth state changed - user is logged in');
        fetchAndStoreFCMToken();
      } else {
        console.log('Auth state changed - no user logged in');
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarExpanded(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button className="mobile-menu-button" onClick={toggleSidebar}>
          <svg className="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar Overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isSidebarExpanded ? 'visible' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarExpanded ? 'expanded' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>Main Menu</h2>
          </div>
          <nav className="sidebar-nav">
            {/* <Link
              to="/admin"
              className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="sidebar-text">Dashboard</span>
            </Link> */}
            <Link
              to="/admin/orders"
              className={`sidebar-link ${isActive('/admin/orders') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="sidebar-text">Orders</span>
            </Link>
            {/* <Link
              to="/admin/customers"
              className={`sidebar-link group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/customers') ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${isActive('/admin/customers') ? 'text-brand-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Customers
            </Link> */}
            <Link
              to="/admin/products"
              className={`sidebar-link ${isActive('/admin/products') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="sidebar-text">Products</span>
            </Link>
            {/* <Link
              to="/admin/analytics"
              className={`sidebar-link group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/analytics') ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${isActive('/admin/analytics') ? 'text-brand-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Analytics
            </Link> */}
          </nav>
          
          {/* <div className="px-4 mt-6 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h2>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            <Link
              to="/admin/settings"
              className={`sidebar-link group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/settings') ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${isActive('/admin/settings') ? 'text-brand-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Settings
            </Link>
            <Link
              to="/admin/help"
              className={`sidebar-link group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/help') ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className={`mr-3 h-5 w-5 ${isActive('/admin/help') ? 'text-brand-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Help
            </Link>
          </nav> */}
        </div>
        {!isMobile && (
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg className="sidebar-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="py-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/orders" element={<AdminDashboard />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/products" element={<AdminProducts />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/edit/:category/:id" element={<EditProduct />} />
            {/* Add other routes as needed */}
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 