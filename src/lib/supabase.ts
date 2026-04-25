import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingUrl = !supabaseUrl || supabaseUrl.includes('your-project-url');
const missingAnonKey = !supabaseAnonKey || supabaseAnonKey === 'your-anon-key';

if (missingUrl || missingAnonKey) {
  const messageParts = [];
  if (missingUrl) messageParts.push('VITE_SUPABASE_URL is missing or invalid.');
  if (missingAnonKey) messageParts.push('VITE_SUPABASE_ANON_KEY is missing or invalid.');
  const errorMessage = `${messageParts.join(' ')} Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vite environment variables.`;

  console.error('CRITICAL: Supabase Environment Variables Missing', {
    errorMessage,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    urlValue: supabaseUrl ? '[REDACTED]' : null,
    timestamp: new Date().toISOString(),
  });

  throw new Error(errorMessage);
}

console.debug('Supabase env vars detected. Creating client.', {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
