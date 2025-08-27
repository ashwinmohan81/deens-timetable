-- Database schema for Deens Timetable MVP

-- Teachers table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  teacher_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  class_section VARCHAR(20) UNIQUE NOT NULL, -- e.g., "Class 5A", "Class 6B"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_section VARCHAR(20) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_section, subject_name)
);

-- Timetable table
CREATE TABLE timetable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_section VARCHAR(20) NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5), -- 1=Mon, 2=Tue, etc.
  period_number INTEGER NOT NULL CHECK (period_number >= 1 AND period_number <= 8),
  subject_id UUID REFERENCES subjects(id),
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_section, day_of_week, period_number)
);

-- Indexes for performance
CREATE INDEX idx_teachers_class_section ON teachers(class_section);
CREATE INDEX idx_subjects_class_section ON subjects(class_section);
CREATE INDEX idx_timetable_class_section ON timetable(class_section);
CREATE INDEX idx_timetable_day_period ON timetable(day_of_week, period_number);

-- Row Level Security (RLS) policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- Teachers can only see their own data
CREATE POLICY "Teachers can view own data" ON teachers
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Teachers can insert own data" ON teachers
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Teachers can update own data" ON teachers
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Subjects are viewable by all, but only class teacher can modify
CREATE POLICY "Subjects viewable by all" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Only class teacher can modify subjects" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE teachers.class_section = subjects.class_section 
      AND teachers.id::text = auth.uid()::text
    )
  );

-- Timetable is viewable by all, but only class teacher can modify
CREATE POLICY "Timetable viewable by all" ON timetable
  FOR SELECT USING (true);

CREATE POLICY "Only class teacher can modify timetable" ON timetable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE teachers.class_section = timetable.class_section 
      AND teachers.id::text = auth.uid()::text
    )
  );
