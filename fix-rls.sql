-- Fix RLS policies to allow registration
-- Run this in your Supabase SQL editor

-- Temporarily disable RLS for registration
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy
DROP POLICY IF EXISTS "Teachers can insert own data" ON teachers;
CREATE POLICY "Allow teacher registration" ON teachers
  FOR INSERT WITH CHECK (true);

-- Re-enable RLS after testing
-- ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
