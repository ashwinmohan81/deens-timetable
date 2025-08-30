import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { processAllPendingEmails } from '../utils/emailProcessor';

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
          console.log('Item fields:', {
            day: item.day,
            day_of_week: item.day_of_week,
            day_name: item.day_name,
            period: item.period,
            period_number: item.period_number,
            period_name: item.period_name,
            subject_name: item.subjects?.subject_name
          });
          
          // Try different possible field names for day and period
          let dayKey = item.day || item.day_of_week || item.day_name;
          const periodKey = item.period || item.period_number || item.period_name;
          
          // Convert numeric day to day name if needed
          if (typeof dayKey === 'number' && dayKey >= 1 && dayKey <= 5) {
            console.log(`Converting day ${dayKey} to ${days[dayKey - 1]}`);
            dayKey = days[dayKey - 1]; // Convert 1->Monday, 2->Tuesday, etc.
          }
          
          console.log('Using keys:', { dayKey, periodKey, originalDay: item.day_of_week });
          
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
      console.log('Timetable object keys:', Object.keys(timetableObj));
      console.log('Timetable object structure:', JSON.stringify(timetableObj, null, 2));
      setTimetable(timetableObj);
    } catch (err) {
      console.error('Error fetching timetable:', err);
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

  const getSubjectId = (day, period) => {
    // The day parameter is already the day name (Monday, Tuesday, etc.)
    // Try to get subject ID from the timetable object
    const subjectData = timetable[day]?.[period];
    
    return subjectData?.subject_id || '';
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
    setError('');
    
    try {
      console.log('🔄 Starting timetable save for class:', classSection);
      
      // Convert timetable object to array of entries for saving
      const entriesToSave = [];
      
      Object.keys(timetable).forEach(day => {
        Object.keys(timetable[day]).forEach(period => {
          const entry = timetable[day][period];
          if (entry && entry.subject_id) {
            // Convert day name back to numeric value for database
            const dayNumber = days.indexOf(day) + 1; // Monday=1, Tuesday=2, etc.
            
            entriesToSave.push({
              class_section: classSection,
              day_of_week: dayNumber,
              period_number: period,
              subject_id: entry.subject_id
            });
          }
        });
      });

      console.log('📝 Entries to save:', entriesToSave);
      console.log('📊 Total entries:', entriesToSave.length);

      if (entriesToSave.length > 0) {
        // First clear existing entries for this class
        console.log('🗑️ Deleting existing entries for class:', classSection);
        const { error: deleteError } = await supabase
          .from('timetable')
          .delete()
          .eq('class_section', classSection);

        if (deleteError) {
          console.error('❌ Delete error:', deleteError);
          throw new Error(`Failed to delete existing entries: ${deleteError.message}`);
        }
        
        console.log('✅ Existing entries deleted successfully');

        // Then insert new entries
        console.log('➕ Inserting new entries...');
        const { data: insertData, error: insertError } = await supabase
          .from('timetable')
          .insert(entriesToSave)
          .select();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          throw new Error(`Failed to insert new entries: ${insertError.message}`);
        }
        
        console.log('✅ New entries inserted successfully:', insertData);
      } else {
        console.log('⚠️ No entries to save');
      }

      // Process email notifications after successful save
      try {
        console.log('📧 Processing email notifications...');
        const emailResult = await processAllPendingEmails();
        if (emailResult.success) {
          console.log(`✅ Email notifications processed: ${emailResult.processed} sent`);
        } else {
          console.log('⚠️ Email notifications failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error processing email notifications:', emailError);
      }

      setMessage('Timetable saved successfully!');
      console.log('🎉 Timetable save completed successfully');
    } catch (err) {
      console.error('❌ Error saving timetable:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(`Failed to save timetable: ${errorMessage}`);
      setMessage('');
    } finally {
      setSaving(false);
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
            day_of_week: days.indexOf(day) + 1, // Convert day name to number
            period_number: period,
            subject_id: subjectId
          });

        if (error) throw error;
      }

      // Process email notifications after cell change
      try {
        console.log('📧 Processing email notifications for cell change...');
        const emailResult = await processAllPendingEmails();
        if (emailResult.success) {
          console.log(`✅ Email notifications processed: ${emailResult.processed} sent`);
        } else {
          console.log('⚠️ Email notifications failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error processing email notifications:', emailError);
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
                        value={getSubjectId(day, period) || ''}
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
        </div>
      )}
    </div>
  );
}

export default TimetableManager;
