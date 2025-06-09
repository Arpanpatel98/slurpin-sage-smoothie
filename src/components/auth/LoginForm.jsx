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
    handleGetOtp,
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

  return (
    <div className="form">
      <div id="loginForm" className="form-container form-visible bg-white shadow-lg rounded-2xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-sage-800 text-center">Login to Your Account</h2>
        {errors.general && <div className="error-message">{errors.general}</div>}

        {/* Authentication Method Selector */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              authMethod === "phone"
                ? "bg-sage-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setAuthMethod("phone")}
          >
            <FaPhone className="w-4 h-4" />
            <span>Phone</span>
          </button>
          <button
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              authMethod === "email"
                ? "bg-sage-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setAuthMethod("email")}
          >
            <FaEnvelope className="w-4 h-4" />
            <span>Email</span>
          </button>
          <button
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              authMethod === "google"
                ? "bg-sage-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setAuthMethod("google")}
          >
            <FaGoogle className="w-4 h-4" />
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
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter your 10-digit mobile number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  />
                  {errors.mobile && <div className="error-message">{errors.mobile}</div>}
                </div>
                <button
                  onClick={() => handleGetOtp(true)}
                  className="w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300"
                >
                  Get OTP
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
                  {errors.otp && <div className="error-message">{errors.otp}</div>}
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
                  onClick={() => handleVerify(true, "login")}
                  className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
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
              {errors.email && <div className="error-message">{errors.email}</div>}
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
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            <button
              onClick={() => handleEmailSignIn("login")}
              className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        )}

        {/* Google Authentication */}
        {authMethod === "google" && (
          <div className="space-y-6">
            <button
              onClick={() => handleGoogleSignIn(true, "login")}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 transition duration-300 flex items-center justify-center space-x-2"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;