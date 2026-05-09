import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL veya key eksik! Demo modunda çalışılıyor.');
  console.warn('Lütfen .env dosyasına Supabase URL ve key ekleyin');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

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
