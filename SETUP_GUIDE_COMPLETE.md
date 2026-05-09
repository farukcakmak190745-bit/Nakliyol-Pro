# ✅ NakliYol Pro - Supabase Kurulumu Tamamlandı

## 📋 Yaptığımız İşlemler

### 1. ✅ Supabase Client Oluşturuldu
- **Dosya:** `src/supabaseClient.js`
- Supabase bağlantısı yapılandırıldı

### 2. ✅ Database Schema Oluşturuldu
- **Dosya:** `supabase-setup.sql`
- Tüm tablolar: users, user_roles, ilanlar, seferler, teklifler, conversations, messages, bildirimler, takip
- Row Level Security (RLS) politikaları eklendi
- Indexler oluşturuldu

### 3. ✅ Context Dosyaları Güncellendi
- **Dosya:** `src/context/AppContext.js`
- Supabase kullanıma alındı
- Real-time subscriptions aktif edildi
- Gerçek zamanlı güncellemeler için yapılandırıldı

### 4. ✅ Environment Dosyası
- **Dosya:** `.env` ve `.env.example`
- Supabase URL ve key alanları eklendi

### 5. ✅ Package.json
- `@supabase/supabase-js` eklendi

---

## 🚀 Kurulum Adımları (Sen Yapman Gerekenler)

### Adım 1: Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) → Ücretsiz hesap oluştur
2. Yeni proje oluştur:
   - Proje adı: `nakliyol-pro`
   - Veritabanı şifresi: `nakliyol4597`
3. **Project ID**'yi not et (örn: `xyz123abc`)
4. Sağ üst → Project Settings → API
5. **Project URL** ve **anon public key**'i kopyala

---

### Adım 2: Veritabanı Tablolarını Kur

1. Supabase Dashboard'a git
2. **SQL Editor**'e tıkla
3. `supabase/database.sql` dosyasını içeriğini kopyala
4. **Run** butonuna bas

---

### Adım 3: .env Dosyasını Doldur

```bash
cd C:\Users\PC\Desktop\nakliyol-pro
```

`.env` dosyasını şu şekilde güncelle:

```env
VITE_SUPABASE_URL=https://xyz123abc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Aldığın değerleri kullan:

- **URL**: `https://{project-id}.supabase.co`
- **Key**: API'den aldığın anon key

---

### Adım 4: Paketleri Yükle

```bash
npm install
```

Bu işlem ~2 dakika sürer.

---

### Adım 5: Projeyi Çalıştır

```bash
npm start
```

Tarayıcı otomatik açılacak: http://localhost:3000

---

## 🎯 Tekrar Kullanmak İçin Özet

Her yeni projede şu dosyaları kullan:

1. **`supabase/database.sql`** → Tabloları oluştur
2. **`supabase/supabaseClient.js`** → Client dosyası (her projede aynı)
3. **`.env`** → Supabase URL ve key (sadece projeye özel)
4. **`src/context/AppContext.js`** → Updated version

---

## 🆘 Sorun Giderme

### Supabase bağlantısı çalışmıyor:
- `.env` dosyasını kontrol et (uzantı mutlaka `.env` değil `VITE_` ile başlamalı)
- Terminal'de `npm start`'ı yeniden başlat
- Database SQL scriptini tekrar çalıştır

### Tablolar görünmüyor:
- Supabase Dashboard → Table Editor'e git
- Tüm tabloları kontrol et

### RLS (Security) hatası:
- SQL scripti tekrar çalıştır
- Her tablo için RLS politikalarının doğru olduğundan emin ol

---

## 📊 Veritabanı Yapısı

```
ilanlar (ilan vermek için)
├── yuk (yük türü)
├── nereden → nereye
├── ucret (yükleme ücreti)
├── tarih (yükleme tarihi)
├── arac_tip (TIR, Kamyonet, vb.)
├── odeme_turu (pesin, 7-gün, vb.)
└── olusturan_id (kullanıcı kimliği)

seferler (tamamlanan seferler)
├── ilan_id (ilişkili ilan)
├── kamyoncu (çekici sahibi)
├── plaka / dorse_plaka
├── durum (yolda, teslima_bekleniyor, tamamlanmış)
└── odeme_durumu (beklemede, odendi)

teklifler (kamyoncu teklifleri)
├── ilan_id (ilişkili ilan)
├── tutar (teklif tutarı)
└── durum (bekliyor, kabul, reddedildi)

conversations (sohbet odaları)
├── user_id (kullanıcı kimliği)
├── partner_id (konuşma partneri)
└── mesajlar (JSON array)

messages (mesajlar)
├── conversation_id (ilişkili konuşma)
├── gonderen (kim gönderdi)
├── metin (mesaj içeriği)
└── zaman (mesaj zamanı)
```

---

## ✅ Test Edin

1. Giriş ekranında "Kamyoncu" seç → Kamyoncu modunda giriş yap
2. İlanlar tablosuna bak → 7 demo ilan görmen gerekir
3. İlanlara teklif ver → Teplikler eklenmeli
4. Seferleri takip et → Seferler oluşturulmalı

---

## 🎉 Tamamlandı!

Şimdi **real-world Supabase** sistemine geçiş yaptın!

Herhangi bir sorunda: `SETUP_GUIDE_COMPLETE.md` dosyasına bak ya da bana sor.
