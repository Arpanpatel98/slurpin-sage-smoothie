// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize messaging only if supported
let messaging = null;
const initializeMessaging = async () => {
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
    } else {
      console.log('Firebase messaging is not supported in this browser');
    }
  } catch (error) {
    console.log('Error initializing Firebase messaging:', error);
  }
};

// Initialize messaging
initializeMessaging();

// Handle auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.email);
  } else {
    console.log('User is signed out');
  }
}, (error) => {
  // Handle auth errors
  console.error('Auth state change error:', error);
  if (error.code === 'auth/unauthorized-domain') {
    const currentDomain = window.location.hostname;
    console.warn('Unauthorized domain. Please add this domain to Firebase Console:');
    console.warn('1. Go to Firebase Console > Authentication > Settings');
    console.warn('2. Add your domain to "Authorized domains"');
    console.warn('3. Current domain:', currentDomain);
    
    // Show a user-friendly message in the console
    console.warn(`
      ============================================
      OAuth Domain Configuration Required
      ============================================
      Your current domain (${currentDomain}) is not authorized for OAuth operations.
      This prevents sign-in with popup/redirect from working.
      
      To fix this:
      1. Go to Firebase Console (https://console.firebase.google.com)
      2. Select your project
      3. Go to Authentication > Settings
      4. Click on "Authorized domains" tab
      5. Click "Add domain"
      6. Add: ${currentDomain}
      7. Save changes
      
      After adding the domain, refresh this page.
      ============================================
    `);
  }
});

// Handle token refresh
auth.onIdTokenChanged((user) => {
  if (user) {
    console.log('User token refreshed');
  }
}, (error) => {
  console.error('Token refresh error:', error);
});

// Export the Firebase services
export const fetchProductData = async (category, productId) => {
  try {
    const docRef = doc(db, 'products/config', category, productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error fetching product data:', error);
    throw error;
  }
};

export { auth, db, storage, messaging };
export default app;
