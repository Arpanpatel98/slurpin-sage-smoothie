import React, { useState } from "react";
import OtpInput from "./OtpInput";
import useAuth from "./useAuth";
import { FaPhone, FaEnvelope, FaGoogle } from "react-icons/fa";

const LoginForm = ({ setSuccessMessage, setShowSuccessPopup }) => {
  const {
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
  } = useAuth(setSuccessMessage, setShowSuccessPopup);

  const [authMethod, setAuthMethod] = useState("phone"); // "phone", "email", or "google"

  const handleAuthMethodChange = (method) => {
    setAuthMethod(method);
    // Clear any existing errors when switching methods
    setErrors({ ...errors, general: "" });
  };

  return (
    <div className="form">
      <div id="loginForm" className="form-container form-visible bg-white shadow-lg rounded-2xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-sage-800 text-center">Login to Your Account</h2>
        
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        {/* Authentication Method Selector */}
        <div className="flex space-x-4 justify-center">
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              authMethod === "phone"
                ? "bg-sage-100 text-sage-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => handleAuthMethodChange("phone")}
          >
            <FaPhone className="text-lg" />
            <span>Phone</span>
          </button>
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              authMethod === "email"
                ? "bg-sage-100 text-sage-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => handleAuthMethodChange("email")}
          >
            <FaEnvelope className="text-lg" />
            <span>Email</span>
          </button>
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              authMethod === "google"
                ? "bg-sage-100 text-sage-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => handleAuthMethodChange("google")}
          >
            <FaGoogle className="text-lg" />
            <span>Google</span>
          </button>
        </div>

        {/* Phone Authentication */}
        {authMethod === "phone" && (
          <>
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter your 10-digit mobile number"
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                      maxLength={10}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>
                  )}
                </div>
                <button
                  onClick={handleRequestOTP}
                  disabled={loading}
                  className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Sending OTP..." : "Get OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
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
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                  )}
                  <button
                    className={`text-sage-600 text-sm font-medium hover:text-sage-700 ${
                      timer > 0 || loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => handleResend(true)}
                    disabled={timer > 0 || loading}
                  >
                    Resend OTP
                  </button>
                </div>
                <button
                  onClick={() => handleVerify(true)}
                  disabled={loading}
                  className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  onClick={handleBack}
                  disabled={loading}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <button
              onClick={() => handleEmailSignIn(true)}
              disabled={loading}
              className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        )}

        {/* Google Authentication */}
        {authMethod === "google" && (
          <div className="space-y-6">
            <button
              onClick={() => handleGoogleSignIn(true)}
              disabled={loading}
              className={`w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 transition duration-300 flex items-center justify-center space-x-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;