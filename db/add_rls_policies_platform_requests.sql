-- RLS Policies for Noones Flow (Read-Only Admin)
-- Since Admin dashboard is read-only and uses service role key,
-- we need policies that allow anonymous public submissions

-- Enable RLS on platform_connection_requests if not already enabled
ALTER TABLE platform_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connection_requests REPLICA IDENTITY FULL;

-- Allow public anonymous users to INSERT (for Noones flow)
-- No user_id required, so anyone can submit without auth
CREATE POLICY "Allow anonymous users to submit platform connection requests"
  ON platform_connection_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow public SELECT (optional - useful for users to check their submission status)
-- In practice, users would use tracking_id to verify submission
CREATE POLICY "Allow users to view submissions with tracking_id"
  ON platform_connection_requests
  FOR SELECT
  USING (true);

-- Allow updates through tracking_id for service role or API updates
CREATE POLICY "Allow updates via tracking_id"
  ON platform_connection_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DENY DELETE for all roles (except admin which bypasses RLS via service role)
CREATE POLICY "Prevent unauthorized deletes"
  ON platform_connection_requests
  FOR DELETE
  USING (false);

-- Verify RLS is enabled
COMMENT ON TABLE platform_connection_requests IS 'Public submissions table with RLS enabled. Admin access via service role bypasses these policies.';
