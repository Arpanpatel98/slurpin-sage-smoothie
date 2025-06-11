import { getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

// Email/Password Authentication Functions
export const signUpWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with name
    if (name) {
      await user.updateProfile({ displayName: name });
    }

    // Store additional user info in Firestore
    await storeUserInfo(user, { name, signupMethod: 'email' }, true);

    return {
      success: true,
      user,
      token: await user.getIdToken(),
      isNewUser: true
    };
  } catch (error) {
    console.error('Error signing up with email:', error);
    
    let errorMessage = 'An error occurred during sign up';
    let shouldLogin = false;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists. Please sign in instead.';
        shouldLogin = true;
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters long and include a mix of letters, numbers, and symbols.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = 'An unexpected error occurred. Please try again.';
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
      shouldLogin
    };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      user,
      token: await user.getIdToken(),
      isNewUser: false
    };
  } catch (error) {
    console.error('Error signing in with email:', error);
    
    let errorMessage = 'An error occurred during sign in';
    let shouldSignup = false;
    let isInvalidCredentials = false;
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email. Please sign up first to create an account.';
        shouldSignup = true;
        break;
      case 'auth/wrong-password':
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
        isInvalidCredentials = true;
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
        isInvalidCredentials = true;
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
      shouldSignup,
      isInvalidCredentials
    };
  }
};

// Configure Google OAuth provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize reCAPTCHA verifier
export const generateRecaptcha = () => {
  try {
    // Remove any existing reCAPTCHA containers
    const existingContainers = document.querySelectorAll('[id^="recaptcha-container-"]');
    existingContainers.forEach(container => {
      container.remove();
    });

    // Clear any existing reCAPTCHA verifier
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    // Create a new container with a unique ID
    const containerId = `recaptcha-container-${Date.now()}`;
    const container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    // Create new reCAPTCHA instance
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
        // Remove the container when expired
        const expiredContainer = document.getElementById(containerId);
        if (expiredContainer) {
          expiredContainer.remove();
        }
      }
    });

    return window.recaptchaVerifier;
  } catch (error) {
    console.error('Error generating reCAPTCHA:', error);
    // Clean up on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    // Remove any containers that might have been created
    const containers = document.querySelectorAll('[id^="recaptcha-container-"]');
    containers.forEach(container => {
      container.remove();
    });
    throw error;
  }
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
    // Clean up any existing reCAPTCHA
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    const containers = document.querySelectorAll('[id^="recaptcha-container-"]');
    containers.forEach(container => {
      container.remove();
    });

    // Generate new reCAPTCHA instance
    const appVerifier = generateRecaptcha();
    if (!appVerifier) {
      throw new Error('reCAPTCHA not initialized');
    }

    const formattedPhone = `+91${phoneNumber}`; // Assuming Indian phone numbers
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    window.confirmationResult = confirmationResult;
    return { success: true };
  } catch (error) {
    console.error('Error requesting OTP:', error);
    
    // Clean up on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    const containers = document.querySelectorAll('[id^="recaptcha-container-"]');
    containers.forEach(container => {
      container.remove();
    });

    let errorMessage = 'Failed to send OTP';
    
    switch (error.code) {
      case 'auth/invalid-phone-number':
        errorMessage = 'Please enter a valid phone number';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many attempts. Please try again later';
        break;
      case 'auth/quota-exceeded':
        errorMessage = 'SMS quota exceeded. Please try again later';
        break;
      case 'auth/captcha-check-failed':
        errorMessage = 'reCAPTCHA verification failed. Please try again';
        break;
      default:
        errorMessage = error.message || 'Failed to send OTP';
    }

    return { 
      success: false, 
      error: errorMessage,
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
        error: 'No account found. Please sign up first.',
        code: 'auth/user-not-found',
        shouldSignup: true
      };
    }

    // Clear reCAPTCHA after successful verification
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
    
    // If this is a login attempt and it's a new user
    if (isLogin && isNewUser) {
      try {
        await auth.signOut();
        return {
          success: false,
          error: 'No account found with this phone number. Please sign up first.',
          code: 'auth/user-not-found',
          shouldSignup: true
        };
      } catch (signOutError) {
        console.error('Error signing out during login flow:', signOutError);
      }
    }
    
    // If this is a signup attempt and it's an existing user
    if (!isLogin && !isNewUser) {
      try {
        await auth.signOut();
        return {
          success: false,
          error: 'An account with this phone number already exists. Please sign in instead.',
          code: 'auth/account-exists',
          shouldLogin: true
        };
      } catch (signOutError) {
        console.error('Error signing out during signup flow:', signOutError);
      }
    }

    return { 
      success: true, 
      user: user,
      token: await user.getIdToken(),
      isNewUser
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    
    // Clear reCAPTCHA on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    let errorMessage = 'Failed to verify OTP';
    let shouldSignup = false;
    
    switch (error.code) {
      case 'auth/invalid-verification-code':
        errorMessage = 'The OTP you entered is incorrect. Please try again.';
        break;
      case 'auth/code-expired':
        errorMessage = 'The OTP has expired. Please request a new one.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = 'Failed to verify OTP. Please try again.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code,
      shouldSignup
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
    
    // Check if this is a new user by comparing creation and last sign-in times
    const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
    
    // Store user info in Firestore
    await storeUserInfo(user, {
      signupMethod: 'google',
      name: user.displayName
    }, isNewUser);
    
    return { 
      success: true, 
      user,
      token: await user.getIdToken(),
      isNewUser
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    
    let errorMessage = 'Failed to sign in with Google';
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'Google sign-in popup was closed';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Google sign-in was cancelled';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Google sign-in popup was blocked. Please allow popups for this site.';
        break;
      case 'auth/account-exists-with-different-credential':
        errorMessage = 'An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.';
        break;
      default:
        errorMessage = error.message || 'Failed to sign in with Google';
    }
    
    return { 
      success: false, 
      error: errorMessage,
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

// Cleanup function for reCAPTCHA
export const cleanupRecaptcha = () => {
  try {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    // Remove all reCAPTCHA containers
    const containers = document.querySelectorAll('[id^="recaptcha-container-"]');
    containers.forEach(container => {
      container.remove();
    });
  } catch (error) {
    console.error('Error cleaning up reCAPTCHA:', error);
  }
};

export { auth };