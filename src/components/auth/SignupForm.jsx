import React from "react";
import { FaPhone, FaEnvelope, FaGoogle } from "react-icons/fa";
import useAuth from "./useAuth";

const SignupForm = ({ setSuccessMessage, setShowSuccessPopup }) => {
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
  } = useAuth(setSuccessMessage, setShowSuccessPopup);

  const [authMethod, setAuthMethod] = React.useState("phone");

  const showStep2 = () => {
    if (!agree) {
      setErrors({ ...errors, terms: "Please agree to the terms and conditions" });
      return;
    }
    handleRequestOTP();
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
                  <div className="otp-input-container">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers
                          if (/^\d*$/.test(value)) {
                            handleOtpChange(index, value);
                            // Auto-focus next input if value is entered
                            if (value && index < 5) {
                              const nextInput = document.querySelector(`input[name=otp-${index + 1}]`);
                              if (nextInput) nextInput.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace
                          if (e.key === 'Backspace' && !digit && index > 0) {
                            const prevInput = document.querySelector(`input[name=otp-${index - 1}]`);
                            if (prevInput) prevInput.focus();
                          }
                          handleOtpKeyDown(index, e);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text').trim();
                          if (/^\d{6}$/.test(pastedData)) {
                            handleOtpPaste(e);
                            // Focus the last input after pasting
                            const lastInput = document.querySelector('input[name=otp-5]');
                            if (lastInput) lastInput.focus();
                          }
                        }}
                        name={`otp-${index}`}
                        className="otp-input"
                        disabled={loading}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="\d*"
                      />
                    ))}
                  </div>
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
                  onClick={() => handleVerify(false)}
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
              onClick={() => handleEmailSignIn(false)}
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
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="agree-google"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <label htmlFor="agree-google">
                I agree to the Terms and Conditions
              </label>
            </div>
            {errors.terms && <div className="error-message">{errors.terms}</div>}
            <button
              onClick={() => handleGoogleSignIn(false)}
              className={`w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 transition duration-300 flex items-center justify-center space-x-2 ${
                !agree || loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!agree || loading}
            >
              <FaGoogle className="w-5 h-5" />
              <span>{loading ? "Signing up..." : "Continue with Google"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupForm;