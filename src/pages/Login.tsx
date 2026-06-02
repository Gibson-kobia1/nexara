import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_USERNAME = 'venomous';
const ADMIN_PASSWORD = 'venomous99';
const ADMIN_CACHE_KEY = 'nexara_admin_status';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_CACHE_KEY);
      if (saved === 'true') {
        navigate('/admin');
        return;
      }
    } catch (err) {
      console.warn('Login: unable to read admin session from localStorage', err);
    }

    setIsCheckingSession(false);
  }, [navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      try {
        localStorage.setItem(ADMIN_CACHE_KEY, 'true');
      } catch (err) {
        console.warn('Login: unable to save admin session', err);
      }
      navigate('/admin');
      return;
    }

    setErrorMessage('Invalid username or password.');
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/90 px-8 py-6 shadow-xl shadow-black/30">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <span>Checking admin session…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-slate-950/90 p-8 shadow-xl shadow-black/30">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold">Admin Login</h1>
          <p className="mt-2 text-slate-400">Sign in with the admin username and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="venomous"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
          <p>Admin access uses the fixed username and password. No Supabase auth is required.</p>
        </div>
      </div>
    </main>
  );
}
