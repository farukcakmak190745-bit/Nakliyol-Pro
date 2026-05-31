-- Users tablosu yapısı
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Ilanlar tablosu yapısı
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ilanlar'
ORDER BY ordinal_position;

-- Seferler tablosu yapısı
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seferler'
ORDER BY ordinal_position;

-- Teklifler tablosu yapısı
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'teklifler'
ORDER BY ordinal_position;
