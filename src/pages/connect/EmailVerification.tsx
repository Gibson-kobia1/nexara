import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function EmailVerification() {
  const location = useLocation();
  const email = location.state?.email || 'gibsonkobia@gmail.com';

  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(18);
  const [resentMessage, setResentMessage] = useState('');
  const timerRef = useRef<number | null>(null);
  const messageRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (messageRef.current) {
        window.clearTimeout(messageRef.current);
      }
    };
  }, []);

  const restartTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    setTimeLeft(18);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    restartTimer();
    setResentMessage(`Code resent to ${email}`);
    if (messageRef.current) {
      window.clearTimeout(messageRef.current);
    }
    messageRef.current = window.setTimeout(() => {
      setResentMessage('');
      messageRef.current = null;
    }, 3000);
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    setCode(digits.slice(0, 6));
  };

  return (
    <main className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8 font-sans text-gray-900">
      <div className="w-full max-w-[440px] bg-white rounded-[16px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-8 sm:p-10">
        <a href="#" className="text-gray-600 hover:underline text-sm font-medium">
          Back to sign in
        </a>

        <h1 className="mt-6 text-[1.75rem] font-semibold leading-tight text-gray-900 mb-2">
          Enter the code we emailed you
        </h1>

        <p className="text-[0.95rem] leading-[1.5] text-[#4b5563] mb-6">
          Check your email {email}. This helps us keep your account secure by verifying that it’s really you.
        </p>

        <div className="space-y-2">
          <label className="text-[0.875rem] font-semibold text-gray-900 block">
            Enter 6-digit code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={handleCodeChange}
            className="w-full rounded-[12px] border border-[#d1d5db] bg-white px-4 py-3 text-center text-[1.25rem] tracking-[0.2em] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            aria-label="Enter 6-digit code"
          />
        </div>

        <div className="mt-6 text-center text-sm text-[#6b7280]">
          {timeLeft > 0 ? (
            <span>Resend code in {timeLeft}</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-blue-600 hover:underline font-medium"
            >
              Resend code
            </button>
          )}
        </div>

        {resentMessage ? (
          <p className="mt-3 text-center text-sm text-[#374151]">{resentMessage}</p>
        ) : null}

        <div className="mt-4 text-center text-sm">
          <a href="#" className="text-blue-600 hover:underline">
            Can&apos;t access? Update your 2FA
          </a>
        </div>
      </div>
    </main>
  );
}
