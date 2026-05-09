# 🗄️ Supabase Kurulum Rehberi

## Adım 1: Supabase Projesi Oluştur

1. **[supabase.com](https://supabase.com)** adresine git
2. Ücretsiz hesap oluştur (Google/Email ile)
3. Yeni proje oluştur:
   - Proje adı: `nakliyol-pro`
   - Veritabanı şifresi: `nakliyol4597`
   - Sağ üstten **"Project Settings"** → **"API"** aç

4. API bilgilerini kopyala (3 adet):
   ```
   Project URL: https://your-project-id.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Nasıl bulursun:**
   - [supabase.com](https://supabase.com) → Projeyi seç
   - Sağ üst → Project Settings (Gear icon) → API
   - **Project ID**: Orada göreceksin (örn: `xyz123abc`)
   - **Project URL**: `https://xyz123abc.supabase.co`

---

## Adım 2: Veritabanı Tablolarını Kur

### A. Supabase Dashboard → SQL Editor'e git

### B. Tablo 1: Users (Kullanıcılar)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kamyoncu', 'issiz', 'admin')),
  ad TEXT NOT NULL,
  tc_kimlik TEXT,
  telefon TEXT,
  plaka TEXT,
  dorse_plaka TEXT,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROL DURUM TABLOSU
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_trucker BOOLEAN DEFAULT FALSE,
  firma_bilgileri JSONB,
  profil_foto TEXT,
  bildirimler JSONB DEFAULT '{}',
  guncelleme_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TAKİP TABLOSU
CREATE TABLE takip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ilan_id UUID REFERENCES ilanlar(id) ON DELETE CASCADE,
  durum TEXT CHECK (durum IN ('beklemede', 'kabul', 'reddedildi')),
  ozellikler JSONB DEFAULT '{}',
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TEKLİF TABLOSU
CREATE TABLE teklifler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ilan_id UUID REFERENCES ilanlar(id) ON DELETE CASCADE,
  teklif_sahibi_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tutar DECIMAL(10, 2) NOT NULL,
  ozellikler JSONB DEFAULT '{}',
  durum TEXT DEFAULT 'beklemede',
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KONUSMA TABLOSU
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_adi TEXT NOT NULL,
  partner_resim TEXT,
  konusma_turu TEXT DEFAULT 'is',
  resim TEXT,
  bg TEXT,
  mesajlar JSONB DEFAULT '[]',
  son_okuma TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  son_guncelleme TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MESAJ TABLOSU (Sub-collection)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  gonderen TEXT NOT NULL,
  metin TEXT NOT NULL,
  veri_tipi TEXT DEFAULT 'metin',
  veri JSONB,
  zaman TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  okundu_zamani TIMESTAMP WITH TIME ZONE
);

-- DOĞRULAMA KURALLARI
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON users
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write access" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated delete" ON users
  FOR DELETE USING (true);

-- Konusmalar için RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Users can insert conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());

-- Messages için RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid() OR partner_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages" ON messages
  FOR DELETE USING (true);
```

---

## Adım 3: .env Dosyasını Güncelle

`.env` dosyasına bu değerleri gir:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Adım 4: Paket Kurulumu

```bash
npm install @supabase/supabase-js
```

---

## Adım 5: Kurulum Dosyaları

`src/supabase/supabaseClient.js` oluştur

---

## ✅ Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] API bilgileri kopyalandı
- [ ] SQL script çalıştırıldı
- [ ] Paket kuruldu
- [ ] .env dosyası güncellendi
- [ ] Client oluşturuldu

---

## 🆘 Sorun Giderme

SQL çalışmıyorsa:
1. Supabase SQL Editor'e git
2. Tüm scripti seç
3. "Run" butonuna bas

Eğer hata alıyorsan:
- Yeniden çalıştır dene
- ROL DURUM ve TAKİP tablolarının arada olması gerekir (order matters)
