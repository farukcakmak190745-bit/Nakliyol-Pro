-- Migration: conversations INSERT/UPDATE/DELETE policy düzelt
-- Tarih: 2026-06-03
-- Sebep: Eskiden "user_id = auth.uid()" gerekiyordu. Bu yüzden kamyoncu,
-- user_id=işveren olan bir konuşma oluşturamıyordu (RLS ihlali).
-- Artık her iki taraf da (user_id VEYA partner_id) tüm işlemleri yapabilir.

-- =====================================
-- CONVERSATIONS RLS
-- =====================================
DROP POLICY IF EXISTS "Users can see their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "conversations_delete" ON conversations;

-- SELECT: her iki taraf da görebilir
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (user_id = auth.uid() OR partner_id = auth.uid());

-- INSERT: her iki taraf da oluşturabilir (user_id VEYA partner_id auth.uid() olmalı)
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR partner_id = auth.uid());

-- UPDATE: her iki taraf da güncelleyebilir
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (user_id = auth.uid() OR partner_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR partner_id = auth.uid());

-- DELETE: her iki taraf da silebilir
CREATE POLICY "conversations_delete" ON conversations
  FOR DELETE USING (user_id = auth.uid() OR partner_id = auth.uid());

-- =====================================
-- TEST SORGUSU
-- =====================================
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies WHERE tablename IN ('conversations', 'messages')
-- ORDER BY tablename, policyname;
