# Deens Academy Timetable Application

A modern timetable management application built with React and Supabase, designed for class teachers to create and manage timetables that are viewable by all users.

## Features

### MVP Requirements ✅
- **Teacher Registration & Authentication**
  - Teacher registration with unique User ID, email, and class/section
  - Prevents duplicate class/section registrations
  - Secure login system

- **Timetable Management**
  - Fixed 8 periods per day (Monday to Friday)
  - Teachers can create/edit/delete subjects for their class
  - Drag-and-drop style timetable creation
  - Real-time updates

- **Public Viewing**
  - Anyone can view timetables by selecting class/section
  - Shows class teacher information
  - Clean, responsive design

- **Account Management**
  - Teachers can unregister (removes all associated data)
  - Secure password management

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: CSS3 with modern design principles
- **State Management**: React Hooks
- **Authentication**: Supabase Auth

## Setup Instructions

### 1. Database Setup

First, run the database schema in your Supabase project:

```sql
-- Copy and paste the contents of database-schema.sql into your Supabase SQL editor
-- This will create all necessary tables and security policies
```

### 2. Environment Configuration

Your Supabase configuration is already set up in `src/config/supabase.js` with:
- Project URL: `https://dgdisihqmdbhxzpquilu.supabase.co`
- Anonymous key configured

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage Flow

### For Teachers:
1. **Register** with unique User ID, email, and class/section
2. **Login** with User ID and password
3. **Add Subjects** for your class (e.g., Math, Science, English)
4. **Create Timetable** by selecting subjects for each time slot
5. **Manage** your timetable - edit, delete, or clear slots
6. **Unregister** if needed (removes all data)

### For Viewers:
1. Navigate to "View Timetable"
2. Select a class/section from the dropdown
3. View the complete timetable and teacher information

## Database Schema

- **teachers**: Teacher accounts with unique class/section assignments
- **subjects**: Subjects available for each class
- **timetable**: Time slot assignments linking subjects to periods

## Security Features

- Row Level Security (RLS) enabled on all tables
- Teachers can only modify their own class data
- Timetables are publicly viewable but only editable by class teachers
- Secure authentication via Supabase Auth

## File Structure

```
src/
├── components/
│   ├── Login.jsx           # Teacher login component
│   ├── Register.jsx        # Teacher registration component
│   ├── TeacherDashboard.jsx # Main teacher interface
│   ├── SubjectManager.jsx  # Subject CRUD operations
│   ├── TimetableManager.jsx # Timetable creation/editing
│   └── ViewTimetable.jsx   # Public timetable viewing
├── config/
│   └── supabase.js         # Supabase client configuration
├── App.jsx                 # Main application component
├── App.css                 # Comprehensive styling
└── main.jsx               # Application entry point
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Customization

- **Colors**: Modify CSS variables in `App.css`
- **Layout**: Adjust grid and flexbox properties
- **Subjects**: Teachers can add any subjects they need
- **Time Slots**: Currently 8 periods, can be modified in components

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive Web App ready

## Deployment

The application can be deployed to:
- Vercel
- Netlify
- Supabase Edge Functions
- Any static hosting service

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase connection and permissions
3. Ensure database schema is properly set up
4. Check that all dependencies are installed

## Future Enhancements

- Multiple time slots per day
- Conflict detection
- Export to PDF/Excel
- Mobile app
- Admin panel for school management
- Integration with school management systems
