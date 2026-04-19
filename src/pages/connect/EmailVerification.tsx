import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function EmailVerification() {
  const location = useLocation();
  const phone = location.state?.phone || '+1* ********12';
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(21);
  const [resentMessage, setResentMessage] = useState('');
  const timerRef = useRef<number | null>(null);
  const messageRef = useRef<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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
    setTimeLeft(21);
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
    setResentMessage(`Code resent to ${phone}`);
    if (messageRef.current) {
      window.clearTimeout(messageRef.current);
    }
    messageRef.current = window.setTimeout(() => {
      setResentMessage('');
      messageRef.current = null;
    }, 3000);
  };

  const handleDigitChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const digit = event.target.value.replace(/\D/g, '').slice(0, 1);
    setCodeDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (codeDigits[index]) {
        setCodeDigits((current) => {
          const next = [...current];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setCodeDigits((current) => {
          const next = [...current];
          next[index - 1] = '';
          return next;
        });
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = Array(6).fill('');
    pasted.split('').forEach((value, idx) => {
      next[idx] = value;
    });
    setCodeDigits(next);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-[480px] rounded-[32px] border border-white/10 bg-[#08080b]/95 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M7 8V6a5 5 0 0 1 10 0v2" />
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <path d="M12 14v2" />
            </svg>
          </div>
        </div>

        <h1 className="text-[2.15rem] font-semibold tracking-[-0.04em] text-white text-center">
          Enter the code we texted you
        </h1>

        <p className="mt-4 text-center text-sm font-medium text-slate-300">
          Verify your phone number <span className="text-white">{phone}</span>
        </p>

        <div className="mt-10 grid grid-cols-6 gap-3">
          {codeDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={handleDigitChange(index)}
              onKeyDown={handleKeyDown(index)}
              onPaste={handlePaste}
              className="h-[72px] w-full rounded-3xl border border-white/10 bg-white/5 text-center text-[2rem] font-semibold tracking-[0.35em] text-white outline-none transition focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]"
              aria-label={`Code digit ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={timeLeft > 0}
          onClick={handleResend}
          className="mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {timeLeft > 0 ? `Resend code in ${timeLeft}` : 'Resend code'}
        </button>

        {resentMessage ? (
          <p className="mt-4 text-center text-sm text-slate-400">
            {resentMessage}
          </p>
        ) : null}

        <div className="mt-6 text-center text-sm text-slate-300">
          <a href="#" className="text-[#60a5fa] hover:underline font-semibold">
            Can&apos;t access? Update your 2FA
          </a>
        </div>
      </div>
    </main>
  );
}
