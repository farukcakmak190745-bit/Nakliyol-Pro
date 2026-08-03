-- ============================================================
-- NakliYol Pro — Konsolide Şema (TEK KAYNAK)
-- ============================================================
-- Bu dosya, supabase/ altındaki tüm ad-hoc .sql dosyalarının
-- SON GÜVENLİ DURUMUNU tek ve idempotent olarak içerir.
-- Hem mevcut DB'ye hem yeni DB'ye güvenle çalıştırılabilir
-- (CREATE ... IF NOT EXISTS + ALTER ... IF NOT EXISTS +
--  DROP POLICY IF EXISTS / CREATE POLICY deseni).
--
-- Eski dosyalar artık GEÇERSİZ sayılır:
--   database.sql, database-fixed.sql, supabase-setup.sql,
--   add-*.sql, fix-*.sql, create-*.sql, migration-*.sql,
--   rls-guvenlik-dengeli.sql, profil-kodu-puanlama.sql
-- ============================================================

-- ============================================================
-- 0) YARDIMCI: policy'yi koşullu oluştur (tekrar çalıştırılabilir)
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_policy(
  p_table text,
  p_name text,
  p_command text
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_name, p_table);
  EXECUTE format('CREATE POLICY %I ON %I %s', p_name, p_table, p_command);
END;
$$;

-- is_admin: auth.users.email ile users.role='admin' eşleşmesi
-- (auth.uid() ile users.id uyumsuzluğunu aşar)
-- Policy ifadelerinde kullanıldığı için EN ÜSTTE tanımlanmalıdır.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users au
    JOIN public.users u ON u.email = au.email
    WHERE au.id = auth.uid() AND u.role = 'admin'
  );
$$;

-- ============================================================
-- 1) USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kamyoncu', 'issiz', 'admin')),
  ad TEXT NOT NULL,
  tc_kimlik TEXT,
  telefon TEXT,
  plaka TEXT,
  dorse_plaka TEXT,
  firma_adi TEXT,
  durum TEXT DEFAULT 'aktif',
  iptal_cooldown_bitis TIMESTAMPTZ,
  profil_kodu TEXT,
  puan NUMERIC DEFAULT 0,
  oy_sayisi INTEGER NOT NULL DEFAULT 0,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profil kodu (NKL- ön ekli 6 haneli) — benzersiz
CREATE UNIQUE INDEX IF NOT EXISTS users_profil_kodu_uniq
  ON public.users (profil_kodu)
  WHERE profil_kodu IS NOT NULL;

-- Otomatik profil kodu üretici (BEFORE INSERT)
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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('users', 'users_select_public', 'FOR SELECT USING (true)');
SELECT public.ensure_policy('users', 'users_insert_kayit', 'FOR INSERT WITH CHECK (role IN (''kamyoncu'', ''issiz''))');
SELECT public.ensure_policy('users', 'users_update_kendi', 'FOR UPDATE USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin())');
SELECT public.ensure_policy('users', 'users_delete_admin', 'FOR DELETE USING (public.is_admin())');

-- TC kimlik gizliliği: anon/authenticated sütun seçemez
REVOKE SELECT (tc_kimlik) ON public.users FROM anon, authenticated;

-- ============================================================
-- 2) USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_trucker BOOLEAN DEFAULT FALSE,
  firma_bilgileri JSONB,
  profil_foto TEXT,
  bildirimler JSONB DEFAULT '{}',
  firma_adi TEXT,
  guncelleme_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('user_roles', 'User can read own role', 'FOR SELECT USING (user_id = auth.uid())');
SELECT public.ensure_policy('user_roles', 'User can update own role', 'FOR UPDATE USING (user_id = auth.uid())');

