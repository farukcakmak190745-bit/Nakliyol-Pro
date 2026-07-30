-- ==============================================
-- Migration: İlanlara açıklama (aciklama) sütunu ekle
-- ==============================================

ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS aciklama TEXT;
