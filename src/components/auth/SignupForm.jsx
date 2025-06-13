import React from "react";
import { FaEnvelope, FaGoogle } from "react-icons/fa";
import useAuth from "./useAuth";

const SignupForm = ({ setSuccessMessage, setShowSuccessPopup }) => {
  const {
    step,
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
    validateName,
    validateEmail,
    validatePassword,
    handleGoogleSignIn,
    handleEmailSignUp,
  } = useAuth(setSuccessMessage, setShowSuccessPopup);

  const [authMethod, setAuthMethod] = React.useState("email");

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign Up</h2>

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

      {/* Email Sign Up Form */}
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
              placeholder="Create a password"
              className="form-input"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
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
            onClick={handleEmailSignUp}
            disabled={loading}
            className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </div>
      )}

      {/* Google Sign Up Button */}
      {authMethod === "google" && (
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 px-4 rounded-lg font-medium transition duration-300 flex items-center justify-center ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FaGoogle className="mr-2" />
          {loading ? "Signing up..." : "Sign up with Google"}
        </button>
      )}

      {/* Sign In Link */}
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{" "}
        <button
          onClick={() => setActiveTab("login")}
          className="text-sage-500 hover:text-sage-600 font-medium"
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

export default SignupForm;