import React from "react";

const OtpInput = ({ otp, errors, loading, handleOtpChange, handleOtpKeyDown, handleOtpPaste }) => (
  <div className="otp-container">
    <div className="otp-inputs">
      {otp.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          name={`otp-${index}`}
          type="text"
          maxLength="1"
          inputMode="numeric"
          pattern="[0-9]"
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(index, e)}
          onPaste={handleOtpPaste}
          disabled={loading}
          className={`otp-input ${errors.otp ? 'error' : ''}`}
        />
      ))}
    </div>
    {errors.otp && <div className="error-message">{errors.otp}</div>}
  </div>
);

export default OtpInput;