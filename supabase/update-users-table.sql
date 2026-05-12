-- Email alanını kaldır / yok say - Sadece telefon ve şifre kullanılır

-- Önce mevcut tabloyu kontrol edin
-- ALTER TABLE users DROP COLUMN email;  -- Email'i kaldırmak için
-- Email alanı opsiyonel olarak kalsın ama kullanılmayabilir

-- Test kullanıcıları için geçici email oluşturma (opsiyonel)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
SELECT
  gen_random_uuid(),
  u.telefon || '@demo.com',
  'hash_of_' || u.telefon,
  NOW(),
  jsonb_build_object('name', u.ad, 'role', u.role, 'tc_kimlik', u.tc_kimlik)
FROM users u
WHERE u.email = '5555555551@demo.com' OR u.telefon = '5555555551'
ON CONFLICT (email) DO NOTHING;

-- Eğer email tablosunda yoksa, son kaydı al
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
SELECT
  gen_random_uuid(),
  u.telefon || '@demo.com',
  'hash_of_' || u.telefon,
  NOW(),
  jsonb_build_object('name', u.ad, 'role', u.role, 'tc_kimlik', u.tc_kimlik)
FROM users u
WHERE u.email IS NULL OR u.email = ''
ORDER BY u.kayitTarihi DESC
LIMIT 1
ON CONFLICT DO NOTHING;

-- Auth tablosuna user_roles ekleyin
INSERT INTO auth.users (raw_user_meta_data)
SELECT jsonb_build_object('user_roles', ur.role)
FROM user_roles ur
ON CONFLICT DO NOTHING;
