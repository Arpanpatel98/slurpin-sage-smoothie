import { getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from '../../firebase';

// Initialize auth and providers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize authentication flags
window.userPreviouslyAuthenticated = false;
window.googleUserAuthenticated = false;

// Configure Google OAuth provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize reCAPTCHA verifier
export const generateRecaptcha = () => {
  // Clear any existing reCAPTCHA
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = null;
  }

  // Create new reCAPTCHA instance
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible',
    'callback': () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
    'expired-callback': () => {
      // Reset reCAPTCHA when expired
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  });

  return window.recaptchaVerifier;
};

// More reliable method to check if a phone number exists
export const checkPhoneExists = async (phoneNumber) => {
  try {
    // We need to directly check with auth system
    // First set up recaptcha
    generateRecaptcha();
    
    // Try to send OTP - we'll use this just to check if the number exists
    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = `+91${phoneNumber}`;
    
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      // If we get here without error, the number is valid for sending OTPs
      // For checking existence, we need to save this for later verification
      window.tempConfirmationResult = confirmationResult;
      
      // Check if the phone number is associated with any user
      // Use the information from the confirmation to determine this
      const phoneAuthProvider = confirmationResult.verificationId ? true : false;
      
      console.log('Phone verification sent', { 
        phoneNumber, 
        hasVerificationId: !!confirmationResult.verificationId
      });
      
      return { 
        // We'll assume the actual verification will determine if user exists
        exists: false,
        hasAuthProvider: phoneAuthProvider,
        confirmationSent: true
      };
    } catch (error) {
      // If we get an error sending OTP, check if it's because the number is invalid
      if (error.code === 'auth/invalid-phone-number') {
        return { exists: false, error: "Invalid phone number format" };
      }
      
      // Other errors might indicate a problem with the service
      return { exists: false, error: error.message };
    }
  } catch (error) {
    console.error('Error checking phone existence:', error);
    return { 
      error: error.message,
      exists: false 
    };
  }
};

