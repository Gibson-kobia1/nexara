-- Create platform_connections table for authenticated users
CREATE TABLE IF NOT EXISTS platform_connections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  platform TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  third_party_password TEXT,
  code TEXT,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_created_at ON platform_connections(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own connections
CREATE POLICY "Users can view their own platform connections"
  ON platform_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own connections
CREATE POLICY "Users can delete their own platform connections"
  ON platform_connections
  FOR DELETE
  USING (auth.uid() = user_id);
