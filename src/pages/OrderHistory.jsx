import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import './OrderHistory.css';
import { jsPDF } from 'jspdf';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const DEFAULT_IMAGE_URL =
    "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.firebasestorage.app/o/products%2FAll%2Fall.HEIC?alt=media&token=5e2ae9b9-bb7d-4c56-96a1-0a60986c1469";
    
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
            tax: data.orderSummary?.tax || 0,
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
              image: item.image || null,
            })) || [],
            orderDetails: {
              location: data.delivery?.displayName || 'Unknown Location',
              address: data.delivery?.detailedAddress || 'No address provided',
            },
            discount: data.orderSummary?.discount || 0,
            image: data.items?.[0]?.image || null,
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
          image: item.image || null,
        })) || [],
        orderDetails: {
          location: location.state.newOrder.delivery?.displayName || 'Unknown Location',
          address: location.state.newOrder.delivery?.detailedAddress || 'No address provided',
        },
        discount: location.state.newOrder.orderSummary?.discount || 0,
        image: location.state.newOrder.image || null,
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

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const downloadReceipt = async (order) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.text('SlurpinSage', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      doc.setFontSize(12);
      doc.text('Smoothie & Juice Bar', pageWidth / 2, yPos, { align: 'center' });
      
      // Receipt Title
      yPos += 20;
      doc.setFontSize(18);
      doc.text('ORDER RECEIPT', pageWidth / 2, yPos, { align: 'center' });
      
      // Order Details
      yPos += 20;
      doc.setFontSize(12);
      doc.text(`Order #${order.orderId}`, margin, yPos);
      yPos += 10;
      doc.text(`Date: ${new Date(order.timestamp).toLocaleString()}`, margin, yPos);
      yPos += 10;
      doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, margin, yPos);
      
      // Items Section
      yPos += 20;
      doc.setFontSize(14);
      doc.text('ITEMS', margin, yPos);
      yPos += 10;
      
      // Draw table header
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // Items
      order.items.forEach((item, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`${item.name} (${item.size})`, margin, yPos);
        doc.text(`₹${item.price} x ${item.quantity}`, pageWidth - margin - 60, yPos);
        doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
        
        if (item.addons && item.addons.length > 0) {
          yPos += 7;
          doc.setFontSize(10);
          doc.text(`Add-ons: ${item.addons.join(', ')}`, margin + 5, yPos);
        }
        
        yPos += 15;
      });
      
      // Summary Section
      yPos += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;
      
      doc.setFontSize(14);
      doc.text('SUMMARY', margin, yPos);
      yPos += 15;
      
      // Summary Items
      const summaryItems = [
        { label: 'Subtotal', value: order.total?.toFixed(2) },
        { label: 'Add-ins', value: order.addInsTotal?.toFixed(2) },
        { label: 'Tax', value: order.tax?.toFixed(2) }
      ];
      
      if (order.discount > 0) {
        summaryItems.push({ label: 'Loyalty Discount', value: `-${order.discount?.toFixed(2)}` });
      }
      
      summaryItems.forEach(item => {
        doc.setFontSize(12);
        doc.text(item.label, margin, yPos);
        doc.text(`₹${item.value}`, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 10;
      });
      
      // Total
      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      doc.setFontSize(14);
      doc.text('Total', margin, yPos);
      const total = ((order.total + order.addInsTotal + order.tax - (order.discount || 0)).toFixed(2));
      doc.text(`₹${total}`, pageWidth - margin - 5, yPos, { align: 'right' });
      
      // Pickup Details
      yPos += 20;
      doc.setFontSize(14);
      doc.text('PICKUP DETAILS', margin, yPos);
      yPos += 15;
      
      doc.setFontSize(12);
      doc.text(order.orderDetails?.location || 'Unknown Location', margin, yPos);
      yPos += 10;
      doc.text(order.orderDetails?.address || 'No address provided', margin, yPos);
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text('Thank you for choosing SlurpinSage!', pageWidth / 2, 285, { align: 'center' });
        doc.text('We hope to serve you again soon!', pageWidth / 2, 290, { align: 'center' });
      }
      
      doc.save(`SlurpinSage_Receipt_${order.orderId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

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
              className="block w-full pl-3 pr-1 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
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
          {paginatedOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            </div>
          ) : (
            paginatedOrders.map((order, index) => {
              const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

              return (
                <div key={order.orderId} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-4 sm:px-6 cursor-pointer" onClick={() => toggleOrderDetails(order.orderId)}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className="mr-4">
                          <div className="w-12 h-12 bg-brand-100 
                          rounded-full flex items-center 
                          justify-center">
                            <svg className="w-6 h-6 text-brand-500" 
                            fill="none" stroke="currentColor" 
                            viewBox="0 0 24 24" xmlns="http://www.w3.
                            org/2000/svg">
                              <path strokeLinecap="round" 
                              strokeLinejoin="round" strokeWidth="2" 
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 
                              12H4L5 9z"></path>
</svg>
                          </div>
                          {/* <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center overflow-hidden">
                            {order.image ? (
                              <img 
                                src={order.image} 
                                alt={`Product for order #${order.orderId}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                              </svg>
                            )}
                          </div> */}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-800">Order #{order.orderId}</h3>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'processing' || order.status === 'confirmed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'completed'
                                ? 'bg-[#e6f3eb] text-[#137B3B]'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.timestamp).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })} • {totalItems} item{totalItems !== 1 ? 's' : ''} • ₹{order.total?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-grow md:flex-grow-0 mr-4">
                          {order.status === 'processing' && (
                            <div className="flex flex-col">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Order placed</span>
                                <span className="text-gray-500">Ready for pickup</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: '50%' }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                            expandedOrders[order.orderId] ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
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
                                  } rounded-lg flex items-center justify-center mr-4 overflow-hidden`}
                                >
                                  <img 
                                    src={item.image || DEFAULT_IMAGE_URL} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_IMAGE_URL;
                                    }}
                                  />
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
                                  {/* <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4,4h16c1.1,0,2,0.9,2,2v12c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2V6C2,4.9,2.9,4,4,4z" />
                                    <path fill="#ffffff" d="M20,10H4v6h16V10z" />
                                  </svg> */}
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
                            <button 
                              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await downloadReceipt(order);
                              }}
                            >
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
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            {[...Array(totalPages).keys()].map((num) => (
              <button
                key={num + 1}
                onClick={() => setCurrentPage(num + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 ${
                  currentPage === num + 1 ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                {num + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
