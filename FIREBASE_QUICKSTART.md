# 🚀 Firebase ile Test Et

## Hızlı Kurulum (2 Dakika)

### 1️⃣ Firebase Projesi Oluştur

1. Git: https://console.firebase.google.com/
2. "Yeni proje" → Name: `nakliyol-pro`
3. "Build" → "Firestore Database" → "Create database" → "Test mode başlat"

### 2️⃣ Firebase Config Al

1. Proje ayarları (⚙️ ikonu) → "Project settings"
2. "Web uygulaması ekle" → App name: `nakliyol-web`
3. Firebase config'i kopyala

### 3️⃣ .env Dosyası Oluştur

```bash
# Firebase Console'dan aldığın config'i gir

REACT_APP_FIREBASE_API_KEY=AIzaSyDxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=nakliyol-pro.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nakliyol-pro
REACT_APP_FIREBASE_STORAGE_BUCKET=nakliyol-pro.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4️⃣ Server'ı Başlat

```bash
npm start
```

## Test Edilecek Özellikler

✅ İlan ekleme
✅ İlan görüntüleme
✅ İlan alma (sefer oluştur)
✅ Mesajlaşma
✅ Profil görüntüleme

## Veritabanı Yapısı

```
ilanlar/
  - id: ilanID
  - yuk: string
  - nereden: string
  - nereye: string
  - ucret: number
  - aracTip: string
  - tarih: string
  - olusturan: string
  - olusturmaZamani: timestamp

seferler/
  - id: seferID
  - yuk: string
  - nereden: string
  - nereye: string
  - plaka: string
  - kamyoncu: string
  - durum: string
  - olusturmaZamani: timestamp

konusmalar/
  - id: konusmaID
  - partnerAd: string
  - partnerRol: string
  - mesajlar: array
  - sonOkuma: timestamp
```

## Firebase Console'da Kontrol Et

1. **Firestore Database:**
   - Koleksiyonlar → `ilanlar`, `seferler`, `konusmalar`

2. **İlanları Gör:** İlk sekmede ilan ekleyin, Firebase'de görün

3. **Real-time:** Her eklemede Firestore'da anlık görünür

## Sorun Giderme

**"Firebase Config yok"**
- `.env` dosyasını kontrol et, Firebase Console'dan config'i gir

**"Permission denied"**
- Firestore'da "Test mode" aktif olduğundan emin ol

**İlan görünmüyor**
- Firebase Console'da collection'ın oluşturulduğunu kontrol et
- Console'da "Verileri görüntüle" diyerek check et
