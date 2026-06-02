-- Migration: Supabase Realtime tabloları etkinleştir
-- Tarih: 2026-06-03
-- Sebep: postgres_changes ile anlık güncelleme için tabloların
-- supabase_realtime publication'ında olması lazım.

-- Tüm uygulama tablolarını realtime'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE ilanlar;
ALTER PUBLICATION supabase_realtime ADD TABLE seferler;
ALTER PUBLICATION supabase_realtime ADD TABLE teklifler;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE bildirimler;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Kontrol: hangi tablolar realtime'da?
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
