-- ==============================================
-- MIGRATION: İlan soft-delete + geçmiş görünürlüğü
-- ==============================================
--
-- Sorun: İşveren ilan sildiğinde seferler de siliniyordu (CASCADE)
-- Çözüm: ilanSil artık DELETE yerine UPDATE durum='silindi' yapıyor.
-- Bu migration, issuer'ın kendi silinmiş ilanlarını da görebilmesi için
-- RLS policy'yi günceller.
--
-- Supabase Dashboard > SQL Editor'da çalıştırın.
-- Tekrar çalıştırılabilir (idempotent).
-- ==============================================

BEGIN;

-- 1) ilanlar SELECT policy'yi güncelle
-- Önce eski policy'yi drop et, sonra yeni kapsamlı policy oluştur.
-- Yeni kural: ya ilan aktif (herkes görebilir) ya da oluşturan kişi (kendi ilanlarını tüm durumlarda görür).
DROP POLICY IF EXISTS "Public can view active ilans" ON ilanlar;

CREATE POLICY "Public can view active or own ilans"
  ON ilanlar FOR SELECT
  USING (
    durum = 'aktif'
    OR olusturan_id = auth.uid()
  );

-- 2) seferler.ilan_id üzerindeki CASCADE'i kaldır.
-- Bu, gelecekte yanlışlıkla hard-delete yapılırsa seferlerin korunmasını sağlar.
-- Mevcut constraint'i drop et, aynısı ON DELETE NO ACTION ile yeniden oluştur.
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'seferler'::regclass
    AND contype = 'f'
    AND conname LIKE '%ilan_id%';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE seferler DROP CONSTRAINT %I', fk_name);
    EXECUTE 'ALTER TABLE seferler
             ADD CONSTRAINT seferler_ilan_id_fkey
             FOREIGN KEY (ilan_id) REFERENCES ilanlar(id) ON DELETE NO ACTION';
    RAISE NOTICE 'seferler.ilan_id CASCADE -> NO ACTION güncellendi';
  ELSE
    RAISE NOTICE 'seferler.ilan_id FK bulunamadı, atlandı';
  END IF;
END $$;

COMMIT;

-- Doğrulama (bilgi amaçlı):
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'ilanlar';
-- SELECT conname, confdeltype FROM pg_constraint WHERE conrelid = 'seferler'::regclass AND contype = 'f';
