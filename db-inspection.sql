-- Check RLS status and policies on both connection tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('platform_connections', 'platform_connection_requests', 'profiles')
ORDER BY tablename;

-- List all policies on platform_connections
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'platform_connections'
ORDER BY policyname;

-- List all policies on platform_connection_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'platform_connection_requests'
ORDER BY policyname;

-- Check if data exists in both tables
SELECT 'platform_connections' as table_name, COUNT(*) as row_count FROM platform_connections
UNION ALL
SELECT 'platform_connection_requests', COUNT(*) FROM platform_connection_requests;
