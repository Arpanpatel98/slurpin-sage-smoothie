import { useState } from "react";
import { auth } from "./firebaseLoginSignup";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";

const useAuth = (setSuccessMessage, setShowSuccessPopup) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Please enter your email address" }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Please enter your password" }));
      return false;
    }
    if (password.length < 6) {
      setErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters long",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const validateName = (name) => {
    if (!name) {
      setErrors((prev) => ({ ...prev, name: "Please enter your name" }));
      return false;
    }
    if (name.length < 2) {
      setErrors((prev) => ({
        ...prev,
        name: "Name must be at least 2 characters long",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, name: "" }));
    return true;
  };

  const handleEmailSignUp = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Validate inputs
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);
      const isNameValid = validateName(name);

      if (!isEmailValid || !isPasswordValid || !isNameValid) {
        setLoading(false);
        return;
      }

      if (!agree) {
        setErrors((prev) => ({
          ...prev,
          terms: "Please agree to the terms and conditions to continue",
        }));
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      setSuccessMessage("Welcome! Your account has been created successfully.");
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error signing up:", error);
      let errorMessage = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered. Please sign in instead.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Please choose a stronger password (at least 6 characters with letters, numbers, and symbols).";
          break;
        case "auth/network-request-failed":
          errorMessage = "Please check your internet connection and try again.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          break;
        default:
          errorMessage = "Unable to create account. Please try again.";
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Validate inputs
      const isEmailValid = validateEmail(email);
      const isPasswordValid = validatePassword(password);

      if (!isEmailValid || !isPasswordValid) {
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage("Welcome back! You've signed in successfully.");
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error signing in:", error);
      let errorMessage = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email. Please sign up first.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled. Please contact support.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later or reset your password.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Please check your internet connection and try again.";
          break;
        default:
          errorMessage = "Unable to sign in. Please check your credentials and try again.";
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrors({});

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMessage("Welcome! You've signed in successfully with Google.");
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      let errorMessage = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/popup-blocked":
          errorMessage = "Please allow popups for this website to sign in with Google.";
          break;
        case "auth/popup-closed-by-user":
          errorMessage = "Sign in was cancelled. Please try again.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Sign in was cancelled. Please try again.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Please check your internet connection and try again.";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage = "An account already exists with this email. Please sign in with your original method.";
          break;
        default:
          errorMessage = "Unable to sign in with Google. Please try again.";
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    errors,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    agree,
    setAgree,
    validateEmail,
    validatePassword,
    validateName,
    handleEmailSignUp,
    handleEmailSignIn,
    handleGoogleSignIn,
  };
};

export default useAuth;