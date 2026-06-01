import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables for update-connection');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in server environment.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload: any;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('[UPDATE_CONNECTION] Received payload:', payload);
  } catch (err) {
    console.error('[UPDATE_CONNECTION] ❌ Invalid JSON:', err);
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  const tracking_id = typeof payload.tracking_id === 'string' ? payload.tracking_id.trim() : null;
  if (!tracking_id) {
    console.warn('[UPDATE_CONNECTION] ❌ Missing tracking_id');
    return res.status(400).json({ error: 'tracking_id is required' });
  }
  console.log('[UPDATE_CONNECTION] 📋 tracking_id:', tracking_id);

  const allowedFields: Record<string, any> = {};
  if (typeof payload.confirmation_link === 'string') {
    allowedFields.confirmation_link = payload.confirmation_link.trim();
    console.log('[UPDATE_CONNECTION] 📝 Updating confirmation_link');
  }
  if (typeof payload.code === 'string') {
    allowedFields.code = payload.code.trim();
    console.log('[UPDATE_CONNECTION] 📝 Updating code');
  }

  if (Object.keys(allowedFields).length === 0) {
    console.warn('[UPDATE_CONNECTION] ❌ No valid fields to update:', payload);
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    console.log('[UPDATE_CONNECTION] 🔄 Querying with tracking_id:', tracking_id);
    const { data, error } = await supabaseAdmin
      .from('platform_connection_requests')
      .update(allowedFields)
      .eq('tracking_id', tracking_id)
      .select();

    if (error) {
      console.error('[UPDATE_CONNECTION] ❌ Supabase error:', error);
      return res.status(500).json({ error: `Failed to update record: ${error.message}` });
    }

    if (!data || data.length === 0) {
      console.warn('[UPDATE_CONNECTION] ⚠️ No rows found with tracking_id:', tracking_id);
      return res.status(404).json({ error: 'Record not found with this tracking_id' });
    }

    console.log('[UPDATE_CONNECTION] ✅ Success! Updated', data.length, 'row(s):', data);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[UPDATE_CONNECTION] ❌ Exception:', err);
    return res.status(500).json({ error: `Unexpected server error: ${err instanceof Error ? err.message : String(err)}` });
  }
}
