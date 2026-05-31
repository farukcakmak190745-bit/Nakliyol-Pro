-- Users tablosunun yapısını görüntüle
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Şu anki kullanıcıları görüntüle
SELECT * FROM users;
