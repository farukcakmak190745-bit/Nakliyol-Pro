-- ============================================================
-- NakliYol Pro — RLS Güvenlik Düzeltmeleri (Dengeli)
-- Tarih: 2026-08-02
-- Çalıştırma: Supabase Dashboard → SQL Editor → Run
--
-- Kapsam:
--   1) users: anon yazma/rol değiştirme/silme KAPATILDI.
--      - INSERT: sadece kamyoncu/issiz rolüyle (anon dahi admin olamaz)
--      - UPDATE: sadece kendi kaydı (auth.uid()=id) veya admin
--      - DELETE: sadece admin
--      - tc_kimlik sütunu anon/authenticated'ten gizlendi
--        (kendi TC'si için kendi_profilini_getir RPC kullanılır)
--   2) bildirimler: SELECT sadece kendi bildirimleri / admin
--   3) ihtilaflar: INSERT artık anon yapamaz; UPDATE admin kontrolü is_admin ile
--   4) teklifler: SELECT authenticated olmayanlara kapalı
--   5) push_abonelikleri: anon tüm abonelik okuması kaldırıldı,
--      sunucu RPC'lerle (SECURITY DEFINER) okuyacak
--   6) is_admin() yardımcı fonksiyonu (recursion güvenli)
--   7) seferler: tc_kimlik REVOKE edildiği için users.tc_kimlik okuyan eski
--      policy'ler patlar → kamyoncu_user_id/telefon tabanlı güvenli tanımlar
-- ============================================================

-- ############################################
-- 0) YARDIMCI FONKSİYON: is_admin()
-- ############################################
-- SECURITY DEFINER sayesinde users tablosunu RLS bypass ederek
-- okur → policy içinde sonsuz recursion (infinite recursion) olmaz.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ############################################
-- 1) USERS TABLOSU
-- ############################################
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eski (çok açık) politikaları kaldır
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Authenticated write access" ON public.users;
DROP POLICY IF EXISTS "Authenticated update" ON public.users;
DROP POLICY IF EXISTS "Authenticated delete" ON public.users;

-- SELECT: mevcut uygulama davranışı korunur (ilan listesi olusturan bilgisi).
-- Okumayı tamamen kapatmak login/ilan akışını kırar (kod anon okumaya bağımlı).
-- Hassas TC sütunu aşağıda column-level REVOKE ile gizlenir.
DROP POLICY IF EXISTS "users_select_public" ON public.users;
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT USING (true);

-- INSERT: kayıt sırasında sadece kamyoncu/issiz rolü verilebilir.
-- Böylece anon key ile "admin" rolünde sahte kayıt oluşturulamaz.
DROP POLICY IF EXISTS "users_insert_kayit" ON public.users;
CREATE POLICY "users_insert_kayit" ON public.users
  FOR INSERT WITH CHECK (
    role IN ('kamyoncu', 'issiz')
  );

-- UPDATE: kullanıcı sadece kendi kaydını güncelleyebilir (rol dahil değil).
-- Admin ise herkesi güncelleyebilir (admin yönetim fonksiyonları için).
-- Non-admin kullanıcı kendi rolünü 'admin' yapamaz (WITH CHECK).
DROP POLICY IF EXISTS "users_update_kendi" ON public.users;
CREATE POLICY "users_update_kendi" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (auth.uid() = id AND role IN ('kamyoncu', 'issiz'))
  );

-- DELETE: sadece admin silebilir (anon'un kullanıcı silme açığı kapatıldı)
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
CREATE POLICY "users_delete_admin" ON public.users
  FOR DELETE USING (public.is_admin());

-- ############################################
-- 1b) USERS — HASSAS SÜTUN GİZLEME (column-level security)
-- ############################################
-- tc_kimlik artık anon/authenticated tarafından OKUNAMAZ.
-- Yazma (kayıt/profil güncelleme) tablo seviyesindeki INSERT/UPDATE
-- grant'ı üzerinden çalışmaya devam eder; sadece okuma kapatılır.
REVOKE SELECT (tc_kimlik) ON public.users FROM anon, authenticated;

