-- Admin yönetim paneli: kullanıcı askıya alma / aktifleştirme kolonu.
-- Kullanıcı 'pasif' olduğunda giriş yapamaz (kod tarafında kontrol edilir).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS durum TEXT DEFAULT 'aktif';
