-- Teslim sonrası ödeme sistemi:
-- 1) İşveren ödeme onayı + vade takibi + ihtilaf (itiraz) sistemi.

-- 1) seferler tablosuna kamyoncu kullanıcı ID'si (bildirim/doğrulama için)
ALTER TABLE seferler
  ADD COLUMN IF NOT EXISTS kamyoncu_user_id UUID;

-- 2) seferler tablosuna vade tarihi (teslim_tarihi + odeme_gun gün)
ALTER TABLE seferler
  ADD COLUMN IF NOT EXISTS vade_tarihi DATE;

-- 3) İhtilaf (itiraz) tablosu: kamyoncu ödeme almadıysa itiraz açar
CREATE TABLE IF NOT EXISTS ihtilaflar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sefer_id UUID REFERENCES seferler(id) ON DELETE CASCADE,
  acan_id UUID REFERENCES users(id) ON DELETE CASCADE,
  acan_rol TEXT DEFAULT 'kamyoncu',
  sebep TEXT NOT NULL,
  durum TEXT DEFAULT 'acik',
  admin_notu TEXT,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) RLS: ihtilafları herkes görebilir, kullanıcılar açabilir, admin çözebilir
ALTER TABLE ihtilaflar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ihtilaflar herkes okuyabilir" ON ihtilaflar;
CREATE POLICY "Ihtilaflar herkes okuyabilir" ON ihtilaflar
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Ihtilaflar kullanici acabilir" ON ihtilaflar;
CREATE POLICY "Ihtilaflar kullanici acabilir" ON ihtilaflar
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Ihtilaflar admin guncelleyebilir" ON ihtilaflar;
CREATE POLICY "Ihtilaflar admin guncelleyebilir" ON ihtilaflar
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
