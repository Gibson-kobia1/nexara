-- Create guest_passes table for native guest access monitoring.
-- Public users can read active unexpired passes only.

CREATE TABLE IF NOT EXISTS guest_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_code varchar(6) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guest_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active non-expired guest passes"
  ON guest_passes
  FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Allow admin inserts for guest passes"
  ON guest_passes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "Prevent unauthorized updates to guest passes"
  ON guest_passes
  FOR UPDATE
  USING (false);

CREATE POLICY "Prevent unauthorized deletes from guest passes"
  ON guest_passes
  FOR DELETE
  USING (false);

COMMENT ON TABLE guest_passes IS 'Native guest monitoring access keys with expiration and public read of active passes.';