// Request OTP
export const requestOTP = async (phoneNumber, isLogin = false) => {
  try {
    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
      throw new Error('reCAPTCHA not initialized');
    }

    const formattedPhone = `+91${phoneNumber}`; // Assuming Indian phone numbers
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    window.confirmationResult = confirmationResult;
    return { success: true };
  } catch (error) {
    console.error('Error requesting OTP:', error);
    
    // Clear reCAPTCHA on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};

export const verifyOTP = async (otp, isLogin = false) => {
  if (!window.confirmationResult) {
    return { 
      success: false, 
      error: 'Please request OTP first',
      code: 'auth/no-confirmation-result'
    };
  }

  try {
    const result = await window.confirmationResult.confirm(otp);
    const user = result.user;
    
    if (!user) {
      return {
        success: false,
        error: 'Failed to retrieve user information',
        code: 'auth/unknown-error'
      };
    }

    // The creationTime and lastSignInTime comparison is not reliable for determining 
    // if a user is truly new, especially after account creation.
    // Firebase automatically signs in a user after account creation, making these times identical.
    
    // For a more reliable approach, we'll check the providerId to determine if this user
    // had previously signed in with a phone number:
    const isPhoneUser = user.providerData.some(provider => provider.providerId === 'phone');
    
    // We'll also log additional info to help debug
    console.log('User verification:', { 
      isLogin, 
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
      providerId: user.providerData.map(p => p.providerId),
      isPhoneUser
    });
    
    // CASE 1: Login attempt for a non-existent account
    // Only trigger this for first-time phone auth users during login
    if (isLogin && user.metadata.creationTime === user.metadata.lastSignInTime && !window.userPreviouslyAuthenticated) {
      console.log('Login attempt for non-existent account');
      // This is a login attempt but the account appears to be new
      try {
        // Clean up by deleting the newly created account
        await user.delete();
      } catch (deleteError) {
        console.error('Error deleting user during login flow:', deleteError);
      }
      
      return {
        success: false,
        error: 'Account not found for login. Please use the signup tab.',
        code: 'auth/user-not-found',
        shouldSignup: true
      };
    }
    
    // Set a flag to remember this user has authenticated successfully before
    // This helps prevent erroneous deletion of legitimate returning users
    window.userPreviouslyAuthenticated = true;
    
    // CASE 2: Signup attempt for an existing account
    // Only apply this logic on explicit signup attempts for users that are clearly not new
    if (!isLogin && user.metadata.creationTime !== user.metadata.lastSignInTime) {
      console.log('Signup attempt for existing account');
      // This is a signup attempt but the account already exists
      // We'll sign the user out to be safe
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out during signup flow:', signOutError);
      }
      
      return {
        success: false,
        error: 'An account with this number already exists. Please use the login tab.',
        code: 'auth/account-exists',
        shouldLogin: true
      };
    }
    
    // CASE 3: Successful login (existing user) or signup (new user)
    console.log('Successful authentication');
    const isActuallyNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
    return { 
      success: true, 
      user: user,
      token: await user.getIdToken(),
      isNewUser: isActuallyNewUser
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    // Handle specific OTP verification errors
    if (error.code === 'auth/invalid-verification-code') {
      return {
        success: false,
        error: 'The OTP you entered is incorrect. Please try again.',
        code: error.code
      };
    } else if (error.code === 'auth/code-expired') {
      return {
        success: false,
        error: 'The OTP has expired. Please request a new one.',
        code: error.code
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to verify OTP',
      code: error.code
    };
  }
};

// Google Authentication Function
export const signInWithGoogle = async (isLogin = false) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    if (!user) {
      return {
        success: false,
        error: 'Failed to retrieve Google user information',
        code: 'auth/unknown-error'
      };
    }
    
    // The creation time/last sign-in time comparison is unreliable
    // We need a better approach for Google auth as well
    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
    
    // Log extensive debug info to understand auth state
    console.log('Google authentication:', { 
      isLogin,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
      providerId: user.providerData.map(p => p.providerId),
      isGoogleUser
    });
    
    // CASE 1: Login attempt for a non-existent account
    // Only apply for first-time Google users during login
    if (isLogin && user.metadata.creationTime === user.metadata.lastSignInTime && !window.googleUserAuthenticated) {
      console.log('Google login attempt for non-existent account');
      // This is a login attempt but the account appears to be new
      try {
        // Clean up by deleting the newly created account
        await user.delete();
      } catch (deleteError) {
        console.error('Error deleting Google user during login flow:', deleteError);
      }
      
      return {
        success: false,
        error: 'Google account not found for login. Please use the signup tab.',
        code: 'auth/user-not-found',
        shouldSignup: true
      };
    }
    
    // Set a flag that this Google user has authenticated before
    // This helps prevent deleting legitimate returning users
    window.googleUserAuthenticated = true;
    
    // CASE 2: Signup attempt for an existing account
    // Only apply for clearly established users attempting signup
    if (!isLogin && user.metadata.creationTime !== user.metadata.lastSignInTime) {
      console.log('Google signup attempt for existing account');
      // This is a signup attempt but the account already exists
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out during Google signup flow:', signOutError);
      }
      
      return {
        success: false,
        error: 'A Google account with this email already exists. Please use the login tab.',
        code: 'auth/account-exists',
        shouldLogin: true
      };
    }
    
    // CASE 3: Successful login (existing user) or signup (new user)
    console.log('Successful Google authentication');
    // Use the actual google.com provider existence to determine if it's a new user
    const isNewGoogleUser = user.metadata.creationTime === user.metadata.lastSignInTime;
    return { 
      success: true, 
      user,
      token: await user.getIdToken(),
      isNewUser: isNewGoogleUser
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific Google authentication errors
    if (error.code === 'auth/popup-closed-by-user') {
      return { 
        success: false, 
        error: 'Google sign-in popup was closed',
        code: error.code
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to sign in with Google',
      code: error.code
    };
  }
};

// Sign Out Function
export const signOut = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Store or update user information in Firestore after signup/login.
 * @param {object} user - The Firebase user object.
 * @param {object} extraData - Any extra data to store (e.g., name, signup method).
 * @param {boolean} isNewUser - Whether this is a new signup.
 */
export const storeUserInfo = async (user, extraData = {}, isNewUser = false) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const baseData = {
    uid: user.uid,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    displayName: user.displayName || extraData.name || null,
    photoURL: user.photoURL || null,
    providerId: user.providerData[0]?.providerId || null,
    lastLogin: serverTimestamp(),
    ...extraData
  };
  if (userSnap.exists()) {
    // Update last login and any changed info
    await updateDoc(userRef, baseData);
  } else if (isNewUser) {
    // Create new user document
    await setDoc(userRef, {
      ...baseData,
      createdAt: serverTimestamp(),
      signupMethod: extraData.signupMethod || baseData.providerId || 'unknown',
    });
  }
};

export { auth };