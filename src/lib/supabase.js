import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 SUPABASE_URL:', supabaseUrl ? '✅ VAR' : '❌ YOK');
console.log('🔍 SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ VAR' : '❌ YOK');

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  console.log('✅ Supabase başlatıldı');
} else {
  console.warn('⚠️ Supabase env variables yok - Demo mode');
  // Demo mode fallback
  supabase = createClient(
    'https://wkxhgrqxknxchferqqha.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGhncnF4a254Y2hmZXJxcWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjI4ODcsImV4cCI6MjA5MzczODg4N30.PObDf90tsIOZhsXtwIFOgODEsjXLVZ0DNgYZ8vrPTQQ',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
}

// Handle auth state changes
if (supabase && supabase.auth) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event);
  });
}

// Export both default and named exports
export default supabase;
export { supabase };
