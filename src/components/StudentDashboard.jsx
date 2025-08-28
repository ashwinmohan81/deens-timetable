import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import ViewTimetable from './ViewTimetable';

function StudentDashboard({ user, onViewChange }) {
  const [student, setStudent] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [registeredClasses, setRegisteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [showTimetable, setShowTimetable] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
    fetchAvailableClasses();
  }, [user]);

  const fetchStudentData = async () => {
    try {
      // Get or create student record
      let { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error && error.code === 'PGRST116') {
        // Student doesn't exist, create one
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({
            email: user.email,
            user_id: user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        studentData = newStudent;
      } else if (error) {
        throw error;
      }

      setStudent(studentData);
      
      // Fetch registered classes
      if (studentData) {
        fetchRegisteredClasses(studentData.id);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('class_section, teacher_name')
        .order('class_section');

      if (error) throw error;
      setAvailableClasses(data || []);
    } catch (err) {
      console.error('Error fetching available classes:', err);
    }
  };

  const fetchRegisteredClasses = async (studentId) => {
    try {
      console.log('Fetching registered classes for student:', studentId);
      
      const { data, error } = await supabase
        .from('student_registrations')
        .select(`
          *,
          teachers(class_section, teacher_name)
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Supabase error fetching registrations:', error);
        throw error;
      }
      
      console.log('Registered classes data:', data);
      setRegisteredClasses(data || []);
    } catch (err) {
      console.error('Error fetching registered classes:', err);
    }
  };

  const handleClassRegistration = async (classSection) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      console.log('Attempting to register for class:', classSection);
      console.log('Student ID:', student.id);
      
      // Check if already registered
      const isRegistered = registeredClasses.some(
        reg => reg.teachers?.class_section === classSection
      );

      if (isRegistered) {
        setError('You are already registered for this class!');
        return;
      }

      // Register for class
      const { data, error } = await supabase
        .from('student_registrations')
        .insert({
          student_id: student.id,
          class_section: classSection,
          registered_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Registration successful:', data);

      // Refresh registered classes
      await fetchRegisteredClasses(student.id);
      setMessage('Successfully registered for ' + classSection);
    } catch (err) {
      console.error('Error registering for class:', err);
      setError('Failed to register for class: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async (classSection) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('student_registrations')
        .delete()
        .eq('student_id', student.id)
        .eq('class_section', classSection);

      if (error) throw error;

      // Refresh registered classes
      await fetchRegisteredClasses(student.id);
      setMessage('Successfully unregistered from ' + classSection);
    } catch (err) {
      console.error('Error unregistering from class:', err);
      setError('Failed to unregister from class');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = (classSection) => {
    setSelectedClass(classSection);
    setShowTimetable(true);
  };

  const handleBackToDashboard = () => {
    setShowTimetable(false);
    setSelectedClass('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (showTimetable) {
    return (
      <div className="student-timetable-view">
        <div className="timetable-header">
          <button onClick={handleBackToDashboard} className="btn-secondary">
            ← Back to Dashboard
          </button>
          <h2>{selectedClass} Timetable</h2>
        </div>
        <ViewTimetable selectedClassOverride={selectedClass} />
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h2>Student Dashboard</h2>
        <p>Welcome, {user.email}</p>
        <button onClick={() => onViewChange('welcome')} className="btn-secondary">
          Logout
        </button>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="registered-classes">
          <h3>Your Registered Classes</h3>
          {registeredClasses.length === 0 ? (
            <p className="no-classes">You haven't registered for any classes yet.</p>
          ) : (
            <div className="classes-grid">
              {registeredClasses.map((registration) => (
                <div key={registration.id} className="class-card">
                  <h4>{registration.teachers.class_section}</h4>
                  <p>Teacher: {registration.teachers.teacher_name}</p>
                  <p>Registered: {new Date(registration.registered_at).toLocaleDateString()}</p>
                  <div className="class-actions">
                    <button
                      onClick={() => handleViewTimetable(registration.teachers.class_section)}
                      className="btn-primary"
                    >
                      View Timetable
                    </button>
                    <button
                      onClick={() => handleUnregister(registration.teachers.class_section)}
                      className="btn-danger"
                    >
                      Unregister
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="available-classes">
          <h3>Available Classes</h3>
          <div className="classes-grid">
            {availableClasses.map((classInfo) => (
              <div key={classInfo.class_section} className="class-card available">
                <h4>{classInfo.class_section}</h4>
                <p>Teacher: {classInfo.teacher_name}</p>
                <button
                  onClick={() => handleClassRegistration(classInfo.class_section)}
                  className="btn-primary"
                  disabled={loading}
                >
                  Register for Class
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
