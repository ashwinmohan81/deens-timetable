import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import SubjectManager from './SubjectManager';
import TimetableManager from './TimetableManager';
import { processAllPendingEmails, checkEmailNotificationStatus } from '../utils/emailProcessor';

function TeacherDashboard({ user }) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subjects');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(''); // subjects, timetable

  useEffect(() => {
    fetchTeacherData();
  }, [user]);

  const fetchTeacherData = async () => {
    try {
      console.log('🔍 Fetching teacher data for user:', user.id, 'email:', user.email);
      
      // First, let's check what's in the teachers table
      const { data: allTeachers, error: listError } = await supabase
        .from('teachers')
        .select('*');
      
      if (listError) {
        console.error('❌ Error listing teachers:', listError);
      } else {
        console.log('📋 All teachers in database:', allTeachers);
      }
      
      // Now try to fetch the specific teacher
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching teacher by id:', error);
        console.log('🔍 User ID being searched:', user.id);
        
        // No fallback needed - id should work
        throw error;
      }
      
      console.log('✅ Teacher data found:', data);
      setTeacher(data);
    } catch (err) {
      console.error('❌ Error in fetchTeacherData:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm('Are you sure you want to unregister? This will delete your account and all associated data.')) {
      return;
    }

    try {
      // Delete timetable entries
      await supabase
        .from('timetable')
        .delete()
        .eq('class_section', teacher.class_section);

      // Delete subjects
      await supabase
        .from('subjects')
        .delete()
        .eq('class_section', teacher.class_section);

      // Delete teacher record
      await supabase
        .from('teachers')
        .delete()
        .eq('id', teacher.id);

      // Sign out
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error unregistering:', err);
      alert('Failed to unregister. Please try again.');
    }
  };

  const handleProcessEmails = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const result = await processAllPendingEmails();
      
      if (result.success) {
        setMessage(`Successfully processed ${result.processed} email notifications`);
      } else {
        setError('Failed to process emails: ' + result.error);
      }
    } catch (err) {
      console.error('Error processing emails:', err);
      setError('Failed to process emails: ' + result.error);
    } finally {
      setLoading(false);
    }
  };



  const handleCheckNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      // Check email notifications
      const stats = await checkEmailNotificationStatus();
      
      if (stats.error) {
        setError('Failed to check notifications: ' + stats.error);
      } else {
        // Also check if timetable changes are being logged
        const { data: changes, error: changesError } = await supabase
          .from('timetable_changes')
          .select('*')
          .eq('class_section', teacher?.class_section)
          .order('id', { ascending: false })
          .limit(5);
        
        if (changesError) {
          console.error('Error checking timetable changes:', changesError);
        } else {
          console.log('📅 Recent timetable changes:', changes);
        }
        
        const message = `Email Notifications: ${stats.total} total, ${stats.sent} sent, ${stats.pending} pending. Recent changes: ${changes?.length || 0}`;
        setMessage(message);
        console.log('📊 Full notification stats:', { stats, changes });
      }
    } catch (err) {
      console.error('Error checking notifications:', err);
      setError('Failed to check notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!teacher) {
    return <div className="error">Teacher data not found</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {teacher.teacher_name}</h2>
        <p>Class: {teacher.class_section}</p>
        <div className="header-actions">
          <button onClick={handleProcessEmails} className="btn-secondary" disabled={loading}>
            📧 Process Email Notifications
          </button>
          <button onClick={handleCheckNotifications} className="btn-info" disabled={loading}>
            📊 Check Notifications
          </button>
          <button onClick={handleUnregister} className="btn-danger">
            Unregister
          </button>
        </div>
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

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          Manage Subjects
        </button>
        <button
          className={`tab ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          Manage Timetable
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'subjects' && (
          <SubjectManager classSection={teacher.class_section} />
        )}
        {activeTab === 'timetable' && (
          <TimetableManager classSection={teacher.class_section} />
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
