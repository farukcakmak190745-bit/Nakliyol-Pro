-- ==============================================
-- Migration: İlana konum, saat aralığı ve fatura başlığı ekle
-- ==============================================

ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS yukleme_konum TEXT;
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS bosaltma_konum TEXT;
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS yukleme_saat_bas TEXT;
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS yukleme_saat_bit TEXT;
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS bosaltma_saat_bas TEXT;
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS bosaltma_saat_bit TEXT;
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS fatura_baslik TEXT;
