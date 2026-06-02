-- =============================================
-- CONVERSATIONS TABLOSU GÜNCELLEMESİ
-- =============================================
-- ilan_id ve baslik kolonları ekler (mesajlaşma entegrasyonu için).
-- Mevcut tablo yapısı korunur.
--
-- Supabase Dashboard → SQL Editor → çalıştır.
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'ilan_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN ilan_id UUID;
    RAISE NOTICE '✅ ilan_id kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️ ilan_id kolonu zaten mevcut';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'baslik'
  ) THEN
    ALTER TABLE conversations ADD COLUMN baslik TEXT;
    RAISE NOTICE '✅ baslik kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️ baslik kolonu zaten mevcut';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_ilan ON conversations(ilan_id);

-- =============================================
-- RLS policy'leri (mevcutları yenisiyle değiştir)
-- =============================================
DROP POLICY IF EXISTS "Users can see their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON conversations;

-- Bir konuşmayı user_id (işveren) VEYA partner_id (kamyoncu) görebilir
CREATE POLICY "Users can see their conversations" ON conversations
  FOR SELECT USING (
    user_id = auth.uid() OR partner_id = auth.uid()
  );

CREATE POLICY "Users can insert conversations" ON conversations
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR partner_id = auth.uid()
  );

CREATE POLICY "Users can update conversations" ON conversations
  FOR UPDATE USING (
    user_id = auth.uid() OR partner_id = auth.uid()
  );

-- =============================================
-- MESSAGES tablosu RLS (eski policy'ler sadece INSERT ve DELETE, SELECT yok!)
-- =============================================
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- =============================================
-- KONTROL
-- =============================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;
