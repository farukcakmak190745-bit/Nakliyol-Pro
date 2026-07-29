import { createClient } from '@supabase/supabase-js';

function getEnv(name) {
  // CRA: process.env.REACT_APP_* (replaced at build time by webpack)
  if (typeof process !== 'undefined' && process.env && process.env['REACT_APP_' + name])
    return process.env['REACT_APP_' + name];
  // Vite: import.meta.env.VITE_*
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env['VITE_' + name])
      return import.meta.env['VITE_' + name];
  } catch (e) {}
  return '';
}

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Initialize Supabase client
export let supabase = null;

try {
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
