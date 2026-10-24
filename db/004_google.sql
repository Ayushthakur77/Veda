-- Google sign-in: users may have no phone (phone is collected on the delivery address instead).
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(40);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_key ON users(google_sub) WHERE google_sub IS NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_identity_check;
ALTER TABLE users ADD CONSTRAINT users_identity_check CHECK (phone IS NOT NULL OR google_sub IS NOT NULL);
