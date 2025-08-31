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
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebug('Starting login...');

    try {
      setDebug('Looking up teacher by manual user_id...');
      setDebug(`User ID entered: "${formData.user_id}"`);
      setDebug(`User ID length: ${formData.user_id.length}`);
      setDebug(`User ID char codes: ${formData.user_id.split('').map(c => c.charCodeAt(0)).join(', ')}`);
      
      // First get the teacher by manual user_id to get their email
      // Normalize case to handle case sensitivity issues
      const normalizedUserId = formData.user_id.trim();
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('email')
        .eq('manual_user_id', normalizedUserId)
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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage('');

    try {
      // First check if the email exists in our teachers table
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('email')
        .eq('email', resetEmail)
        .single();

      if (teacherError || !teacher) {
        setResetMessage('No teacher found with this email address.');
        setLoading(false);
        return;
      }

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (resetError) {
        setResetMessage('Failed to send reset email: ' + resetError.message);
      } else {
        setResetMessage('Password reset email sent! Check your inbox.');
        setResetEmail('');
      }
    } catch (err) {
      setResetMessage('An error occurred. Please try again.');
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

  if (showResetForm) {
    return (
      <div className="auth-container">
        <h2>Reset Password</h2>
        <form onSubmit={handlePasswordReset} className="auth-form">
          <div className="form-group">
            <label htmlFor="resetEmail">Email Address</label>
            <input
              type="email"
              id="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>

          {resetMessage && (
            <div className={resetMessage.includes('sent') ? 'success' : 'error'}>
              {resetMessage}
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
        
        <p className="auth-switch">
          <button onClick={() => setShowResetForm(false)} className="btn-link">
            Back to Login
          </button>
        </p>
      </div>
    );
  }

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
      
      <div className="auth-actions">
        <button onClick={() => setShowResetForm(true)} className="btn-link">
          Forgot Password?
        </button>
        <span className="auth-divider">|</span>
        <button onClick={onSwitchToRegister} className="btn-link">
          Register here
        </button>
      </div>
    </div>
  );
}

export default Login;
