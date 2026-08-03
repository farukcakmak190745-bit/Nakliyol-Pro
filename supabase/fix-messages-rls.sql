-- Migration: messages tablosu için SELECT policy ekle + INSERT policy düzelt
-- Tarih: 2026-06-03
-- Sebep: messages tablosunda SELECT policy yoktu — kamyoncu/işveren
-- karşı tarafın mesajlarını okuyamıyordu. Ayrıca INSERT policy'de
-- subquery RLS recursion'a sebep olabiliyordu.

-- ============================================
-- MESSAGES RLS POLICIES
-- ============================================

-- Eski policy'leri temizle
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- Yeni: SELECT policy — bir mesajı ancak ait olduğu konuşmanın
-- user_id'si veya partner_id'si isen görebilirsin
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_id = auth.uid() OR c.partner_id = auth.uid())
    )
  );

-- Yeni: INSERT policy — mesaj yollamak için konuşmanın
-- user_id veya partner_id'sinden biri sen olmalısın
CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_id = auth.uid() OR c.partner_id = auth.uid())
    )
  );

-- Yeni: DELETE policy — her iki taraf da silebilir
CREATE POLICY "messages_delete_policy" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user_id = auth.uid() OR c.partner_id = auth.uid())
    )
  );

-- ============================================
-- CONVERSATIONS RLS — UPDATE policy'yi iki taraf için yap
-- (Şu an sadece user_id güncelleyebiliyor, partner_id de güncelleyebilmeli)
-- ============================================
DROP POLICY IF EXISTS "Users can update conversations" ON conversations;
CREATE POLICY "Users can update conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid() OR partner_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR partner_id = auth.uid());

-- ============================================
-- TEST SORGUSU
-- ============================================
-- SELECT 'messages policies' as info, policyname, cmd, roles, qual, with_check
-- FROM pg_policies WHERE tablename = 'messages';
