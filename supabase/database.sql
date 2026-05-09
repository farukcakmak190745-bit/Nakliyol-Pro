-- ==============================================
-- NakliYol Pro Database Schema - Supabase
-- ==============================================

-- 1. USERS TABLE
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

-- 2. USER ROLES TABLE
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_trucker BOOLEAN DEFAULT FALSE,
  firma_bilgileri JSONB,
  profil_foto TEXT,
  bildirimler JSONB DEFAULT '{}',
  guncelleme_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ILANLAR TABLE
CREATE TABLE ilanlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olusturan_id UUID REFERENCES users(id) ON DELETE CASCADE,
  olusturan TEXT NOT NULL,
  olusturan_puan DECIMAL(3, 2) DEFAULT 5.0,
  yuk TEXT NOT NULL,
  nereden TEXT NOT NULL,
  nereye TEXT NOT NULL,
  ucret DECIMAL(10, 2) NOT NULL,
  tarih DATE NOT NULL,
  sure TEXT,
  ton DECIMAL(5, 2) DEFAULT 0,
  arac_tip TEXT,
  odeme_turu TEXT DEFAULT 'pesin',
  odeme_gun INTEGER DEFAULT 0,
  kdv_orani DECIMAL(5, 2) DEFAULT 0,
  kdv_tutari DECIMAL(10, 2) DEFAULT 0,
  toplam_ucret DECIMAL(10, 2),
  durum TEXT DEFAULT 'aktif',
  istek_sayisi INTEGER DEFAULT 0,
  belgeler JSONB DEFAULT '[]',
  iban TEXT,
  iban_sahibi TEXT,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SEFERLER TABLE
CREATE TABLE seferler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ilan_id UUID REFERENCES ilanlar(id) ON DELETE CASCADE,
  yuk TEXT NOT NULL,
  nereden TEXT NOT NULL,
  nereye TEXT NOT NULL,
  ucret DECIMAL(10, 2) NOT NULL,
  tarih DATE NOT NULL,
  sure TEXT,
  ton DECIMAL(5, 2) DEFAULT 0,
  arac_tip TEXT,
  plaka TEXT,
  dorse_plaka TEXT,
  kamyoncu TEXT NOT NULL,
  kamyoncu_tel TEXT NOT NULL,
  kamyoncu_tc TEXT,
  olusturan TEXT NOT NULL,
  durum TEXT DEFAULT 'yolda',
  teslim_tarihi DATE,
  belgeler JSONB DEFAULT '[]',
  odeme_tarihi DATE,
  odeme_durumu TEXT DEFAULT 'beklemede',
  odeme_turu TEXT,
  odeme_gun INTEGER DEFAULT 0,
  iban TEXT,
  iban_sahibi TEXT,
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TEKLIFLER TABLE
CREATE TABLE teklifler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ilan_id UUID REFERENCES ilanlar(id) ON DELETE CASCADE,
  teklif_sahibi_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tutar DECIMAL(10, 2) NOT NULL,
  ozellikler JSONB DEFAULT '{}',
  durum TEXT DEFAULT 'beklemede',
  olusturma_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONVERSATIONS TABLE
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

-- 7. MESSAGES TABLE
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

-- ==============================================
-- SECURITY POLICIES (ROW LEVEL SECURITY)
-- ==============================================

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON users
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write access" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated delete" ON users
  FOR DELETE USING (true);

-- USER ROLES
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can read own role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "User can update own role" ON user_roles
  FOR UPDATE USING (user_id = auth.uid());

-- ILANLAR
ALTER TABLE ilanlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ilans" ON ilanlar
  FOR SELECT USING (durum = 'aktif');

CREATE POLICY "Only creator can insert ilan" ON ilanlar
  FOR INSERT WITH CHECK (auth.uid() = olusturan_id::uuid);

CREATE POLICY "Only creator can update ilan" ON ilanlar
  FOR UPDATE USING (auth.uid() = olusturan_id::uuid);

CREATE POLICY "Only creator can delete ilan" ON ilanlar
  FOR DELETE USING (auth.uid() = olusturan_id::uuid);

-- SEFERLER
ALTER TABLE seferler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all seferler" ON seferler
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY "Creator can view own seferler" ON seferler
  FOR SELECT USING (auth.uid() = olusturan_id::uuid OR kamyoncu_tc = auth.uid()::text);

CREATE POLICY "Creator can update own seferler" ON seferler
  FOR UPDATE USING (auth.uid() = olusturan_id::uuid OR kamyoncu_tc = auth.uid()::text);

-- TEKLIFLER
ALTER TABLE teklifler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view teklifler" ON teklifler
  FOR SELECT USING (true);

CREATE POLICY "Only teklif_sahibi can insert teklif" ON teklifler
  FOR INSERT WITH CHECK (auth.uid() = teklif_sahibi_id::uuid);

CREATE POLICY "Only admin can update teklif" ON teklifler
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Users can insert conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid() OR partner_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages" ON messages
  FOR DELETE USING (true);

-- ==============================================
-- INDEXES (Performans için)
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_ilanlar_durum ON ilanlar(durum);
CREATE INDEX IF NOT EXISTS idx_ilanlar_olusturma_zamani ON ilanlar(olusturma_zamani DESC);
CREATE INDEX IF NOT EXISTS idx_ilanlar_olusturan ON ilanlar(olusturan_id);
CREATE INDEX IF NOT EXISTS idx_seferler_durum ON seferler(durum);
CREATE INDEX IF NOT EXISTS idx_seferler_tarih ON seferler(tarih);
CREATE INDEX IF NOT EXISTS idx_teklifler_ilan ON teklifler(ilan_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON conversations(partner_id);

-- ==============================================
-- INITIAL DATA (Opsiyonel - Demo kullanımı için)
-- ==============================================

-- Demo admin kullanıcı
INSERT INTO users (email, role, ad, telefon) VALUES
('admin@nakliyol.com', 'admin', 'Admin', '02125555555')
ON CONFLICT (email) DO NOTHING;

-- ==============================================
-- TAMAMLAMA
-- ==============================================
