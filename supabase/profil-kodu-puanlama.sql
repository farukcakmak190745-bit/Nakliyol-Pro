-- Nakliyol Pro — Profil kodu + Puanlama / Değerlendirme sistemi
-- Supabase Dashboard > SQL Editor'dan çalıştırın

-- =============================================
-- 1) users: benzersiz profil kodu (6 haneli, NKL- öneki)
-- =============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profil_kodu text;

CREATE UNIQUE INDEX IF NOT EXISTS users_profil_kodu_uniq
  ON public.users (profil_kodu)
  WHERE profil_kodu IS NOT NULL;

-- Yeni kayıtlarda otomatik üret (BEFORE INSERT trigger)
CREATE OR REPLACE FUNCTION public.users_profil_kodu_ata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kod text;
BEGIN
  IF NEW.profil_kodu IS NULL OR btrim(NEW.profil_kodu) = '' THEN
    LOOP
      v_kod := 'NKL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE profil_kodu = v_kod);
    END LOOP;
    NEW.profil_kodu := v_kod;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_profil_kodu ON public.users;
CREATE TRIGGER trg_users_profil_kodu
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_profil_kodu_ata();

-- Mevcut kullanıcıları geriye dönük doldur (backfill)
DO $$
DECLARE
  u RECORD;
  v_kod text;
BEGIN
  FOR u IN SELECT id FROM public.users
           WHERE profil_kodu IS NULL OR btrim(profil_kodu) = '' LOOP
    LOOP
      v_kod := 'NKL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE profil_kodu = v_kod);
    END LOOP;
    UPDATE public.users SET profil_kodu = v_kod WHERE id = u.id;
  END LOOP;
END $$;

-- =============================================
-- 2) users: oy sayısı + ortalama puan
-- =============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS puan numeric DEFAULT 0;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS oy_sayisi integer NOT NULL DEFAULT 0;

-- =============================================
-- 3) degerlendirmeler tablosu
--    Yalnızca tamamlanmış bir seferin iki tarafı değerlendirebilir.
--    Direkt INSERT yasak; degerlendirme_ekle() fonksiyonu ile yapılır.
-- =============================================
CREATE TABLE IF NOT EXISTS public.degerlendirmeler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hedef_kullanici_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  degerlendiren_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sefer_id uuid NOT NULL REFERENCES public.seferler(id) ON DELETE CASCADE,
  puan integer NOT NULL CHECK (puan BETWEEN 1 AND 5),
  yorum text,
  olusturma_zamani timestamptz NOT NULL DEFAULT now(),
  UNIQUE (degerlendiren_id, sefer_id)
);

CREATE INDEX IF NOT EXISTS degerlendirmeler_hedef_idx
  ON public.degerlendirmeler (hedef_kullanici_id);
CREATE INDEX IF NOT EXISTS degerlendirmeler_degerlendiren_idx
  ON public.degerlendirmeler (degerlendiren_id);

ALTER TABLE public.degerlendirmeler ENABLE ROW LEVEL SECURITY;

-- Yorumlar herkese açık (güven bilgisi) — kişisel veri içermez
DROP POLICY IF EXISTS degerlendirmeler_select_public ON public.degerlendirmeler;
CREATE POLICY degerlendirmeler_select_public ON public.degerlendirmeler
  FOR SELECT USING (true);

-- Direkt yazma kapalı; yalnızca SECURITY DEFINER fonksiyon üzerinden
DROP POLICY IF EXISTS degerlendirmeler_insert_yasak ON public.degerlendirmeler;
CREATE POLICY degerlendirmeler_insert_yasak ON public.degerlendirmeler
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS degerlendirmeler_update_yasak ON public.degerlendirmeler;
CREATE POLICY degerlendirmeler_update_yasak ON public.degerlendirmeler
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS degerlendirmeler_delete_yasak ON public.degerlendirmeler;
CREATE POLICY degerlendirmeler_delete_yasak ON public.degerlendirmeler
  FOR DELETE USING (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.degerlendirmeler TO authenticated, service_role;

-- =============================================
-- 4) degerlendirme_ekle: iş kurallarını zorlayan fonksiyon
--    - Sadece giriş yapmış kullanıcı
--    - Kendini değerlendiremez
--    - Sadece tamamlanmış sefer (odendi / tamamlandı)
--    - Sadece seferin iki tarafından biri (işveren veya kamyoncu)
--    - Başarılı olunca users.puan / oy_sayisi güncellenir
-- =============================================
CREATE OR REPLACE FUNCTION public.degerlendirme_ekle(
  p_hedef uuid,
  p_sefer uuid,
  p_puan integer,
  p_yorum text DEFAULT NULL
)
RETURNS public.degerlendirmeler
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sefer public.seferler;
  v_diger_taraf uuid;
  v_satir public.degerlendirmeler;
BEGIN
  IF p_puan < 1 OR p_puan > 5 THEN
    RAISE EXCEPTION 'Puan 1 ile 5 arasında olmalıdır';
  END IF;

  SELECT * INTO v_sefer FROM public.seferler WHERE id = p_sefer;
  IF v_sefer.id IS NULL THEN
    RAISE EXCEPTION 'Sefer bulunamadı';
  END IF;

  IF v_sefer.durum NOT IN ('odendi', 'tamamlandi', 'tamamlandı') THEN
    RAISE EXCEPTION 'Sadece tamamlanmış seferler değerlendirilebilir';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Giriş yapmanız gerekiyor';
  END IF;

  IF auth.uid() = p_hedef THEN
    RAISE EXCEPTION 'Kendinizi değerlendiremezsiniz';
  END IF;

  IF v_sefer.olusturan_id::uuid = auth.uid() THEN
    v_diger_taraf := v_sefer.kamyoncu_user_id;
  ELSIF v_sefer.kamyoncu_user_id = auth.uid() THEN
    v_diger_taraf := v_sefer.olusturan_id::uuid;
  END IF;

  IF v_diger_taraf IS NULL OR v_diger_taraf <> p_hedef THEN
    RAISE EXCEPTION 'Bu seferin taraflarından biri değilsiniz';
  END IF;

  INSERT INTO public.degerlendirmeler (hedef_kullanici_id, degerlendiren_id, sefer_id, puan, yorum)
  VALUES (p_hedef, auth.uid(), p_sefer, p_puan, NULLIF(btrim(p_yorum), ''))
  ON CONFLICT (degerlendiren_id, sefer_id)
  DO UPDATE SET puan = EXCLUDED.puan, yorum = EXCLUDED.yorum, olusturma_zamani = now()
  RETURNING * INTO v_satir;

  UPDATE public.users
  SET puan = COALESCE((SELECT round(avg(d.puan)::numeric, 1) FROM public.degerlendirmeler d WHERE d.hedef_kullanici_id = p_hedef), 0),
      oy_sayisi = (SELECT count(*) FROM public.degerlendirmeler d WHERE d.hedef_kullanici_id = p_hedef)
  WHERE id = p_hedef;

  RETURN v_satir;
END;
$$;

GRANT EXECUTE ON FUNCTION public.degerlendirme_ekle(uuid, uuid, integer, text) TO authenticated, service_role;
