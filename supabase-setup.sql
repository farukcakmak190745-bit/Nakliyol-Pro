-- NakliYol Pro v3.0 - Supabase Tabloları Oluşturma
-- Bu SQL scripti Supabase Dashboard > SQL Editor'den çalıştırın

-- 1. Kullanıcı Tablosu
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  ad TEXT NOT NULL,
  soyad TEXT NOT NULL,
  telefon TEXT NOT NULL,
  tc_kimlik TEXT UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('kamyoncu', 'issiz')),
  iban TEXT,
  iban_sahibi TEXT,
  firma_adi TEXT,
  vergi_no TEXT,
  plaka TEXT,
  arac_tip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Kullanıcı Roller Tablosu (Auth için)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- 3. İlanlar Tablosu
CREATE TABLE IF NOT EXISTS ilanlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yuk TEXT NOT NULL,
  nereden TEXT NOT NULL,
  nereye TEXT NOT NULL,
  ucret DECIMAL(10, 2) NOT NULL,
  tarih DATE NOT NULL,
  sure TEXT,
  ton INTEGER DEFAULT 0,
  arac_tip TEXT NOT NULL,
  aciklama TEXT,
  odeme_turu TEXT DEFAULT 'pesin',
  odeme_gun INTEGER DEFAULT 0,
  kdv_orani DECIMAL(3, 2) DEFAULT 0.00,
  kdv_tutari DECIMAL(10, 2) DEFAULT 0.00,
  toplam_ucret DECIMAL(10, 2),
  durum TEXT DEFAULT 'aktif',
  istek_sayisi INTEGER DEFAULT 0,
  belgeler JSONB DEFAULT '[]',
  olusturan_id UUID REFERENCES users(id),
  olusturan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Seferler Tablosu
CREATE TABLE IF NOT EXISTS seferler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yuk TEXT NOT NULL,
  nereden TEXT NOT NULL,
  nereye TEXT NOT NULL,
  ucret DECIMAL(10, 2) NOT NULL,
  tarih DATE NOT NULL,
  sure TEXT,
  ton INTEGER DEFAULT 0,
  arac_tip TEXT NOT NULL,
  ilan_id UUID REFERENCES ilanlar(id),
  plaka TEXT,
  dorse_plaka TEXT,
  kamyoncu TEXT,
  kamyoncu_tel TEXT,
  kamyoncu_tc TEXT,
  olusturan TEXT,
  olusturan_id UUID REFERENCES users(id),
  durum TEXT DEFAULT 'bekliyor',
  teslim_tarihi TIMESTAMP WITH TIME ZONE,
  belgeler JSONB DEFAULT '[]',
  odeme_tarihi TIMESTAMP WITH TIME ZONE,
  odeme_durumu TEXT DEFAULT 'beklemede',
  odeme_turu TEXT DEFAULT 'pesin',
  odeme_gun INTEGER DEFAULT 0,
  iban TEXT,
  iban_sahibi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Teklifler Tablosu
CREATE TABLE IF NOT EXISTS teklifler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ilan_id UUID REFERENCES ilanlar(id),
  teklif_sahibi_id UUID REFERENCES users(id),
  tutar DECIMAL(10, 2) NOT NULL,
  ozellikler JSONB DEFAULT '{}',
  durum TEXT DEFAULT 'bekliyor',
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Konuşmalar Tablosu
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES users(id),
  partner_ad TEXT NOT NULL,
  partner_rol TEXT NOT NULL,
  konusma_turu TEXT DEFAULT 'is',
  baslik TEXT,
  resim TEXT,
  bg TEXT,
  yaziyor BOOLEAN DEFAULT false,
  yaziyor_ad TEXT,
  okunmamis INTEGER DEFAULT 0,
  son_guncelleme TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Mesajlar Tablosu
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  konusma_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  gonderen TEXT NOT NULL,
  gonderen_id UUID REFERENCES users(id),
  metin TEXT,
  veri_tipi TEXT DEFAULT 'metin',
  veri JSONB,
  zaman TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  okundu_zaman TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS bildirimler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID REFERENCES users(id),
  tur TEXT NOT NULL,
  baslik TEXT NOT NULL,
  icerik TEXT NOT NULL,
  okundu BOOLEAN DEFAULT false,
  sefer_id UUID REFERENCES seferler(id),
  ilan_id UUID REFERENCES ilanlar(id),
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Indexler (Performans için)
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_tc_idx ON users(tc_kimlik);
CREATE INDEX IF NOT EXISTS ilanlar_olusturan_idx ON ilanlar(olusturan_id);
CREATE INDEX IF NOT EXISTS ilanlar_durum_idx ON ilanlar(durum);
CREATE INDEX IF NOT EXISTS seferler_kamyoncu_idx ON seferler(kamyoncu_tc);
CREATE INDEX IF NOT EXISTS seferler_durum_idx ON seferler(durum);
CREATE INDEX IF NOT EXISTS teklifler_ilan_idx ON teklifler(ilan_id);
CREATE INDEX IF NOT EXISTS teklifler_durum_idx ON teklifler(durum);
CREATE INDEX IF NOT EXISTS conversations_partner_idx ON conversations(partner_id);
CREATE INDEX IF NOT EXISTS messages_konusma_idx ON messages(konusma_id);

-- 10. Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ilanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE seferler ENABLE ROW LEVEL SECURITY;
ALTER TABLE teklifler ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bildirimler ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar için RSI politikaları
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- İlanlar için RSI politikaları
CREATE POLICY "Issiz users can create ilanlar" ON ilanlar
  FOR INSERT WITH CHECK (auth.uid() = olusturan_id);

CREATE POLICY "Issiz users can view all ilanlar" ON ilanlar
  FOR SELECT USING (true);

CREATE POLICY "Issiz users can update their ilanlar" ON ilanlar
  FOR UPDATE USING (auth.uid() = olusturan_id);

-- Seferler için RSI politikaları
CREATE POLICY "Issiz users can view seferler they created" ON seferler
  FOR SELECT USING (auth.uid() = olusturan_id);

CREATE POLICY "Kamyoncu users can view seferler they work on" ON seferler
  FOR SELECT USING (auth.uid() = olusturan_id OR auth.uid() = kamyoncu_tc::uuid);

CREATE POLICY "Kamyoncu users can update their seferler" ON seferler
  FOR UPDATE USING (auth.uid() = kamyoncu_tc::uuid);

-- Konuşmalar için RSI politikaları
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.konusma_id = conversations.id
      AND messages.gonderen_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- Mesajlar için RSI politikaları
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.konusma_id
      AND (
        conversations.partner_id = auth.uid() OR
        auth.uid() = messages.gonderen_id
      )
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = gonderen_id);

CREATE POLICY "Users can update messages in their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.partner_id = auth.uid() OR
        auth.uid() = messages.gonderen_id
      )
    )
  );

-- Bildirimler için RSI politikaları
CREATE POLICY "Users can view their own notifications" ON bildirimler
  FOR SELECT USING (auth.uid() = kullanici_id);

CREATE POLICY "Users can create notifications" ON bildirimler
  FOR INSERT WITH CHECK (true);

-- Yüksek güvenlik ayarları
ALTER TABLE users SET (row_security = off);
ALTER TABLE user_roles SET (row_security = off);
