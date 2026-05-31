-- Test Kullanıcıları Oluşturmak İçin SQL

-- NOT: Bu SQL script'i Supabase Dashboard'dan 'SQL Editor' bölümünden çalıştırın

-- Test 1: İş Veren (Issiz)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  '5555555551@demo.com',
  'hash_of_123456_here',  -- Gerçek hash kullanılmalı
  NOW(),
  '{"name": "Test İş Yeri", "role": "issiz"}'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, role, ad, tc_kimlik, telefon)
SELECT
  auth.id,
  auth.email,
  COALESCE(um.role, 'issiz'),
  COALESCE(um.ad, auth.email),
  um.tc_kimlik,
  um.telefon
FROM auth.users auth
LEFT JOIN (
  SELECT user_id, role, ad, tc_kimlik, telefon
  FROM user_roles ur
  LEFT JOIN users u ON ur.user_id = u.id
) um ON auth.id = um.user_id
WHERE auth.email = '5555555551@demo.com';

-- Test 2: Kamyoncu
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  '5555555552@demo.com',
  'hash_of_123456_here',  -- Gerçek hash kullanılmalı
  NOW(),
  '{"name": "Test Kamyoncu", "role": "kamyoncu"}'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, role, ad, tc_kimlik, telefon)
SELECT
  auth.id,
  auth.email,
  COALESCE(um.role, 'kamyoncu'),
  COALESCE(um.ad, auth.email),
  um.tc_kimlik,
  um.telefon
FROM auth.users auth
LEFT JOIN (
  SELECT user_id, role, ad, tc_kimlik, telefon
  FROM user_roles ur
  LEFT JOIN users u ON ur.user_id = u.id
) um ON auth.id = um.user_id
WHERE auth.email = '5555555552@demo.com';

-- Daha kolay yöntem: Supabase Dashboard kullanın
-- 1. Authentication > Users kısmına gidin
-- 2. "New User" butonuna tıklayın
-- 3. Email ve şifre girin (şifre: 123456)
-- 4. Email onayı yapın
-- 5. Sonra users tablosuna manuel olarak satır ekleyin
