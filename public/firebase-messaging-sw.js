importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase with minimal configuration
firebase.initializeApp({
    apiKey: "AIzaSyDB_-d-Tx7wi5hhagq1LMmeaLGH6ikNH_g",
    authDomain: "slurpin-sage.firebaseapp.com",
    projectId: "slurpin-sage",
    storageBucket: "slurpin-sage.firebasestorage.app",
    messagingSenderId: "496868645145",
    appId: "1:496868645145:web:339d36ab343393f3148d88",
    measurementId: "G-278ERY88W6"
});

const messaging = firebase.messaging();

// Cache for notification icons
const iconCache = new Map();

// Optimize message handling with debouncing
let messageQueue = [];
let processingTimeout = null;

const processMessageQueue = () => {
  if (messageQueue.length === 0) return;

  const payload = messageQueue.shift();
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/path/to/your/icon.png',
    badge: '/path/to/your/badge.png',
    tag: payload.data?.tag || 'default',
    renotify: true,
    requireInteraction: true,
    actions: payload.data?.actions || [],
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions)
    .catch(error => console.error('Error showing notification:', error));

  // Process next message if any
  if (messageQueue.length > 0) {
    processingTimeout = setTimeout(processMessageQueue, 100);
  } else {
    processingTimeout = null;
  }
};

// Handle background messages with debouncing
messaging.onBackgroundMessage((payload) => {
  messageQueue.push(payload);
  
  if (!processingTimeout) {
    processingTimeout = setTimeout(processMessageQueue, 0);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
}); 