-- ============================================================
-- NakliYol Pro — Anti-Spam / Hız Sınırı (RPC)
-- ============================================================
-- Teklif ve başvuru spam'ını önlemek için sunucu tarafı hız sınırı.
-- Kullanım (ön yüz):
--   supabase.rpc('hiz_siniri_asildi_mi', { p_tablo: 'teklifler',
--     p_sutun: 'teklif_sahibi_id', p_deger: oturum.id,
--     p_dakika: 60, p_limit: 10 })
-- => true dönerse istek engellenmelidir.
-- ============================================================

CREATE OR REPLACE FUNCTION public.hiz_siniri_asildi_mi(
  p_tablo text,
  p_sutun text,
  p_deger uuid,
  p_dakika integer DEFAULT 60,
  p_limit integer DEFAULT 10
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sayac integer;
  v_sorgu text;
BEGIN
  IF p_dakika < 1 OR p_dakika > 1440 THEN
    p_dakika := 60;
  END IF;
  IF p_limit < 1 OR p_limit > 1000 THEN
    p_limit := 10;
  END IF;

  -- Sütun adını beyaz listeye al: yalnızca bilinen sütunlar kabul edilir
  IF p_sutun NOT IN ('teklif_sahibi_id', 'kamyoncu_user_id', 'kullanici_id', 'acan_id') THEN
    RETURN false;
  END IF;

  v_sorgu := format(
    'SELECT count(*) FROM public.%I WHERE %I = %L AND olusturma_zamani > now() - make_interval(mins => %s)',
    p_tablo, p_sutun, p_deger, p_dakika
  );

  EXECUTE v_sorgu INTO v_sayac;
  RETURN v_sayac >= p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hiz_siniri_asildi_mi(text, text, uuid, integer, integer) TO authenticated, service_role;
