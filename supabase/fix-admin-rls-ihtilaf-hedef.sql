-- ============================================================
-- NakliYol Pro — Admin RLS düzeltmesi + İhtilaf karşı taraf kaydı
-- Tarih: 2026-08-02
-- Çalıştırma: Supabase Dashboard → SQL Editor → Run
--
-- Sorun:
--   * Admin hesabının auth.uid() değeri users.id ile eşleşmiyor.
--     is_admin() = (users.id = auth.uid()) olduğu için admin için
--     FALSE dönüyor → admin seferler/ihtilaflar/kullanıcıları
--     okuyamıyor, güncelleyemiyordu.
--   * İhtilaflar, karşı tarafın kullanıcı ID'sini saklamıyordu;
--     admin paneli karşı tarafı ancak sefer üzerinden bulabiliyordu.
--     Sefer silinirse veya okunamazsa karşı taraf telefonu gözükmüyordu.
--
-- Çözüm:
--   1) is_admin(): auth.uid() → auth.users.email → users.email
--      eşleşmesiyle adminliği doğrula (auth uid ile users.id uyumsuzluğuna
--      dayanıklı).
--   2) ihtilaflar.hedef_id: ihtilaf açılırken karşı tarafın kullanıcı
--      ID'si saklanır + mevcut kayıtlar sefer üzerinden geri doldurulur.
-- ============================================================

-- ############################################
-- 1) is_admin() düzeltmesi
-- ############################################
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users au
    JOIN public.users u ON u.email = au.email
    WHERE au.id = auth.uid() AND u.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ############################################
-- 2) ihtilaflar.hedef_id (karşı taraf kullanıcı ID)
-- ############################################
ALTER TABLE public.ihtilaflar
  ADD COLUMN IF NOT EXISTS hedef_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Mevcut ihtilafları geri doldur:
-- * ihtilafı kamyoncu açtıysa → hedef = seferin işvereni (olusturan_id)
-- * ihtilafı işveren açtıysa → hedef = seferin kamyoncusu (kamyoncu_user_id)
UPDATE public.ihtilaflar i
SET hedef_id = CASE
  WHEN i.acan_id = s.olusturan_id THEN s.kamyoncu_user_id
  ELSE s.olusturan_id
END
FROM public.seferler s
WHERE s.id = i.sefer_id AND i.hedef_id IS NULL;

-- ############################################
-- 3) Eski "odendi" durumlu seferleri "tamamlandı" yap
-- ############################################
-- Ödeme onaylanmış (odeme_durumu = odendi) veya durumu odendi olan
-- seferleri yeni terminolojiye çevir. odeme_durumu aynen korunur.
UPDATE public.seferler
SET durum = 'tamamlandı'
WHERE durum = 'odendi';

-- ############################################
-- KONTROL SORGULARI
-- ############################################
-- SELECT * FROM public.ihtilaflar ORDER BY olusturma_zamani DESC;
-- SELECT is_admin();  -- admin oturumuyla beklenen: true
-- SELECT durum, count(*) FROM public.seferler GROUP BY durum;
