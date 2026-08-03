-- ============================================================
-- NakliYol Pro — Profil fotoğrafı / belge yükleme düzeltmesi
-- Tarih: 2026-08-02
-- Çalıştırma: Supabase Dashboard → SQL Editor → Run
--
-- Sorunlar:
--   * belgeler.rol NOT NULL CHECK (kamyoncu/issiz) → kod rolü yanlış
--     alanda (role) tutuyordu; rol NULL gelince foto yüklenemiyordu.
--   * CHECK 'admin' rolünü reddediyordu (admin foto yükleyemezdi).
--   * belgeler RLS'i yalnızca kendi belgesini gösteriyordu → başka
--     kullanıcıların profil fotoğrafları görünmüyordu; admin Belge
--     paneli boş kalıyordu.
-- ============================================================

-- 1) rol sütununu esnet: CHECK'e admin ekle, boş gelirse kamyoncu varsay
ALTER TABLE public.belgeler
  ALTER COLUMN rol SET DEFAULT 'kamyoncu';

ALTER TABLE public.belgeler
  DROP CONSTRAINT IF EXISTS belgeler_rol_check;

ALTER TABLE public.belgeler
  ADD CONSTRAINT belgeler_rol_check CHECK (rol IN ('kamyoncu', 'issiz', 'admin'));

-- 2) RLS: herkes (oturum açan) profil fotoğrafı dahil belgeleri görebilsin
--    (ilanlar/profiller herkese açık olduğu için görseller görünmeli).
--    INSERT/DELETE yine kendi belgesi; UPDATE/onay admin.
DROP POLICY IF EXISTS "Kullanıcı kendi belgelerini görür" ON public.belgeler;
CREATE POLICY "Belgeleri herkes görebilir" ON public.belgeler
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Kullanıcı kendi belgelerini ekler" ON public.belgeler;
CREATE POLICY "Kullanıcı kendi belgesini ekler" ON public.belgeler
  FOR INSERT WITH CHECK (auth.uid() = kullanici_id);

DROP POLICY IF EXISTS "Kullanıcı kendi belgelerini siler" ON public.belgeler;
CREATE POLICY "Kullanıcı kendi belgesini siler" ON public.belgeler
  FOR DELETE USING (auth.uid() = kullanici_id);

-- Admin tüm belgeleri onaylayabilir / güncelleyebilir
DROP POLICY IF EXISTS "Admin belgeleri gunceller" ON public.belgeler;
CREATE POLICY "Admin belgeleri gunceller" ON public.belgeler
  FOR UPDATE USING (public.is_admin());

-- 3) Storage: kullanıcılar belgeleri okuyabilsin/yükleyebilsin
--    (profil fotoğraflarının herkese görünmesi için SELECT açık)
DROP POLICY IF EXISTS "Kullanıcı belgelerini görür" ON storage.objects;
CREATE POLICY "Belgeleri herkes gorebilir" ON storage.objects
  FOR SELECT USING (bucket_id = 'belgeler');

DROP POLICY IF EXISTS "Kullanıcı belgelerini yükler" ON storage.objects;
CREATE POLICY "Kullanici belge yukleyebilir" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'belgeler' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Kullanıcı belgelerini siler" ON storage.objects;
CREATE POLICY "Kullanici belge silebilir" ON storage.objects
  FOR DELETE USING (bucket_id = 'belgeler' AND auth.uid() IS NOT NULL);

-- ############################################
-- KONTROL
-- ############################################
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'belgeler';
-- SELECT id, kullanici_id, dosya_adi, rol, onaylandi FROM public.belgeler LIMIT 20;
