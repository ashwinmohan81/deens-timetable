import React, { useState } from 'react';
import { supabase } from '../config/supabase';

function Login({ onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    user_id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebug('Starting login...');

    try {
      setDebug('Looking up teacher by user_id...');
      
      // First get the teacher by user_id to get their email
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('email')
        .eq('user_id', formData.user_id)
        .single();

      if (teacherError || !teacher) {
        setError('Invalid user ID or password');
        setDebug('Teacher lookup failed: ' + (teacherError?.message || 'No teacher found'));
        setLoading(false);
        return;
      }

      setDebug('Teacher found, email: ' + teacher.email);
      setDebug('Attempting Supabase auth...');

      // Sign in with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: teacher.email,
        password: formData.password
      });

      if (signInError) {
        setError('Invalid user ID or password');
        setDebug('Auth failed: ' + signInError.message);
      } else {
        setDebug('Login successful!');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setDebug('Exception: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <h2>Teacher Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="user_id">User ID</label>
          <input
            type="text"
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}
        {debug && <div className="debug" style={{background: '#e3f2fd', color: '#1976d2', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '1rem'}}>{debug}</div>}
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="auth-switch">
        Don't have an account?{' '}
        <button onClick={onSwitchToRegister} className="btn-link">
          Register here
        </button>
      </p>
    </div>
  );
}

export default Login;
