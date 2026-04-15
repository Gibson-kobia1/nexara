import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('your-project-url') ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'your-anon-key';

if (isPlaceholder) {
  console.warn(
    'Supabase configuration is missing or using placeholders. ' +
      'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env or Vercel environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl && !supabaseUrl.includes('your-project-url')
    ? supabaseUrl
    : 'https://placeholder.supabase.co',
  supabaseAnonKey && supabaseAnonKey !== 'your-anon-key'
    ? supabaseAnonKey
    : 'placeholder-key'
);
