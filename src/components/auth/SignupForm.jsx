import React from "react";
import OtpInput from "./OtpInput";
import useAuth from "./useAuth";

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
    validateMobile,
    handleGetOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerify,
    handleGoogleSignIn,
    handleResend,
    handleBack,
    setErrors,
  } = useAuth(setSuccessMessage, setShowSuccessPopup);

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
      await handleGetOtp(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl font-bold text-sage-800 mb-6 text-center">Create Your Account</h2>
      {errors.general && <div className="error-message">{errors.general}</div>}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="signupName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="signupName"
              className={`w-full py-3 px-4 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:ring-sage-500 focus:border-sage-500`}
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              disabled={loading}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          <div>
            <label htmlFor="signupMobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">+91</span>
              </div>
              <input
                type="tel"
                id="signupMobile"
                className={`pl-12 w-full py-3 px-4 border ${
                  errors.mobile ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-sage-500 focus:border-sage-500`}
                placeholder="Enter your mobile number"
                maxLength="10"
                pattern="[0-9]{10}"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) validateMobile(e.target.value);
                }}
                disabled={loading}
              />
            </div>
            {errors.mobile && <div className="error-message">{errors.mobile}</div>}
          </div>
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              className={`h-5 w-5 text-sage-500 border ${
                errors.terms ? "border-red-500" : "border-gray-300"
              } rounded focus:ring-sage-500 mt-1`}
              checked={agree}
              onChange={(e) => {
                setAgree(e.target.checked);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              disabled={loading}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{" "}
              <a href="#" className="text-sage-600 hover:text-sage-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-sage-600 hover:text-sage-700">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.terms && <div className="error-message">{errors.terms}</div>}
          <button
            onClick={showStep2}
            className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium transition duration-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
          <div className="google-button-container">
            <span>or sign up with</span>
            <div className="google-button">
              <button
                type="button"
                onClick={() => handleGoogleSignIn(false, "signup")}
                disabled={loading}
                className={loading ? "opacity-50 cursor-not-allowed" : ""}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 Neal 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"
                    fill="#4285F4"
                  />
                  <path
                    d="M4.17 14.596l3.258-2.538c-.761-1.12-1.178-2.518-1.178-4.019 0-1.5.417-2.898 1.178-4.019L4.17 1.481A8.932 8.932 0 0 0 2.009 8.04c0 2.294.726 4.377 2.16 6.557z"
                    fill="#34A853"
                  />
                  <path
                    d="M12 19.27c2.371 0 4.33-.8 5.78-2.16l-3.29-2.53c-.992.661-2.294 1.094-3.49 1.094-2.313 0-4.278-1.636-4.995-3.842L2.28 14.594c1.55 3.09 4.742 5.18 8.72 5.18z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 2.88c1.405 0 2.628.447 3.615 1.33l2.6-2.599C16.65.603 14.396 0 12 0 7.903 0 4.406 2.09 2.28 5.18l3.726 2.84C6.722 4.723 9.187 2.88 12 2.88z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{loading ? "Signing up..." : "Continue with Google"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
              <span className="text-sm text-sage-600 font-medium">
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              We've sent a 6-digit code to +91 <span>{mobile.slice(0, 2)}{mobile.slice(-2)}</span>
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
            className={`w-full bg-sage-500 hover:bg-sage-600 text-white py-3 px-4 rounded-lg font-medium ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => handleVerify(false, "signup")}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Verify & Create Account"}
          </button>
          <button
            className={`w-full border border-sage-500 text-sage-500 hover:bg-sage-50 py-3 px-4 rounded-lg font-medium ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default SignupForm;