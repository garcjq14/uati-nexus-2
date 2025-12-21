# UATI Nexus Universal - Full Stack LMS

A comprehensive Learning Management System (LMS) for autodidacts, built with React, Node.js, Express, and SQLite.

**Status**: ✅ Production Ready - All core features implemented and functional.

## Features

### Core Features
- **Content-Agnostic Architecture**: Switch between different majors/courses (Computer Science, Design, Law, etc.)
- **Complete Authentication Flow**: Splash screen, onboarding, login/register, initial setup
- **Dashboard**: Overview of progress, statistics, active projects, and flashcards
- **Detailed Statistics**: Advanced charts and analytics (progress by block, weekly hours, PoW completion)
- **Activity Feed**: Timeline of all learning activities with filters
- **Notifications System**: Real-time notifications with unread count

### Curriculum Management
- **Visual Timeline**: Course modules with progress indicators (locked/active/completed)
- **Block Details**: Detailed view with syllabus, associated PoW, and topics
- **Topics Management**: List and detail views with reading status
- **Resource Details**: Annotations, progress tracking, and external links

### Project Management
- **Portfolio Projects**: List with progress bars and status indicators
- **Project Details**: Requirements, technologies, deadlines, repository links
- **Checklist System**: Mandatory delivery tasks with completion tracking
- **Digital Diary**: Markdown-based daily entries with tags and timeline
- **Celebration View**: Completion screen with statistics and sharing

### Learning Tools
- **Spaced Repetition (SRS)**: Algorithm-based flashcard review system
- **Knowledge Graph**: Interactive node-based visualization
- **Zettelkasten System**: Digital note-taking with connections
- **Note Editor**: Full-featured editor with Feynman explanation, connections, tags, references
- **Connections Map**: Visual graph of note relationships
- **Paradigms Map**: Programming paradigms and languages proficiency visualization
- **Pomodoro Timer**: Focus timer with ambient audio controls

### Library & Resources
- **Resource Management**: Books, PDFs, videos, audio with status tracking
- **Annotations**: Chapter/section-based annotations
- **Filtering**: By format, search functionality
- **Progress Tracking**: Reading progress per resource

### Settings & Profile
- **Academic Settings**: Major/course selection and switching
- **Account Settings**: Password and email change
- **General Settings**: Theme, language, notifications
- **Help & Support**: FAQ, contact form, documentation access
- **Master Documents**: Access to essential guides and manuals

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Shadcn UI components
- Lucide React icons
- Recharts (statistics)
- React Flow (knowledge graph)
- React Router
- Framer Motion (animations)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite database
- JWT authentication
- bcryptjs (password hashing)

## Project Structure

```
app-uati-nexus/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Screen components
│   │   ├── contexts/      # React Context providers
│   │   ├── lib/           # Utilities, API client
│   │   └── App.tsx
│   └── package.json
├── backend/           # Express backend API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database with initial data:
```bash
npm run prisma:seed
```

6. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are set):
```env
VITE_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Login

After seeding the database, you can login with:
- **Email**: `alexandre@uati.com`
- **Password**: `password123`

## Database Schema

The application uses SQLite with the following main entities:
- **User**: User accounts and authentication
- **Major**: Course/major definitions
- **Curriculum**: Course modules and progress
- **Project**: Portfolio projects with tasks
- **Flashcard**: Spaced repetition cards
- **Resource**: Library items (books, PDFs, videos)
- **KnowledgeNode**: Knowledge graph nodes and connections
- **StudySession**: Pomodoro timer sessions
- **Activity**: Activity feed entries

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (rate limited)
- `POST /api/auth/login` - Login user (rate limited)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Majors
- `GET /api/majors` - List all majors
- `GET /api/majors/current` - Get current major with all data
- `PUT /api/majors/switch/:majorId` - Switch current major

### Curriculum
- `GET /api/curriculum` - Get curriculum modules
- `GET /api/curriculum/:id` - Get curriculum block details
- `PUT /api/curriculum/:id/progress` - Update module progress

### Topics
- `GET /api/topics/curriculum/:curriculumId` - Get topics for a curriculum
- `GET /api/topics/:id` - Get topic details
- `PUT /api/topics/:id/status` - Update topic status

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/checklist` - Get project checklist
- `GET /api/projects/:id/diary` - Get diary entries
- `POST /api/projects/:id/diary` - Create diary entry
- `POST /api/projects/:id/tasks` - Add task to project
- `PUT /api/projects/tasks/:taskId` - Update task
- `DELETE /api/projects/tasks/:taskId` - Delete task

### Flashcards
- `GET /api/flashcards` - Get flashcards and deck stats
- `GET /api/flashcards/due` - Get flashcards due for review
- `POST /api/flashcards` - Create flashcard
- `POST /api/flashcards/:id/review` - Review flashcard (rate quality)

### Resources
- `GET /api/resources` - List resources (with optional format filter)
- `GET /api/resources/:id` - Get resource details
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `GET /api/resources/:id/annotations` - Get resource annotations
- `POST /api/resources/:id/annotations` - Add annotation

### Knowledge Graph
- `GET /api/knowledge-graph` - Get knowledge nodes
- `POST /api/knowledge-graph` - Create node
- `POST /api/knowledge-graph/connections` - Create connection
- `DELETE /api/knowledge-graph/:id` - Delete node

### Notes (Zettelkasten)
- `GET /api/notes` - List notes (with search and tag filters)
- `GET /api/notes/:id` - Get note details with connections
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Timer
- `POST /api/timer/session` - Create study session
- `GET /api/timer/history` - Get session history

### Activities
- `GET /api/activities` - Get activity feed (with filters and pagination)
- `POST /api/activities` - Create activity

### Notifications
- `GET /api/notifications` - Get notifications (with unread filter)
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `POST /api/notifications` - Create notification

### User
- `GET /api/user/preferences` - Get user preferences
- `POST /api/user/preferences` - Save user preferences
- `PUT /api/user/password` - Change password
- `PUT /api/user/email` - Change email

### Paradigms
- `GET /api/paradigms` - Get paradigms and languages data
- `PUT /api/paradigms/proficiency` - Update proficiency level

## Visual Identity

- **Theme**: Dark Academia / Cyberpunk Minimalist
- **Background**: `#0a0a0a` (Deep Black)
- **Primary Accent**: `#A31F34` (MIT Red)
- **Secondary**: `#27272a` (Muted Grey)
- **Success**: `#22c55e` (Green)
- **Typography**: Merriweather (headings), Inter (UI)

## Development

### Backend Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

ISC

