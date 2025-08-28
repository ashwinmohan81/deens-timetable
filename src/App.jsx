import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Login from './components/Login';
import Register from './components/Register';
import TeacherDashboard from './components/TeacherDashboard';
import StudentLogin from './components/StudentLogin';
import StudentDashboard from './components/StudentDashboard';
import ViewTimetable from './components/ViewTimetable';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('welcome'); // welcome, login, register, dashboard, view, student-login, student-dashboard
  const [userType, setUserType] = useState(null); // 'teacher' or 'student'

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        detectUserType(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        detectUserType(session.user);
      } else {
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const detectUserType = async (user) => {
    try {
      // Check if user is a teacher
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', user.id)
        .single();

      if (teacher) {
        setUserType('teacher');
        setView('dashboard');
        return;
      }

      // Check if user is a student
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (student) {
        setUserType('student');
        setView('student-dashboard');
        return;
      }

      // New user, check metadata
      if (user.user_metadata?.user_type === 'student') {
        setUserType('student');
        setView('student-dashboard');
      } else {
        setUserType('teacher');
        setView('dashboard');
      }
    } catch (err) {
      console.error('Error detecting user type:', err);
      // Default to teacher for existing users
      setUserType('teacher');
      setView('dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('welcome');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <h1>Deens Academy Timetable</h1>
          <nav>
            <button onClick={() => setView('welcome')}>View Timetables</button>
            <button onClick={() => setView('login')}>Teacher Login</button>
          </nav>
        </header>
        
        <main>
          {view === 'view' && <ViewTimetable />}
          {view === 'login' && <Login onSwitchToRegister={() => setView('register')} />}
          {view === 'register' && <Register onSwitchToLogin={() => setView('login')} />}
          {view === 'student-login' && <StudentLogin onViewChange={setView} />}
          {view === 'welcome' && (
            <div className="welcome-section">
              <div className="welcome-content">
                <h2>Welcome to Deens Academy</h2>
                <p>View class timetables or login to manage your class schedule.</p>
                <div className="welcome-actions">
                  <button onClick={() => setView('view')} className="btn-primary btn-large">
                    View Timetables
                  </button>
                  <button onClick={() => setView('login')} className="btn-secondary btn-large">
                    Teacher Login
                  </button>
                  <button onClick={() => setView('student-login')} className="btn-secondary btn-large">
                    Student Login
                  </button>
                </div>
              </div>
              <div className="credit-text">
                <p>Project Conceived and Created by <strong>Rishi Ashwin</strong> of Grade 8B</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Deens Academy Timetable</h1>
        <nav>
          <button onClick={() => setView('dashboard')}>Dashboard</button>
          <button onClick={() => setView('view')}>View Timetable</button>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>
      
      <main>
        {view === 'dashboard' && userType === 'teacher' && <TeacherDashboard user={user} />}
        {view === 'student-dashboard' && userType === 'student' && <StudentDashboard user={user} onViewChange={setView} />}
        {view === 'view' && <ViewTimetable />}
      </main>
    </div>
  );
}

export default App;
