-- Clean up the confusing user_id columns in teachers table
-- We only need: id (UUID primary key) and manual_user_id (human-readable login)

-- First, verify current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- Remove the redundant user_id column (it's the same as id)
-- Check if column exists first to avoid errors
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE teachers DROP COLUMN user_id;
        RAISE NOTICE 'user_id column removed successfully';
    ELSE
        RAISE NOTICE 'user_id column does not exist - already cleaned up';
    END IF;
END $$;

-- Verify the cleaned structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- Show final data structure
SELECT id, email, manual_user_id FROM teachers ORDER BY email;

-- Update RLS policies if needed (remove any user_id references)
-- Note: RLS policies should use auth.uid() which matches the 'id' column
