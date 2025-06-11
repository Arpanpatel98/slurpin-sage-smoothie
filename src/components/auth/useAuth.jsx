import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  generateRecaptcha,
  requestOTP,
  verifyOTP,
  signInWithGoogle,
  storeUserInfo,
  signUpWithEmail,
  signInWithEmail,
  cleanupRecaptcha,
} from "./firebaseLoginSignup";

const useAuth = (setSuccessMessage, setShowSuccessPopup) => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(40);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    mobile: "",
    name: "",
    otp: "",
    terms: "",
    general: "",
    email: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState("login");
  const intervalRef = useRef(null);
  const recaptchaRef = useRef(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecaptcha();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Clear reCAPTCHA when switching auth methods
  useEffect(() => {
    cleanupRecaptcha();
  }, [activeTab]);

  // Clear reCAPTCHA when step changes
  useEffect(() => {
    if (step === 1) {
      cleanupRecaptcha();
    }
  }, [step]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (step === 2) {
      setTimer(40);
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [step]);

  const validateMobile = (number) => {
    if (!number) {
      setErrors((prev) => ({ ...prev, mobile: "Mobile number is required" }));
      return false;
    }
    if (!/^[0-9]{10}$/.test(number)) {
      setErrors((prev) => ({ ...prev, mobile: "Please enter a valid 10-digit mobile number" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, mobile: "" }));
    return true;
  };

  const validateEmail = (email) => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return false;
    }
    if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters long" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const handleRequestOTP = async () => {
    clearErrors();
    if (!validateMobile(mobile)) {
      setErrors((prev) => ({
        ...prev,
        mobile: "Please enter a valid 10-digit mobile number"
      }));
      return;
    }

    setLoading(true);
    try {
      // Clean up any existing reCAPTCHA before requesting new OTP
      cleanupRecaptcha();
      
      const result = await requestOTP(mobile, activeTab === "login");
      if (result.success) {
        setStep(2);
        setTimer(40);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error
        }));
        cleanupRecaptcha();
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Failed to send OTP"
      }));
      cleanupRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors((prev) => ({ ...prev, otp: "" }));

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        document.getElementById(`otp-${index - 1}`)?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`)?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
      document.getElementById(`otp-${nextEmptyIndex}`)?.focus();
    } else {
      document.getElementById(`otp-5`)?.focus();
    }
  };

  const handleVerify = async (isLogin) => {
    clearErrors();
    if (otp.some((digit) => !digit)) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the complete OTP" }));
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(otp.join(""), isLogin);
      if (result.success) {
        setUser(result.user);
        setSuccessMessage(
          isLogin
            ? "Welcome back! You have successfully logged in."
            : "Your account has been created successfully! You are now logged in."
        );
        setShowSuccessPopup(true);
        setOtp(["", "", "", "", "", ""]);
        setMobile("");
      } else {
        handleAuthError(result, true);
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (isLogin) => {
    clearErrors();
    setLoading(true);
    try {
      const result = await signInWithGoogle(isLogin);
      if (result.success) {
        setUser(result.user);
        setSuccessMessage(
          isLogin
            ? "Welcome back! You have successfully logged in with Google."
            : "Your account has been created successfully with Google! You are now logged in."
        );
        setShowSuccessPopup(true);
      } else {
        if (result.shouldSignup) {
          setActiveTab("signup");
          setErrors((prev) => ({
            ...prev,
            general: result.error
          }));
        } else if (result.shouldLogin) {
          setActiveTab("login");
          setErrors((prev) => ({
            ...prev,
            general: result.error
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: result.error
          }));
        }
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "An unexpected error occurred during Google authentication."
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    setErrors((prev) => ({ ...prev, general: "" }));
    
    if (!validateEmail(email) || !validatePassword(password) || !name.trim()) {
      if (!name.trim()) {
        setErrors((prev) => ({ ...prev, name: "Name is required" }));
      }
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password, name);
      if (result.success) {
        setUser(result.user);
        setSuccessMessage("Your account has been created successfully! You are now logged in.");
        setShowSuccessPopup(true);
        setEmail("");
        setPassword("");
        setName("");
        setAgree(false);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error,
        }));
        if (result.shouldLogin) {
          setStep(1);
        }
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "An unexpected error occurred during sign up.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    clearErrors();
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        setUser(result.user);
        setSuccessMessage("Welcome back! You have successfully logged in.");
        setShowSuccessPopup(true);
        setEmail("");
        setPassword("");
      } else {
        handleAuthError(result, true);
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setTimer(40);
    setOtp(["", "", "", "", "", ""]);
    await handleRequestOTP();
  };

  const handleBack = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setErrors({ mobile: "", name: "", otp: "", terms: "", general: "", email: "", password: "" });
    cleanupRecaptcha();
  };

  const clearErrors = () => {
    setErrors({
      mobile: "",
      name: "",
      otp: "",
      terms: "",
      general: "",
      email: "",
      password: "",
    });
  };

  const handleAuthError = (error, shouldSwitchTab = false) => {
    if (error.shouldSignup && activeTab === "login") {
      setErrors((prev) => ({
        ...prev,
        general: error.error || "Please sign up first to create an account.",
      }));
      setActiveTab("signup");
    } else if (error.shouldLogin && activeTab === "signup") {
      setErrors((prev) => ({
        ...prev,
        general: error.error || "An account already exists. Please sign in instead.",
      }));
      if (shouldSwitchTab) {
        setActiveTab("login");
      }
    } else if (error.isInvalidCredentials) {
      setErrors((prev) => ({
        ...prev,
        email: "The email or password you entered is incorrect.",
        password: "The email or password you entered is incorrect.",
        general: "Please check your credentials and try again."
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        general: error.error || "Please sign up first to create an account.",
      }));
      if (activeTab === "login") {
        setActiveTab("signup");
      }
    }
  };

  return {
    step,
    setStep,
    mobile,
    setMobile,
    otp,
    setOtp,
    timer,
    name,
    setName,
    agree,
    setAgree,
    loading,
    user,
    errors,
    setErrors,
    email,
    setEmail,
    password,
    setPassword,
    validateMobile,
    validateEmail,
    validatePassword,
    handleRequestOTP,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerify,
    handleGoogleSignIn,
    handleEmailSignUp,
    handleEmailSignIn,
    handleResend,
    handleBack,
    clearErrors,
    activeTab,
    setActiveTab,
  };
};

export default useAuth;