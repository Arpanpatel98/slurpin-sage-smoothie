import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import './AdminDashboard.css';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [dateFilter, setDateFilter] = useState('today');
  const [locationFilter, setLocationFilter] = useState('');
  const [usersData, setUsersData] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('=== AUTH CHECK START ===');
      console.log('Current user:', currentUser);
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const uid = currentUser.uid;
          console.log('Checking authorization for UID:', uid);
          
          // Check user's role in the user collection
          const userDocRef = doc(db, 'users', uid);
          console.log('Fetching user document from:', 'user/' + uid);
          
          const userDocSnap = await getDoc(userDocRef);
          console.log('Document exists?', userDocSnap.exists());
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log('Full user document data:', userData);
            console.log('User role:', userData.role);
            
            // Temporarily log all possible role values for debugging
            console.log('Role check:', {
              isAdmin: userData.role === 'admin',
              isStaff: userData.role === 'staff',
              actualRole: userData.role,
              roleType: typeof userData.role
            });
            
            // Check for role with more lenient comparison
            const userRole = String(userData.role).toLowerCase().trim();
            if (userRole === 'admin' || userRole === 'staff') {
              console.log('Authorization successful!');
              setIsAuthorized(true);
            } else {
              console.log('Authorization failed - invalid role:', userRole);
              setIsAuthorized(false);
              navigate('/');
            }
          } else {
            console.log('No user document found in collection');
            // Create user document with admin role
            try {
              await setDoc(userDocRef, {
                email: currentUser.email,
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              console.log('Created user document with admin role');
              setIsAuthorized(true);
            } catch (error) {
              console.error('Error creating user document:', error);
              setIsAuthorized(false);
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Error during authorization:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
          });
          setIsAuthorized(false);
          navigate('/');
        }
      } else {
        console.log('No authenticated user found');
        setIsAuthorized(false);
        navigate('/');
      }
      console.log('=== AUTH CHECK END ===');
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    console.log('Authorization state changed:', isAuthorized);
  }, [isAuthorized]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            orderId: doc.id,
            status: data.status?.order || 'pending',
            timestamp: data.timestamps?.created || new Date().toISOString(),
            total: data.orderSummary?.subtotal || 0,
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
            customerName: data.userName || 'Anonymous',
            customerEmail: data.userEmail || 'No email provided',
            customerPhone: data.customerPhone || 'No phone provided',
            userId: data.userId || null,
            delivery: {
              detailedAddress: data.delivery?.address?.detailedAddress || '',
              floor: data.delivery?.address?.floor || '',
              status: data.delivery?.status || 'pending',
              estimatedDelivery: data.delivery?.estimatedDelivery || '',
            },
            paymentMethod: data.payment?.method || 'Not specified',
            paymentStatus: data.payment?.status || 'pending',
          };
        });
        setOrders(fetchedOrders);

        // Fetch user data for orders with userId
        const fetchUsers = async () => {
          const usersMap = { ...usersData };
          for (const order of fetchedOrders) {
            if (order.userId && !usersMap[order.userId]) {
              try {
                const userDocRef = doc(db, 'users', order.userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  usersMap[order.userId] = userDocSnap.data();
                } else {
                  console.log('User not found for userId:', order.userId);
                  usersMap[order.userId] = {};
                }
              } catch (error) {
                console.error('Error fetching user data for userId:', order.userId, error);
                usersMap[order.userId] = {};
              }
            }
          }
          setUsersData(usersMap);
        };

        fetchUsers();
      },
      (error) => {
        console.error('Error fetching orders:', error);
      }
    );

    return () => unsubscribe();
  }, [user, usersData]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        'status.order': newStatus,
        'status.updatedAt': new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleOrderClick = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'delivered').length,
  };

  // Filter orders based on status, date, and search query
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    // Date filter
    const orderDate = new Date(order.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (dateFilter) {
      case 'today':
        if (orderDate < today) return false;
        break;
      case 'yesterday':
        if (orderDate < yesterday || orderDate >= today) return false;
        break;
      case 'this_week':
        if (orderDate < thisWeekStart) return false;
        break;
      case 'last_week':
        if (orderDate < lastWeekStart || orderDate >= thisWeekStart) return false;
        break;
      case 'this_month':
        if (orderDate < thisMonthStart) return false;
        break;
    }

    // Search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        (usersData[order.userId]?.name || '').toLowerCase().includes(searchLower) ||
        (usersData[order.userId]?.phone || '').toLowerCase().includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const handleExportOrders = () => {
    console.log('Starting export...');
    console.log('Filtered orders:', filteredOrders);
    
    // Prepare data for export
    const exportData = filteredOrders.map(order => ({
      'Order ID': order.id,
      'Customer Name': usersData[order.userId]?.name || 'N/A',
      'Phone': usersData[order.userId]?.phone || 'N/A',
      'Date': new Date(order.timestamp).toLocaleDateString(),
      'Time': new Date(order.timestamp).toLocaleTimeString(),
      'Items': order.items.map(item => `${item.name} (${item.quantity})`).join(', '),
      'Total Amount': `₹${order.total}`,
      'Payment Method': order.paymentMethod,
      'Status': order.status,
      'Delivery Address': `${order.delivery.detailedAddress}${order.delivery.floor ? `, Floor ${order.delivery.floor}` : ''}`,
      'Delivery Instructions': order.delivery.instructions || 'N/A'
    }));

    console.log('Export data prepared:', exportData);

    try {
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      console.log('Worksheet created');

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      console.log('Workbook created');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      console.log('Excel buffer generated');

      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      console.log('Blob created');

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      console.log('Download link created, clicking...');
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error during export:', error);
      alert('Error exporting orders. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="unauthorized-message_AdminDashboard">
        <h2>Loading...</h2>
        <p>Please wait while we verify your access.</p>
        <p>Debug Info: User object not loaded</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="unauthorized-message_AdminDashboard">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Debug Info:</p>
        <ul>
          <li>User ID: {user?.uid}</li>
          <li>Email: {user?.email}</li>
          <li>Phone: {user?.phoneNumber}</li>
        </ul>
        <p>If you believe this is an error, please contact the system administrator.</p>
      </div>
    );
  }

  // TEMPORARY: Always show the dashboard for testing
  return (
    <div className="flex_AdminDashboard flex-col_AdminDashboard flex-1_AdminDashboard overflow-hidden_AdminDashboard admin-dashboard_AdminDashboard">
      {/* Top Navigation */}
      <div className="relative_AdminDashboard z-10_AdminDashboard flex-shrink-0_AdminDashboard flex_AdminDashboard h-16_AdminDashboard bg-white_AdminDashboard border-b_AdminDashboard border-gray-200_AdminDashboard">
        {/* <button type="button" className="md:hidden_AdminDashboard px-4_AdminDashboard text-gray-500_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-inset_AdminDashboard focus:ring-brand-500_AdminDashboard">
          <svg className="h-6_AdminDashboard w-6_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button> */}
        
        <div className="flex-1_AdminDashboard px-4_AdminDashboard flex_AdminDashboard justify-between_AdminDashboard">
          <div className="flex-1_AdminDashboard flex_AdminDashboard items-center_AdminDashboard">
            <div className="max-w-lg_AdminDashboard w-full_AdminDashboard lg:max-w-xs_AdminDashboard">
              <label htmlFor="search" className="sr-only_AdminDashboard">Search</label>
              <div className="relative_AdminDashboard">
                <div className="absolute_AdminDashboard inset-y-0_AdminDashboard left-0_AdminDashboard pl-3_AdminDashboard flex_AdminDashboard items-center_AdminDashboard pointer-events-none_AdminDashboard">
                  <svg className="h-5_AdminDashboard w-5_AdminDashboard text-gray-400_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block_AdminDashboard w-full_AdminDashboard pl-10_AdminDashboard pr-3_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-gray-300_AdminDashboard rounded-md_AdminDashboard leading-5_AdminDashboard bg-white_AdminDashboard placeholder-gray-500_AdminDashboard focus:outline-none_AdminDashboard focus:placeholder-gray-400_AdminDashboard focus:ring-1_AdminDashboard focus:ring-brand-500_AdminDashboard focus:border-brand-500_AdminDashboard sm:text-sm_AdminDashboard"
                  placeholder="Search orders, customers..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ml-4_AdminDashboard flex_AdminDashboard items-center_AdminDashboard md:ml-6_AdminDashboard">
            {/* Notification dropdown */}
            <div className="ml-3_AdminDashboard relative_AdminDashboard">
              <div>
                <button
                  type="button"
                  className="p-1_AdminDashboard text-gray-400_AdminDashboard rounded-full_AdminDashboard hover:bg-gray-100_AdminDashboard hover:text-gray-500_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                  onClick={() => alert('View notifications button clicked.')}
                >
                  <span className="sr-only_AdminDashboard">View notifications</span>
                  <svg className="h-6_AdminDashboard w-6_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  <span className="absolute_AdminDashboard top-0_AdminDashboard right-0_AdminDashboard block_AdminDashboard h-2_AdminDashboard w-2_AdminDashboard rounded-full_AdminDashboard bg-red-400_AdminDashboard ring-2_AdminDashboard ring-white_AdminDashboard"></span>
                </button>
              </div>
            </div>
            
            {/* Profile dropdown */}
            <div className="ml-3_AdminDashboard relative_AdminDashboard">
              <div>
                <button
                  type="button"
                  className="max-w-xs_AdminDashboard bg-white_AdminDashboard flex_AdminDashboard items-center_AdminDashboard text-sm_AdminDashboard rounded-full_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                  onClick={() => alert('Profile button clicked.')}
                >
                  <span className="sr-only_AdminDashboard">Open user menu</span>
                  <div className="h-8_AdminDashboard w-8_AdminDashboard rounded-full_AdminDashboard bg-brand-100_AdminDashboard flex_AdminDashboard items-center_AdminDashboard justify-center_AdminDashboard text-brand-700_AdminDashboard font-semibold_AdminDashboard">
                    {user?.displayName?.charAt(0) || 'A'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1_AdminDashboard overflow-y-auto_AdminDashboard bg-gray-50_AdminDashboard">
        <div className="py-6_AdminDashboard">
          <div className="max-w-7xl_AdminDashboard mx-auto_AdminDashboard px-4_AdminDashboard sm:px-6_AdminDashboard md:px-8_AdminDashboard">
            <div className="flex_AdminDashboard flex-col_AdminDashboard md:flex-row_AdminDashboard md:items-center_AdminDashboard md:justify-between_AdminDashboard mb-6_AdminDashboard">
              <div>
                <h1 className="text-2xl_AdminDashboard font-semibold_AdminDashboard text-gray-900_AdminDashboard">Orders Management</h1>
                <p className="mt-1_AdminDashboard text-sm_AdminDashboard text-gray-500_AdminDashboard">Manage and process customer orders</p>
              </div>
              <div className="mt-4_AdminDashboard md:mt-0_AdminDashboard flex_AdminDashboard space-x-3_AdminDashboard">
                <button 
                  type="button" 
                  onClick={handleExportOrders}
                  className="inline-flex_AdminDashboard items-center_AdminDashboard px-4_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-gray-300_AdminDashboard shadow-sm_AdminDashboard text-sm_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard text-gray-700_AdminDashboard bg-white_AdminDashboard hover:bg-gray-50_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                >
                  <svg className="-ml-1_AdminDashboard mr-2_AdminDashboard h-5_AdminDashboard w-5_AdminDashboard text-gray-500_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export
                </button>
                {/* <button
                  type="button"
                  className="inline-flex_AdminDashboard items-center_AdminDashboard px-4_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-transparent_AdminDashboard shadow-sm_AdminDashboard text-sm_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard text-white_AdminDashboard bg-brand-500_AdminDashboard hover:bg-brand-600_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                  onClick={() => navigate('/admin/orders/new')}
                >
                  <svg className="-ml-1_AdminDashboard mr-2_AdminDashboard h-5_AdminDashboard w-5_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Order
                </button> */}
              </div>
            </div>
            
            {/* Order Stats */}
            <div className="grid_AdminDashboard grid-cols-1_AdminDashboard gap-5_AdminDashboard sm:grid-cols-2_AdminDashboard lg:grid-cols-4_AdminDashboard mb-6_AdminDashboard">
              {/* Total Orders */}
              <div className="bg-white_AdminDashboard overflow-hidden_AdminDashboard shadow_AdminDashboard rounded-lg_AdminDashboard">
                <div className="px-4_AdminDashboard py-5_AdminDashboard sm:p-6_AdminDashboard">
                  <div className="flex_AdminDashboard items-center_AdminDashboard">
                    <div className="flex-shrink-0_AdminDashboard bg-brand-100_AdminDashboard rounded-md_AdminDashboard p-3_AdminDashboard">
                      <svg className="h-6_AdminDashboard w-6_AdminDashboard text-brand-600_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <div className="ml-5_AdminDashboard w-0_AdminDashboard flex-1_AdminDashboard">
                      <dl>
                        <dt className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard truncate_AdminDashboard">Total Orders</dt>
                        <dd>
                          <div className="text-lg_AdminDashboard font-semibold_AdminDashboard text-gray-900_AdminDashboard">{stats.total}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pending Orders */}
              <div className="bg-white_AdminDashboard overflow-hidden_AdminDashboard shadow_AdminDashboard rounded-lg_AdminDashboard">
                <div className="px-4_AdminDashboard py-5_AdminDashboard sm:p-6_AdminDashboard">
                  <div className="flex_AdminDashboard items-center_AdminDashboard">
                    <div className="flex-shrink-0_AdminDashboard bg-yellow-100_AdminDashboard rounded-md_AdminDashboard p-3_AdminDashboard">
                      <svg className="h-6_AdminDashboard w-6_AdminDashboard text-yellow-600_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="ml-5_AdminDashboard w-0_AdminDashboard flex-1_AdminDashboard">
                      <dl>
                        <dt className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard truncate_AdminDashboard">Pending Orders</dt>
                        <dd>
                          <div className="text-lg_AdminDashboard font-semibold_AdminDashboard text-gray-900_AdminDashboard">{stats.pending}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Processing Orders */}
              <div className="bg-white_AdminDashboard overflow-hidden_AdminDashboard shadow_AdminDashboard rounded-lg_AdminDashboard">
                <div className="px-4_AdminDashboard py-5_AdminDashboard sm:p-6_AdminDashboard">
                  <div className="flex_AdminDashboard items-center_AdminDashboard">
                    <div className="flex-shrink-0_AdminDashboard bg-blue-100_AdminDashboard rounded-md_AdminDashboard p-3_AdminDashboard">
                      <svg className="h-6_AdminDashboard w-6_AdminDashboard text-blue-600_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                      </svg>
                    </div>
                    <div className="ml-5_AdminDashboard w-0_AdminDashboard flex-1_AdminDashboard">
                      <dl>
                        <dt className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard truncate_AdminDashboard">Processing</dt>
                        <dd>
                          <div className="text-lg_AdminDashboard font-semibold_AdminDashboard text-gray-900_AdminDashboard">{stats.processing}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Completed Orders */}
              <div className="bg-white_AdminDashboard overflow-hidden_AdminDashboard shadow_AdminDashboard rounded-lg_AdminDashboard">
                <div className="px-4_AdminDashboard py-5_AdminDashboard sm:p-6_AdminDashboard">
                  <div className="flex_AdminDashboard items-center_AdminDashboard">
                    <div className="flex-shrink-0_AdminDashboard bg-green-100_AdminDashboard rounded-md_AdminDashboard p-3_AdminDashboard">
                      <svg className="h-6_AdminDashboard w-6_AdminDashboard text-green-600_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="ml-5_AdminDashboard w-0_AdminDashboard flex-1_AdminDashboard">
                      <dl>
                        <dt className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard truncate_AdminDashboard">Completed Today</dt>
                        <dd>
                          <div className="text-lg_AdminDashboard font-semibold_AdminDashboard text-gray-900_AdminDashboard">{stats.completed}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filters and Actions */}
            <div className="bg-white_AdminDashboard shadow_AdminDashboard rounded-lg_AdminDashboard mb-6_AdminDashboard">
              <div className="px-4_AdminDashboard py-5_AdminDashboard sm:p-6_AdminDashboard">
                <div className="flex_AdminDashboard flex-col_AdminDashboard md:flex-row_AdminDashboard md:items-center_AdminDashboard md:justify-between_AdminDashboard space-y-4_AdminDashboard md:space-y-0_AdminDashboard">
                  <div className="flex_AdminDashboard flex-col_AdminDashboard sm:flex-row_AdminDashboard sm:items-center_AdminDashboard space-y-3_AdminDashboard sm:space-y-0_AdminDashboard sm:space-x-4_AdminDashboard">
                    {/* Status Filter */}
                    <div className="relative_AdminDashboard">
                      <select
                        className="block_AdminDashboard w-full_AdminDashboard pl-3_AdminDashboard pr-10_AdminDashboard py-2_AdminDashboard text-base_AdminDashboard border-gray-300_AdminDashboard focus:outline-none_AdminDashboard focus:ring-brand-500_AdminDashboard focus:border-brand-500_AdminDashboard sm:text-sm_AdminDashboard rounded-md_AdminDashboard"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="ready">Ready for Pickup</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    {/* Date Filter */}
                    <div className="relative_AdminDashboard">
                      <select
                        className="block_AdminDashboard w-full_AdminDashboard pl-3_AdminDashboard pr-10_AdminDashboard py-2_AdminDashboard text-base_AdminDashboard border-gray-300_AdminDashboard focus:outline-none_AdminDashboard focus:ring-brand-500_AdminDashboard focus:border-brand-500_AdminDashboard sm:text-sm_AdminDashboard rounded-md_AdminDashboard"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this_week">This Week</option>
                        <option value="last_week">Last Week</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>
                    
                    {/* Location Filter */}
                    <div className="relative_AdminDashboard">
                      <select
                        className="block_AdminDashboard w-full_AdminDashboard pl-3_AdminDashboard pr-10_AdminDashboard py-2_AdminDashboard text-base_AdminDashboard border-gray-300_AdminDashboard focus:outline-none_AdminDashboard focus:ring-brand-500_AdminDashboard focus:border-brand-500_AdminDashboard sm:text-sm_AdminDashboard rounded-md_AdminDashboard"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      >
                        <option value="">All Locations</option>
                        <option value="downtown">Downtown</option>
                        <option value="westside">Westside</option>
                        <option value="eastside">Eastside</option>
                        <option value="northside">Northside</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex_AdminDashboard items-center_AdminDashboard space-x-3_AdminDashboard">
                    <button type="button" className="inline-flex_AdminDashboard items-center_AdminDashboard px-3_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-gray-300_AdminDashboard shadow-sm_AdminDashboard text-sm_AdminDashboard leading-4_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard text-gray-700_AdminDashboard bg-white_AdminDashboard hover:bg-gray-50_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard">
                      <svg className="-ml-0.5_AdminDashboard mr-2_AdminDashboard h-4_AdminDashboard w-4_AdminDashboard text-gray-500_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                      Filter
                    </button>
                    <button
                      type="button"
                      className="inline-flex_AdminDashboard items-center_AdminDashboard px-3_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-gray-300_AdminDashboard shadow-sm_AdminDashboard text-sm_AdminDashboard leading-4_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard text-gray-700_AdminDashboard bg-white_AdminDashboard hover:bg-gray-50_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                      onClick={() => alert('Refresh button clicked.')}
                    >
                      <svg className="-ml-0.5_AdminDashboard mr-2_AdminDashboard h-4_AdminDashboard w-4_AdminDashboard text-gray-500_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Orders Table */}
            <div className="bg-white_AdminDashboard shadow_AdminDashboard overflow-hidden_AdminDashboard sm:rounded-lg_AdminDashboard">
              <div className="overflow-x-auto_AdminDashboard">
                <table className="min-w-full_AdminDashboard divide-y_AdminDashboard divide-gray-200_AdminDashboard">
                  <thead className="bg-gray-50_AdminDashboard">
                    <tr>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        <div className="flex_AdminDashboard items-center_AdminDashboard">
                          <input id="select-all" type="checkbox" className="h-4_AdminDashboard w-4_AdminDashboard text-brand-600_AdminDashboard focus:ring-brand-500_AdminDashboard border-gray-300_AdminDashboard rounded" />
                          <label htmlFor="select-all" className="sr-only_AdminDashboard">Select All</label>
                        </div>
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Order ID
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Customer
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Date &amp; Time
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Items
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Total
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Status
                      </th>
                      <th scope="col" className="px-6_AdminDashboard py-3_AdminDashboard text-left_AdminDashboard text-xs_AdminDashboard font-medium_AdminDashboard text-gray-500_AdminDashboard uppercase_AdminDashboard tracking-wider_AdminDashboard">
                        Location
                      </th>
                      <th scope="col" className="relative_AdminDashboard px-6_AdminDashboard py-3_AdminDashboard">
                        <span className="sr-only_AdminDashboard">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white_AdminDashboard divide-y_AdminDashboard divide-gray-200_AdminDashboard">
                    {filteredOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr 
                          className="order-row_AdminDashboard hover:bg-gray-50_AdminDashboard cursor-pointer_AdminDashboard" 
                          onClick={() => handleOrderClick(order.id)}
                        >
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <div className="flex_AdminDashboard items-center_AdminDashboard">
                              <input
                                type="checkbox"
                                className="h-4_AdminDashboard w-4_AdminDashboard text-brand-600_AdminDashboard focus:ring-brand-500_AdminDashboard border-gray-300_AdminDashboard rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <div className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-900_AdminDashboard">#{order.id}</div>
                            <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">Online</div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <div className="flex_AdminDashboard items-center_AdminDashboard">
                              <div className="flex-shrink-0_AdminDashboard h-8_AdminDashboard w-8_AdminDashboard rounded-full_AdminDashboard bg-green-100_AdminDashboard flex_AdminDashboard items-center_AdminDashboard justify-center_AdminDashboard text-green-700_AdminDashboard font-medium_AdminDashboard">
                                {order.customerName.charAt(0)}
                              </div>
                              <div className="ml-4_AdminDashboard">
                                <div className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-900_AdminDashboard">
                                  {/* Show user's name from users collection if available, otherwise show order's customerName */}
                                  {order.userId && usersData[order.userId] && (usersData[order.userId].displayName || usersData[order.userId].name)
                                    ? (usersData[order.userId].displayName || usersData[order.userId].name)
                                    : (order.customerName === 'Anonymous' && (order.customerEmail || order.customerPhone)
                                        ? (order.customerEmail || order.customerPhone)
                                        : order.customerName)}
                                </div>
                                {/* Display user information from users collection if available */}
                                {order.userId && usersData[order.userId] ? (
                                  usersData[order.userId].email ? (
                                    <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">
                                      {usersData[order.userId].email}
                                    </div>
                                  ) : usersData[order.userId].phoneNumber ? (
                                    <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">
                                      {usersData[order.userId].phoneNumber}
                                    </div>
                                  ) : null
                                ) : (
                                  // Fallback to order document data if no user data
                                  order.customerEmail ? (
                                    <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">
                                      {order.customerEmail}
                                    </div>
                                  ) : order.customerPhone ? (
                                    <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">
                                      {order.customerPhone}
                                    </div>
                                  ) : null
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <div className="text-sm_AdminDashboard text-gray-900_AdminDashboard">
                              {new Date(order.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">
                              {new Date(order.timestamp).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <div className="text-sm_AdminDashboard text-gray-900_AdminDashboard">{order.items.length} items</div>
                            <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">
                              {order.items.map(item => item.name).join(', ')}
                            </div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <div className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-900_AdminDashboard">₹{order.total}</div>
                            <div className="text-xs_AdminDashboard text-gray-500_AdminDashboard">Paid ({order.paymentMethod})</div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard">
                            <select
                              className={`status-badge_AdminDashboard ${order.status}_AdminDashboard`}
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="ready">Ready for Pickup</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard text-sm_AdminDashboard text-gray-500_AdminDashboard">
                            <div>
                              {order.delivery.detailedAddress}
                              {order.delivery.floor && `, Floor ${order.delivery.floor}`}
                            </div>
                          </td>
                          <td className="px-6_AdminDashboard py-4_AdminDashboard whitespace-nowrap_AdminDashboard text-right_AdminDashboard text-sm_AdminDashboard font-medium_AdminDashboard">
                            <button
                              className="text-brand-600_AdminDashboard hover:text-brand-900_AdminDashboard"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderClick(order.id);
                              }}
                            >
                              <svg className="h-5_AdminDashboard w-5_AdminDashboard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                        
                        {/* Order Details Panel */}
                        {expandedOrders[order.id] && (
                          <tr className="bg-gray-50_AdminDashboard">
                            <td colSpan="9_AdminDashboard" className="px-6_AdminDashboard py-0_AdminDashboard">
                              <div className="order-details-panel_AdminDashboard">
                                <div className="py-4_AdminDashboard">
                                  <div className="grid_AdminDashboard grid-cols-1_AdminDashboard md:grid-cols-3_AdminDashboard gap-6_AdminDashboard">
                                    {/* Order Items */}
                                    <div className="md:col-span-2_AdminDashboard">
                                      <h4 className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-900_AdminDashboard mb-3_AdminDashboard">Order Items</h4>
                                      <div className="bg-white_AdminDashboard rounded-md_AdminDashboard shadow-sm_AdminDashboard p-4_AdminDashboard space-y-4_AdminDashboard">
                                        {order.items && order.items.length > 0 ? (
                                          order.items.map((item, index) => (
                                            <div key={index} className="flex_AdminDashboard">
                                              <div className="w-12_AdminDashboard h-12_AdminDashboard bg-green-100_AdminDashboard rounded-lg_AdminDashboard flex_AdminDashboard items-center_AdminDashboard justify-center_AdminDashboard mr-4_AdminDashboard">
                                                <div className="w-8_AdminDashboard h-8_AdminDashboard bg-green-200_AdminDashboard rounded-full_AdminDashboard flex_AdminDashboard items-center_AdminDashboard justify-center_AdminDashboard">
                                                  <svg className="w-4_AdminDashboard h-4_AdminDashboard text-brand-500_AdminDashboard" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 15.5C14.21_AdminDashboard 15.5 16 13.71_AdminDashboard 16 11.5V6C16 3.79_AdminDashboard 14.21_AdminDashboard 2 12 2C9.79_AdminDashboard 2 8 3.79_AdminDashboard 8 6V11.5C8 13.71_AdminDashboard 9.79_AdminDashboard 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div className="flex-grow_AdminDashboard">
                                                <div className="flex_AdminDashboard justify-between_AdminDashboard">
                                                  <div>
                                                    <h5 className="font-medium_AdminDashboard text-gray-800_AdminDashboard">{item.name}</h5>
                                                    <p className="text-sm_AdminDashboard text-gray-500_AdminDashboard">{item.size} • {item.milk}</p>
                                                  </div>
                                                  <span className="text-gray-800_AdminDashboard">₹{item.price * item.quantity}</span>
                                                </div>
                                                {item.addons && item.addons.length > 0 && (
                                                  <div className="mt-2_AdminDashboard flex_AdminDashboard flex-wrap_AdminDashboard gap-1_AdminDashboard">
                                                    {item.addons.map((addon, idx) => (
                                                      <span key={idx} className="bg-gray-100_AdminDashboard text-gray-600_AdminDashboard text-xs_AdminDashboard px-2_AdminDashboard py-0.5_AdminDashboard rounded-full_AdminDashboard">
                                                        {addon}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-sm_AdminDashboard text-gray-500_AdminDashboard">No items in this order</div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Order Info */}
                                    <div>
                                      <h4 className="text-sm_AdminDashboard font-medium_AdminDashboard text-gray-900_AdminDashboard mb-3_AdminDashboard">Order Information</h4>
                                      <div className="bg-white_AdminDashboard rounded-md_AdminDashboard shadow-sm_AdminDashboard p-4_AdminDashboard space-y-4_AdminDashboard">
                                        <div>
                                          <h5 className="text-xs_AdminDashboard font-medium_AdminDashboard text-gray-700_AdminDashboard uppercase_AdminDashboard mb-2_AdminDashboard">Customer Details</h5>
                                          <p className="text-sm_AdminDashboard text-gray-800_AdminDashboard">{order.customerName}</p>
                                          <p className="text-sm_AdminDashboard text-gray-600_AdminDashboard">{order.customerEmail}</p>
                                          <p className="text-sm_AdminDashboard text-gray-600_AdminDashboard">{order.customerPhone}</p>
                                        </div>
                                        
                                        <div className="border-t_AdminDashboard border-gray-200_AdminDashboard pt-4_AdminDashboard">
                                          <h5 className="text-xs_AdminDashboard font-medium_AdminDashboard text-gray-700_AdminDashboard uppercase_AdminDashboard mb-2_AdminDashboard">Delivery Details</h5>
                                          <p className="text-sm_AdminDashboard text-gray-800_AdminDashboard">{order.delivery.detailedAddress}</p>
                                          <p className="text-sm_AdminDashboard text-gray-600_AdminDashboard">{order.delivery.floor && `Floor: ${order.delivery.floor}`}</p>
                                          <p className="text-sm_AdminDashboard text-gray-600_AdminDashboard">{order.delivery.estimatedDelivery && `Est. Delivery: ${new Date(order.delivery.estimatedDelivery).toLocaleString()}`}</p>
                                        </div>
                                        
                                        <div className="border-t_AdminDashboard border-gray-200_AdminDashboard pt-4_AdminDashboard">
                                          <h5 className="text-xs_AdminDashboard font-medium_AdminDashboard text-gray-700_AdminDashboard uppercase_AdminDashboard mb-2_AdminDashboard">Payment Information</h5>
                                          <p className="text-sm_AdminDashboard text-gray-800_AdminDashboard">{order.paymentMethod}</p>
                                          <p className="text-sm_AdminDashboard text-gray-600_AdminDashboard">Status: {order.paymentStatus}</p>
                                        </div>
                                        
                                        <div className="border-t_AdminDashboard border-gray-200_AdminDashboard pt-4_AdminDashboard">
                                          <h5 className="text-xs_AdminDashboard font-medium_AdminDashboard text-gray-700_AdminDashboard uppercase_AdminDashboard mb-2_AdminDashboard">Order Summary</h5>
                                          <div className="space-y-1_AdminDashboard">
                                            <div className="flex_AdminDashboard justify-between_AdminDashboard text-sm_AdminDashboard">
                                              <span className="text-gray-600_AdminDashboard">Subtotal</span>
                                              <span className="text-gray-800_AdminDashboard">₹{order.total}</span>
                                            </div>
                                            <div className="flex_AdminDashboard justify-between_AdminDashboard font-medium_AdminDashboard pt-2_AdminDashboard border-t_AdminDashboard border-gray-100_AdminDashboard mt-2_AdminDashboard">
                                              <span>Total</span>
                                              <span>₹{order.total}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Order Actions */}
                                      <div className="mt-4_AdminDashboard space-y-2_AdminDashboard">
                                        <button
                                          type="button"
                                          className="w-full_AdminDashboard inline-flex_AdminDashboard justify-center_AdminDashboard items-center_AdminDashboard px-4_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-transparent_AdminDashboard text-sm_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard shadow-sm_AdminDashboard text-white_AdminDashboard bg-brand-500_AdminDashboard hover:bg-brand-600_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                                          onClick={() => updateOrderStatus(order.id, 'ready')}
                                        >
                                          Mark as Ready
                                        </button>
                                        <button
                                          type="button"
                                          className="w-full_AdminDashboard inline-flex_AdminDashboard justify-center_AdminDashboard items-center_AdminDashboard px-4_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-gray-300_AdminDashboard shadow-sm_AdminDashboard text-sm_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard text-gray-700_AdminDashboard bg-white_AdminDashboard hover:bg-gray-50_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                                        >
                                          Print Receipt
                                        </button>
                                        <button
                                          type="button"
                                          className="w-full_AdminDashboard inline-flex_AdminDashboard justify-center_AdminDashboard items-center_AdminDashboard px-4_AdminDashboard py-2_AdminDashboard border_AdminDashboard border-gray-300_AdminDashboard shadow-sm_AdminDashboard text-sm_AdminDashboard font-medium_AdminDashboard rounded-md_AdminDashboard text-gray-700_AdminDashboard bg-white_AdminDashboard hover:bg-gray-50_AdminDashboard focus:outline-none_AdminDashboard focus:ring-2_AdminDashboard focus:ring-offset-2_AdminDashboard focus:ring-brand-500_AdminDashboard"
                                        >
                                          Contact Customer
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard; 