import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Watch() {
  const location = useLocation();
  const params = useParams<{ code?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [passData, setPassData] = useState<any>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryPass = searchParams.get('pass')?.trim();
    const pathPass = params.code?.trim();
    const passCode = queryPass || pathPass || '';

    console.log('🔍 WATCH PARAMETER CHECK:', window.location.search);
    console.log('🔍 WATCH PARAMETER VALUE:', passCode);

    (async () => {
      setErrorMessage('');
      setIsValid(false);
      setPassData(null);

      if (!passCode) {
        console.warn('Watch: no pass code found in query or path');
        setErrorMessage('Invalid or Expired Pass');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('guest_passes')
          .select('*')
          .eq('pass_code', passCode);

        console.log('🔍 WATCH QUERY RESULT:', { data, error });

        if (error) {
          console.error('Watch: Supabase query failed:', error);
          setErrorMessage('Invalid or Expired Pass');
          return;
        }

        const passRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!passRecord) {
          setErrorMessage('Invalid or Expired Pass');
          return;
        }

        const expiresAt = new Date(passRecord.expires_at);
        if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
          setErrorMessage('Invalid or Expired Pass');
          return;
        }

        setPassData(passRecord);
        setIsValid(true);
      } catch (err) {
        console.error('Watch: Unexpected error validating pass:', err);
        setErrorMessage('Invalid or Expired Pass');
      }
    })();
  }, [location.search, params.code]);

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
