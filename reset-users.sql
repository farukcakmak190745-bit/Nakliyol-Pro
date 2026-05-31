-- Supabase'deki tüm kullanıcıları ve ilanları sil

-- 1. Kullanıcıları sil
TRUNCATE TABLE users CASCADE;

-- 2. İlanları sil
TRUNCATE TABLE ilanlar CASCADE;

-- 3. Seferleri sil
TRUNCATE TABLE seferler CASCADE;

-- 4. Teklifleri sil
TRUNCATE TABLE teklifler CASCADE;

-- 5. Konuşmaları sil
TRUNCATE TABLE conversations CASCADE;

-- 6. Mesajları sil
TRUNCATE TABLE messages CASCADE;

-- 7. Bildirimleri sil
TRUNCATE TABLE bildirimler CASCADE;

-- 8. Takip tablosunu sil
TRUNCATE TABLE takip CASCADE;

-- Tüm veriler temizlendi

-- Opsiyonel: İstatistik görüntüle
SELECT 'Kullanıcılar' as tablo, COUNT(*) as sayi FROM users
UNION ALL
SELECT 'İlanlar' as tablo, COUNT(*) as sayi FROM ilanlar
UNION ALL
SELECT 'Seferler' as tablo, COUNT(*) as sayi FROM seferler
UNION ALL
SELECT 'Teklifler' as tablo, COUNT(*) as sayi FROM teklifler;
