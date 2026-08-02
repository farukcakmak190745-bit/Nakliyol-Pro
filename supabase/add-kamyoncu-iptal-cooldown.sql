-- Kamyoncu iptal sistemi: sefer iptali + abuse (kötüye kullanım) önleme cooldown'u.
-- Kural: Son 24 saatte 3+ iptal yapan kamyoncu 24 saat ilanlara başvuru yapamaz.

-- 1) users tablosuna cooldown bitiş kolonu
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS iptal_cooldown_bitis TIMESTAMP WITH TIME ZONE;

-- 2) İptal kayıtları tablosu (kaç kez iptal edildiğini saymak için)
CREATE TABLE IF NOT EXISTS kamyoncu_iptaller (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sefer_id UUID,
  sebep TEXT,
  zaman TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kamyoncu_iptaller_kullanici
  ON kamyoncu_iptaller (kullanici_id, zaman);

-- 3) RLS: kamyoncu kendi iptal kaydını ekleyebilir ve görebilir
ALTER TABLE kamyoncu_iptaller ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kamyoncu can insert own iptal" ON kamyoncu_iptaller;
CREATE POLICY "Kamyoncu can insert own iptal" ON kamyoncu_iptaller
  FOR INSERT WITH CHECK (auth.uid() = kullanici_id);

DROP POLICY IF EXISTS "Kamyoncu can view own iptal" ON kamyoncu_iptaller;
CREATE POLICY "Kamyoncu can view own iptal" ON kamyoncu_iptaller
  FOR SELECT USING (
    auth.uid() = kullanici_id OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
