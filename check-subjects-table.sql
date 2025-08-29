-- Check the subjects table structure specifically
-- This will show us exactly what columns exist

-- Show all columns in subjects table
SELECT 'SUBJECTS TABLE STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subjects' 
ORDER BY ordinal_position;

-- Show sample data from subjects table
SELECT 'SUBJECTS TABLE DATA' as check_type;
SELECT * FROM subjects LIMIT 10;

-- Check if there are any foreign key relationships
SELECT 'FOREIGN KEY RELATIONSHIPS' as check_type;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='subjects';

-- Check what the subjects table actually contains
SELECT 'SUBJECTS CONTENT ANALYSIS' as check_type;
SELECT 
    class_section,
    COUNT(*) as subject_count,
    STRING_AGG(subject_name, ', ') as subjects
FROM subjects 
GROUP BY class_section 
ORDER BY class_section;
