import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zdcniidpqppwjyosooge.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY25paWRwcXBwd2p5b3Nvb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODc3NDgsImV4cCI6MjA3NDQ2Mzc0OH0.nz9oqG27mtmGzso3uPAMFoj191Qr3dz03AKUS5anXuo';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Config] Missing required configuration!');
  console.error('[Supabase Config] URL:', supabaseUrl ? 'Set' : 'MISSING');
  console.error('[Supabase Config] Key:', supabaseAnonKey ? 'Set' : 'MISSING');
}

// Log configuration (for debugging in production)
console.log('[Supabase Config] Initializing with URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('[Supabase Config] Key:', supabaseAnonKey ? 'Set' : 'Missing');

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  console.log('[Supabase Config] Client created successfully');
} catch (error) {
  console.error('[Supabase Config] Failed to create client:', error);
  throw new Error('Failed to initialize Supabase client: ' + error.message);
}

// Export default for convenience
export { supabase };
export default supabase;


