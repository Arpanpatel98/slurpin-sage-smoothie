import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import './OrderHistory.css';
import InvoiceTemplate from '../components/InvoiceTemplate';
import '../components/InvoiceTemplate.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [selectedOrder, setSelectedOrder] = useState(null);
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
      // Dynamically import the required libraries
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '0px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.zIndex = '9999';
      document.body.appendChild(tempDiv);

      // Render the invoice content
      tempDiv.innerHTML = `
        <div class="invoice-container rounded-lg overflow-hidden" style="width: 800px; background: white; position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <!-- Background Pattern -->
          <div class="leaf-pattern" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.03;">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 800 800">
              <pattern id="leaf-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50,0 C60,20 80,20 100,10 C80,40 80,60 100,90 C80,80 60,80 50,100 C40,80 20,80 0,90 C20,60 20,40 0,10 C20,20 40,20 50,0" fill="#1a4d2e"></path>
              </pattern>
              <rect width="100%" height="100%" fill="url(#leaf-pattern)"></rect>
            </svg>
          </div>

          <div class="content-wrapper" style="padding: 20px; position: relative; z-index: 1;">
            <!-- Invoice Header -->
            <div class="invoice-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center;">
                <div style="margin-right: 16px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#1a4d2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #1a4d2e; margin-bottom: 4px;">SlurpinSage</div>
                  <div style="font-size: 14px; opacity: 0.8;">Nourish Your Journey</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 24px; font-weight: bold;">INVOICE</div>
                <div style="font-size: 14px; opacity: 0.8;">#${order.orderId}</div>
              </div>
            </div>

            <!-- Invoice Body -->
            <div class="invoice-body">
              <!-- Business & Customer Info -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
                <div>
                  <h3 style="font-size: 18px; font-weight: bold; color: #1a4d2e; margin-bottom: 10px;">Our Information</h3>
                  <p style="font-weight: 500;">SlurpinSage Health Beverages</p>
                  <p>123 Green Avenue</p>
                  <p>Wellness District, CA 90210</p>
                  <p>Phone: (555) 123-4567</p>
                  <p>Email: orders@slurpinsage.com</p>
                </div>
                <div>
                  <h3 style="font-size: 18px; font-weight: bold; color: #1a4d2e; margin-bottom: 10px;">Order Information</h3>
                  <p style="font-weight: 500;">Order #${order.orderId}</p>
                  <p>${new Date(order.timestamp).toLocaleString()}</p>
                  <p>${order.orderDetails?.location || 'Unknown Location'}</p>
                  <p>${order.orderDetails?.address || 'No address provided'}</p>
                </div>
              </div>

              <!-- Order Items -->
              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 18px; font-weight: bold; color: #1a4d2e; margin-bottom: 10px;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                  <thead>
                    <tr style="background-color: #f8f9fa;">
                      <th style="padding: 8px 16px; text-align: left; font-weight: 600;">Item</th>
                      <th style="padding: 8px 16px; text-align: left; font-weight: 600;">Details</th>
                      <th style="padding: 8px 16px; text-align: right; font-weight: 600;">Qty</th>
                      <th style="padding: 8px 16px; text-align: right; font-weight: 600;">Price</th>
                      <th style="padding: 8px 16px; text-align: right; font-weight: 600;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items?.map(item => `
                      <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px 16px;">
                          <div style="font-weight: 500;">${item.name}</div>
                          <div style="font-size: 12px; color: #6b7280;">${item.size}</div>
                        </td>
                        <td style="padding: 12px 16px;">
                          <div style="font-size: 12px; color: #4b5563;">${item.milk}</div>
                          ${item.addons && item.addons.length > 0 ? `
                            <div style="margin-top: 4px;">
                              ${item.addons.map(addon => `
                                <span style="display: inline-block; padding: 2px 8px; margin-right: 5px; border-radius: 12px; font-size: 10px; color: white; background-color: #28a745;">${addon}</span>
                              `).join('')}
                            </div>
                          ` : ''}
                        </td>
                        <td style="padding: 12px 16px; text-align: right;">${item.quantity}</td>
                        <td style="padding: 12px 16px; text-align: right;">₹${item.price}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 500;">₹${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <!-- Order Totals -->
                <div style="display: flex; justify-content: flex-end;">
                  <div style="width: 256px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <div style="color: #4b5563;">Subtotal:</div>
                      <div style="font-weight: 500;">₹${order.total?.toFixed(2)}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <div style="color: #4b5563;">Add-ins:</div>
                      <div style="font-weight: 500;">₹${order.addInsTotal?.toFixed(2)}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <div style="color: #4b5563;">Tax:</div>
                      <div style="font-weight: 500;">₹${order.tax?.toFixed(2)}</div>
                    </div>
                    ${order.discount > 0 ? `
                      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <div style="color: #4b5563;">Loyalty Discount:</div>
                        <div style="font-weight: 500; color: #28a745;">-₹${order.discount?.toFixed(2)}</div>
                      </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #d1d5db; margin-top: 8px;">
                      <div style="font-size: 18px; font-weight: bold;">Total:</div>
                      <div style="font-size: 18px; font-weight: bold;">
                        ₹${((order.total + order.addInsTotal + order.tax - (order.discount || 0)).toFixed(2))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="font-weight: 500; color: #1a4d2e;">Thank you for choosing SlurpinSage!</p>
                <p style="font-size: 14px; color: #4b5563;">Your health journey is our priority.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Wait for content to be rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
        windowWidth: 800,
        windowHeight: tempDiv.offsetHeight
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190; // A4 width (210mm) minus 10mm margins
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      // Add the invoice image
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      // Handle multi-page content
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(`SlurpinSage_Receipt_${order.orderId}.pdf`);

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  const handleDownloadReceipt = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseInvoice = () => {
    setSelectedOrder(null);
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                downloadReceipt(order);
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

        {selectedOrder && (
          <InvoiceTemplate
            order={selectedOrder}
            onClose={handleCloseInvoice}
          />
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
