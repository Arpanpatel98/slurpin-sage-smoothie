import React from "react";

const SuccessPopup = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 sm:p-8 shadow-xl z-10 max-w-md w-full mx-4 relative">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#e6f3eb] mb-3 sm:mb-4">
            <svg 
              className="h-5 w-5 sm:h-6 sm:w-6 text-[#137B3B]"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Success!</h3>
          <p className="text-xs sm:text-sm text-gray-500">{message}</p>
          <button
            onClick={onClose}
            className="mt-4 sm:mt-6 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 bg-sage-600 text-sm sm:text-base font-medium text-white hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;