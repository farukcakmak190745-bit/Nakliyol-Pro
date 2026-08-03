-- ============================================================
-- NakliYol Pro — Realtime yayını
-- Uygulama bu tablolara postgres_changes ile abone oluyor
-- ============================================================
-- Idempotent: zaten yayında olan tabloları atlar (tekrar RUN güvenli).
-- Supabase bazı tabloları varsayılan olarak kendisi eklediği için
-- "relation is already member of publication" hatasını önler.

DO $$
DECLARE
  v_tablo text;
  v_tablolar text[] := ARRAY['ilanlar','seferler','teklifler','users','bildirimler','conversations','messages'];
BEGIN
  FOREACH v_tablo IN ARRAY v_tablolar LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_tablo
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_tablo);
      RAISE NOTICE 'Realtime eklenen tablo: %', v_tablo;
    ELSE
      RAISE NOTICE 'Zaten yayinda, atlandi: %', v_tablo;
    END IF;
  END LOOP;
END $$;
