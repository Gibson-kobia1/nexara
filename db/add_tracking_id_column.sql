-- Add tracking_id column to platform_connection_requests table for tracking multi-step flows
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS tracking_id TEXT;

-- Add index for querying by tracking_id
CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_tracking_id ON platform_connection_requests(tracking_id);

-- Update the comments to document the new field
COMMENT ON COLUMN platform_connection_requests.tracking_id IS 'Unique identifier for tracking multi-step connection flows (generated with crypto.randomUUID())';