import React from "react";
import { FaEnvelope, FaGoogle } from "react-icons/fa";
import useAuth from "./useAuth";

const SigninForm = ({ setSuccessMessage, setShowSuccessPopup }) => {
  const {
    loading,
    errors,
    email,
    setEmail,
    password,
    setPassword,
    validateEmail,
    validatePassword,
    handleGoogleSignIn,
    handleEmailSignIn,
  } = useAuth(setSuccessMessage, setShowSuccessPopup);

  const [authMethod, setAuthMethod] = React.useState("email");

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h2>

      {/* Auth Method Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-center ${
            authMethod === "email"
              ? "bg-sage-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setAuthMethod("email")}
        >
          <FaEnvelope className="inline-block mr-2" />
          Email
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-center ${
            authMethod === "google"
              ? "bg-sage-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setAuthMethod("google")}
        >
          <FaGoogle className="inline-block mr-2" />
          Google
        </button>
      </div>

      {/* Error Messages */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Email Sign In Form */}
      {authMethod === "email" && (
        <div className="space-y-6">
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
          <button
            onClick={handleEmailSignIn}
            disabled={loading}
            className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      )}

      {/* Google Sign In Button */}
      {authMethod === "google" && (
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 px-4 rounded-lg font-medium transition duration-300 flex items-center justify-center ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FaGoogle className="mr-2" />
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      )}

      {/* Sign Up Link */}
      <p className="mt-4 text-center text-gray-600">
        Don't have an account?{" "}
        <button
          onClick={() => setActiveTab("signup")}
          className="text-sage-500 hover:text-sage-600 font-medium"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default SigninForm; 