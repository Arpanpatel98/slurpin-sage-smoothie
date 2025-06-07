import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import app from '../firebase';

// Initialize Firebase Cloud Messaging and Functions
const messaging = getMessaging(app);
const functions = getFunctions(app, 'us-central1');

// Function to request notification permission and get FCM token (admin only)
export const requestNotificationPermission = async () => {
  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission status:', permission);
    
    if (permission === 'granted') {
      console.log('Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      console.log('FCM Token received:', token);
      return token;
    }
    throw new Error('Notification permission denied');
  } catch (error) {
    console.error('Error getting notification permission:', error);
    throw error;
  }
};

// Function to send notification to admin
export const sendOrderNotification = async (orderData) => {
  try {
    console.log('Sending notification for order:', orderData);
    const sendNotification = httpsCallable(functions, 'sendNotification');
    
    // Get admin token from Firestore
    const adminTokenDoc = await getDoc(doc(db, 'fcmTokens', userId));
    if (!adminTokenDoc.exists()) {
      throw new Error('Admin FCM token not found');
    }

    const adminToken = adminTokenDoc.data().token;
    console.log('Using admin FCM token:', adminToken);

    const message = {
      token: adminToken,
      title: 'New Order Received!',
      body: `Order #${orderData.orderId} has been placed. Total: ₹${orderData.orderSummary.total}`,
      data: {
        orderId: orderData.orderId,
        total: orderData.orderSummary.total.toString(),
        timestamp: new Date().toISOString()
      }
    };

    console.log('Calling sendNotification function with message:', message);
    const result = await sendNotification(message);
    console.log('Notification sent successfully:', result);

    if (!result.data.success) {
      if (result.data.code === 'messaging/invalid-registration-token' || 
          result.data.code === 'messaging/registration-token-not-registered') {
        throw new Error('Admin FCM token is invalid. Please visit the admin page to update the token.');
      }
      throw new Error(result.data.error || 'Failed to send notification');
    }

    return {
      ...result.data,
      message: 'Notification sent successfully to admin'
    };

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Test function to simulate order creation and notification
export const testNotification = async () => {
  try {
    console.log('Starting notification test...');
    
    // Create a test order
    const testOrder = {
      orderId: `TEST${Date.now()}`,
      orderSummary: {
        total: 299.99
      }
    };
    
    console.log('Sending test notification for order:', testOrder);
    // Send test notification
    const result = await sendOrderNotification(testOrder);
    console.log('Test notification result:', result);
    
    return {
      success: true,
      message: 'Test notification sent successfully to admin',
      result: result
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 