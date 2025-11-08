-- Add name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200);

-- Update existing users with default names if they don't have one
UPDATE users SET name = 'Sistem Yöneticisi' WHERE role = 'admin' AND name IS NULL;
UPDATE users SET name = email WHERE name IS NULL;

