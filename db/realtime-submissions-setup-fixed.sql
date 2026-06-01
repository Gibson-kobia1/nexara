-- ============================================================================
-- REALTIME SUBMISSIONS SETUP (FIXED - No GRANT SUBSCRIBE needed)
-- ============================================================================
-- This SQL configures the platform_connection_requests table for real-time
-- admin updates. The key insight: RLS policies control access, publication
-- just needs to exist, and Supabase handles realtime subscription internally.
-- ============================================================================

-- ============================================================================
-- Step 1: ADD REQUIRED COLUMNS (if they don't exist)
-- ============================================================================
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE;
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS confirmation_link TEXT;
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ============================================================================
-- Step 2: CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_tracking_id 
  ON platform_connection_requests(tracking_id);

CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_created_at 
  ON platform_connection_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_platform 
  ON platform_connection_requests(platform);

-- ============================================================================
-- Step 3: ENABLE ROW LEVEL SECURITY (if not already enabled)
-- ============================================================================
ALTER TABLE platform_connection_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 4: DROP OLD POLICIES (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "Allow anonymous users to submit platform connection requests" 
  ON platform_connection_requests;
DROP POLICY IF EXISTS "Allow users to view submissions with tracking_id" 
  ON platform_connection_requests;
DROP POLICY IF EXISTS "Prevent unauthorized updates" 
  ON platform_connection_requests;
DROP POLICY IF EXISTS "Prevent unauthorized deletes" 
  ON platform_connection_requests;

-- ============================================================================
-- Step 5: CREATE NEW RLS POLICIES
-- ============================================================================
-- Allow public anonymous users to INSERT (for Noones flow and other platforms)
CREATE POLICY "Allow anonymous users to submit platform connection requests"
  ON platform_connection_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow public SELECT (users can check their submission status via tracking_id)
CREATE POLICY "Allow users to view submissions with tracking_id"
  ON platform_connection_requests
  FOR SELECT
  USING (true);

-- Prevent UPDATE from public (use service role via /api/update-connection instead)
CREATE POLICY "Prevent unauthorized updates"
  ON platform_connection_requests
  FOR UPDATE
  USING (false);

-- Prevent DELETE from public (use service role via admin endpoint instead)
CREATE POLICY "Prevent unauthorized deletes"
  ON platform_connection_requests
  FOR DELETE
  USING (false);

-- ============================================================================
-- Step 6: ENABLE REALTIME PUBLICATION
-- ============================================================================
-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS platform_connection_requests_realtime CASCADE;

-- Create publication for realtime
-- This is all we need - Supabase handles the subscription internally
CREATE PUBLICATION platform_connection_requests_realtime 
  FOR TABLE platform_connection_requests;

-- ============================================================================
-- Step 7: VERIFY SETUP (optional - run these to check)
-- ============================================================================
-- Uncomment and run these individually to verify:

-- Check columns exist:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'platform_connection_requests' 
-- ORDER BY ordinal_position;

-- Check indexes exist:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'platform_connection_requests';

-- Check RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, qual 
-- FROM pg_policies 
-- WHERE tablename = 'platform_connection_requests'
-- ORDER BY policyname;

-- Check realtime publication:
-- SELECT * FROM pg_publication WHERE pubname LIKE '%platform_connection%';
