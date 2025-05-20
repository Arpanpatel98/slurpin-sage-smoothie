import React from "react";

const OtpInput = ({ otp, errors, loading, handleOtpChange, handleOtpKeyDown, handleOtpPaste }) => (
  <div className="flex justify-between gap-1 sm:gap-2 mb-2">
    {otp.map((digit, index) => (
      <input
        key={index}
        id={`otp-${index}`}
        type="text"
        maxLength="1"
        inputMode="numeric"
        pattern="[0-9]"
        value={digit}
        onChange={(e) => handleOtpChange(index, e.target.value)}
        onKeyDown={(e) => handleOtpKeyDown(index, e)}
        onPaste={handleOtpPaste}
        disabled={loading}
        className={`otp-input text-center text-lg sm:text-xl border ${
          errors.otp ? "border-red-500" : "border-gray-300"
        } rounded-lg focus:outline-none ${loading ? "opacity-50" : ""}`}
      />
    ))}
  </div>
);

export default OtpInput;