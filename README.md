# Deens Timetable

A modern, responsive timetable management application built with React and Supabase.

## Features

- 📅 Create and manage timetables
- 🎨 Drag and drop interface
- 👤 User authentication
- 💾 Real-time data persistence
- 📱 Mobile responsive design

## Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: CSS Modules + Lucide Icons
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-bitbucket-repo-url>
cd deens-timetable
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/        # Configuration files
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # API and database services
├── styles/        # CSS and styling
└── utils/         # Utility functions
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Commit with descriptive messages
4. Push and create a pull request

## License

MIT
