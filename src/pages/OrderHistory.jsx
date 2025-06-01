import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import './OrderHistory.css';

const OrderHistory = () => {
  const location = useLocation();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            orderId: doc.id,
            status: data.status?.order || 'pending',
            timestamp: data.timestamps?.created || new Date().toISOString(),
            total: data.orderSummary?.subtotal || 0,
            addInsTotal: data.orderSummary?.addIns || 0,
            tax: data.orderSummary?.tax || 0, // Fetch tax
            items: data.items?.map((item) => ({
              name: item.name,
              size: item.customization?.size || 'regular',
              milk: item.customization?.milk || 'none',
              price: item.price || 0,
              quantity: item.quantity || 1,
              addons: [
                ...(item.customization?.boosters?.map((b) => b.name) || []),
                ...(item.customization?.toppings?.map((t) => t.name) || []),
              ].filter(Boolean),
            })) || [],
            orderDetails: {
              location: data.delivery?.displayName || 'Unknown Location',
              address: data.delivery?.detailedAddress || 'No address provided',
            },
            discount: data.orderSummary?.discount || 0,
          };
        });
        setOrders(fetchedOrders);
      },
      (error) => {
        console.error('Error fetching orders:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (location.state?.newOrder && user && location.state.newOrder.userId === user.uid) {
      const newOrder = {
        orderId: location.state.newOrder.orderId,
        status: location.state.newOrder.status?.order || 'processing',
        timestamp: location.state.newOrder.timestamps?.created || new Date().toISOString(),
        total: location.state.newOrder.orderSummary?.subtotal || 0,
        addInsTotal: location.state.newOrder.orderSummary?.addIns || 0,
        tax: location.state.newOrder.orderSummary?.tax || 0, // Include tax
        items: location.state.newOrder.items?.map((item) => ({
          name: item.name,
          size: item.customization?.size || 'regular',
          milk: item.customization?.milk || 'none',
          price: item.price || 0,
          quantity: item.quantity || 1,
          addons: [
            ...(item.customization?.boosters?.map((b) => b.name) || []),
            ...(item.customization?.toppings?.map((t) => t.name) || []),
          ].filter(Boolean),
        })) || [],
        orderDetails: {
          location: location.state.newOrder.delivery?.displayName || 'Unknown Location',
          address: location.state.newOrder.delivery?.detailedAddress || 'No address provided',
        },
        discount: location.state.newOrder.orderSummary?.discount || 0,
      };
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      setExpandedOrders((prev) => ({
        ...prev,
        [newOrder.orderId]: true,
      }));
      if (newOrder.status === 'processing' || newOrder.status === 'confirmed') {
        setActiveTab('active');
      }
    }
  }, [location.state, user]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const filteredOrders = orders
    .filter((order) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'active') return order.status === 'processing' || order.status === 'confirmed';
      if (activeTab === 'completed') return order.status === 'completed';
      return true;
    })
    .filter((order) =>
      searchQuery ? order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .filter((order) =>
      statusFilter ? order.status.toLowerCase() === statusFilter.toLowerCase() : true
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      return 0;
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Please Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to view your orders.</p>
          <button
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            onClick={() => auth.signInWithRedirect(new auth.GoogleAuthProvider())}
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">Track and manage your SlurpinSage orders</p>
          </div>
          <button className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Order Again
          </button>
        </div>

        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Orders
            </button>
            <button
              onClick={() => handleTabChange('active')}
              className={`${
                activeTab === 'active'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              Active
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                {orders.filter((order) => order.status === 'processing' || order.status === 'confirmed').length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`${
                activeTab === 'completed'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed
            </button>
          </nav>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Filter by status</option>
              <option value="processing">Processing</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Sort by date</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

              return (
                <div key={order.orderId} className="bg-white shadow rounded-lg overflow-hidden">
                  <div
                    className="px-4 py-4 sm:px-6 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleOrderDetails(order.orderId)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14.5c2.49 0 4.5-2.01 4.5-4.5V4c0-2.49-2.01-4.5-4.5-4.5S7.5 1.51 7.5 4v6C7.5 12.49 9.51 14.5 12 14.5zm-3.5-10c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-6zm7 10.5c0 2.89-2.31 5.24-5.18 5.5-.45.04-.82.4-.82.86v2.07c0 .47.38.85.85.85H15c.47 0 .85-.38.85-.85v-2.07c0-.46-.37-.82-.82-.86C14.31 20.24 12 17.89 12 15c0-.55-.45-1-1-1s-1 .45-1 1c0 3.31 2.69 6 6 6s6-2.69 6-6h-2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-base font-semibold text-gray-900">Order #{order.orderId}</h3>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'processing' || order.status === 'confirmed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'completed'
                                ? 'bg-[#e6f3eb] text-[#137B3B]'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {new Date(order.timestamp).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })} • {totalItems} item{totalItems !== 1 ? 's' : ''} • ₹{order.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-auto">
                      <button
                        className="text-brand-600 text-sm font-medium flex items-center focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Order Again clicked for order:', order.orderId);
                        }}
                      >
                        Order Again
                        <svg
                          className="ml-1 h-4 w-4 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <svg
                        className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                          expandedOrders[order.orderId] ? 'rotate-180' : ''
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className={`border-t border-gray-200 ${expandedOrders[order.orderId] ? 'block' : 'hidden'}`}>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                          <div className="space-y-4">
                            {order.items?.map((item, index) => (
                              <div key={index} className="flex items-center">
                                <div
                                  className={`flex-shrink-0 w-16 h-16 ${
                                    index === 0 ? 'bg-[#e6f3eb]' : index === 1 ? 'bg-purple-100' : 'bg-yellow-100'
                                  } rounded-lg flex items-center justify-center mr-4`}
                                >
                                  <div
                                    className={`w-10 h-10 ${
                                      index === 0 ? 'bg-[#c8e6d3]' : index === 1 ? 'bg-purple-200' : 'bg-yellow-200'
                                    } rounded-full flex items-center justify-center`}
                                  >
                                    <svg
                                      className="w-6 h-6 text-brand-600"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-grow flex justify-between items-center">
                                  <div>
                                    <h5 className="text-base font-medium text-gray-900">{item.name}</h5>
                                    <p className="text-sm text-gray-500">{item.size} • {item.milk} • Qty: {item.quantity}</p>
                                    {item.addons && item.addons.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {item.addons.map((addon, idx) => (
                                          <span
                                            key={idx}
                                            className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                                          >
                                            {addon}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-base font-semibold text-gray-900">₹{item.price}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h4>
                          <div className="bg-white shadow-sm rounded-lg p-4">
                            <div className="space-y-4">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">Pickup Details</h5>
                                <p className="mt-1 text-sm text-gray-600">
                                  {new Date(order.timestamp).toLocaleString()}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">{order.orderDetails?.location}</p>
                                <p className="mt-1 text-sm text-gray-600">{order.orderDetails?.address}</p>
                              </div>
                              <div className="border-t border-gray-200 pt-4">
                                <h5 className="text-sm font-medium text-gray-900">Payment Method</h5>
                                <div className="mt-1 flex items-center">
                                  <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4,4h16c1.1,0,2,0.9,2,2v12c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2V6C2,4.9,2.9,4,4,4z" />
                                    <path fill="#ffffff" d="M20,10H4v6h16V10z" />
                                  </svg>
                                  <span className="ml-2 text-sm text-gray-600">•••• 4242</span>
                                </div>
                              </div>
                              <div className="border-t border-gray-200 pt-4">
                                <h5 className="text-sm font-medium text-gray-900">Order Summary</h5>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">₹{order.total?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Add-ins</span>
                                    <span className="text-gray-900">₹{order.addInsTotal?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">₹{order.tax?.toFixed(2)}</span>
                                  </div>
                                  {order.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Loyalty Discount</span>
                                      <span className="text-[#137B3B]">-₹{order.discount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="border-t border-gray-200 pt-2 mt-2">
                                    <div className="flex justify-between text-base font-semibold text-gray-900">
                                      <span>Total</span>
                                      <span>
                                        ₹{((order.total + order.addInsTotal + order.tax - (order.discount || 0)).toFixed(2))}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 space-y-3">
                            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                              <svg
                                className="-ml-1 mr-3 h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download Receipt
                            </button>
                            <button
                              className="ml-auto text-brand-600 text-sm font-medium flex items-center focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Order Again clicked for order:', order.orderId);
                              }}
                            >
                              Order Again
                              <svg
                                className="ml-1 h-4 w-4 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-brand-600 text-sm font-medium text-white">
              1
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
