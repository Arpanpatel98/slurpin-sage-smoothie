import React, { useEffect } from "react";

const SuccessPopup = ({ isOpen, message, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Add a small delay before showing the popup for better animation
      const timer = setTimeout(() => {
        const popup = document.querySelector('.success-popup');
        if (popup) {
          popup.classList.add('show');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0 bg-black opacity-50 transition-opacity duration-300" 
        onClick={onClose}
      />
      <div className="success-popup bg-white rounded-lg p-6 sm:p-8 shadow-xl z-10 max-w-md w-full mx-4 relative">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#e6f3eb] mb-4">
            <svg 
              className="h-6 w-6 text-[#137B3B]"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          {/* <button
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sage-600 text-base font-medium text-white hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500 transition-colors duration-200"
          >
            Continue
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;