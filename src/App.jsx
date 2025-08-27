import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Login from './components/Login';
import Register from './components/Register';
import TeacherDashboard from './components/TeacherDashboard';
import ViewTimetable from './components/ViewTimetable';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('welcome'); // welcome, login, register, dashboard, view

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        {view === 'dashboard' && <TeacherDashboard user={user} />}
        {view === 'view' && <ViewTimetable />}
      </main>
    </div>
  );
}

export default App;
