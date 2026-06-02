-- Migration: kamyoncu_user_id sütunu ekle
-- Tarih: 2026-06-02
-- Sebep: Kamyoncu "Seferlerim" filtresinin güvenilir çalışması için
--        (tc_kimlik/telefon yerine auth user id ile eşleştirme)

-- 1) sütunu ekle (NULL olabiliyor — eski kayıtlar için)
ALTER TABLE seferler
  ADD COLUMN IF NOT EXISTS kamyoncu_user_id uuid;

-- 2) index (kamyoncu kendi seferlerini çekerken hızlı)
CREATE INDEX IF NOT EXISTS idx_seferler_kamyoncu_user_id
  ON seferler (kamyoncu_user_id);

-- 3) foreign key (opsiyonel ama önerilir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_seferler_kamyoncu_user'
  ) THEN
    ALTER TABLE seferler
      ADD CONSTRAINT fk_seferler_kamyoncu_user
      FOREIGN KEY (kamyoncu_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) RLS: kamyoncu kendi seferlerini user_id ile de görebilmeli
DROP POLICY IF EXISTS "Kamyoncu can view own seferler" ON seferler;
CREATE POLICY "Kamyoncu can view own seferler" ON seferler
  FOR SELECT USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_user_id = auth.uid()
    OR kamyoncu_tc = auth.uid()::text
  );

DROP POLICY IF EXISTS "Creator can update own seferler" ON seferler;
CREATE POLICY "Creator can update own seferler" ON seferler
  FOR UPDATE USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_user_id = auth.uid()
    OR kamyoncu_tc = auth.uid()::text
  );

-- 5) Mevcut seferler için backfill (tc_kimlik'ten user_id bul)
UPDATE seferler s
SET kamyoncu_user_id = u.id
FROM users u
WHERE s.kamyoncu_tc = u.tc_kimlik
  AND s.kamyoncu_user_id IS NULL;
