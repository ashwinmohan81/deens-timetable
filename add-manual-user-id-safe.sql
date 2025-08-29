-- Safely add manual_user_id field to teachers table
-- This script checks if the field exists before adding it

-- Add the new column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'manual_user_id'
    ) THEN
        ALTER TABLE teachers ADD COLUMN manual_user_id VARCHAR(50);
        RAISE NOTICE 'manual_user_id column added successfully';
    ELSE
        RAISE NOTICE 'manual_user_id column already exists';
    END IF;
END $$;

-- Update existing records to have a default manual_user_id based on email
UPDATE teachers 
SET manual_user_id = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '_'))
WHERE manual_user_id IS NULL OR manual_user_id = '';

-- Make the field NOT NULL after populating
ALTER TABLE teachers ALTER COLUMN manual_user_id SET NOT NULL;

-- Add UNIQUE constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'teachers_manual_user_id_key'
    ) THEN
        ALTER TABLE teachers ADD CONSTRAINT teachers_manual_user_id_key UNIQUE (manual_user_id);
        RAISE NOTICE 'UNIQUE constraint added to manual_user_id';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on manual_user_id';
    END IF;
END $$;

-- Verify the changes
SELECT id, email, manual_user_id FROM teachers ORDER BY email;
