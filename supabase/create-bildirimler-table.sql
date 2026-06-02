-- =============================================
-- BİLDİRİMLER TABLOSU OLUŞTUR
-- =============================================
-- Bu script 'bildirimler' tablosunu yoksa oluşturur,
-- RLS etkinleştirir ve INSERT/SELECT policy'leri ekler.
--
-- Supabase Dashboard → SQL Editor → New query → çalıştır.
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bildirimler'
  ) THEN
    CREATE TABLE bildirimler (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kullanici_id UUID REFERENCES users(id) ON DELETE CASCADE,
      tur TEXT NOT NULL DEFAULT 'genel',
      baslik TEXT,
      icerik TEXT,
      ilan_id UUID,
      sefer_id UUID,
      okundu BOOLEAN DEFAULT FALSE,
      olusturma_zamani TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_bildirimler_kullanici ON bildirimler(kullanici_id);
    CREATE INDEX IF NOT EXISTS idx_bildirimler_okundu ON bildirimler(okundu);
    CREATE INDEX IF NOT EXISTS idx_bildirimler_zaman ON bildirimler(olusturma_zamani DESC);

    RAISE NOTICE '✅ bildirimler tablosu oluşturuldu';
  ELSE
    RAISE NOTICE 'ℹ️ bildirimler tablosu zaten mevcut';
  END IF;
END $$;

ALTER TABLE bildirimler ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bildirimler' AND policyname = 'Authenticated can insert bildirimler'
  ) THEN
    CREATE POLICY "Authenticated can insert bildirimler"
      ON bildirimler FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bildirimler' AND policyname = 'Users can view own bildirimler'
  ) THEN
    CREATE POLICY "Users can view own bildirimler"
      ON bildirimler FOR SELECT
      USING (auth.uid() = kullanici_id OR kullanici_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bildirimler' AND policyname = 'Users can update own bildirimler'
  ) THEN
    CREATE POLICY "Users can update own bildirimler"
      ON bildirimler FOR UPDATE
      USING (auth.uid() = kullanici_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bildirimler' AND policyname = 'Users can delete own bildirimler'
  ) THEN
    CREATE POLICY "Users can delete own bildirimler"
      ON bildirimler FOR DELETE
      USING (auth.uid() = kullanici_id);
  END IF;
END $$;

-- Kontrol
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'bildirimler'
ORDER BY policyname;
