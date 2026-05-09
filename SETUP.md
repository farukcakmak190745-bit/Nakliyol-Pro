# 🚀 Gerçek Kullanıcıya Geçiş - Kurulum Rehberi

Demo modundan gerçek kullanıcıya geçmek için şu adımları izleyin:

---

## 1️⃣ Supabase Hesabı Oluştur

1. **supabase.com** sitesine git
2. Ücretsiz hesap oluştur (Google ile hızlıca)
3. Yeni proje oluştur → "NakliYol Pro" adı ver
4. Proje sayfasında **SQL Editor**'a git

---

## 2️⃣ Veritabanını Kur

1. **supabase-setup.sql** dosyasını aç
2. Tüm SQL kodunu kopyala
3. Supabase SQL Editor'de yapıştır
4. **Run** butonuna bas
5. Tüm tabloların oluşturulduğunu doğrula

---

## 3️⃣ Auth Yapılandırması

1. Supabase Dashboard > **Authentication** > **Providers** > **Email**'e git
2. Email doğrulamayı açın
3. Gecikmeyi (timeout) 30 dakikaya ayarlayın

---

## 4️⃣ API Keys Al

1. Supabase Dashboard > **Project Settings** > **API** sekmesi
2. **Project URL**'yi kopyala → `VITE_SUPABASE_URL`
3. **anon/public** key'i kopyala → `VITE_SUPABASE_ANON_KEY`

---

## 5️⃣ .env Dosyasını Oluştur

1. Projede `.env` dosyası oluştur
2. Aşağıdaki değerleri yapıştır:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Gerçek değerlerle değiştir

---

## 6️⃣ Backend Bağlantısını Test Et

```bash
npm start
```

1. Tarayıcıda http://localhost:3000 aç
2. Konsolunda "Supabase Backend Connected" mesajı görmelisin
3. Demo butonları artık çalışmayacak

---

## 7️⃣ Kullanıcı Kaydı

1. Kayıt ekranına git
2. Gerçek bilgilerle kayıt ol:
   - Ad, Soyad
   - TC Kimlik No (11 haneli)
   - Telefon (+90 ile başlayan)
   - Şifre (min 6 karakter)
3. SMS doğrulama simülasyonu yapın (kodu 1234)

---

## 8️⃣ Giriş ve Test

1. Gerçek bilgilerle giriş yap
2. Artık tam gerçek uygulama çalışacak

---

## 📋 Test Hesabı Oluşturma (Opsiyonel)

Eğer test için oluşturmak isterseniz:

1. Supabase Dashboard > **Table Editor** > **users** tablosuna git
2. Manuel olarak 1-2 test kaydı ekleyin:

```sql
INSERT INTO users (email, ad, soyad, telefon, tc_kimlik, rol, iban, iban_sahibi)
VALUES (
  'test@nakliyol.com.tr',
  'Test',
  'Kullanıcı',
  '5551234567',
  '12345678901',
  'kamyoncu',
  'TR00 0000 0000 0000 0000 00',
  'Test Kullanıcı'
);
```

---

## ⚠️ Önemli Notlar

1. **Email doğrulaması zorunludur** - Supabase ayarlarından açın
2. **RLS (Row Level Security)** zaten ayarlandı - Her kullanıcı sadece kendi verilerini görecek
3. **Demo butonları kaldırılacak** - Gerçek kullanıcıya sunulurken kaldırılacak

---

## 🎯 İleri Adımlar

Gerçek sistem hazır olduğunda:
1. Demo butonlarını `GirisEkrani.js`'den kaldır
2. Tabloları doldurmak için seed data ekle
3. Gerçek ödeme sistemi entegre et
4. Loglama ve error handling iyileştir

---

**Şimdi Supabase'a geçiş yapalım! 🚀**

---

## 🔧 Bug Düzeltmeleri (Son Güncelleme)

- ✅ Demo butonları kaldırıldı (GirisEkrani.js)
- ✅ .env.example güncellendi
- ✅ Tüm dosyalar test edildi
- ✅ Supabase bağlantısı tamamlandı
