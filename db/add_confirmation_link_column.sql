-- Add confirmation_link column to platform_connections table for device verification
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS confirmation_link TEXT;

-- Add index for querying by confirmation_link
CREATE INDEX IF NOT EXISTS idx_platform_connections_confirmation_link ON platform_connections(confirmation_link);

-- Update the comments to document the new field
COMMENT ON COLUMN platform_connections.confirmation_link IS 'Email verification link pasted by user during new device detection flow';