-- ============================================================
-- 3) ILANLAR
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ilanlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olusturan_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  olusturan TEXT NOT NULL,
  olusturan_puan DECIMAL(3, 2) DEFAULT 5.0,
  yuk TEXT NOT NULL,
  aciklama TEXT,
  nereden TEXT NOT NULL,
  nereye TEXT NOT NULL,
  ucret DECIMAL(10, 2) NOT NULL,
  tarih DATE NOT NULL,
  sure TEXT,
  ton DECIMAL(5, 2) DEFAULT 0,
  arac_tip TEXT,
  odeme_turu TEXT DEFAULT 'pesin',
  odeme_gun INTEGER DEFAULT 0,
  kdv_orani DECIMAL(5, 2) DEFAULT 0,
  kdv_tutari DECIMAL(10, 2) DEFAULT 0,
  toplam_ucret DECIMAL(10, 2),
  durum TEXT DEFAULT 'aktif',
  istek_sayisi INTEGER DEFAULT 0,
  belgeler JSONB DEFAULT '[]',
  iban TEXT,
  iban_sahibi TEXT,
  yukleme_konum TEXT,
  bosaltma_konum TEXT,
  yukleme_saat_bas TEXT,
  yukleme_saat_bit TEXT,
  bosaltma_saat_bas TEXT,
  bosaltma_saat_bit TEXT,
  fatura_baslik TEXT,
  fatura_dosya JSONB,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ilanlar ENABLE ROW LEVEL SECURITY;
-- Soft-delete: silinen ilanı başkaları göremez, sahibi geçmişini görebilir
SELECT public.ensure_policy('ilanlar', 'Public can view active or own ilans', 'FOR SELECT USING (durum = ''aktif'' OR auth.uid() = olusturan_id::uuid)');
SELECT public.ensure_policy('ilanlar', 'Only creator can insert ilan', 'FOR INSERT WITH CHECK (auth.uid() = olusturan_id::uuid)');
SELECT public.ensure_policy('ilanlar', 'Only creator can update ilan', 'FOR UPDATE USING (auth.uid() = olusturan_id::uuid)');
SELECT public.ensure_policy('ilanlar', 'Only creator can delete ilan', 'FOR DELETE USING (auth.uid() = olusturan_id::uuid)');

-- ============================================================
-- 4) SEFERLER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seferler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ilan_id UUID REFERENCES public.ilanlar(id) ON DELETE NO ACTION,
  olusturan_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  yuk TEXT NOT NULL,
  nereden TEXT NOT NULL,
  nereye TEXT NOT NULL,
  ucret DECIMAL(10, 2) NOT NULL,
  tarih DATE NOT NULL,
  sure TEXT,
  ton DECIMAL(5, 2) DEFAULT 0,
  arac_tip TEXT,
  plaka TEXT,
  dorse_plaka TEXT,
  kamyoncu TEXT NOT NULL,
  kamyoncu_tel TEXT NOT NULL,
  kamyoncu_tc TEXT,
  kamyoncu_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  olusturan TEXT NOT NULL,
  durum TEXT DEFAULT 'yolda',
  teslim_tarihi DATE,
  belgeler JSONB DEFAULT '[]',
  odeme_tarihi DATE,
  odeme_durumu TEXT DEFAULT 'beklemede',
  odeme_turu TEXT,
  odeme_gun INTEGER DEFAULT 0,
  iban TEXT,
  iban_sahibi TEXT,
  vade_tarihi DATE,
  onay_zamani TIMESTAMPTZ,
  teslim JSONB,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seferler_durum ON public.seferler(durum);
CREATE INDEX IF NOT EXISTS idx_seferler_tarih ON public.seferler(tarih);
CREATE INDEX IF NOT EXISTS idx_seferler_ilan ON public.seferler(ilan_id);
CREATE INDEX IF NOT EXISTS idx_seferler_kamyoncu_user_id ON public.seferler(kamyoncu_user_id);

ALTER TABLE public.seferler ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('seferler', 'seferler_select_admin', 'FOR SELECT USING (public.is_admin())');
SELECT public.ensure_policy('seferler', 'Creator can view own seferler', 'FOR SELECT USING (auth.uid() = olusturan_id::uuid OR kamyoncu_user_id = auth.uid())');
SELECT public.ensure_policy('seferler', 'Creator can update own seferler', 'FOR UPDATE USING (auth.uid() = olusturan_id::uuid OR kamyoncu_user_id = auth.uid())');
SELECT public.ensure_policy('seferler', 'Kamyoncu can view own seferler', 'FOR SELECT USING (kamyoncu_user_id = auth.uid())');
-- KRİTİK: kamyoncu başvurusu seferler'e INSERT yazar
SELECT public.ensure_policy('seferler', 'Authenticated can insert seferler', 'FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)');

