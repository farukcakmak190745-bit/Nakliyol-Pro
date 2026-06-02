-- =============================================
-- SEFERLER RLS POLICY DÜZELTMESİ
-- =============================================
-- Eski policy: kamyoncu_tc = auth.uid()::text
--   → ÇALIŞMIYOR çünkü kamyoncu_tc TC kimlik numarası (örn "12345678901"),
--     auth.uid() ise UUID. Kamyoncu kendi seferini ASLA göremiyordu.
--
-- Yeni policy: users tablosundan kullanıcının tc_kimlik ve telefon
-- bilgilerini alıp karşılaştırır.
--
-- Supabase Dashboard → SQL Editor → çalıştır.
-- =============================================

-- Eski policy'leri kaldır
DROP POLICY IF EXISTS "Creator can view own seferler" ON seferler;
DROP POLICY IF EXISTS "Creator can update own seferler" ON seferler;

-- Yeni policy: İşveren (olusturan_id) VEYA kamyoncu (tc/telefon ile users join)
CREATE POLICY "Creator can view own seferler" ON seferler
  FOR SELECT USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_tc IN (SELECT tc_kimlik FROM users WHERE id = auth.uid())
    OR kamyoncu_tel IN (SELECT telefon FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Creator can update own seferler" ON seferler
  FOR UPDATE USING (
    auth.uid() = olusturan_id::uuid
    OR kamyoncu_tc IN (SELECT tc_kimlik FROM users WHERE id = auth.uid())
    OR kamyoncu_tel IN (SELECT telefon FROM users WHERE id = auth.uid())
  );

-- Kontrol
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'seferler'
ORDER BY policyname;
