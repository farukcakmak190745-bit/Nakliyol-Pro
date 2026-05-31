-- Supabase'de role sorununu çöz

-- 1. Önce mevcut tabloları kontrol et
SELECT 'USERS TABLE:' as info, id, email, ad, role, telefon FROM users ORDER BY id DESC;

SELECT 'AUTH USERS:' as info, id, email, raw_user_meta_data FROM auth.users ORDER BY id DESC LIMIT 10;

-- 2. Her kullanıcı için auth.users'taki role'u users tablosuna kopyala
UPDATE users u
SET role = COALESCE(
  COALESCE(au.raw_user_meta_data->>'role', au.raw_user_meta_data->>'name'),
  'issiz'
)
FROM auth.users au
WHERE u.id = au.id
AND u.role IS NULL;

-- 3. Sonucu tekrar kontrol et
SELECT
  u.id,
  u.email,
  u.role as user_role,
  au.raw_user_meta_data,
  au.raw_user_meta_data->>'role' as auth_role
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.id DESC;