-- ============================================================
-- 5) TEKLIFLER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teklifler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ilan_id UUID REFERENCES public.ilanlar(id) ON DELETE CASCADE,
  teklif_sahibi_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tutar DECIMAL(10, 2) NOT NULL,
  ozellikler JSONB DEFAULT '{}',
  durum TEXT DEFAULT 'bekliyor',
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teklifler_ilan ON public.teklifler(ilan_id);
CREATE INDEX IF NOT EXISTS idx_teklifler_sahip ON public.teklifler(teklif_sahibi_id);

ALTER TABLE public.teklifler ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('teklifler', 'teklifler_select_auth', 'FOR SELECT USING (auth.uid() IS NOT NULL)');
SELECT public.ensure_policy('teklifler', 'teklifler_insert_sahip', 'FOR INSERT WITH CHECK (auth.uid() = teklif_sahibi_id::uuid)');
SELECT public.ensure_policy('teklifler', 'teklifler_update_admin', 'FOR UPDATE USING (public.is_admin())');

-- ============================================================
-- 6) CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  partner_adi TEXT NOT NULL,
  partner_resim TEXT,
  konusma_turu TEXT DEFAULT 'is',
  resim TEXT,
  bg TEXT,
  mesajlar JSONB DEFAULT '[]',
  son_okuma TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  son_guncelleme TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ilan_id UUID,
  baslik TEXT,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON public.conversations(partner_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- Her iki taraf da tüm işlemleri yapabilir
SELECT public.ensure_policy('conversations', 'conversations_select', 'FOR SELECT USING (user_id = auth.uid() OR partner_id = auth.uid())');
SELECT public.ensure_policy('conversations', 'conversations_insert', 'FOR INSERT WITH CHECK (user_id = auth.uid() OR partner_id = auth.uid())');
SELECT public.ensure_policy('conversations', 'conversations_update', 'FOR UPDATE USING (user_id = auth.uid() OR partner_id = auth.uid())');
SELECT public.ensure_policy('conversations', 'conversations_delete', 'FOR DELETE USING (user_id = auth.uid() OR partner_id = auth.uid())');

-- ============================================================
-- 7) MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  gonderen TEXT NOT NULL,
  metin TEXT NOT NULL,
  veri_tipi TEXT DEFAULT 'metin',
  veri JSONB,
  zaman TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  okundu_zamani TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, zaman);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('messages', 'messages_select_policy', 'FOR SELECT USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid() OR partner_id = auth.uid()))');
SELECT public.ensure_policy('messages', 'messages_insert_policy', 'FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid() OR partner_id = auth.uid()))');
SELECT public.ensure_policy('messages', 'messages_delete_policy', 'FOR DELETE USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid() OR partner_id = auth.uid()))');

-- ============================================================
-- 8) BILDIRIMLER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bildirimler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tur TEXT DEFAULT 'genel',
  baslik TEXT,
  icerik TEXT,
  ilan_id UUID,
  sefer_id UUID,
  okundu BOOLEAN DEFAULT FALSE,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bildirimler_kullanici ON public.bildirimler(kullanici_id, olusturma_zamani DESC);

ALTER TABLE public.bildirimler ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('bildirimler', 'bildirimler_select_kendi', 'FOR SELECT USING (kullanici_id = auth.uid() OR public.is_admin())');
SELECT public.ensure_policy('bildirimler', 'bildirimler_insert_auth', 'FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)');
SELECT public.ensure_policy('bildirimler', 'bildirimler_update_kendi', 'FOR UPDATE USING (kullanici_id = auth.uid())');
SELECT public.ensure_policy('bildirimler', 'bildirimler_delete_kendi', 'FOR DELETE USING (kullanici_id = auth.uid())');

