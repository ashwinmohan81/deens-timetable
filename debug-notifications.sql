-- Debug script to check notification system status
-- Run this in your Supabase SQL editor

-- Check timetable changes
SELECT 
  'timetable_changes' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN class_section = '8B' THEN 1 END) as class_8b_records
FROM timetable_changes;

-- Check email notifications
SELECT 
  'email_notifications' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN class_section = '8B' THEN 1 END) as class_8b_records
FROM email_notifications;

-- Check student registrations for 8B
SELECT 
  'student_registrations' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN class_section = '8B' THEN 1 END) as class_8b_records
FROM student_registrations;

-- Show recent timetable changes for 8B
SELECT 
  id,
  class_section,
  day_of_week,
  period_number,
  old_subject_id,
  new_subject_id,
  changed_at,
  changed_by
FROM timetable_changes 
WHERE class_section = '8B'
ORDER BY changed_at DESC
LIMIT 5;

-- Show student registrations for 8B
SELECT 
  sr.id,
  sr.class_section,
  sr.registered_at,
  s.email,
  s.user_id
FROM student_registrations sr
JOIN students s ON sr.student_id = s.id
WHERE sr.class_section = '8B';

-- Check if the trigger function exists and is working
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'track_timetable_changes';

-- Check triggers on timetable table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'timetable';