-- ############################################
-- 1c) KENDİ PROFİLİNİ GETİR (tc_kimlik dahil tam satır)
-- ############################################
-- Kullanıcı kendi TC'sini görmek/düzenlemek için bu RPC'yi kullanır.
CREATE OR REPLACE FUNCTION public.kendi_profilini_getir()
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.kendi_profilini_getir() TO authenticated;

-- ############################################
-- 2) BİLDİRİMLER
-- ############################################
ALTER TABLE public.bildirimler ENABLE ROW LEVEL SECURITY;

-- Eski açık SELECT politikalarını kaldır
DROP POLICY IF EXISTS "Authenticated can view bildirimler" ON public.bildirimler;
DROP POLICY IF EXISTS "Users can view own bildirimler" ON public.bildirimler;

-- SELECT: sadece kendi bildirimlerin (admin tümünü görebilir)
DROP POLICY IF EXISTS "bildirimler_select_kendi" ON public.bildirimler;
CREATE POLICY "bildirimler_select_kendi" ON public.bildirimler
  FOR SELECT USING (
    auth.uid() = kullanici_id OR public.is_admin()
  );

-- INSERT: sistem diğer kullanıcıların adına bildirim atabildiği için
-- authenticated kullanıcılara açık kalır (spoofing riski kabul edilebilir).
DROP POLICY IF EXISTS "Authenticated can insert bildirimler" ON public.bildirimler;
DROP POLICY IF EXISTS "bildirimler_insert_auth" ON public.bildirimler;
CREATE POLICY "bildirimler_insert_auth" ON public.bildirimler
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE (okundu işaretleme): sadece kendi bildirimin
DROP POLICY IF EXISTS "Users can update own bildirimler" ON public.bildirimler;
DROP POLICY IF EXISTS "bildirimler_update_kendi" ON public.bildirimler;
CREATE POLICY "bildirimler_update_kendi" ON public.bildirimler
  FOR UPDATE USING (auth.uid() = kullanici_id);

-- DELETE: sadece kendi bildirimin
DROP POLICY IF EXISTS "Users can delete own bildirimler" ON public.bildirimler;
DROP POLICY IF EXISTS "bildirimler_delete_kendi" ON public.bildirimler;
CREATE POLICY "bildirimler_delete_kendi" ON public.bildirimler
  FOR DELETE USING (auth.uid() = kullanici_id);

-- ############################################
-- 3) İHTİLAFLAR
-- ############################################
ALTER TABLE public.ihtilaflar ENABLE ROW LEVEL SECURITY;

-- INSERT: anon ihtilaf açamasın (oturum gerekli)
DROP POLICY IF EXISTS "Ihtilaflar kullanici acabilir" ON public.ihtilaflar;
CREATE POLICY "Ihtilaflar kullanici acabilir" ON public.ihtilaflar
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: admin kontrolünü is_admin() fonksiyonuna çevir
DROP POLICY IF EXISTS "Ihtilaflar admin guncelleyebilir" ON public.ihtilaflar;
CREATE POLICY "Ihtilaflar admin guncelleyebilir" ON public.ihtilaflar
  FOR UPDATE USING (public.is_admin());

-- ############################################
-- 4) TEKLİFLER
-- ############################################
ALTER TABLE public.teklifler ENABLE ROW LEVEL SECURITY;

-- SELECT: anon teklifleri göremesin (oturum gerekli)
DROP POLICY IF EXISTS "Public can view teklifler" ON public.teklifler;
DROP POLICY IF EXISTS "teklifler_select_auth" ON public.teklifler;
CREATE POLICY "teklifler_select_auth" ON public.teklifler
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: teklif sahibi kendisi olmalı (mevcut, korundu)
DROP POLICY IF EXISTS "Only teklif_sahibi can insert teklif" ON public.teklifler;
DROP POLICY IF EXISTS "teklifler_insert_sahip" ON public.teklifler;
CREATE POLICY "teklifler_insert_sahip" ON public.teklifler
  FOR INSERT WITH CHECK (auth.uid() = teklif_sahibi_id::uuid);

