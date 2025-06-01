import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-[#137B3B] mx-auto"
            className="w-16 h-16 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mb-4">
          Thank you for your order. We'll start preparing your smoothie right away.
        </p>
        {orderId && (
          <p className="text-gray-600 mb-4">
            Order ID: {orderId}
          </p>
        )}
        {total && (
          <p className="text-gray-600 mb-8">
            Total Amount: ₹{total.toFixed(2)}
          </p>
        )}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-sage-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-sage-600 transition-colors"
          >
            View Order Status
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess; 