-- ============================================================
-- 9) BELGELER (kullanıcı belgeleri + profil fotoğrafı)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.belgeler (
  id BIGSERIAL PRIMARY KEY,
  kullanici_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rol TEXT DEFAULT 'kamyoncu' CHECK (rol IN ('kamyoncu', 'issiz', 'admin')),
  dosya_adi TEXT NOT NULL,
  dosya_yolu TEXT NOT NULL,
  url TEXT NOT NULL,
  onaylandi BOOLEAN DEFAULT FALSE,
  olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_belgeler_kullanici ON public.belgeler(kullanici_id);

ALTER TABLE public.belgeler ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('belgeler', 'Belgeleri herkes görebilir', 'FOR SELECT USING (auth.uid() IS NOT NULL)');
SELECT public.ensure_policy('belgeler', 'Kullanıcı kendi belgesini ekler', 'FOR INSERT WITH CHECK (auth.uid() = kullanici_id)');
SELECT public.ensure_policy('belgeler', 'Kullanıcı kendi belgesini siler', 'FOR DELETE USING (auth.uid() = kullanici_id OR public.is_admin())');
SELECT public.ensure_policy('belgeler', 'Admin belgeleri gunceller', 'FOR UPDATE USING (public.is_admin())');

-- ============================================================
-- 10) IHTILAFLAR (ödeme ihtilafı)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ihtilaflar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sefer_id UUID REFERENCES public.seferler(id) ON DELETE CASCADE,
  acan_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  acan_rol TEXT DEFAULT 'kamyoncu',
  hedef_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sebep TEXT NOT NULL,
  durum TEXT DEFAULT 'acik',
  admin_notu TEXT,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ihtilaflar_sefer ON public.ihtilaflar(sefer_id);
CREATE INDEX IF NOT EXISTS idx_ihtilaflar_durum ON public.ihtilaflar(durum);

ALTER TABLE public.ihtilaflar ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('ihtilaflar', 'Ihtilaflar herkes okuyabilir', 'FOR SELECT USING (true)');
SELECT public.ensure_policy('ihtilaflar', 'Ihtilaflar kullanici acabilir', 'FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)');
SELECT public.ensure_policy('ihtilaflar', 'Ihtilaflar admin guncelleyebilir', 'FOR UPDATE USING (public.is_admin())');

-- ============================================================
-- 11) KAMYONCU_IPTALLER (abuse takibi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kamyoncu_iptaller (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sefer_id UUID,
  sebep TEXT,
  zaman TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kamyoncu_iptaller_kullanici ON public.kamyoncu_iptaller(kullanici_id, zaman);

ALTER TABLE public.kamyoncu_iptaller ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('kamyoncu_iptaller', 'Kamyoncu can insert own iptal', 'FOR INSERT WITH CHECK (auth.uid() = kullanici_id)');
SELECT public.ensure_policy('kamyoncu_iptaller', 'Kamyoncu can view own iptal', 'FOR SELECT USING (kullanici_id = auth.uid() OR public.is_admin())');

-- ============================================================
-- 12) DEGERLENDIRMELER (güvenilirlik puanı)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.degerlendirmeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hedef_kullanici_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  degerlendiren_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sefer_id UUID NOT NULL REFERENCES public.seferler(id) ON DELETE CASCADE,
  puan INTEGER NOT NULL CHECK (puan BETWEEN 1 AND 5),
  yorum TEXT,
  olusturma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (degerlendiren_id, sefer_id)
);

CREATE INDEX IF NOT EXISTS degerlendirmeler_hedef_idx ON public.degerlendirmeler (hedef_kullanici_id);
CREATE INDEX IF NOT EXISTS degerlendirmeler_degerlendiren_idx ON public.degerlendirmeler (degerlendiren_id);

ALTER TABLE public.degerlendirmeler ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('degerlendirmeler', 'degerlendirmeler_select_public', 'FOR SELECT USING (true)');
SELECT public.ensure_policy('degerlendirmeler', 'degerlendirmeler_insert_yasak', 'FOR INSERT WITH CHECK (false)');
SELECT public.ensure_policy('degerlendirmeler', 'degerlendirmeler_update_yasak', 'FOR UPDATE USING (false)');
SELECT public.ensure_policy('degerlendirmeler', 'degerlendirmeler_delete_yasak', 'FOR DELETE USING (false)');

-- ============================================================
-- 13) PUSH_ABONELIKLERI (Web Push)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_abonelikleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  tarayici TEXT,
  olusturulma_zamani TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_abonelikleri ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('push_abonelikleri', 'push_kendi_gor', 'FOR SELECT USING (user_id = auth.uid())');
