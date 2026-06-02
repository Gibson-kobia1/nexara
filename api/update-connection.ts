import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tracking_id, confirmation_link, code } = req.body || {};

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase service role env vars");
    return res.status(500).json({
      error: "Server configuration error. Service role key not available."
    });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const updateData: any = {};
  if (confirmation_link !== undefined) updateData.confirmation_link = confirmation_link;
  if (code !== undefined) updateData.code = code;

  const { data, error } = await supabaseAdmin
    .from('platform_connection_requests')
    .update(updateData)
    .eq('tracking_id', tracking_id)
    .select()
    .single();

  if (error) {
    console.error("Update error:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}