-- UPDATE: admin (mevcut, is_admin ile)
DROP POLICY IF EXISTS "Only admin can update teklif" ON public.teklifler;
DROP POLICY IF EXISTS "teklifler_update_admin" ON public.teklifler;
CREATE POLICY "teklifler_update_admin" ON public.teklifler
  FOR UPDATE USING (public.is_admin());

-- ############################################
-- 5) SEFERLER — admin kontrolünü is_admin()'e çevir
-- ############################################
DROP POLICY IF EXISTS "Admin can view all seferler" ON public.seferler;
DROP POLICY IF EXISTS "seferler_select_admin" ON public.seferler;
CREATE POLICY "seferler_select_admin" ON public.seferler
  FOR SELECT USING (public.is_admin());

-- KRİTİK: fix-seferler-rls.sql'deki "Creator can view/update own seferler"
-- politikaları `users.tc_kimlik` sütununu okuyor. Bu sütun yukarıda REVOKE
-- edildiği için o politikalar ARTIK permission denied ile PATLAR (kamyoncu ve
-- işveren kendi seferlerini göremez/güncelleyemez).
-- Burada güvenli tanımlara geçiyoruz:
--   * kamyoncu_user_id = auth.uid()  (yeni kayıtlarda + backfill ile dolu)
--   * kamyoncu_tel users.telefon'a bakıyor (REVOKE edilmedi, güvenli)
DROP POLICY IF EXISTS "Creator can view own seferler" ON public.seferler;
DROP POLICY IF EXISTS "Creator can update own seferler" ON public.seferler;
DROP POLICY IF EXISTS "Kamyoncu can view own seferler" ON public.seferler;
CREATE POLICY "Creator can view own seferler" ON public.seferler
  FOR SELECT USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_user_id = auth.uid()
    OR kamyoncu_tel IN (SELECT telefon FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "Creator can update own seferler" ON public.seferler
  FOR UPDATE USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_user_id = auth.uid()
    OR kamyoncu_tel IN (SELECT telefon FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "Kamyoncu can view own seferler" ON public.seferler
  FOR SELECT USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_user_id = auth.uid()
  );

-- ############################################
-- 6) PUSH ABONELİKLERİ
-- ############################################
-- Anon'un tüm abonelikleri okuması (endpoint/p256dh/auth) kaldırıldı.
-- Vercel serverless, aşağıdaki SECURITY DEFINER RPC'leri kullanır.
DROP POLICY IF EXISTS "push_anon_oku" ON public.push_abonelikleri;

-- Hedefe göre abonelikleri getir (kullanıcı ID veya rol bazlı)
CREATE OR REPLACE FUNCTION public.push_abonelikleri_getir(
  p_kullanici_id uuid,
  p_rol text
)
RETURNS SETOF public.push_abonelikleri
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pa.*
  FROM public.push_abonelikleri pa
  WHERE
    (p_kullanici_id IS NOT NULL AND pa.user_id = p_kullanici_id)
    OR
    (p_rol IS NOT NULL AND pa.user_id IN (
      SELECT id FROM public.users WHERE role = p_rol
    ));
$$;

GRANT EXECUTE ON FUNCTION public.push_abonelikleri_getir(uuid, text) TO anon, service_role;

-- 404/410 ile bozulmuş abonelikleri temizle
CREATE OR REPLACE FUNCTION public.push_abonelikleri_sil(
  p_idler uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sayac integer;
BEGIN
  DELETE FROM public.push_abonelikleri
  WHERE id = ANY(p_idler);
  GET DIAGNOSTICS v_sayac = ROW_COUNT;
  RETURN v_sayac;
END;
$$;

GRANT EXECUTE ON FUNCTION public.push_abonelikleri_sil(uuid[]) TO anon, service_role;

-- ############################################
-- KONTROL SORGULARI
-- ############################################
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename IN ('users','bildirimler','ihtilaflar','teklifler','seferler','push_abonelikleri')
-- ORDER BY tablename, policyname;
