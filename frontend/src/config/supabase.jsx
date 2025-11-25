import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Config] Missing required configuration!');
  console.error('[Supabase Config] URL:', supabaseUrl ? 'Set' : 'MISSING');
  console.error('[Supabase Config] Key:', supabaseAnonKey ? 'Set' : 'MISSING');
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Log configuration (for debugging in production)
console.log('[Supabase Config] Initializing with URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('[Supabase Config] Key:', supabaseAnonKey ? 'Set' : 'Missing');

// Singleton pattern to prevent multiple client instances
// Use global window object to ensure true singleton across module reloads
if (!window.__SUPABASE_CLIENT__) {
  try {
    window.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'skn-lms-auth', // Use a unique storage key to avoid conflicts
        storage: window.localStorage
      }
    });
    console.log('[Supabase Config] Client created successfully');
  } catch (error) {
    console.error('[Supabase Config] Failed to create client:', error);
    throw new Error('Failed to initialize Supabase client: ' + error.message);
  }
} else {
  console.log('[Supabase Config] Using existing client instance from window');
}

const supabase = window.__SUPABASE_CLIENT__;

// Create admin client with service role key (if available)
// WARNING: Service role key should NEVER be exposed in client-side code in production!
// This is only for development/testing. In production, use Edge Functions or backend API.
let supabaseAdmin = null;

if (!window.__SUPABASE_ADMIN_CLIENT__) {
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseServiceRoleKey) {
    try {
      // Use a completely isolated storage to avoid conflicts
      const adminStorage = {
        getItem: (key) => {
          try {
            return window.localStorage.getItem(`admin_${key}`);
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            window.localStorage.setItem(`admin_${key}`, value);
          } catch { }
        },
        removeItem: (key) => {
          try {
            window.localStorage.removeItem(`admin_${key}`);
          } catch { }
        }
      };

      window.__SUPABASE_ADMIN_CLIENT__ = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storageKey: 'skn-lms-admin-auth-unique', // Unique storage key
          storage: adminStorage // Use custom storage to avoid conflicts
        }
      });
      console.log('[Supabase Config] Admin client created (service role key detected)');
      supabaseAdmin = window.__SUPABASE_ADMIN_CLIENT__;
    } catch (error) {
      console.warn('[Supabase Config] Failed to create admin client:', error);
    }
  } else {
    // Only warn if we are in development mode, otherwise silence it
    if (import.meta.env.DEV) {
      console.warn('[Supabase Config] Service role key not found. Direct password changes will not work. Use email reset method or configure VITE_SUPABASE_SERVICE_ROLE_KEY.');
    }
  }
} else {
  supabaseAdmin = window.__SUPABASE_ADMIN_CLIENT__;
  console.log('[Supabase Config] Using existing admin client instance from window');
}

// Export default for convenience
export { supabase, supabaseAdmin };
export default supabase;
