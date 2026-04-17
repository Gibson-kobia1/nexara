-- Create a dedicated table for anonymous/public platform connection submissions.
-- This keeps public requests separate from authenticated platform_connections.

CREATE TABLE IF NOT EXISTS platform_connection_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  platform TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  third_party_password TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
