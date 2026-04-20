-- Add missing columns to platform_connection_requests table
ALTER TABLE IF EXISTS platform_connection_requests
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add comment to clarify the columns
COMMENT ON COLUMN platform_connection_requests.code IS 'Verification code (e.g., 2FA code from device verification)';
COMMENT ON COLUMN platform_connection_requests.user_id IS 'Optional user_id for authenticated submissions';
