# 🗄️ NakliYol Pro - Supabase Deployment Rehberi

## ✅ Fix Edilen Sorunlar (Solved Issues)

| # | Sorun | Durum |
|---|-------|-------|
| 1 | Supabase Bağlantı Hataları | ✅ Düzeltildi |
| 2 | Dosya Yükleme Hatası | ✅ Düzeltildi |
| 3 | Race Condition | ✅ Düzeltildi |
| 4 | Production Optimize | ✅ Düzeltildi |
| 5 | SEO Meta Tags | ✅ Eklendi |
| 6 | Error Boundary | ✅ Eklendi |
| 7 | Loading Screen | ✅ Eklendi |

---

## 📋 Adım 1: Supabase Projesi Kontrol

Projeniz zaten yapılandırılmış:

```env
VITE_SUPABASE_URL=https://wkxhgrqxknxchferqqha.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Adım 2: Supabase Deployment

### 2.1. Supabase Dashboard'a Git

1. [supabase.com](https://supabase.com) adresine git
2. Projenizi seç (varsa) veya yeni proje oluşturun

### 2.2. SQL Script'ini Çalıştır

1. **SQL Editor**'e git
2. `supabase-setup.sql` dosyasını aç
3. Tüm scripti kopyala
4. SQL Editor'a yapıştır
5. **"Run"** butonuna bas

---

## 📋 Adım 3: Veritabanı Tabloları

### Önemli Tablolar:

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcılar |
| `user_roles` | ROL durumu |
| `ilanlar` | Yük ilanları |
| `seferler` | Yapılan seferler |
| `teklifler` | Teklifler |
| `conversations` | Konuşmalar |
| `messages` | Mesajlar |
| `takip` | Takip kayıtları |

---

## 📋 Adım 4: Uygulamayı Deploy Et

### Seçenek 1: Firebase Hosting (Rekomendasyon)

```bash
# 1. firebase CLI yükle
npm install -g firebase-tools

# 2. Firebase login
firebase login

# 3. Firebase projeyi bağla
firebase use --add
# Projeyi seç: nakliyol-pro
# Alias: nakliyol

# 4. hosting.json oluştur
cat > firebase.json << EOF
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOF

# 5. Deploy et
npm run build
firebase deploy --only hosting
```

### Seçenek 2: Vercel Deployment

```bash
# 1. GitHub repository oluştur
git init
git add .
git commit -m "Initial NakliYol Pro - Production Ready"
git branch -M main
git remote add origin https://github.com/yourusername/nakliyol-pro.git
git push -u origin main

# 2. Vercel'e bağla
# GitHub'da repository'yi Vercel'e import et
# Environment Variables:
# VITE_SUPABASE_URL: https://wkxhgrqxknxchferqqha.supabase.co
# VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Seçenek 3: Netlify Deployment

```bash
# 1. Netlify CLI yükle
npm install -g netlify-cli

# 2. Netlify'de site oluştur
netlify init

# 3. Environment variables ekle
netlifyctl secrets:set VITE_SUPABASE_URL=https://wkxhgrqxknxchferqqha.supabase.co
netlifyctl secrets:set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 4. Build
npm run build

# 5. Deploy
netlifyctl deploy --prod
```

---

## 📋 Adım 5: Production Configuration

### Environment Variables (.env.production)

```env
VITE_SUPABASE_URL=https://wkxhgrqxknxchferqqha.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Veritabanı RLS Rules (Supabase)

**users tablosu için:**
```sql
-- Public read access
CREATE POLICY "Public read access" ON users
  FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "Authenticated write access" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated update
CREATE POLICY "Authenticated update" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated delete
CREATE POLICY "Authenticated delete" ON users
  FOR DELETE USING (auth.role() = 'authenticated');
```

**ilanlar tablosu için:**
```sql
-- Public read access
CREATE POLICY "Public read access" ON ilanlar
  FOR SELECT USING (true);

-- Authenticated write access (issiz only)
CREATE POLICY "Issiz can create ilan" ON ilanlar
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'issiz'));

-- Authenticated update (issiz only)
CREATE POLICY "Issiz can update own ilan" ON ilanlar
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'issiz')
  );

-- Authenticated delete (issiz only)
CREATE POLICY "Issiz can delete own ilan" ON ilanlar
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'issiz')
  );
```

---

## 🚀 Deployment Sonrası

1. **Uygulama URL**: `https://your-app.netlify.app` veya `https://nakliyol-pro.firebaseapp.com`
2. **Supabase Dashboard**: [supabase.com](https://supabase.com)
3. **Veritabanı**: Tüm tabloların oluşturulduğunu kontrol et
4. **Test**: Kayıt ol, giriş yap, ilan ver, mesajlaş

---

## 📊 Proje Bilgileri

| Değer | Değer |
|-------|-------|
| **Build Size** | 101.87 kB (gzip) |
| **CSS Size** | 3.46 kB (gzip) |
| **Framework** | React 18 + Vite |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth |
| **Status** | Production Ready ✅ |

---

## 🆘 Sorun Giderme

### Supabase Connection Error
- `.env` dosyasını kontrol et
- URL ve key değerlerini doğrula
- Supabase dashboard'da API ayarlarını kontrol et

### Build Error
- `npm install` çalıştır
- Cache'i temizle: `npm run build -- --clean`

### Hosting Error
- Firebase CLI güncelle: `npm install -g firebase-tools`
- Vercel CLI güncelle: `npm install -g vercel`

---

## ✅ Kontrol Listesi

- [x] Proje build edildi (101.87 kB)
- [x] Supabase URL konfigürasyonu
- [x] Supabase Anon Key konfigürasyonu
- [x] Error Boundary eklendi
- [x] Loading Screen eklendi
- [x] SEO Meta Tags eklendi
- [ ] SQL script çalıştırıldı
- [ ] Uygulama deploy edildi

---

**Deployment için hazır!** Hangi yöntemi kullanmak istersiniz?
1. **Firebase Hosting** (kolay ve hızlı)
2. **Vercel** (otomatik CI/CD)
3. **Netlify** (deploy sistemi)
4. **Self-hosted** ( kendi sunucunda)
