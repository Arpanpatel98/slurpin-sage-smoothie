import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  generateRecaptcha,
  requestOTP,
  verifyOTP,
  signInWithGoogle,
  storeUserInfo,
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
  const [errors, setErrors] = useState({
    mobile: "",
    name: "",
    otp: "",
    terms: "",
    general: "",
  });
  const intervalRef = useRef(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

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

  const handleGetOtp = async (isLogin) => {
    setErrors((prev) => ({ ...prev, general: "" }));
    if (!validateMobile(mobile)) return;

    setLoading(true);
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      generateRecaptcha();
      const confirmationResult = await requestOTP(mobile, isLogin);
      if (confirmationResult.success) {
        setStep(2);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: confirmationResult.accountNotFound
            ? confirmationResult.error
            : confirmationResult.error || "Failed to send OTP. Please try again.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "An unexpected error occurred while requesting OTP.",
      }));
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

  const handleVerify = async (isLogin, activeTab) => {
    setErrors((prev) => ({ ...prev, general: "", otp: "" }));
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the complete 6-digit OTP" }));
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(enteredOtp, isLogin);
      if (result.success && result.user) {
        setUser(result.user);

        if (activeTab === "signup" && name) {
          try {
            await result.user.updateProfile({ displayName: name });
          } catch (profileError) {
            console.error("Error updating user profile:", profileError);
          }
          try {
            await storeUserInfo(result.user, { name, signupMethod: activeTab }, result.isNewUser);
          } catch (firestoreError) {
            console.error("Error storing user info in Firestore:", firestoreError);
          }
        }

        setSuccessMessage(
          activeTab === "signup"
            ? "Your account has been created successfully! You are now logged in."
            : "Welcome back! You have successfully logged in."
        );
        setShowSuccessPopup(true);
        setOtp(["", "", "", "", "", ""]);
        setStep(1);
        setMobile("");
        setName("");
        setAgree(false);
      } else if (result.shouldSignup) {
        setErrors((prev) => ({
          ...prev,
          general: "Account not found for login. Please use the signup tab.",
        }));
        setStep(1);
      } else if (result.shouldLogin) {
        setErrors((prev) => ({
          ...prev,
          general: "An account with this number already exists. Please use the login tab.",
        }));
        setStep(1);
      } else if (result.code === "auth/invalid-verification-code") {
        setErrors((prev) => ({ ...prev, otp: "Invalid OTP. Please check and try again." }));
      } else if (result.code === "auth/code-expired") {
        setErrors((prev) => ({ ...prev, otp: "OTP has expired. Please request a new one." }));
      } else if (result.code === "auth/user-disabled") {
        setErrors((prev) => ({ ...prev, general: "Your account has been disabled." }));
      } else if (result.code === "auth/too-many-requests") {
        setErrors((prev) => ({ ...prev, general: "Too many verification attempts. Please try again later." }));
      } else if (result.code === "auth/invalid-verification-id") {
        setErrors((prev) => ({ ...prev, general: "Verification session expired. Please request a new OTP." }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error || "An unexpected error occurred during verification.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "An unexpected error occurred. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (isLogin, activeTab) => {
    setLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const result = await signInWithGoogle(isLogin);
      if (result.success && result.user) {
        setUser(result.user);
        try {
          await storeUserInfo(result.user, { signupMethod: "google" }, result.isNewUser);
        } catch (firestoreError) {
          console.error("Error storing Google user info in Firestore:", firestoreError);
        }
        setSuccessMessage(
          activeTab === "signup"
            ? "Your account has been created successfully with Google! You are now logged in."
            : "Welcome back! You have successfully logged in with Google."
        );
        setShowSuccessPopup(true);
      } else if (result.shouldSignup) {
        setErrors((prev) => ({
          ...prev,
          general: "Google account not found for login. Please use the signup tab.",
        }));
      } else if (result.shouldLogin) {
        setErrors((prev) => ({
          ...prev,
          general: "A Google account with this email already exists. Please use the login tab.",
        }));
      } else if (result.code === "auth/popup-closed-by-user") {
        setErrors((prev) => ({ ...prev, general: "Google sign-in popup was closed." }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result.error || "Failed to sign in with Google. Please try again.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "An unexpected error occurred during Google sign-in.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (isLogin) => {
    setTimer(40);
    setOtp(["", "", "", "", "", ""]);
    await handleGetOtp(isLogin);
  };

  const handleBack = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setErrors({ mobile: "", name: "", otp: "", terms: "", general: "" });
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
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
    validateMobile,
    handleGetOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerify,
    handleGoogleSignIn,
    handleResend,
    handleBack,
  };
};

export default useAuth;