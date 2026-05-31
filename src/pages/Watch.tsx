import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type LivePayload = Record<string, any>;

export default function Watch() {
  const { code } = useParams<{ code: string }>();
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [events, setEvents] = useState<LivePayload[]>([]);
  const channelRef = useRef<any>(null);

  const normalizedCode = useMemo(() => (code || '').toUpperCase().trim(), [code]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage('');
    setIsValid(false);
    setEvents([]);

    if (!normalizedCode) {
      setErrorMessage('This access link has expired or is invalid.');
      setIsLoading(false);
      return;
    }

    const validatePass = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('guest_passes')
        .select('id')
        .eq('pass_code', normalizedCode)
        .gt('expires_at', now)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        console.error('Watch: guest pass validation error', error);
        setErrorMessage('This access link has expired or is invalid.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage('This access link has expired or is invalid.');
        setIsLoading(false);
        return;
      }

      setIsValid(true);
      setIsLoading(false);
    };

    validatePass();

    return () => {
      isActive = false;
    };
  }, [normalizedCode]);

  useEffect(() => {
    if (!isValid || !normalizedCode) {
      return;
    }

    const channel = supabase
      .channel(`watch-live-${normalizedCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'platform_connection_requests',
        },
        (payload) => {
          if (!payload || !payload.new) return;
          setEvents((current) => [payload.new, ...current]);
        }
      );

    channel.subscribe((status) => {
      console.log('[WATCH] realtime channel status', status);
      if (status === 'SUBSCRIBED') {
        console.log('[WATCH] subscribed to live platform connection requests');
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [isValid, normalizedCode]);

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/30">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Live Watch Portal</h1>
          <p className="mt-2 text-slate-400">
            This screen is read-only. It displays incoming live events for active guest pass access.
          </p>
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
            <p className="text-lg font-semibold">This access link has expired or is invalid.</p>
            <p className="mt-2 text-sm text-red-200">Please request a new guest pass from the administrator.</p>
          </div>
        )}

        {!isLoading && isValid && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <p className="text-slate-300">Guest pass <span className="font-semibold text-white">{normalizedCode}</span> is valid.</p>
              <p className="mt-2 text-slate-400">Waiting for incoming live data from the platform connection request stream.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              {events.length === 0 ? (
                <div className="text-slate-400">No live events have arrived yet. Keep this page open to watch incoming data.</div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={`${event.id ?? index}-${event.created_at ?? index}`} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                      <div className="flex flex-col gap-2 text-sm text-slate-300">
                        {Object.entries(event).map(([field, value]) => (
                          <div key={field} className="grid grid-cols-[180px_1fr] gap-3">
                            <span className="font-mono text-slate-500">{field}</span>
                            <span className="break-words text-white">{value === null || value === undefined ? '-' : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
