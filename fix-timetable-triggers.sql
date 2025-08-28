-- Fix for timetable triggers - handles DELETE operations properly
-- Run this in your Supabase SQL editor

-- Drop existing triggers first
DROP TRIGGER IF EXISTS timetable_change_tracker ON timetable;
DROP TRIGGER IF EXISTS timetable_change_tracker_insert ON timetable;
DROP TRIGGER IF EXISTS timetable_change_tracker_delete ON timetable;

-- Drop the old function
DROP FUNCTION IF EXISTS track_timetable_changes();

-- Create fixed function that handles all operations correctly
CREATE OR REPLACE FUNCTION track_timetable_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different trigger operations
  IF TG_OP = 'DELETE' THEN
    -- For DELETE operations, use OLD record
    INSERT INTO timetable_changes (
      class_section,
      day_of_week,
      period_number,
      old_subject_id,
      new_subject_id,
      changed_by
    ) VALUES (
      OLD.class_section,
      OLD.day_of_week,
      OLD.period_number,
      OLD.subject_id,
      NULL, -- No new subject when deleting
      auth.uid()
    );

    -- Queue email notifications for deletions
    INSERT INTO email_notifications (
      student_id,
      class_section,
      change_summary,
      notification_link
    )
    SELECT 
      sr.student_id,
      OLD.class_section,
      'Subject removed',
      'https://your-domain.com/timetable/' || OLD.class_section
    FROM student_registrations sr
    WHERE sr.class_section = OLD.class_section;

    RETURN OLD;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- For INSERT operations, use NEW record
    INSERT INTO timetable_changes (
      class_section,
      day_of_week,
      period_number,
      old_subject_id,
      new_subject_id,
      changed_by
    ) VALUES (
      NEW.class_section,
      NEW.day_of_week,
      NEW.period_number,
      NULL, -- No old subject when inserting
      NEW.subject_id,
      auth.uid()
    );

    -- Queue email notifications for insertions
    INSERT INTO email_notifications (
      student_id,
      class_section,
      change_summary,
      notification_link
    )
    SELECT 
      sr.student_id,
      NEW.class_section,
      'New subject added',
      'https://your-domain.com/timetable/' || NEW.class_section
    FROM student_registrations sr
    WHERE sr.class_section = NEW.class_section;

    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- For UPDATE operations, compare OLD and NEW
    INSERT INTO timetable_changes (
      class_section,
      day_of_week,
      period_number,
      old_subject_id,
      new_subject_id,
      changed_by
    ) VALUES (
      NEW.class_section,
      NEW.day_of_week,
      NEW.period_number,
      OLD.subject_id,
      NEW.subject_id,
      auth.uid()
    );

    -- Queue email notifications for updates
    INSERT INTO email_notifications (
      student_id,
      class_section,
      change_summary,
      notification_link
    )
    SELECT 
      sr.student_id,
      NEW.class_section,
      'Subject changed',
      'https://your-domain.com/timetable/' || NEW.class_section
    FROM student_registrations sr
    WHERE sr.class_section = NEW.class_section;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for each operation type
CREATE TRIGGER timetable_change_tracker_delete
  AFTER DELETE ON timetable
  FOR EACH ROW
  EXECUTE FUNCTION track_timetable_changes();

CREATE TRIGGER timetable_change_tracker_insert
  AFTER INSERT ON timetable
  FOR EACH ROW
  EXECUTE FUNCTION track_timetable_changes();

CREATE TRIGGER timetable_change_tracker_update
  AFTER UPDATE ON timetable
  FOR EACH ROW
  WHEN (OLD.subject_id IS DISTINCT FROM NEW.subject_id)
  EXECUTE FUNCTION track_timetable_changes();
