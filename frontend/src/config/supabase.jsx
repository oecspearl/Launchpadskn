import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.error('[Supabase Config] Missing required configuration!');
  }
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Singleton pattern to prevent multiple client instances
if (!window.__SUPABASE_CLIENT__) {
  try {
    window.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'skn-lms-auth',
        storage: window.localStorage
      }
    });
  } catch (error) {
    throw new Error('Failed to initialize Supabase client: ' + error.message);
  }
}

const supabase = window.__SUPABASE_CLIENT__;

// SECURITY: Service role key is NOT available on the client.
// Admin operations (user deletion, password resets) must go through
// Supabase Edge Functions or a server-side API.
const supabaseAdmin = null;

// Export default for convenience
export { supabase, supabaseAdmin };
export default supabase;
