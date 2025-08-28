import React, { useState } from 'react';
import { supabase } from '../config/supabase';

function StudentLogin({ onViewChange }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (isLogin) {
        // Student Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setMessage('Login successful!');
      } else {
        // Student Registration
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: 'student'
            }
          }
        });
        if (error) throw error;
        setMessage('Registration successful! Please check your email to verify your account.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Student Login' : 'Student Registration'}</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="btn-link"
          >
            {isLogin ? "Don't have an account? Register here" : "Already have an account? Login here"}
          </button>
        </div>

        <div className="auth-actions">
          <button
            onClick={() => onViewChange('welcome')}
            className="btn-secondary"
          >
            Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
