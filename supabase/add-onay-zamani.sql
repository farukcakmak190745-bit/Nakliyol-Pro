-- Onay zamanı kolonu: işverenin başvuruyu onayladığı an.
-- Bu sayede işveren onayı 10 dakika içinde iptal edebilir.
ALTER TABLE seferler
  ADD COLUMN IF NOT EXISTS onay_zamani TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_seferler_onay_zamani
  ON seferler (onay_zamani);
