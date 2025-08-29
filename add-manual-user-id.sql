-- Add manual_user_id field to teachers table
-- This field will store the human-readable User ID that teachers use to login

-- Add the new column
ALTER TABLE teachers ADD COLUMN manual_user_id VARCHAR(50) UNIQUE;

-- Update existing records to have a default manual_user_id based on email
UPDATE teachers 
SET manual_user_id = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '_'))
WHERE manual_user_id IS NULL;

-- Make the field NOT NULL after populating
ALTER TABLE teachers ALTER COLUMN manual_user_id SET NOT NULL;

-- Add RLS policy for manual_user_id access
CREATE POLICY "Teachers can view their own manual_user_id" ON teachers
    FOR SELECT USING (auth.uid() = id);

-- Verify the changes
SELECT id, email, manual_user_id, user_id FROM teachers LIMIT 5;
