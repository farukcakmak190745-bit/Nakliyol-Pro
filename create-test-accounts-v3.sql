-- Test Hesapları Oluştur
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- İşveren Hesabı
INSERT INTO users (email, role, ad, soyad, telefon, tc_kimlik, iban, iban_sahibi, firma_adi, vergi_no)
VALUES (
  'isveren@test.com',
  'issiz',
  'Ahmet',
  'Yilmaz',
  '5555555555',
  '12345678901',
  'TR 0000 0000 0000 0000 0000 00',
  'Ahmet Yilmaz',
  'Yilmaz Lojistik AS',
  '1234567890'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id) VALUES ((SELECT id FROM users WHERE email = 'isveren@test.com'));

-- Kamyoncu Hesabı
INSERT INTO users (email, role, ad, soyad, telefon, tc_kimlik, plaka, dorse_plaka)
VALUES (
  'kamyoncu@test.com',
  'kamyoncu',
  'Mehmet',
  'Demir',
  '5555555556',
  '09876543210',
  '34 ABC 123',
  '34 XYZ 456'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id) VALUES ((SELECT id FROM users WHERE email = 'kamyoncu@test.com'));

-- Demo İlan
INSERT INTO ilanlar (
  yuk, nereden, nereye, ucret, tarih, arac_tip, aciklama,
  odeme_turu, odeme_gun, kdv_orani, kdv_tutari, toplam_ucret,
  durum, istek_sayisi, belgeler, olusturan_id, olusturan
) VALUES (
  'Kömür',
  'Antalya',
  'Izmir',
  7083.00,
  '2026-05-20',
  'TIR',
  'Antalya Liman dan Izmir OSB ye kömür',
  'pesin',
  0,
  0.00,
  7083.00,
  'aktif',
  0,
  '[]',
  (SELECT id FROM users WHERE email = 'isveren@test.com'),
  'Yilmaz Lojistik AS'
) ON CONFLICT DO NOTHING;

-- DEMO HESAPLAR
-- =========================================
-- İşveren:
-- Email: isveren@test.com
-- Sifre: 123456
-- Telefon: 5555555555 (Giris için bu kullanilir)
-- Ad Soyad: Ahmet Yilmaz
-- =========================================
-- Kamyoncu:
-- Email: kamyoncu@test.com
-- Sifre: 123456
-- Telefon: 5555555556 (Giris için bu kullanilir)
-- Ad Soyad: Mehmet Demir
-- Plaka: 34 ABC 123
-- =========================================
-- Test İlanı:
-- Yuk: Kömür
-- Rota: Antalya -> Izmir
-- =========================================
