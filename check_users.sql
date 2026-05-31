-- Supabase Dashboard > SQL Editor > bu kodu çalıştır

-- 1. Users tablosundaki tüm kayıtları gör
SELECT
  id,
  email,
  ad,
  tc_kimlik,
  telefon,
  created_at
FROM users
ORDER BY created_at DESC;

-- 2. Role kolonu var mı kontrol et
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';

-- 3. Auth tablosundaki meta data'yı kontrol et
SELECT
  id,
  email,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Eğer role yoksa eklemek için bu sorguyu çalıştır
-- Her kullanıcı için önce auth.users'tan role al, sonra users tablosuna update et
UPDATE users u
SET role = COALESCE(
  jsonb_extract_path_text(au.raw_user_meta_data, 'role'),
  'issiz'
)
FROM auth.users au
WHERE u.id = au.id
AND u.role IS NULL;

-- 5. Sonucu tekrar kontrol et
SELECT
  u.id,
  u.email,
  u.role,
  u.ad,
  au.raw_user_meta_data
FROM users u
LEFT JOIN auth.users au ON u.id = au.id;
