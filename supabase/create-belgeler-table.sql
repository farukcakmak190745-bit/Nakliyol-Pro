-- Belgeler tablosu oluştur
CREATE TABLE IF NOT EXISTS belgeler (
  id BIGSERIAL PRIMARY KEY,
  kullanici_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('kamyoncu', 'issiz')),
  dosya_adi TEXT NOT NULL,
  dosya_yolu TEXT NOT NULL,
  url TEXT NOT NULL,
  onaylandi BOOLEAN DEFAULT FALSE,
  olusturulma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policy'leri
ALTER TABLE belgeler ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi belgelerini görüp silebilir
CREATE POLICY "Kullanıcı kendi belgelerini görür"
  ON belgeler FOR SELECT
  USING (auth.uid() = kullanici_id);

CREATE POLICY "Kullanıcı kendi belgelerini ekler"
  ON belgeler FOR INSERT
  WITH CHECK (auth.uid() = kullanici_id);

CREATE POLICY "Kullanıcı kendi belgelerini siler"
  ON belgeler FOR DELETE
  USING (auth.uid() = kullanici_id);

-- Storage bucket oluştur (belgeler için)
INSERT INTO storage.buckets (id, name, public)
VALUES ('belgeler', 'belgeler', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy'leri
CREATE POLICY "Kullanıcı belgelerini yükler"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'belgeler' AND auth.uid()::text = (SELECT id FROM users WHERE id = auth.uid()));

CREATE POLICY "Kullanıcı belgelerini görür"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'belgeler' AND auth.uid()::text = (SELECT id FROM users WHERE id = auth.uid()));

CREATE POLICY "Kullanıcı belgelerini siler"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'belgeler' AND auth.uid()::text = (SELECT id FROM users WHERE id = auth.uid()));
