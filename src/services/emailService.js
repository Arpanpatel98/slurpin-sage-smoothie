import { getFunctions, httpsCallable } from "firebase/functions";
import app from '../firebase';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Function to send email notification to admin
export const sendOrderEmailNotification = async (orderData) => {
  try {
    console.log('Sending email notification for order:', orderData);
    const sendEmail = httpsCallable(functions, 'sendOrderEmail');
    
    const emailData = {
      to: import.meta.env.VITE_ADMIN_EMAIL,
      subject: `New Order Received - Order #${orderData.orderId}`,
      template: 'order-notification',
      data: {
        orderId: orderData.orderId,
        customerName: orderData.userName || 'Guest',
        customerEmail: orderData.userEmail || 'No email provided',
        total: orderData.orderSummary.total,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          customization: item.customization
        })),
        deliveryAddress: orderData.delivery.address,
        orderTime: new Date(orderData.timestamps.created).toLocaleString(),
        paymentMethod: orderData.payment.method,
        paymentStatus: orderData.payment.status
      }
    };

    console.log('Calling sendEmail function with data:', emailData);
    const result = await sendEmail(emailData);
    console.log('Email sent successfully:', result);

    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to send email');
    }

    return {
      ...result.data,
      message: 'Email notification sent successfully to admin'
    };

  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}; 