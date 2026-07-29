import { createClient } from '@supabase/supabase-js';

// CRA defines process.env.REACT_APP_* via DefinePlugin at build time
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
export let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        onError: (error) => {
          console.error('❌ Realtime WebSocket HATASI:', error.message);
        }
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event);
    });
  } catch (error) {
    console.error('❌ Supabase client oluşturulamadı:', error);
  }
} else {
  console.warn('⚠️ Supabase URL veya key eksik! Demo modunda çalışılıyor.');
}

// Global Realtime channel reference
export let supabaseChannel = null;

// Collection Ref'ler
export const usersTable = 'users';
export const userRolesTable = 'user_roles';
export const ilanlarTable = 'ilanlar';
export const seferlerTable = 'seferler';
export const tekliflerTable = 'teklifler';
export const conversationsTable = 'conversations';
export const messagesTable = 'messages';
export const bildirimlerTable = 'bildirimler';
export const takipTable = 'takip';
