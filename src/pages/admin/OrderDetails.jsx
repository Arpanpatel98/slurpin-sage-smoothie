import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './OrderDetails.css';

const DEFAULT_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Fdefault-product.png?alt=media&token=your-token";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const data = orderSnap.data();
          setOrder({
            id: orderSnap.id,
            status: data.status?.order || 'pending',
            timestamp: data.timestamps?.created || new Date().toISOString(),
            total: data.orderSummary?.subtotal || 0,
            items: data.items?.map((item) => ({
              name: item.name,
              size: item.customization?.size || 'regular',
              milk: item.customization?.milk || 'none',
              price: item.price || 0,
              quantity: item.quantity || 1,
              image: item.image || DEFAULT_IMAGE_URL,
              addons: [
                ...(item.customization?.boosters?.map((b) => b.name) || []),
                ...(item.customization?.toppings?.map((t) => t.name) || []),
              ].filter(Boolean),
            })) || [],
            customerName: data.userName || 'Anonymous',
            customerEmail: data.userEmail || 'No email provided',
            customerPhone: data.customerPhone || 'No phone provided',
            delivery: {
              detailedAddress: data.delivery?.address?.detailedAddress || '',
              floor: data.delivery?.address?.floor || '',
              status: data.delivery?.status || 'pending',
              estimatedDelivery: data.delivery?.estimatedDelivery || '',
            },
            paymentMethod: data.payment?.method || 'Not specified',
            paymentStatus: data.payment?.status || 'pending',
          });
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Error fetching order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        'status.order': newStatus,
        'status.updatedAt': new Date().toISOString(),
      });
      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">Order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button and Status */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Orders
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready for Pickup</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-brand-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_IMAGE_URL;
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
                              <span className="text-sm text-gray-600">•</span>
                              <p className="text-sm text-gray-600">{item.size} • {item.milk}</p>
                              <span className="text-sm text-gray-600">•</span>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-base font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                          </div>
                          {item.addons.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.addons.map((addon, idx) => (
                                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                                  {addon}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
                <dl className="space-y-4">
                  <div className="flex justify-between items-center">
                    <dt className="text-base font-medium text-gray-600">Subtotal</dt>
                    <dd className="text-base font-semibold text-gray-900">₹{order.total}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-base font-medium text-gray-600">Tax</dt>
                    <dd className="text-base font-semibold text-gray-900">₹{(order.total * 0.18).toFixed(2)}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <dt className="text-lg font-semibold text-gray-900">Total</dt>
                      <dd className="text-lg font-bold text-gray-900">₹{order.total}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column - Order Info */}
          <div className="space-y-6">
            {/* Order Information Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Information</h3>
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Order ID:</dt>
                    <dd className="text-base font-semibold text-gray-900">#{order.id}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Date & Time:</dt>
                    <dd className="text-base text-gray-900">
                      {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Method:</dt>
                    <dd className="text-base font-medium text-gray-900">{order.paymentMethod}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Status:</dt>
                    <dd>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Order Status:</dt>
                    <dd>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Customer Information Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h3>
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Name:</dt>
                    <dd className="text-base font-medium text-gray-900">{order.customerName}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email:</dt>
                    <dd className="text-base text-gray-900">{order.customerEmail}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Phone:</dt>
                    <dd className="text-base text-gray-900">{order.customerPhone}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Delivery Information Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h3>
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Address:</dt>
                    <dd className="text-base text-gray-900">{order.delivery.detailedAddress}</dd>
                  </div>
                  {order.delivery.floor && (
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-gray-500">Floor:</dt>
                      <dd className="text-base text-gray-900">{order.delivery.floor}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Delivery Status:</dt>
                    <dd>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        order.delivery.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.delivery.status}
                      </span>
                    </dd>
                  </div>
                  {order.delivery.estimatedDelivery && (
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-gray-500">Estimated Delivery:</dt>
                      <dd className="text-base text-gray-900">
                        {new Date(order.delivery.estimatedDelivery).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 