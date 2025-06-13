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

  // Validation functions
  const validateMobile = (number) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!number) {
      return "Mobile number is required";
    }
    if (!mobileRegex.test(number)) {
      return "Please enter a valid 10-digit mobile number";
    }
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  // Handle OTP request
  const handleRequestOTP = async () => {
    try {
      setLoading(true);
      setErrors({ ...errors, mobile: "", general: "" });

      // Validate mobile number
      const mobileError = validateMobile(mobile);
      if (mobileError) {
        setErrors({ ...errors, mobile: mobileError });
        setLoading(false);
        return;
      }

      // Request OTP
      const result = await requestOTP(mobile, activeTab === "login");

      if (result.success) {
        window.confirmationResult = result.confirmationResult;
        setStep(2);
        startTimer();
      } else {
        // Handle specific error cases
        if (result.code === 'auth/phone-number-already-in-use' || 
            result.code === 'auth/account-exists-with-different-credential') {
          setErrors({ 
            ...errors, 
            general: "This phone number is already registered. Please sign in instead.",
            mobile: "This number is already registered. Please sign in instead."
          });
          // Switch to login tab
          setActiveTab("login");
          // Reset OTP input
          setOtp(["", "", "", "", "", ""]);
          // Go back to step 1
          setStep(1);
        } else if (result.code === 'auth/invalid-phone-number') {
          setErrors({ 
            ...errors, 
            mobile: "Please enter a valid phone number"
          });
        } else if (result.code === 'auth/too-many-requests') {
          setErrors({ 
            ...errors, 
            general: "Too many attempts. Please try again later",
            mobile: "Please wait a few minutes before trying again"
          });
        } else {
          setErrors({ 
            ...errors, 
            general: result.error || "Failed to send OTP. Please try again.",
            mobile: result.error || "Failed to send OTP. Please try again."
          });
        }
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setErrors({ 
        ...errors, 
        general: "Failed to send OTP. Please try again.",
        mobile: "Failed to send OTP. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerify = async (isLogin = false) => {
    try {
      setLoading(true);
      setErrors({ ...errors, otp: "", general: "" });

      const otpString = otp.join("");
      if (otpString.length !== 6) {
        setErrors({ ...errors, otp: "Please enter a valid 6-digit OTP" });
        return;
      }

      const result = await verifyOTP(otpString, isLogin);
      
      if (result.success) {
        if (result.isNewUser && !isLogin) {
          setSuccessMessage("Account created successfully!");
          setShowSuccessPopup(true);
          // Close popup after 2 seconds only for successful signup
          setTimeout(() => {
            setShowSuccessPopup(false);
          }, 2000);
        } else if (!result.isNewUser && isLogin) {
          setSuccessMessage("Logged in successfully!");
          setShowSuccessPopup(true);
          // Close popup after 2 seconds only for successful login
          setTimeout(() => {
            setShowSuccessPopup(false);
          }, 2000);
        }
      } else {
        if (result.shouldSignup) {
          setErrors({ 
            ...errors, 
            general: "No account found with this number. Please sign up first.",
            mobile: "This number is not registered. Please sign up instead."
          });
          // Switch to signup tab
          setActiveTab("signup");
          // Reset OTP input
          setOtp(["", "", "", "", "", ""]);
          // Go back to step 1
          setStep(1);
        } else if (result.shouldLogin || result.error?.code === 'auth/account-exists') {
          setErrors({ 
            ...errors, 
            general: "An account with this number already exists. Please use the login tab.",
            mobile: "This number is already registered. Please sign in instead."
          });
          // Switch to login tab
          setActiveTab("login");
          // Reset OTP input
          setOtp(["", "", "", "", "", ""]);
          // Go back to step 1
          setStep(1);
        } else if (result.error?.code === 'auth/phone-number-already-exists') {
          setErrors({ 
            ...errors, 
            general: "This phone number is already registered. Please sign in instead.",
            mobile: "This number is already registered. Please sign in instead."
          });
          // Switch to login tab
          setActiveTab("login");
          // Reset OTP input
          setOtp(["", "", "", "", "", ""]);
          // Go back to step 1
          setStep(1);
        } else {
          setErrors({ 
            ...errors, 
            general: result.error || "Verification failed. Please try again.",
            otp: "Invalid OTP. Please try again."
          });
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error.code === 'auth/account-exists') {
        setErrors({ 
          ...errors, 
          general: "An account with this number already exists. Please use the login tab.",
          mobile: "This number is already registered. Please sign in instead."
        });
        // Switch to login tab
        setActiveTab("login");
        // Reset OTP input
        setOtp(["", "", "", "", "", ""]);
        // Go back to step 1
        setStep(1);
      } else if (error.code === 'auth/phone-number-already-exists') {
        setErrors({ 
          ...errors, 
          general: "This phone number is already registered. Please sign in instead.",
          mobile: "This number is already registered. Please sign in instead."
        });
        // Switch to login tab
        setActiveTab("login");
        // Reset OTP input
        setOtp(["", "", "", "", "", ""]);
        // Go back to step 1
        setStep(1);
      } else {
        setErrors({ 
          ...errors, 
          general: "Unable to verify OTP. Please check your internet connection and try again.",
          otp: "Verification failed. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle email sign in
  const handleEmailSignIn = async (isLogin = false) => {
    try {
      setLoading(true);
      setErrors({ ...errors, email: "", password: "", general: "" });

      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      if (emailError || passwordError) {
        setErrors({ ...errors, email: emailError, password: passwordError });
        return;
      }

      const result = isLogin 
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, name);

      if (result.success) {
        setSuccessMessage(isLogin ? "Logged in successfully!" : "Account created successfully!");
        setShowSuccessPopup(true);
      } else {
        setErrors({ ...errors, general: result.error || "Authentication failed. Please try again." });
      }
    } catch (error) {
      setErrors({ 
        ...errors, 
        general: "Unable to authenticate. Please check your internet connection and try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async (isLogin = false) => {
    try {
      setLoading(true);
      setErrors({ ...errors, general: "" });

      const result = await signInWithGoogle(isLogin);
      
      if (result.success) {
        setSuccessMessage(isLogin ? "Logged in successfully!" : "Account created successfully!");
        setShowSuccessPopup(true);
      } else {
        setErrors({ ...errors, general: result.error || "Google sign-in failed. Please try again." });
      }
    } catch (error) {
      setErrors({ 
        ...errors, 
        general: "Unable to sign in with Google. Please check your internet connection and try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Timer functions
  const startTimer = () => {
    setTimer(40);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name=otp-${index + 1}]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name=otp-${index - 1}]`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(""));
    }
  };

  // Resend OTP
  const handleResend = async (isLogin = false) => {
    if (timer > 0 || loading) return;
    await handleRequestOTP();
  };

  // Back button handler
  const handleBack = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setErrors({ ...errors, otp: "", general: "" });
    cleanupRecaptcha();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecaptcha();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  return {
    step,
    mobile,
    setMobile,
    otp,
    timer,
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
    validateMobile,
    validateEmail,
    validatePassword,
    handleRequestOTP,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerify,
    handleGoogleSignIn,
    handleEmailSignIn,
    handleResend,
    handleBack,
    setErrors,
  };
};

export default useAuth;