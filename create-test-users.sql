-- Test kullanıcısı oluştur
INSERT INTO users (id, email, role, ad, tc_kimlik, telefon, plaka, dorse_plaka, olusturma_zamani)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'kamyoncu@test.com',
  'kamyoncu',
  'Test Kamyoncu',
  '12345678901',
  '5551112233',
  '34 ABC 123',
  '',
  '2026-05-14'
);

INSERT INTO users (id, email, role, ad, tc_kimlik, telefon, plaka, dorse_plaka, olusturma_zamani)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'issiz@test.com',
  'issiz',
  'Test İşveren',
  '98765432101',
  '5554445566',
  '',
  '',
  '2026-05-14'
);

-- Test ilanı oluştur
INSERT INTO ilanlar (yuk, nereden, nereye, ucret, tarih, arac_tip, aciklama, durum, olusturan, olusturan_id, istek_sayisi)
VALUES (
  'Kömür',
  'Antalya',
  'İzmir',
  8500,
  '2026-05-14',
  'TIR',
  'Antalya Liman''dan İzmir OSB''ye kömür. Sabah 08:00 yükleme.',
  'aktif',
  'Test İşveren',
  '22222222-2222-2222-2222-222222222222',
  0
);

-- Test sefer oluştur
INSERT INTO seferler (yuk, nereden, nereye, ucret, tarih, plaka, kamyoncu, olusturan, olusturan_id, durum)
VALUES (
  'Kömür Nakliyesi',
  'Antalya',
  'İzmir',
  8200,
  '2026-05-14',
  '34 TYK 421',
  'Test Kamyoncu',
  'Test İşveren',
  '22222222-2222-2222-2222-222222222222',
  'yolda'
);

-- Test teklif oluştur
INSERT INTO teklifler (ilan_id, teklif_sahibi_id, tutar, ozellikler, durum, olusturma_zamani)
VALUES (
  1,
  '11111111-1111-1111-1111-111111111111',
  8000,
  '{}',
  'bekliyor',
  '2026-05-14'
);
