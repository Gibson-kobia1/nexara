import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NoonesDeviceVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(54);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = location.state?.email || 'gibsonkobia@gmail.com';

  // Timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(0, 1); // Only one digit per box
    setCode(newCode);

    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const digits = clipboardText.replace(/\D/g, '').slice(0, 6);
      
      if (digits.length > 0) {
        const newCode = [...code];
        for (let i = 0; i < Math.min(digits.length, 6); i++) {
          newCode[i] = digits[i];
        }
        setCode(newCode);
        
        // Focus last input or next empty input
        if (digits.length < 6) {
          inputRefs.current[digits.length]?.focus();
        } else {
          inputRefs.current[5]?.focus();
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleContinue = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    try {
      // TODO: Verify code with backend
      navigate('/link-success');
    } catch (err) {
      alert('Verification failed. Please try again.');
    }
  };

  const isComplete = code.every((digit) => digit !== '');

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4 font-sans">
      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-white rounded-lg shadow-sm p-8">
        {/* Logo Text */}
        <div className="mb-8">
          <p className="text-[22px] font-medium text-gray-800">noones</p>
        </div>

        {/* Main Heading */}
        <h1 className="text-[22px] font-semibold text-center text-gray-900 mb-6">
          Two-factor authentication
        </h1>

        {/* Instruction Lines */}
        <div className="text-center mb-8">
          <p className="text-[14px] font-normal text-gray-600 mb-1">
            Enter 6-digit code sent to
          </p>
          <p className="text-[14px] font-normal text-gray-900">
            {email}
          </p>
        </div>

        {/* Code Input Grid */}
        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg outline-none focus:border-gray-900 focus:ring-0 transition-colors"
              placeholder=""
              autoComplete="off"
            />
          ))}
        </div>

        {/* Paste Link */}
        <div className="text-center mb-6">
          <button
            onClick={handlePaste}
            className="text-[14px] text-gray-800 hover:underline font-normal cursor-pointer bg-none border-none p-0"
          >
            Paste
          </button>
        </div>

        {/* Timer */}
        <p className="text-center text-[13px] text-gray-600 mb-8">
          Resend in {resendTimer} seconds
        </p>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!isComplete}
          className={`w-[85%] mx-auto block py-3 rounded-full font-semibold text-center transition-all ${
            isComplete
              ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer'
              : 'bg-gray-900 text-gray-500 cursor-not-allowed opacity-60'
          }`}
        >
          Continue
        </button>

        {/* Footer Text */}
        <p className="text-center text-[12px] text-gray-500 mt-8">
          If you need to reset 2FA, please{' '}
          <a href="#support" className="text-gray-700 hover:underline">
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