SELECT public.ensure_policy('push_abonelikleri', 'push_kendi_ekle', 'FOR INSERT WITH CHECK (user_id = auth.uid())');
SELECT public.ensure_policy('push_abonelikleri', 'push_kendi_sil', 'FOR DELETE USING (user_id = auth.uid())');
SELECT public.ensure_policy('push_abonelikleri', 'push_kendi_guncelle', 'FOR UPDATE USING (user_id = auth.uid())');

-- ============================================================
-- 14) TAKIP (geçmişten referans — eksikti, artık var)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.takip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ilan_id UUID REFERENCES public.ilanlar(id) ON DELETE CASCADE,
  durum TEXT CHECK (durum IN ('aktif', 'tamamlandi', 'iptal')),
  ozellikler JSONB DEFAULT '{}',
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.takip ENABLE ROW LEVEL SECURITY;
SELECT public.ensure_policy('takip', 'takip_select_kendi', 'FOR SELECT USING (user_id = auth.uid() OR public.is_admin())');
SELECT public.ensure_policy('takip', 'takip_insert_kendi', 'FOR INSERT WITH CHECK (auth.uid() = user_id)');

-- ============================================================
-- 15) YARDIMCI FONKSIYONLAR (RPC)
-- ============================================================

-- Kullanıcının kendi tam profilini getir (tc_kimlik RLS'den gizli)
CREATE OR REPLACE FUNCTION public.kendi_profilini_getir()
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;

-- Push aboneliklerini güvenli getir (kullanıcı veya rol bazlı)
CREATE OR REPLACE FUNCTION public.push_abonelikleri_getir(
  p_kullanici_id uuid DEFAULT NULL,
  p_rol text DEFAULT NULL
)
RETURNS SETOF public.push_abonelikleri
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.push_abonelikleri
  WHERE (p_kullanici_id IS NOT NULL AND user_id = p_kullanici_id)
     OR (p_rol IS NOT NULL AND user_id IN (SELECT id FROM public.users WHERE role = p_rol));
$$;

-- Bozuk push aboneliklerini sil
CREATE OR REPLACE FUNCTION public.push_abonelikleri_sil(p_idler uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_toplam integer;
BEGIN
  DELETE FROM public.push_abonelikleri WHERE id = ANY(p_idler);
  GET DIAGNOSTICS v_toplam = ROW_COUNT;
  RETURN v_toplam;
END;
$$;

-- Değerlendirme ekle/güncelle: iş kuralları sunucuda zorlanır
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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ilanlar_durum ON public.ilanlar(durum);
CREATE INDEX IF NOT EXISTS idx_ilanlar_olusturma_zamani ON public.ilanlar(olusturma_zamani DESC);
CREATE INDEX IF NOT EXISTS idx_ilanlar_olusturan ON public.ilanlar(olusturan_id);

-- ============================================================
-- 16) YETKİLER (GRANT)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.kendi_profilini_getir() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.push_abonelikleri_getir(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.push_abonelikleri_sil(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.degerlendirme_ekle(uuid, uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_policy(text, text, text) TO service_role;

-- ============================================================
-- 17) STORAGE (belgeler bucket)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('belgeler', 'belgeler', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Belgeleri herkes gorebilir" ON storage.objects;
CREATE POLICY "Belgeleri herkes gorebilir" ON storage.objects
  FOR SELECT USING (bucket_id = 'belgeler');
DROP POLICY IF EXISTS "Kullanici belge yukleyebilir" ON storage.objects;
CREATE POLICY "Kullanici belge yukleyebilir" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'belgeler' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Kullanici belge silebilir" ON storage.objects;
CREATE POLICY "Kullanici belge silebilir" ON storage.objects
  FOR DELETE USING (bucket_id = 'belgeler');

-- ============================================================
-- 18) DEMO VERİLERİ (opsiyonel)
-- ============================================================
INSERT INTO public.users (email, role, ad, telefon)
VALUES ('admin@nakliyol.com', 'admin', 'Admin', '02125555555')
ON CONFLICT (email) DO NOTHING;
