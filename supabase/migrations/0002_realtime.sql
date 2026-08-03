-- ============================================================
-- NakliYol Pro — Realtime yayını
-- Uygulama bu tablolara postgres_changes ile abone oluyor
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.ilanlar;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seferler;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teklifler;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bildirimler;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
