import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client
export let supabase = null;
let isDemoMode = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.error('❌ Supabase client oluşturulamadı:', error);
    isDemoMode = true;
  }
} else {
  console.warn('⚠️ Supabase URL veya key eksik! Demo modunda çalışılıyor.');
  isDemoMode = true;
}

// Helper to check if demo mode
export const isDemoModeActive = () => isDemoMode;

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
