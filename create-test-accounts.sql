-- Test Hesapları Oluştur
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- İşveren Hesabı
INSERT INTO users (email, role, ad, soyad, telefon, tc_kimlik, iban, iban_sahibi, firma_adi, vergi_no)
VALUES (
  'isveren@test.com',
  'issiz',
  'Ahmet',
  'Yılmaz',
  '5555555555',
  '12345678901',
  'TR 0000 0000 0000 0000 0000 00',
  'Ahmet Yılmaz',
  'Yılmaz Lojistik A.Ş.',
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
  'İzmir',
  7083.00,
  '2026-05-20',
  'TIR',
  'Antalya Liman\'dan İzmir OSB\'ye kömür. Sabah 08:00 yükleme.',
  'pesin',
  0,
  0.00,
  7083.00,
  'aktif',
  0,
  '[]',
  (SELECT id FROM users WHERE email = 'isveren@test.com'),
  'Yılmaz Lojistik A.Ş.'
) ON CONFLICT DO NOTHING;

-- Şifreler: 123456
-- İşveren: isveren@test.com / 123456
-- Kamyoncu: kamyoncu@test.com / 123456
