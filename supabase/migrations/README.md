# NakliYol Pro — SQL Migration Yapısı

Bu klasör, veritabanı şemasının **tek kaynağıdır**. Numara sırasıyla çalıştırılır.

## Kurulum (Supabase SQL Editor)

1. `0001_schema.sql` → konsolide şema (tablolar, RLS, fonksiyonlar, trigger'lar, storage)
2. `0002_realtime.sql` → realtime yayını
3. `0003_antispam.sql` → hız sınırı RPC'leri

Tüm dosyalar **idempotent**'tir — mevcut DB'de tekrar çalıştırmak güvenlidir.

## Eski dosyalar

`supabase/` kökündeki `database.sql`, `database-fixed.sql`, `add-*.sql`, `fix-*.sql`,
`create-*.sql`, `migration-*.sql`, `rls-guvenlik-dengeli.sql`, `profil-kodu-puanlama.sql`
ve kök dizindeki `supabase-setup.sql` gibi ad-hoc dosyalar **artık geçersizdir**.
Bunların yerine `0001_schema.sql` kullanılır.

Önemli noktalar:

- `is_admin()` → `auth.users.email` üzerinden rol doğrular (auth.uid ≠ users.id uyumsuzluğunu aşar).
- `users.tc_kimlik` anon/authenticated'ten **gizlidir** (`kendi_profilini_getir()` ile erişilir).
- `degerlendirmeler` yalnızca `degerlendirme_ekle()` RPC'si ile yazılır (doğrudan INSERT yasak).
- `seferler.ilan_id` → `ON DELETE NO ACTION` (ilan silinse de sefer geçmişi korunur, soft-delete).
- `hiz_siniri_asildi_mi()` teklif/başvuru spam koruması sağlar (bkz. `0003_antispam.sql`).
