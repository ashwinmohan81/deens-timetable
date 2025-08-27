import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function SubjectManager({ classSection }) {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
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
      setError('Failed to fetch subjects');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          class_section: classSection,
          subject_name: newSubject.trim()
        });

      if (error) throw error;

      setNewSubject('');
      fetchSubjects();
    } catch (err) {
      console.error('Error adding subject:', err);
      setError('Failed to add subject. It might already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to delete this subject? This will also remove it from the timetable.')) {
      return;
    }

    try {
      // First remove from timetable
      await supabase
        .from('timetable')
        .delete()
        .eq('subject_id', subjectId);

      // Then delete the subject
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      fetchSubjects();
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError('Failed to delete subject');
    }
  };

  return (
    <div className="subject-manager">
      <h3>Manage Subjects for {classSection}</h3>
      
      <form onSubmit={handleAddSubject} className="add-subject-form">
        <div className="form-row">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Enter subject name"
            className="subject-input"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Subject'}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="subjects-list">
        <h4>Current Subjects ({subjects.length})</h4>
        {subjects.length === 0 ? (
          <p className="no-subjects">No subjects added yet. Add subjects to create your timetable.</p>
        ) : (
          <div className="subjects-grid">
            {subjects.map((subject) => (
              <div key={subject.id} className="subject-item">
                <span className="subject-name">{subject.subject_name}</span>
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectManager;
