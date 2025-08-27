import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TimetableManager({ classSection }) {
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchSubjects();
    fetchTimetable();
  }, [classSection]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_section', classSection)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchTimetable = async () => {
    try {
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq('class_section', classSection)
        .order('day_of_week, period_number');

      if (error) throw error;

      // Convert to timetable object
      const timetableObj = {};
      data.forEach(item => {
        if (!timetableObj[item.day_of_week]) {
          timetableObj[item.day_of_week] = {};
        }
        timetableObj[item.day_of_week][item.period_number] = {
          id: item.id,
          subject_id: item.subject_id,
          subject_name: item.subjects.subject_name
        };
      });

      setTimetable(timetableObj);
    } catch (err) {
      console.error('Error fetching timetable:', err);
    }
  };

  const handleSubjectChange = async (day, period, subjectId) => {
    if (!subjectId) return;

    setLoading(true);
    setError('');

    try {
      const subject = subjects.find(s => s.id === subjectId);
      
      // Check if this slot is already occupied
      const existingSlot = timetable[day]?.[period];
      
      if (existingSlot) {
        // Update existing slot
        const { error } = await supabase
          .from('timetable')
          .update({ subject_id: subjectId })
          .eq('id', existingSlot.id);

        if (error) throw error;
      } else {
        // Create new slot
        const { error } = await supabase
          .from('timetable')
          .insert({
            class_section: classSection,
            day_of_week: day,
            period_number: period,
            subject_id: subjectId
          });

        if (error) throw error;
      }

      fetchTimetable();
    } catch (err) {
      console.error('Error updating timetable:', err);
      setError('Failed to update timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSlot = async (day, period) => {
    const slot = timetable[day]?.[period];
    if (!slot) return;

    try {
      const { error } = await supabase
        .from('timetable')
        .delete()
        .eq('id', slot.id);

      if (error) throw error;
      fetchTimetable();
    } catch (err) {
      console.error('Error clearing slot:', err);
      setError('Failed to clear slot');
    }
  };

  const getSubjectName = (day, period) => {
    return timetable[day]?.[period]?.subject_name || '';
  };

  if (subjects.length === 0) {
    return (
      <div className="timetable-manager">
        <h3>Manage Timetable for {classSection}</h3>
        <p className="no-subjects">Please add subjects first before creating a timetable.</p>
      </div>
    );
  }

  return (
    <div className="timetable-manager">
      <h3>Manage Timetable for {classSection}</h3>
      
      {error && <div className="error">{error}</div>}

      <div className="timetable-container">
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Period</th>
              {days.map((day, index) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period}>
                <td className="period-label">Period {period}</td>
                {days.map((day, dayIndex) => {
                  const dayNumber = dayIndex + 1;
                  const currentSubject = timetable[dayNumber]?.[period];
                  
                  return (
                    <td key={`${day}-${period}`} className="timetable-cell">
                      {currentSubject ? (
                        <div className="subject-slot">
                          <span className="subject-name">{currentSubject.subject_name}</span>
                          <button
                            onClick={() => handleClearSlot(dayNumber, period)}
                            className="btn-clear btn-small"
                            title="Clear slot"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => handleSubjectChange(dayNumber, period, e.target.value)}
                          disabled={loading}
                          className="subject-select"
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="timetable-actions">
        <button 
          onClick={fetchTimetable} 
          disabled={loading}
          className="btn-secondary"
        >
          Refresh Timetable
        </button>
      </div>
    </div>
  );
}

export default TimetableManager;
