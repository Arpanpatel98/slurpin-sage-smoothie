import { getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from '../../firebase';

// Initialize auth and providers
export const auth = getAuth(app);
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

export const signInWithGoogle = async (isLogin = false) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // Store user info in Firestore
    await storeUserInfo(user, { signupMethod: 'google' }, !isLogin);

    return {
      success: true,
      user,
      token,
      isNewUser: !isLogin
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    
    let errorMessage = 'An error occurred during Google sign in';
    
    switch (error.code) {
      case 'auth/popup-blocked':
        errorMessage = 'Please allow popups for this website to sign in with Google.';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign in was cancelled. Please try again.';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Sign in was cancelled. Please try again.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = error.message || 'Failed to sign in with Google. Please try again.';
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code
    };
  }
};

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

export const storeUserInfo = async (user, extraData = {}, isNewUser = false) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists() || isNewUser) {
      // Create new user document
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || extraData.name || '',
        photoURL: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
        signupMethod: extraData.signupMethod || 'email',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        ...extraData
      });
    } else {
      // Update existing user document
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        displayName: user.displayName || userDoc.data().displayName || '',
        photoURL: user.photoURL || userDoc.data().photoURL || '',
        ...extraData
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error storing user info:', error);
    return {
      success: false,
      error: error.message
    };
  }
};