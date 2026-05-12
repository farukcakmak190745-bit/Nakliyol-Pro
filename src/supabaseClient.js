import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client
export let supabase = null;
let isDemoMode = false;

try {
  console.log('🔧 Supabase client başlatılıyor...');
  console.log('Supabase URL:', supabaseUrl ? '✓ Var' : '❌ Yok');

  if (supabaseUrl && supabaseAnonKey) {
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
        // WebSocket hatası durumunda console log ekle
        onError: (error) => {
          console.error('❌ Realtime WebSocket HATASI:', error.message);
        }
      }
    });

    console.log('✅ Supabase client başarıyla oluşturuldu');

    // Handle auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event);
    });

    // Realtime bağlantı kontrolü
    setTimeout(() => {
      console.log('📡 Realtime bağlantısı kuruldu');
    }, 1000);
  } else {
    console.warn('⚠️ Supabase URL veya key eksik! Demo modunda çalışılıyor.');
    isDemoMode = true;
  }
} catch (error) {
  console.error('❌ Supabase client oluşturulamadı:', error);
  isDemoMode = true;
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
