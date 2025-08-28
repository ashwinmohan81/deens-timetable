import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function NotificationCenter({ studentId, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentId) {
      fetchNotifications();
    }
  }, [studentId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch timetable changes for the student's registered classes
      const { data: changes, error: changesError } = await supabase
        .from('timetable_changes')
        .select(`
          *,
          subjects!old_subject_id(subject_name),
          subjects!new_subject_id(subject_name)
        `)
        .in('class_section', 
          (await supabase
            .from('student_registrations')
            .select('class_section')
            .eq('student_id', studentId)
          ).data?.map(r => r.class_section) || []
        )
        .order('changed_at', { ascending: false })
        .limit(20);

      if (changesError) throw changesError;

      // Fetch email notifications
      const { data: emailNotifs, error: emailError } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('student_id', studentId)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (emailError) throw emailError;

      // Combine and format notifications
      const formattedNotifications = [
        ...changes.map(change => ({
          id: `change_${change.id}`,
          type: 'timetable_change',
          title: 'Timetable Change',
          message: formatChangeMessage(change),
          timestamp: change.changed_at,
          classSection: change.class_section,
          priority: 'high'
        })),
        ...emailNotifs.map(notif => ({
          id: `email_${notif.id}`,
          type: 'email_notification',
          title: 'Email Sent',
          message: notif.change_summary,
          timestamp: notif.sent_at,
          classSection: notif.class_section,
          priority: 'medium'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatChangeMessage = (change) => {
    const oldSubject = change.subjects?.subject_name || 'No subject';
    const newSubject = change.subjects?.subject_name || 'No subject';
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayName = dayNames[change.day_of_week - 1] || `Day ${change.day_of_week}`;
    
    if (change.old_subject_id && change.new_subject_id) {
      return `Subject changed from "${oldSubject}" to "${newSubject}" on ${dayName}, Period ${change.period_number}`;
    } else if (change.old_subject_id) {
      return `Subject "${oldSubject}" removed from ${dayName}, Period ${change.period_number}`;
    } else if (change.new_subject_id) {
      return `New subject "${newSubject}" added to ${dayName}, Period ${change.period_number}`;
    }
    
    return `Timetable change on ${dayName}, Period ${change.period_number}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="notification-center">
        <div className="notification-header">
          <h3>📢 Notifications</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="notification-content">
          <div className="loading">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>📢 Notifications</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="notification-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications yet.</p>
            <p className="sub-text">You'll see timetable changes and updates here.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div key={notification.id} className={`notification-item ${notification.type}`}>
                <div className="notification-icon">
                  {notification.type === 'timetable_change' ? '📅' : '📧'}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <span className="timestamp">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="class-section">{notification.classSection}</span>
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(notification.priority) }}
                    >
                      {notification.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="notification-actions">
          <button onClick={fetchNotifications} className="btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;
