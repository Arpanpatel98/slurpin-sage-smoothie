import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './OrderDetails.css';

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
            orderId: orderSnap.id,
            status: data.status?.order || 'pending',
            timestamp: data.timestamps?.created || new Date().toISOString(),
            total: data.orderSummary?.subtotal || 0,
            addInsTotal: data.orderSummary?.addIns || 0,
            tax: data.orderSummary?.tax || 0,
            discount: data.orderSummary?.discount || 0,
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
            customerName: data.customerName || 'Anonymous',
            customerEmail: data.customerEmail || 'No email provided',
            customerPhone: data.customerPhone || 'No phone provided',
            orderDetails: {
              location: data.delivery?.displayName || 'Unknown Location',
              address: data.delivery?.detailedAddress || 'No address provided',
              instructions: data.delivery?.instructions || 'No special instructions',
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

  if (loading) {
    return (
      <div className="order-details-page_AdminDashboard">
        <div className="loading_AdminDashboard">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-page_AdminDashboard">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page_AdminDashboard">
        <div className="error">Order not found</div>
      </div>
    );
  }

  return (
    <div className="order-details-page_AdminDashboard">
      <div className="order-header_AdminDashboard">
        <h1 className="order-title_AdminDashboard">Order #{orderId}</h1>
        <p className="order-date_AdminDashboard">
          {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString()}
        </p>
      </div>

      <div className="order-status_AdminDashboard">
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="status-select_AdminDashboard"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="cooking">Cooking</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <div className="order-content_AdminDashboard">
        <div className="items-list_AdminDashboard">
          {order.items.map((item, index) => (
            <div key={index} className="order-item_AdminDashboard">
              <div className="item-details_AdminDashboard">
                <h3 className="item-name_AdminDashboard">{item.name}</h3>
                <p className="item-variant_AdminDashboard">
                  {item.size} • {item.milk}
                </p>
                {item.addons.length > 0 && (
                  <p className="item-addons_AdminDashboard">
                    Add-ons: {item.addons.join(', ')}
                  </p>
                )}
                <span className="item-quantity_AdminDashboard">x{item.quantity}</span>
              </div>
              <p className="item-price_AdminDashboard">₹{item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        <div className="order-summary_AdminDashboard">
          <h2 className="summary-title_AdminDashboard">Order Summary</h2>
          <div className="summary-row_AdminDashboard">
            <span>Subtotal</span>
            <span>₹{order.total}</span>
          </div>
          <div className="summary-row_AdminDashboard">
            <span>Tax</span>
            <span>₹{(order.total * 0.18).toFixed(2)}</span>
          </div>
          <div className="summary-row_AdminDashboard">
            <span>Delivery Fee</span>
            <span>₹{order.deliveryFee || 0}</span>
          </div>
          <div className="summary-row_AdminDashboard discount_AdminDashboard">
            <span>Discount</span>
            <span>-₹{order.discount || 0}</span>
          </div>
          <div className="summary-row_AdminDashboard total_AdminDashboard">
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 