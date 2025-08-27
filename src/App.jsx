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
  const [view, setView] = useState('login'); // login, register, dashboard, view

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
    setView('login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="app">
        {view === 'login' ? (
          <Login onSwitchToRegister={() => setView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setView('login')} />
        )}
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
