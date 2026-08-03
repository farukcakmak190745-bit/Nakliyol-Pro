-- Teslim anında kamyoncu tarafından girilen IBAN, IBAN sahibi (ad soyad) ve teslim evrağını seferde sakla.
-- İşveren, "Ödemeyi Onayla" altında bu bilgileri kolayca görür.
ALTER TABLE seferler
  ADD COLUMN IF NOT EXISTS teslim JSONB;
