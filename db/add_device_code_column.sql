-- Add device_code column to platform_connection_requests table for storing new device verification codes
ALTER TABLE platform_connection_requests ADD COLUMN device_code TEXT;