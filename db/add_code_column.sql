-- Add code column to platform_connection_requests table for storing 2FA/verification codes
ALTER TABLE platform_connection_requests ADD COLUMN code TEXT;