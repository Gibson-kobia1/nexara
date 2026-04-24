import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import Connect from './Connect';

export default function Admin() {
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = (msg: string) => {
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const finishAuthCheck = (message = '') => {
    if (!isMounted.current) return;
    setAuthChecked(true);
    setLoading(false);
    setUnauthorizedMessage(message);
  };

  const updateStatusMessage = (message: string) => {
    if (!isMounted.current) return;
    setStatusMessage(message);
  };

  const initializeAdmin = async (user: any) => {
    console.log('Admin: initializeAdmin called with user:', user ? { id: user.id, email: user.email } : null);
    if (!isMounted.current) {
      console.log('Admin: component unmounted, skipping');
      return;
    }

    if (!user) {
      console.log('Admin: no user, setting not admin');
      updateStatusMessage('No active admin session found. Please sign in.');
      setUser(null);
      setIsAdmin(false);
      finishAuthCheck();
      return;
    }

    setUser(user);
    setLoading(true);
    setAuthChecked(false);
    updateStatusMessage('Verifying admin access...');
    addDebugMessage('admin check started');
    try {
      console.log('Admin: querying profile for user id:', user.id);
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
      const normalizedEmail = user.email?.toLowerCase?.() ?? '';
      const isOwner = normalizedEmail === 'gibsonkobia@gmail.com';
      console.log('Admin: isOwner check:', isOwner, 'user email:', user.email);

      if (!profile?.is_admin && !isOwner) {
        console.log('Admin: not admin, showing error');
        addDebugMessage('admin check failed');
        updateStatusMessage('Admin access denied for this account.');
        setIsAdmin(false);
        finishAuthCheck('You do not have admin access with this account.');
        return;
      }

      console.log('Admin: user is admin, fetching submissions');
      addDebugMessage('admin check passed');
      setIsAdmin(true);
      setUnauthorizedMessage('');
      updateStatusMessage('Admin access granted. Fetching submissions...');
      await fetchSubmissions();
      await fetchUsers();
      console.log('Admin: fetchUsers completed');
      updateStatusMessage('Loaded admin data.');
      finishAuthCheck();
    } catch (err) {
      console.error('Admin: Error checking admin status:', err);
      addDebugMessage(`admin check failed: ${err}`);
      setIsAdmin(false);
      finishAuthCheck('Unable to verify admin access. Please try again later.');
    }
  };

  useEffect(() => {
    addDebugMessage('page mounted');
    console.log('Admin: useEffect triggered');
    const loadSession = async () => {
      addDebugMessage('session re-check started');
      console.log('Admin: loading session');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('Admin: getSession error:', error);
        console.log('Admin: session loaded:', session ? { user: { id: session.user.id, email: session.user.email } } : null);
        addDebugMessage(session ? `session found: ${session.user.email} / ${session.user.id}` : 'no session');
        await initializeAdmin(session?.user ?? null);
      } catch (err) {
        console.error('Admin: loadSession failed:', err);
        addDebugMessage(`loadSession failed: ${err}`);
        finishAuthCheck('Unable to load session. Please sign in again.');
      } finally {
        initialLoadDone.current = true;
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Admin: auth state change:', event, session ? { user: { id: session.user.id, email: session.user.email } } : null);
        addDebugMessage(`auth state change: ${event}`);
        if (!initialLoadDone.current) {
          console.log('Admin: ignoring auth event before initial load');
          return;
        }
        await initializeAdmin(session?.user ?? null);
      }
    );

    return () => {
      console.log('Admin: cleanup');
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchSubmissions = async () => {
    addDebugMessage('submissions fetch started');
    console.log('Admin: fetchSubmissions started');
    try {
      updateStatusMessage('Loading submissions...');
      // Get the current session to get the token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
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
        device_code: row.device_code,
        confirmation_link: row.confirmation_link || null,
      }));

      console.log('Admin: merged rows count:', mergedRows.length);
      addDebugMessage(`submissions fetch success: ${mergedRows.length} submissions`);
      addDebugMessage(`admin status: email=${adminEmail}, isOwner=${isOwner}`);
      setRows(mergedRows);
    } catch (err) {
      console.error('Admin: Error loading admin submissions:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      addDebugMessage(`submissions fetch failed: ${errorMsg}`);
      updateStatusMessage(`Submissions fetch failed: ${errorMsg}`);
    } finally {
      console.log('Admin: fetchSubmissions finally, setting loading false');
      if (isMounted.current) {
        setLoading(false);
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
        usersData = fallback.data;
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
                <th className="px-3 py-2">Device Code</th>
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
                  <td className="px-3 py-2 font-mono font-semibold text-green-400">{row.device_code ? (
                    <span className="bg-green-900/20 px-2 py-1 rounded text-green-300 font-bold">{row.device_code}</span>
                  ) : '-'}</td>
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                    {loading ? 'Loading submissions...' : 'No submissions found.'}
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
