-- Temporary fix: Disable problematic triggers
-- Run this in your Supabase SQL editor to fix the immediate issue

-- Drop the problematic triggers
DROP TRIGGER IF EXISTS timetable_change_tracker ON timetable;
DROP TRIGGER IF EXISTS timetable_change_tracker_insert ON timetable;
DROP TRIGGER IF EXISTS timetable_change_tracker_delete ON timetable;

-- Drop the problematic function
DROP FUNCTION IF EXISTS track_timetable_changes();

-- Now you should be able to save timetables without the constraint error
-- The change tracking will be disabled temporarily

-- To re-enable later, run the fix-timetable-triggers.sql file
