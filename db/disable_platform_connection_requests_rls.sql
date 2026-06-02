-- Disable strict RLS for this table
DROP POLICY IF EXISTS "Prevent unauthorized updates" ON platform_connection_requests;
DROP POLICY IF EXISTS "Allow updates via tracking_id" ON platform_connection_requests;

CREATE POLICY "Allow all updates for now" 
  ON platform_connection_requests 
    FOR UPDATE 
      USING (true) 
        WITH CHECK (true);

ALTER TABLE platform_connection_requests REPLICA IDENTITY FULL;
