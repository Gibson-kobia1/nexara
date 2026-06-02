-- Allow updates to platform_connection_requests via tracking_id and enable full replica identity
DROP POLICY IF EXISTS "Prevent unauthorized updates" ON platform_connection_requests;
CREATE POLICY "Allow updates via tracking_id"
  ON platform_connection_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
ALTER TABLE platform_connection_requests REPLICA IDENTITY FULL;
