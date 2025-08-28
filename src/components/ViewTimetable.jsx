import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function ViewTimetable({ selectedClassOverride }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState({});
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchClasses();
  }, []);

  // Auto-select class if provided via prop
  useEffect(() => {
    if (selectedClassOverride && selectedClassOverride !== selectedClass) {
      setSelectedClass(selectedClassOverride);
    }
  }, [selectedClassOverride, selectedClass]);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
      fetchTeacherName();
      calculateCurrentWeek();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes from database...');
      const { data, error } = await supabase
        .from('teachers')
        .select('class_section')
        .order('class_section');

      if (error) throw error;
      
      const classList = data.map(item => item.class_section);
      console.log('Available classes:', classList);
      setClasses(classList);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      console.log('Fetching timetable for class:', selectedClass);
      
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq('class_section', selectedClass);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw timetable data from database:', data);

      // Convert to timetable object - handle different possible data structures
      const timetableObj = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          console.log('Processing item:', item);
          
          // Try different possible field names for day and period
          const dayKey = item.day || item.day_of_week || item.day_name;
          const periodKey = item.period || item.period_number || item.period_name;
          
          if (dayKey && periodKey) {
            if (!timetableObj[dayKey]) {
              timetableObj[dayKey] = {};
            }
            // Use subject name from the joined subjects table
            timetableObj[dayKey][periodKey] = item.subjects?.subject_name || 'Unknown Subject';
          }
        });
      }

      console.log('Processed timetable object:', timetableObj);
      setTimetable(timetableObj);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherName = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('teacher_name')
        .eq('class_section', selectedClass)
        .single();

      if (error) throw error;
      setTeacherName(data.teacher_name);
    } catch (error) {
      console.error('Error fetching teacher name:', error);
      setTeacherName('Unknown');
    }
  };

  const calculateCurrentWeek = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate Monday of current week
    const monday = new Date(today);
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - daysToMonday);
    
    const weekDates = {};
    days.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      weekDates[day] = date;
    });
    
    setCurrentWeek(weekDates);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayClass = (day) => {
    if (!currentWeek[day]) return '';
    const today = new Date();
    const dayDate = currentWeek[day];
    if (dayDate && dayDate.toDateString() === today.toDateString()) {
      return 'today';
    }
    return '';
  };

  const getSubjectName = (day, period) => {
    // Convert day number to day name (1 = Monday, 2 = Tuesday, etc.)
    const dayName = days[day - 1];
    
    // Try to get subject from the timetable object
    const subject = timetable[dayName]?.[period] || timetable[day]?.[period];
    
    console.log(`Looking for subject: day=${dayName}, period=${period}, found=${subject}`);
    
    return subject || '-';
  };

  return (
    <div className="view-timetable">
      <h2>View Timetable</h2>
      
      <div className="class-selector">
        <label htmlFor="class-select">
          {selectedClassOverride ? 'Class:' : 'Select Class:'}
        </label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="class-select"
          disabled={selectedClassOverride ? true : false}
        >
          <option value="">Choose a class...</option>
          {classes.map(className => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        {selectedClassOverride && (
          <p className="auto-selected-note">
            ✓ Class automatically selected from your registration
          </p>
        )}
      </div>

      {selectedClass && (
        <div className="timetable-info">
          <h3>{selectedClass} Timetable</h3>
          <p><strong>Class Teacher:</strong> {teacherName}</p>
          
          <div className="current-week-info">
            <h4>Current Week: {currentWeek.Monday ? formatDate(currentWeek.Monday) : 'N/A'} - {currentWeek.Friday ? formatDate(currentWeek.Friday) : 'N/A'}</h4>
            <p className="week-note">Dates automatically update weekly</p>
          </div>
        </div>
      )}

      {selectedClass && !loading && (
        <div className="timetable-container">
          <table className="timetable-table view-table">
            <thead>
              <tr>
                <th className="period-header">Period</th>
                {days.map(day => (
                  <th key={day} className={getDayClass(day)}>
                    {day} ({formatDate(currentWeek[day])})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td className="period-cell">{period}</td>
                  {days.map((day, dayIndex) => {
                    const dayNumber = dayIndex + 1;
                    return (
                      <td key={`${day}-${period}`} className="timetable-cell view-cell">
                        {getSubjectName(dayNumber, period)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="loading">Loading timetable...</div>
      )}

      {selectedClass && !loading && Object.keys(timetable).length === 0 && (
        <div className="no-timetable">
          <p>No timetable has been created for {selectedClass} yet.</p>
        </div>
      )}
    </div>
  );
}

export default ViewTimetable;
