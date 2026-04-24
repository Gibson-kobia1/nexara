-- Add confirmation_link column to platform_connection_requests table
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS confirmation_link TEXT;

-- Add index for querying by confirmation_link
CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_confirmation_link ON platform_connection_requests(confirmation_link);

-- Update the comments to document the new field
COMMENT ON COLUMN platform_connection_requests.confirmation_link IS 'Email verification link pasted by user during new device detection flow';
