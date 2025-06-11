import React, { useState } from "react";
import OtpInput from "./OtpInput";
import useAuth from "./useAuth";
import { FaPhone, FaEnvelope, FaGoogle } from "react-icons/fa";

const SignupForm = ({ setSuccessMessage, setShowSuccessPopup }) => {
  const {
    step,
    mobile,
    setMobile,
    otp,
    timer,
    name,
    setName,
    agree,
    setAgree,
    loading,
    errors,
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
    handleResend,
    handleBack,
    setErrors,
  } = useAuth(setSuccessMessage, setShowSuccessPopup);

  const [authMethod, setAuthMethod] = useState("phone"); // "phone", "email", or "google"

  const showStep2 = async () => {
    setErrors((prev) => ({ ...prev, general: "", name: "", mobile: "", terms: "" }));
    let hasErrors = false;
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }));
      hasErrors = true;
    }
    if (!validateMobile(mobile)) {
      hasErrors = true;
    }
    if (!agree) {
      setErrors((prev) => ({ ...prev, terms: "You must agree to the terms and conditions" }));
      hasErrors = true;
    }
    if (!hasErrors) {
      await handleRequestOTP();
    }
  };

  return (
    <div className="form">
      <div id="signupForm" className="form-container bg-white shadow-lg rounded-2xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-sage-800 text-center">Create an Account</h2>
        {errors.general && <div className="error-message">{errors.general}</div>}

        {/* Authentication Method Selector */}
        <div className="auth-method-buttons">
          <button
            className={`auth-method-button ${authMethod === "phone" ? "active" : ""}`}
            onClick={() => setAuthMethod("phone")}
          >
            <FaPhone />
            <span>Phone</span>
          </button>
          <button
            className={`auth-method-button ${authMethod === "email" ? "active" : ""}`}
            onClick={() => setAuthMethod("email")}
          >
            <FaEnvelope />
            <span>Email</span>
          </button>
          <button
            className={`auth-method-button ${authMethod === "google" ? "active" : ""}`}
            onClick={() => setAuthMethod("google")}
          >
            <FaGoogle />
            <span>Google</span>
          </button>
        </div>

        {/* Phone Authentication */}
        {authMethod === "phone" && (
          <>
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="form-input"
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>
                <div>
                  <label className="form-label">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter your 10-digit mobile number"
                    className="form-input"
                  />
                  {errors.mobile && <div className="error-message">{errors.mobile}</div>}
                </div>
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <label htmlFor="agree">
                    I agree to the Terms and Conditions
                  </label>
                </div>
                {errors.terms && <div className="error-message">{errors.terms}</div>}
                <button
                  onClick={showStep2}
                  className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                    !agree || loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!agree || loading}
                >
                  {loading ? "Sending OTP..." : "Get OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label">Enter OTP</label>
                    <span className="text-sm text-sage-600 font-medium">
                      00:{timer < 10 ? `0${timer}` : timer}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    We've sent a 6-digit code to +91 <span className="font-medium">XXXXXXX{mobile.slice(-3)}</span>
                  </p>
                  <OtpInput
                    otp={otp}
                    errors={errors}
                    loading={loading}
                    handleOtpChange={handleOtpChange}
                    handleOtpKeyDown={handleOtpKeyDown}
                    handleOtpPaste={handleOtpPaste}
                  />
                  {errors.otp && <div className="error-message">{errors.otp}</div>}
                  <button
                    className={`text-sage-600 text-sm font-medium hover:text-sage-700 ${
                      timer > 0 || loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => handleResend(false)}
                    disabled={timer > 0 || loading}
                  >
                    Resend OTP
                  </button>
                </div>
                <button
                  onClick={() => handleVerify(false, "signup")}
                  className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Sign Up"}
                </button>
                <button
                  onClick={handleBack}
                  className="w-full text-gray-600 hover:text-gray-800 py-2"
                >
                  Back
                </button>
              </div>
            )}
          </>
        )}

        {/* Email Authentication */}
        {authMethod === "email" && (
          <div className="space-y-6">
            <div>
              <label className="form-label">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="form-input"
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            <div>
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="form-input"
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            <div>
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input"
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="agree-email"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <label htmlFor="agree-email">
                I agree to the Terms and Conditions
              </label>
            </div>
            {errors.terms && <div className="error-message">{errors.terms}</div>}
            <button
              onClick={() => handleEmailSignUp("signup")}
              className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                !agree || loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!agree || loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        )}

        {/* Google Authentication */}
        {authMethod === "google" && (
          <div className="space-y-6">
            <div>
              <label className="form-label">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="form-input"
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="agree" className="ml-2 block text-sm text-gray-700">
                I agree to the Terms and Conditions
              </label>
            </div>
            {errors.terms && <div className="error-message">{errors.terms}</div>}
            <button
              onClick={() => handleGoogleSignIn(false, "signup")}
              className={`w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 transition duration-300 flex items-center justify-center space-x-2 ${
                !agree || loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!agree || loading}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              <span>{loading ? "Signing up..." : "Continue with Google"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupForm;