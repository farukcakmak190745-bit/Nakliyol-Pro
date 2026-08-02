-- Fatura dosyası: ilan verirken fatura başlığı (text) yerine fotoğraf/PDF eklenir.
-- Dosya bilgisi JSONB olarak saklanır: {"tip":"img"|"pdf","ad":"...","veri":"base64","boyut":...}
ALTER TABLE ilanlar
  ADD COLUMN IF NOT EXISTS fatura_dosya JSONB;
