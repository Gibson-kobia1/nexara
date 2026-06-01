import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Watch() {
  const location = useLocation();
  const params = useParams<{ code?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [passData, setPassData] = useState<any>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const passCodeFromQuery = searchParams.get('pass')?.trim();
    const pathCode = params.code?.trim();
    const passCode = passCodeFromQuery || pathCode || '';

    const validatePass = async () => {
      setIsLoading(true);
      setErrorMessage('');
      setIsValid(false);
      setPassData(null);

      if (!passCode) {
        setErrorMessage('Invalid or Expired Pass');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('guest_passes')
          .select('*')
          .eq('pass_code', passCode);

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
      } finally {
        setIsLoading(false);
      }
    };

    validatePass();
  }, [location.search, params.code]);

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/30">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Live Watch Portal</h1>
          <p className="mt-2 text-slate-400">This screen is public and read-only.</p>
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Validating access link...</span>
            </div>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-3xl border border-red-500/30 bg-red-950/80 p-6 text-red-200">
            <p className="text-lg font-semibold">Invalid or Expired Pass</p>
            <p className="mt-2 text-sm text-red-200">The pass is not valid or has already expired.</p>
          </div>
        )}

        {!isLoading && isValid && passData && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <h2 className="text-2xl font-semibold">Access granted</h2>
              <p className="mt-2 text-slate-300">This guest pass is valid until {new Date(passData.expires_at).toLocaleString()}.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <div className="text-slate-300">Live stream placeholder:</div>
              <div className="mt-4 rounded-3xl bg-black/60 p-6 text-slate-100">
                <p className="text-lg font-semibold">Live data stream</p>
                <p className="mt-2 text-slate-400">Incoming events would appear here in the production watcher.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
