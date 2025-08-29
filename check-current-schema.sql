-- Check current structure of teachers table
-- This will show us what columns actually exist

-- Show all columns in teachers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- Show sample data to understand current structure
SELECT * FROM teachers LIMIT 3;

-- Check if manual_user_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
AND column_name = 'manual_user_id';
