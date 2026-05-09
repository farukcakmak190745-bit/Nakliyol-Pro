# 🔥 NakliYol Pro - Firebase Deployment Guide

## ✅ Fix Edilen Sorunlar (Solved Issues)

1. ✅ **Import path hatası** - AppContext'de import yolu düzeltildi
2. ✅ **Typo hatası** - MesajContext'te 'setKonsumas' -> 'setKonusmalar' düzeltildi
3. ✅ **Firebase paketi** - npm install yapıldı
4. ✅ **Build başarılı** - Proje başarıyla build edildi

---

## 📋 Adım Adım Firebase Deployment

### Adım 1: Firebase Console'da Proje Oluştur

1. Google Console'da Firebase'e gidin: https://console.firebase.google.com/
2. **"Create Project"** butonuna tıklayın
3. Proje adı (Project name): **Nakliyol**
4. Konum: Turkey
5. **"Create Project"** diyerek oluşturun

---

### Adım 2: Firestore Database Oluştur

1. Firebase Console'da **"Build"** → **"Firestore Database"**'e tıklayın
2. **"Create database"** diyerek başlatın
3. **Test Mode** seçin (geliştirme için)
4. **Nearby** konumunu seçin
5. **Create** diyerek veritabanını oluşturun

---

### Adım 3: Firebase Configuration Al

1. Proje ayarları (⚙️) → **"Project settings"**'e tıklayın
2. **"Your apps"** bölümüne gidin
3. **Web** ikonuna (<<) tıklayın
4. Uygulama adı: `nakliyol-web`
5. **"Register app"** diyerek kayıt oluşturun
6. `firebaseConfig` nesnesini kopyalayın:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxx",
  authDomain: "nakliyolpro.firebaseapp.com",      ← Proje ID kullanıyor
  projectId: "nakliyolpro",                        ← Proje ID kullanıyor
  storageBucket: "nakliyolpro.appspot.com",        ← Proje ID kullanıyor
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXX"
};
```

---

### Adım 4: Firebase Rules Oluştur

**Create `firestore.rules` dosyası:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Test mode (geliştirme)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Create `storage.rules` dosyası:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

### Adım 5: Firebase Config Dosyasını Güncelle

**`firebase-config.json` dosyasını güncelleyin:**

```json
{
  "firebaseConfig": {
    "apiKey": "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
    "authDomain": "nakliyol-pro.firebaseapp.com",
    "projectId": "nakliyol-pro",
    "storageBucket": "nakliyol-pro.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abcdef",
    "measurementId": "G-XXXXX"
  },
  "instructions": "Replace the placeholder values with your actual Firebase config from the Firebase Console."
}
```

---

### Adım 6: Firebase Deployment

**Terminalde şu komutları çalıştırın:**

```bash
# Firebase projeyi bağla
firebase login

# Firebase projeyi seç
firebase use nakliyol-pro

# Firestore ve Storage rules yükle
firebase deploy --only firestore:rules,storage:rules

# Hosting ile deploy et
firebase deploy --only hosting
```

**Veya tümüyle deploy et:**

```bash
firebase deploy
```

---

### Adım 7: Hosting Ayarı

**`firebase.json` dosyası zaten mevcut:**

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

---

## 🔧 Ekstra Ayarlar

### .env Dosyası

`.env` dosyasını projenin root klasörüne kopyalayın ve Firebase config değerlerini girin:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=nakliyol-pro.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nakliyol-pro
REACT_APP_FIREBASE_STORAGE_BUCKET=nakliyol-pro.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXX
```

---

## 🚀 Deploy Sonrası

1. Firebase Console'da **"Hosting"** → **"Sites"** bölümüne gidin
2. `nakliyol-pro.firebaseapp.com` adresini ziyaret edin
3. Uygulama çalışmalı

---

## 📊 Proje Bilgileri

| Değer | Değer |
|-------|-------|
| **Proje Adı** | Nakliyol |
| **Proje ID** | nakliyolpro |
| **Auth Domain** | nakliyolpro.firebaseapp.com |
| **Storage Bucket** | nakliyolpro.appspot.com |
| **Build Size** | 140.9 kB (gzipped) |
| **CSS Size** | 3.46 kB (gzipped) |
| **Framework** | React 18.2.0 |
| **Router** | React Router v6.22.0 |
| **Firebase Version** | 10.7.1 |

---

## 🆘 Sorun Giderme

### Build Hatası
- npm install çalıştırın
- .env dosyasını kontrol edin

### Firebase Error
- firebase login çalıştırın
- firebase deploy --only hosting çalıştırın

### Hosting Hatası
- build klasörünün oluşturulduğunu kontrol edin
- firebase.json ayarlarının doğru olduğunu kontrol edin

---

## 📞 Destek

Eğer herhangi bir sorunda yardıma ihtiyacınız varsa, lütfen bildirin!

---

## 🚀 Uygulama URL'i

Deploy sonrası uygulaman erişilebilir olacağı URL:

**https://nakliyolpro.firebaseapp.com**

---

## 📝 Önemli Notlar

- **Proje Adı** (Nakliyol) sadece görünen isimdir
- **Proje ID** (nakliyolpro) tekil ve benzersizdir
- Auth domain ve storage bucket **Projeden** oluşturulur (uzantılar projeye bağlıdır)
- .env dosyasındaki değerler **Projeden** ayarlanmalıdır
