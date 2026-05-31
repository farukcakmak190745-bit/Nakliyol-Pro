-- Email onayını kapat
UPDATE auth.users
SET email_confirm = false
WHERE email_confirm IS NOT NULL;

-- Güvenlik uyarısı: Email onayı kapalı, kullanıcılar otomatik olarak aktif olacak
-- Bu demo amaçlıdır, prod ortamında email onayı açık tutun

-- Sonraki yeni kayıt olan kullanıcılar için de ayarı değiştir
ALTER AUTH PROVIDERS
SET email_confirm = false;

-- Yeni kayıtlar için de güncelle
UPDATE auth.users
SET email_confirm = false;
