-- Student Management Tables
-- Run this in your Supabase SQL editor

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student class registrations
CREATE TABLE IF NOT EXISTS student_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_section TEXT NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_section)
);

-- Timetable change tracking
CREATE TABLE IF NOT EXISTS timetable_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  period_number INTEGER NOT NULL,
  old_subject_id UUID REFERENCES subjects(id),
  new_subject_id UUID REFERENCES subjects(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Notification queue for emails
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_section TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  notification_link TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_sent BOOLEAN DEFAULT FALSE
);

-- RLS Policies for students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own data" ON students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow student registration" ON students
  FOR INSERT WITH CHECK (true);

-- RLS Policies for student_registrations table
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own registrations" ON student_registrations
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage own registrations" ON student_registrations
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for timetable_changes table
ALTER TABLE timetable_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to timetable changes" ON timetable_changes
  FOR SELECT USING (true);

CREATE POLICY "Allow teachers to insert changes" ON timetable_changes
  FOR INSERT WITH CHECK (
    changed_by IN (
      SELECT id FROM teachers WHERE id = auth.uid()
    )
  );

-- RLS Policies for email_notifications table
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own notifications" ON email_notifications
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow system to insert notifications" ON email_notifications
  FOR INSERT WITH CHECK (true);

-- Function to track timetable changes
CREATE OR REPLACE FUNCTION track_timetable_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert change record
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

  -- Queue email notifications for registered students
  INSERT INTO email_notifications (
    student_id,
    class_section,
    change_summary,
    notification_link
  )
  SELECT 
    sr.student_id,
    NEW.class_section,
    CASE 
      WHEN OLD.subject_id IS NULL THEN 'New subject added'
      WHEN NEW.subject_id IS NULL THEN 'Subject removed'
      ELSE 'Subject changed'
    END,
    'https://your-domain.com/timetable/' || NEW.class_section
  FROM student_registrations sr
  WHERE sr.class_section = NEW.class_section;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically track changes
CREATE TRIGGER timetable_change_tracker
  AFTER UPDATE ON timetable
  FOR EACH ROW
  WHEN (OLD.subject_id IS DISTINCT FROM NEW.subject_id)
  EXECUTE FUNCTION track_timetable_changes();

-- Trigger for new entries
CREATE TRIGGER timetable_change_tracker_insert
  AFTER INSERT ON timetable
  FOR EACH ROW
  EXECUTE FUNCTION track_timetable_changes();

-- Trigger for deletions
CREATE TRIGGER timetable_change_tracker_delete
  AFTER DELETE ON timetable
  FOR EACH ROW
  EXECUTE FUNCTION track_timetable_changes();
