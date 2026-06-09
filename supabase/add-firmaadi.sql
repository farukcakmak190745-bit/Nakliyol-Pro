-- Add firmaAdi to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS firma_adi TEXT;

-- Add firmaAdi to user_roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS firma_adi TEXT;

-- Update existing rows with sample data for demo
UPDATE users SET firma_adi = NULL WHERE firma_adi IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_firma_adi ON users(firma_adi);
CREATE INDEX IF NOT EXISTS idx_user_roles_firma_adi ON user_roles(firma_adi);
