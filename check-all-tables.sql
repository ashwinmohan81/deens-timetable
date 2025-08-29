-- Comprehensive check of all tables in the Deens Timetable database
-- This will verify the structure and data integrity of all tables

-- ========================================
-- 1. CHECK TEACHERS TABLE
-- ========================================
SELECT 'TEACHERS TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

SELECT 'TEACHERS TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT id, email, manual_user_id, teacher_name, class_section, created_at
FROM teachers 
ORDER BY email 
LIMIT 5;

-- ========================================
-- 2. CHECK STUDENTS TABLE
-- ========================================
SELECT 'STUDENTS TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

SELECT 'STUDENTS TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT id, email, created_at
FROM students 
ORDER BY email 
LIMIT 5;

-- ========================================
-- 3. CHECK SUBJECTS TABLE
-- ========================================
SELECT 'SUBJECTS TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subjects' 
ORDER BY ordinal_position;

SELECT 'SUBJECTS TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT * FROM subjects 
ORDER BY class_section, subject_name 
LIMIT 10;

-- ========================================
-- 4. CHECK TIMETABLE TABLE
-- ========================================
SELECT 'TIMETABLE TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'timetable' 
ORDER BY ordinal_position;

SELECT 'TIMETABLE TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT * FROM timetable 
ORDER BY class_section, day_of_week, period_number 
LIMIT 10;

-- ========================================
-- 5. CHECK STUDENT_REGISTRATIONS TABLE
-- ========================================
SELECT 'STUDENT_REGISTRATIONS TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'student_registrations' 
ORDER BY ordinal_position;

SELECT 'STUDENT_REGISTRATIONS TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT * FROM student_registrations 
ORDER BY class_section 
LIMIT 10;

-- ========================================
-- 6. CHECK TIMETABLE_CHANGES TABLE
-- ========================================
SELECT 'TIMETABLE_CHANGES TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'timetable_changes' 
ORDER BY ordinal_position;

SELECT 'TIMETABLE_CHANGES TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT * FROM timetable_changes 
ORDER BY changed_at DESC 
LIMIT 10;

-- ========================================
-- 7. CHECK EMAIL_NOTIFICATIONS TABLE
-- ========================================
SELECT 'EMAIL_NOTIFICATIONS TABLE' as table_name, 'STRUCTURE' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_notifications' 
ORDER BY ordinal_position;

SELECT 'EMAIL_NOTIFICATIONS TABLE' as table_name, 'DATA SAMPLE' as check_type;
SELECT * FROM email_notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- 8. CHECK RLS POLICIES
-- ========================================
SELECT 'RLS POLICIES' as table_name, 'POLICIES' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 9. CHECK TRIGGERS
-- ========================================
SELECT 'TRIGGERS' as table_name, 'TRIGGERS' as check_type;
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
ORDER BY t.event_object_table, t.trigger_name;

-- ========================================
-- 10. SUMMARY STATISTICS
-- ========================================
SELECT 'SUMMARY STATISTICS' as table_name, 'COUNTS' as check_type;
SELECT 
    'teachers' as table_name, COUNT(*) as record_count FROM teachers
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'timetable', COUNT(*) FROM timetable
UNION ALL
SELECT 'student_registrations', COUNT(*) FROM student_registrations
UNION ALL
SELECT 'timetable_changes', COUNT(*) FROM timetable_changes
UNION ALL
SELECT 'email_notifications', COUNT(*) FROM email_notifications;
