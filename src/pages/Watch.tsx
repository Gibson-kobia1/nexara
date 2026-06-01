import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gunqntehkvyesigmqcjy.supabase.co';
const supabaseAnonKey = 'REPLACE_WITH_EXACT_ANON_KEY_FROM_SRC_LIB_SUPABASE';

const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default function Watch() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [passData, setPassData] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 WATCH PARAMETER CHECK:', window.location.search);

    setErrorMessage('');
    setIsValid(false);
    setPassData(null);

    const params = new URLSearchParams(window.location.search);
    const passCode = params.get('pass')?.trim() ?? '';

    console.log('🔍 WATCH PARAMETER VALUE:', passCode);

    publicClient
      .from('guest_passes')
      .select('*')
      .eq('pass_code', passCode)
      .then(({ data, error }) => {
        console.log('🔍 WATCH QUERY RESULT:', { data, error });

        if (error) {
          console.error('Watch: Supabase query failed:', error);
          setErrorMessage('Invalid or Expired Pass');
          return;
        }

        const passRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;
        const expiresAt = passRecord ? new Date(passRecord.expires_at) : null;

        if (!passRecord || !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
          setErrorMessage('Invalid or Expired Pass');
          return;
        }

        setPassData(passRecord);
        setIsValid(true);
      })
      .catch((err) => {
        console.error('Watch: Unexpected error validating pass:', err);
        setErrorMessage('Invalid or Expired Pass');
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/30">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Live Watch Portal</h1>
          <p className="mt-2 text-slate-400">Public access only. No subscriptions, no auth locks.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <p className="text-slate-300">
            The page renders immediately while validating the pass in the background. If the pass is invalid,
            a message will appear below.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-500/30 bg-red-950/80 p-6 text-red-200">
            <p className="text-lg font-semibold">Invalid or Expired Pass</p>
            <p className="mt-2 text-sm text-red-200">The access link is invalid or no longer valid.</p>
          </div>
        ) : isValid && passData ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <h2 className="text-2xl font-semibold">Access granted</h2>
              <p className="mt-2 text-slate-300">
                Your guest pass is valid until {new Date(passData.expires_at).toLocaleString()}.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <div className="text-slate-300">Live stream placeholder:</div>
              <div className="mt-4 rounded-3xl bg-black/60 p-6 text-slate-100">
                <p className="text-lg font-semibold">Live data stream</p>
                <p className="mt-2 text-slate-400">Incoming events would appear here in the production watcher.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-300">
            <p>No pass validated yet. The page is already visible and validation is running in the background.</p>
          </div>
        )}
      </div>
    </main>
  );
}
