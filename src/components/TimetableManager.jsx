import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TimetableManager({ classSection }) {
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const [currentWeek, setCurrentWeek] = useState({});

  useEffect(() => {
    fetchSubjects();
    fetchTimetable();
    calculateCurrentWeek();
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
      console.log('Fetching timetable for class:', classSection);
      
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq('class_section', classSection);

      if (error) throw error;

      console.log('Raw timetable data:', data);

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
            timetableObj[dayKey][periodKey] = {
              id: item.id,
              subject_id: item.subject_id,
              subject_name: item.subjects?.subject_name || 'Unknown Subject'
            };
          }
        });
      }

      console.log('Processed timetable object:', timetableObj);
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
    // The day parameter is already the day name (Monday, Tuesday, etc.)
    // Try to get subject from the timetable object
    const subjectData = timetable[day]?.[period];
    
    console.log(`Looking for subject: day=${day}, period=${period}, found=${subjectData?.subject_name || 'none'}`);
    
    return subjectData?.subject_name || '';
  };

  const calculateCurrentWeek = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const week = {};
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      week[days[i]] = date;
    }
    setCurrentWeek(week);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const getDayClass = (day) => {
    const date = currentWeek[day];
    if (!date) return '';

    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    }
    return '';
  };

  const saveTimetable = async () => {
    setSaving(true);
    setMessage('');
    try {
      // Convert timetable object to array of entries for saving
      const entriesToSave = [];
      
      Object.keys(timetable).forEach(day => {
        Object.keys(timetable[day]).forEach(period => {
          const entry = timetable[day][period];
          if (entry && entry.subject_id) {
            entriesToSave.push({
              class_section: classSection,
              day: day,
              period: period,
              subject_id: entry.subject_id
            });
          }
        });
      });

      console.log('Saving timetable entries:', entriesToSave);

      if (entriesToSave.length > 0) {
        // First clear existing entries for this class
        await supabase
          .from('timetable')
          .delete()
          .eq('class_section', classSection);

        // Then insert new entries
        const { error } = await supabase
          .from('timetable')
          .insert(entriesToSave);

        if (error) throw error;
      }

      setMessage('Timetable saved successfully!');
    } catch (err) {
      console.error('Error saving timetable:', err);
      setMessage('Failed to save timetable.');
    } finally {
      setSaving(false);
    }
  };

  const loadTimetable = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq('class_section', classSection);

      if (error) throw error;

      console.log('Loading timetable data:', data);

      const loadedTimetable = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          // Try different possible field names for day and period
          const dayKey = item.day || item.day_of_week || item.day_name;
          const periodKey = item.period || item.period_number || item.period_name;
          
          if (dayKey && periodKey) {
            if (!loadedTimetable[dayKey]) {
              loadedTimetable[dayKey] = {};
            }
            loadedTimetable[dayKey][periodKey] = {
              id: item.id,
              subject_id: item.subject_id,
              subject_name: item.subjects?.subject_name || 'Unknown Subject'
            };
          }
        });
      }

      console.log('Loaded timetable object:', loadedTimetable);
      setTimetable(loadedTimetable);
      setMessage('Timetable loaded successfully!');
    } catch (err) {
      console.error('Error loading timetable:', err);
      setMessage('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = async (day, period, subjectId) => {
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
            day: day,
            period: period,
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

  return (
    <div className="timetable-manager">
      <h2>Manage Timetable for {classSection}</h2>
      
      <div className="current-week-info">
        <h3>Current Week: {currentWeek.Monday && formatDate(currentWeek.Monday)} - {currentWeek.Friday && formatDate(currentWeek.Friday)}</h3>
        <p className="week-note">Dates automatically update weekly</p>
      </div>

      {subjects.length === 0 ? (
        <div className="no-subjects">
          <p>No subjects added yet. Please add subjects first.</p>
          <button onClick={() => window.location.href = '#subjects'} className="btn-primary">
            Add Subjects
          </button>
        </div>
      ) : (
        <div className="timetable-container">
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Period</th>
                {days.map(day => (
                  <th key={day} className={getDayClass(day)}>
                    <div className="day-header">
                      <div className="day-name">{day}</div>
                      <div className="day-date">{currentWeek[day] && formatDate(currentWeek[day])}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td className="period-cell">{period}</td>
                  {days.map(day => (
                    <td key={day} className={`timetable-cell ${getDayClass(day)}`}>
                      <select
                        value={getSubjectName(day, period) || ''}
                        onChange={(e) => handleCellChange(day, period, e.target.value)}
                        className="subject-select"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.subject_name}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="timetable-actions">
            <button onClick={saveTimetable} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Timetable'}
            </button>
            <button onClick={loadTimetable} disabled={loading} className="btn-secondary">
              {loading ? 'Loading...' : 'Load Saved Timetable'}
            </button>
          </div>
          
          {message && (
            <div className={message.includes('success') ? 'success' : 'error'}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TimetableManager;
