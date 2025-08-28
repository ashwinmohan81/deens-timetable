import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function ViewTimetable() {
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

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
      fetchTeacherName();
      calculateCurrentWeek();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('class_section')
        .order('class_section');

      if (error) throw error;
      setClasses(data.map(item => item.class_section));
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq('class_section', selectedClass);

      if (error) throw error;

      // Convert to timetable object
      const timetableObj = {};
      data.forEach(item => {
        if (!timetableObj[item.day]) {
          timetableObj[item.day] = {};
        }
        timetableObj[item.day][item.period] = item.subjects.subject_name;
      });

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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayClass = (day) => {
    const today = new Date();
    const dayDate = currentWeek[day];
    if (dayDate && dayDate.toDateString() === today.toDateString()) {
      return 'today';
    }
    return '';
  };

  const getSubjectName = (day, period) => {
    return timetable[day]?.[period] || '-';
  };

  return (
    <div className="view-timetable">
      <h2>View Timetable</h2>
      
      <div className="class-selector">
        <label htmlFor="class-select">Select Class:</label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="class-select"
        >
          <option value="">Choose a class...</option>
          {classes.map(className => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="timetable-info">
          <h3>{selectedClass} Timetable</h3>
          <p><strong>Class Teacher:</strong> {teacherName}</p>
        </div>
      )}

      {selectedClass && !loading && (
        <div className="timetable-container">
          <table className="timetable-table view-table">
            <thead>
              <tr>
                <th>Period</th>
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
                  <td className="period-label">Period {period}</td>
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
