import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DeviceVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resendTimer, setResendTimer] = useState(21);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get email from location state or use default
  const email = location.state?.email || 'your-email@example.com';

  // Timer for "Resend email" button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleResendEmail = () => {
    setResendTimer(21);
    // TODO: Implement resend email logic
  };

  const handleTryAnotherWay = () => {
    navigate('/');
  };

  const handleCancelSignIn = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center pt-12 font-sans text-white">
      {/* Header with Logo */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#4ade80] tracking-tight">noones</h1>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-xl p-8 mx-4 shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">New device detected</h2>
          <p className="text-gray-400 text-sm mb-6">
            Confirm this is your device from the email we just sent to
            <span className="block font-medium text-gray-300">{email}</span>
          </p>

          {/* Device Icon */}
          <div className="flex justify-center mb-6 opacity-40">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 18h-1V6c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v12H4c-1.1 0-2 .9-2 2h20c0-1.1-.9-2-2-2zm-13-12h10v12H7V6z" />
            </svg>
          </div>

          {/* Warning Text */}
          <p className="text-gray-300 font-medium mb-8">We don't recognize this device</p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={resendTimer > 0}
              className="w-full py-4 bg-[#333333] hover:bg-[#444444] disabled:bg-[#333333] disabled:opacity-60 text-gray-400 font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              Resend email ({resendTimer} sec.)
            </button>

            <button
              onClick={handleTryAnotherWay}
              className="w-full py-4 bg-[#2a2a2a] hover:bg-[#353535] text-white font-bold rounded-xl border border-gray-700 transition-colors"
            >
              Try another way
            </button>

            <div className="pt-4">
              <a
                onClick={handleCancelSignIn}
                className="text-[#4ade80] font-medium hover:underline cursor-pointer"
              >
                Cancel signing in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-auto w-full max-w-md flex justify-between p-6 items-center">
        {/* Dark/Light Mode Toggle */}
        <div className="flex items-center space-x-3 bg-[#1e1e1e] p-1 rounded-full px-2 border border-gray-800">
          <span className={isDarkMode ? 'text-gray-500' : 'text-yellow-500'}>☀️</span>
          <div className="w-12 h-6 bg-[#4ade80] rounded-full relative cursor-pointer" onClick={() => setIsDarkMode(!isDarkMode)}>
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                isDarkMode ? 'right-1' : 'left-1'
              }`}
            />
          </div>
          <span className={!isDarkMode ? 'text-gray-500' : 'text-gray-400'}>🌙</span>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-[#4ade80] flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            {language} <span className="ml-1 text-xs">▼</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 w-32">
              {['English', 'Spanish', 'French', 'German'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setIsDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm rounded ${
                    language === lang ? 'text-[#4ade80] bg-[#2a2a2a]' : 'text-gray-300 hover:bg-[#2a2a2a]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
