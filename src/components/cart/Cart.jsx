import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import RecommendedProduct from './RecommendedProduct';
import OrderSummary from './OrderSummary';
import ProductCustomization from './ProductCustomizationModal';
import DeliveryForm from '../DeliveryForm';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

const recommendedProducts = [
  {
    id: 'tropical-twist',
    name: 'Tropical Twist',
    description: 'A refreshing blend of mango, pineapple, and coconut water.',
    price: 6.99,
    gradient: 'yellow',
  },
  {
    id: 'green-glow',
    name: 'Green Glow',
    description: 'Spinach, kale, apple, and ginger for a vibrant boost.',
    price: 7.49,
    gradient: 'purple',
  },
  {
    id: 'berry-blast',
    name: 'Berry Blast',
    description: 'Mixed berries, banana, and almond milk for a sweet treat.',
    price: 6.49,
    gradient: 'blue',
  },
];

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, showCustomization, calculateTotals, clearCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' or 'delivery'
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (checkoutStep === 'delivery') {
      fetchAddresses();
    }
  }, [checkoutStep]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setAddresses([]);
        return;
      }

      const q = query(
        collection(db, 'delivery_addresses'),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const addressList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAddresses(addressList);
      if (addressList.length > 0) {
        setSelectedAddress(addressList[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    setCheckoutStep('delivery');
  };

  const handleBackToCart = () => {
    setCheckoutStep('cart');
  };

  const handleAddressAdded = () => {
    fetchAddresses();
  };

  const handleAddressSelect = (addressId) => {
    setSelectedAddress(addressId);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteDoc(doc(db, 'delivery_addresses', addressId));
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      if (selectedAddress === addressId) {
        setSelectedAddress(addresses.length > 1 ? addresses[0].id : null);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddresses([]); // This will trigger the DeliveryForm to show
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setAddresses([]);
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      
      // Get the total from calculateTotals
      const { total } = calculateTotals();
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Math.round(total * 100), // Convert to paise and ensure it's an integer
          currency: 'INR',
          name: 'Slurpin Sage',
          description: 'Payment for your order',
          handler: async function (response) {
            try {
              // Create order data with proper validation
              const orderData = {
                userId: auth.currentUser?.uid || null,
                items: cartItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  addIns: item.addIns || []
                })),
                total: total,
                paymentId: response.razorpay_payment_id || null,
                orderId: response.razorpay_order_id || null,
                signature: response.razorpay_signature || null,
                deliveryAddress: selectedAddress ? addresses.find(addr => addr.id === selectedAddress) : null,
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                paymentStatus: 'completed'
              };

              // Validate required fields before saving
              if (!orderData.userId) {
                throw new Error('User ID is required');
              }

              if (!orderData.items || orderData.items.length === 0) {
                throw new Error('Order must contain items');
              }

              if (!orderData.deliveryAddress) {
                throw new Error('Delivery address is required');
              }

              // Save order to Firestore
              const orderRef = await addDoc(collection(db, 'orders'), orderData);
              
              // Clear the cart
              clearCart();
              
              // Navigate to success page with order ID
              navigate('/order-success', { 
                state: { 
                  orderId: orderRef.id,
                  total: total
                }
              });
            } catch (error) {
              console.error('Error saving order:', error);
              setPaymentProcessing(false);
              // Show error message to user
              alert('There was an error processing your order. Please try again.');
            }
          },
          prefill: {
            name: auth.currentUser?.displayName || '',
            email: auth.currentUser?.email || '',
            contact: auth.currentUser?.phoneNumber || ''
          },
          theme: {
            color: '#256029'
          },
          modal: {
            ondismiss: function() {
              setPaymentProcessing(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      script.onerror = () => {
        console.error('Razorpay SDK failed to load');
        setPaymentProcessing(false);
        alert('Failed to load payment system. Please try again.');
      };
    } catch (error) {
      console.error('Error initializing payment:', error);
      setPaymentProcessing(false);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const renderProgressBar = () => (
    <div className="progress_container_cart slide_up_global" style={{ animationDelay: '0.2s' }}>
      <span className={`progress_label_cart ${checkoutStep === 'cart' ? 'text-sage-600' : 'text-gray-400'}`}>Cart</span>
      <span className={`progress_label_cart ${checkoutStep === 'delivery' ? 'text-sage-600' : 'text-gray-400'}`}>Checkout</span>
      <span className="progress_inactive_cart">Order Confirmation</span>
    </div>
  );

  const renderContent = () => {
    if (cartItems.length === 0) {
      return (
        <div className="empty_cart slide_up_global" style={{ animationDelay: '0.4s' }}>
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="empty_message_cart text-xl font-medium text-gray-600">Your cart is empty</p>
            <Link to="/menu" className="shop_button_cart mt-6 inline-block bg-sage-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sage-600 transition-colors">
            Start Shopping
          </Link>
          </div>
        </div>
      );
    }

    if (checkoutStep === 'delivery') {
      return (
        <div className="slide_up_global" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white rounded-lg shadow-lg p-6">
          <button 
            onClick={handleBackToCart}
              className="mb-6 flex items-center text-sage-600 hover:text-sage-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </button>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading addresses...</p>
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-800">Select Delivery Address</h2>
                  <button
                    onClick={handleAddNewAddress}
                    className="flex items-center text-sage-600 hover:text-sage-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Address
                  </button>
                </div>

                <div className="grid gap-4">
                  {addresses.slice(0, showAllAddresses ? addresses.length : 2).map((address) => (
                    <div
                      key={address.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === address.id
                          ? 'border-sage-500 bg-sage-50'
                          : 'border-gray-200 hover:border-sage-300'
                      }`}
                      onClick={() => handleAddressSelect(address.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedAddress === address.id
                                  ? 'border-sage-500 bg-sage-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selectedAddress === address.id && (
                                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <p className="font-medium text-gray-900">{address.displayName}</p>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {address.detailedAddress}
                              </p>
                              {address.floor && (
                                <p className="text-sm text-gray-500 flex items-center">
                                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  Floor: {address.floor}
                                </p>
                              )}
                              {address.landmark && (
                                <p className="text-sm text-gray-500 flex items-center">
                                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Landmark: {address.landmark}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            className="text-gray-400 hover:text-sage-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(address.id);
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {addresses.length > 2 && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setShowAllAddresses(!showAllAddresses)}
                      className="flex items-center text-sage-600 hover:text-sage-700 transition-colors"
                    >
                      {showAllAddresses ? (
                        <>
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                          Show Less
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                          See More Addresses
                        </>
                      )}
                    </button>
                  </div>
                )}

                {selectedAddress && (
                  <div className="flex justify-end">
                    <button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className={`px-6 py-2 bg-sage-500 text-white rounded-lg transition-colors ${
                        paymentProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sage-600'
                      }`}
                    >
                      {paymentProcessing ? 'Processing...' : 'Continue to Payment'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {editingAddress ? 'Edit Delivery Address' : 'Add New Address'}
                </h2>
                <DeliveryForm 
                  onAddressAdded={handleAddressAdded} 
                  existingAddress={editingAddress}
                  onCancel={() => {
                    setEditingAddress(null);
                    fetchAddresses();
                  }}
                />
              </div>
            )}

            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Address</h3>
                  <p className="text-gray-600 mb-6">Are you sure you want to delete this address? This action cannot be undone.</p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(showDeleteConfirm)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="layout_cart">
        <div className="items_container_cart custom_scrollbar_global">
          {cartItems.map((item, index) => (
            <CartItem key={item.id} item={item} index={index} />
          ))}
        </div>
        <OrderSummary onProceedToCheckout={handleProceedToCheckout} />
      </div>
    );
  };

  return (
    <div className="container_cart">
      <div className="slide_up_global" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="title_cart text-2xl font-bold text-gray-800">Your Cart</h2>
          <Link to="/menu" className="continue_shopping_cart flex items-center text-sage-600 hover:text-sage-700 transition-colors">
            <svg className="continue_icon_cart w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Continue Shopping
        </Link>
        </div>
      </div>
      {renderProgressBar()}
      <div className="progress_bar_cart slide_up_global" style={{ animationDelay: '0.3s' }}>
        <div 
          className="progress_fill_cart" 
          style={{ width: checkoutStep === 'cart' ? '33.33%' : '66.66%' }}
        ></div>
      </div>
      {renderContent()}
      {showCustomization && <ProductCustomization />}
    </div>
  );
};

export default Cart;