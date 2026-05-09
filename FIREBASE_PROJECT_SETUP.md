# 🔥 Firebase Proje Adı: Nakliyolpro

## ✅ Mevcut Ayarlar (Zaten Yapıldı)

`.env` dosyanızda zaten doğru değerler var:

```
REACT_APP_FIREBASE_PROJECT_ID=nakliyolpro
REACT_APP_FIREBASE_AUTH_DOMAIN=nakliyolpro.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=nakliyolpro.firebasestorage.app
```

---

## 📋 Firebase Console'da Yapman Gerekenler

### 1️⃣ Firebase Proje Oluştur

Google Console'da Firebase'e gidin: https://console.firebase.google.com/

- **Create Project** butonuna tıkla
- Proje adı: **`nakliyolpro`** (HAZIRDA)
- Konum: Turkey
- **"Create Project"** diyerek oluştur

⚠️ **NOT:** Eğer projenin adı farklıysa:
1. Proje ayarlarına (⚙️) tıkla
2. Proje adını `nakliyolpro` olarak güncelle
3. `nakliyolpro.firebaseapp.com`'a erişilebilmeli

---

### 2️⃣ Firestore Database Oluştur

1. Firebase Console'da **"Build"** → **"Firestore Database"**'e tıkla
2. **"Create database"** diyerek başlat
3. **Test Mode** seç (geliştirme için)
4. **Nearby** konumunu seç
5. **Create** diyerek veritabanını oluştur

---

### 3️⃣ Web Uygulaması Ekle

1. Proje ayarları (⚙️) → **"Project settings"**'e tıkla
2. **"Your apps"** bölümüne git
3. **Web** ikonuna (<<) tıkla
4. Uygulama adı: `nakliyol-web`
5. **"Register app"** diyerek kayıt oluştur
6. `firebaseConfig` nesnesini kopyala:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "nakliyolpro.firebaseapp.com",      ← DİKKAT: Proje adı burada
  projectId: "nakliyolpro",                        ← DİKKAT: Proje ID burada
  storageBucket: "nakliyolpro.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXX"
};
```

---

### 4️⃣ Firebase Config Dosyasını Güncelle

**`.env` dosyasını güncelle** (mevcut değerleri doğrula):

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=nakliyolpro.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nakliyolpro
REACT_APP_FIREBASE_STORAGE_BUCKET=nakliyolpro.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXX
```

---

### 5️⃣ Firebase'i Deploy Et

Terminalde çalıştır:

```bash
# Firebase'e giriş yap
firebase login

# Firebase projeyi seç
firebase use nakliyolpro

# Firestore ve Storage kurallarını yükle
firebase deploy --only firestore:rules,storage:rules

# Hosting ile deploy et
firebase deploy --only hosting
```

**Veya tümüyle:**

```bash
firebase deploy
```

---

## 📊 Proje Adı Kontrol Listesi

- ✅ Firebase Console'da proje adı: **nakliyolpro**
- ✅ authDomain: **nakliyolpro.firebaseapp.com**
- ✅ projectId: **nakliyolpro**
- ✅ storageBucket: **nakliyolpro.firebasestorage.app**
- ✅ .env dosyası güncel

---

## 🌐 Uygulama URL'i

Deploy sonrası uygulaman erişilebilir olacağı URL:

**https://nakliyolpro.firebaseapp.com**

---

## 🆘 Sorun Giderme

### "Project not found" hatası
```bash
firebase login
firebase projects:list
firebase use nakliyolpro
```

### Auth Domain hatası
Firebase Console'da:
1. Proje ayarlarına (⚙️)
2. General → Your apps → Nakliyol Web
3. Host app linkini kontrol et
4. Google Auth servisini aktif et

### Storage hatası
Firebase Console'da:
1. Build → Storage
2. Create bucket
3. Test Mode'a geç

---

## 📞 Yardım

Eğer sorunda yardıma ihtiyacın varsa sor!
