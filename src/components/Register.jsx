import React, { useState } from 'react';
import { supabase } from '../config/supabase';

function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    user_id: '',
    teacher_name: '',
    email: '',
    class_grade: '',
    class_section_letter: '',
    class_section: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false); // Disabled for testing
    setError('');
    setDebug('Starting registration...');

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setDebug('Checking for existing class/section...');
      
      // Check if class/section is already taken
      const { data: existingTeacher, error: checkError } = await supabase
        .from('teachers')
        .select('id')
        .eq('class_section', formData.class_section)
        .single();

      if (existingTeacher) {
        setError('This class and section is already registered');
        setDebug('Class/section already taken');
        return;
      }

      setDebug('Checking for existing user_id...');

      // Check if manual_user_id is already taken
      const { data: existingUserId, error: userIdCheckError } = await supabase
        .from('teachers')
        .select('id')
        .eq('manual_user_id', formData.user_id)
        .single();

      if (existingUserId) {
        setError('User ID is already taken');
        setDebug('User ID already taken');
        return;
      }

      setDebug('Checking for existing email...');

      // Check if email is already taken
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingEmail) {
        setError('Email is already registered');
        setDebug('Email already taken');
        return;
      }

      setDebug('Creating Supabase auth user...');

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        setError('Auth error: ' + authError.message);
        setDebug('Auth failed: ' + authError.message);
        return;
      }

      if (!authData.user) {
        setError('Failed to create auth user');
        setDebug('No auth user returned');
        return;
      }

      setDebug('Auth user created with ID: ' + authData.user.id);
      setDebug('Now creating teacher record...');

      // Create teacher record with the auth user ID
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          id: authData.user.id, // Use the auth user ID as primary key
          user_id: authData.user.id, // Link to auth user ID (not the manual User ID)
          manual_user_id: formData.user_id, // Store the manual User ID for login
          teacher_name: formData.teacher_name,
          email: formData.email,
          class_section: formData.class_section,
          password_hash: 'placeholder' // This field is not used for auth
        });

      if (teacherError) {
        setError('Failed to create teacher account: ' + teacherError.message);
        setDebug('Teacher record creation failed: ' + teacherError.message);
        
        // Clean up the auth user if teacher creation fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          setDebug('Cleaned up auth user due to failure');
        } catch (cleanupError) {
          setDebug('Failed to cleanup auth user: ' + cleanupError.message);
        }
        return;
      }

      setDebug('Registration successful! Teacher ID: ' + authData.user.id);
      
      // Sign out the user since we want them to login properly
      await supabase.auth.signOut();
      
      // Success - switch to login
      onSwitchToLogin();
    } catch (err) {
      setError('An error occurred: ' + err.message);
      setDebug('Exception: ' + err.message);
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
      <h2>Teacher Registration</h2>
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
          <label htmlFor="teacher_name">Teacher Name</label>
          <input
            type="text"
            id="teacher_name"
            name="teacher_name"
            value={formData.teacher_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="class_section">Class + Section</label>
          <div className="class-section-selector">
            <select
              id="class_grade"
              name="class_grade"
              value={formData.class_grade || ''}
              onChange={(e) => setFormData({
                ...formData,
                class_grade: e.target.value,
                class_section: e.target.value + (formData.class_section_letter || '')
              })}
              required
              className="grade-select"
            >
              <option value="">Select Grade</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(grade => (
                <option key={grade} value={`Grade ${grade}`}>
                  Grade {grade}
                </option>
              ))}
            </select>
            
            <select
              id="class_section_letter"
              name="class_section_letter"
              value={formData.class_section_letter || ''}
              onChange={(e) => setFormData({
                ...formData,
                class_section_letter: e.target.value,
                class_section: (formData.class_grade || '') + e.target.value
              })}
              required
              className="section-select"
              disabled={!formData.class_grade}
            >
              <option value="">Select Section</option>
              {Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                <option key={letter} value={letter}>
                  Section {letter}
                </option>
              ))}
            </select>
          </div>
          {formData.class_grade && formData.class_section_letter && (
            <div className="selected-class">
              Selected: <strong>{formData.class_grade} {formData.class_section_letter}</strong>
            </div>
          )}
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

        <div className="form-group">
          <label htmlFor="confirm_password">Confirm Password</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}
        {debug && <div className="debug" style={{background: '#e3f2fd', color: '#1976d2', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '1rem'}}>{debug}</div>}
        
        <button type="submit" className="btn-primary">
          Register
        </button>
      </form>
      
      <p className="auth-switch">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="btn-link">
          Login here
        </button>
      </p>
    </div>
  );
}

export default Register;
