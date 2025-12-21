import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { CourseProvider } from './contexts/CourseContext';
import { DomainProvider } from './contexts/DomainContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MainContent } from './components/layout/MainContent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SetupRequiredRoute } from './components/layout/SetupRequiredRoute';
import { ToastProvider } from './components/feedback/ToastSystem';
import { DashboardProvider } from './contexts/DashboardContext';
import { usePageTracking } from './hooks/usePageTracking';

// Pages - Auth (Lazy loaded)
import { lazy, Suspense } from 'react';
import { Skeleton } from './components/ui/skeleton';
// Import Splash synchronously for use as fallback in ProtectedRoute
import Splash from './pages/Splash';

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const InitialSetup = lazy(() => import('./pages/InitialSetup'));

// Pages - Main (Lazy loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Activities = lazy(() => import('./pages/Activities'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Curriculum = lazy(() => import('./pages/Curriculum'));
const BlockDetail = lazy(() => import('./pages/BlockDetail'));
const TopicsList = lazy(() => import('./pages/TopicsList'));
const TopicDetail = lazy(() => import('./pages/TopicDetail'));
const ResourceDetail = lazy(() => import('./pages/ResourceDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectChecklist = lazy(() => import('./pages/ProjectChecklist'));
const ProjectDiary = lazy(() => import('./pages/ProjectDiary'));
const ProjectCelebration = lazy(() => import('./pages/ProjectCelebration'));
const Library = lazy(() => import('./pages/Library'));
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));
const SpacedRepetition = lazy(() => import('./pages/SpacedRepetition'));
const ToolsFocus = lazy(() => import('./pages/ToolsFocus'));
const ToolsHub = lazy(() => import('./pages/ToolsHub'));
const NotesList = lazy(() => import('./pages/NotesList'));
const NoteEditor = lazy(() => import('./pages/NoteEditor'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const NotesConnections = lazy(() => import('./pages/NotesConnections'));
const ParadigmsMap = lazy(() => import('./pages/ParadigmsMap'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Documents = lazy(() => import('./pages/Documents'));
const WeeklyPlanner = lazy(() => import('./pages/WeeklyPlanner'));
const CoursesManagement = lazy(() => import('./pages/CoursesManagement'));
const CommandPalette = lazy(() => import('./components/search/CommandPalette'));
const QuickActionButton = lazy(() => import('./components/quick-actions/QuickActionButton'));
const SessionTimer = lazy(() => import('./components/study/SessionTimer'));
function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  usePageTracking(); // Track page visits for achievements
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <Splash />;
  }

  if (!user) {
    // Show splash while redirecting instead of null
    return <Splash />;
  }

  return (
    <div 
      className="flex bg-background text-foreground"
      style={{ 
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        width: '100%',
        position: 'relative'
      }}
    >
      <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0" style={{ minHeight: 0 }}>
        <TopBar 
          isMobileMenuOpen={isMobileMenuOpen} 
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        <MainContent>
          <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
        </MainContent>
      </div>
      <Suspense fallback={null}>
        <QuickActionButton />
      </Suspense>
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
      <Suspense fallback={null}>
        <SessionTimer />
      </Suspense>
    </div>
  );
}

function App() {
  console.log('App component rendering...');
  
  // Fallback component in case of critical errors
  const FallbackApp = () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#050506', 
      color: '#f4f4f5',
      fontFamily: 'system-ui',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#780606' }}>UATI NEXUS</div>
      <div style={{ color: '#999' }}>Carregando aplicação...</div>
    </div>
  );

  try {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <UserProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <CourseProvider>
                  <DomainProvider>
                    <DashboardProvider>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                      <Route path="/splash" element={<Splash />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/initial-setup" element={<InitialSetup />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Dashboard />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/statistics"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Statistics />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Activities />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Notifications />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/curriculum"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Curriculum />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/curriculum/:id"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <BlockDetail />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/curriculum/:curriculumId/topics"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <TopicsList />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/topics/:id"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <TopicDetail />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources/:id"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ResourceDetail />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Projects />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ProjectDetail />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/checklist"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ProjectChecklist />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/diary"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ProjectDiary />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/celebration"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ProjectCelebration />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Library />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-graph"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <KnowledgeGraph />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaced-repetition"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <SpacedRepetition />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools-focus"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ToolsFocus />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tools-hub"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ToolsHub />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <NotesList />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/new"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <NoteEditor />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/:id"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <NoteDetail />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/:id/edit"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <NoteEditor />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes/connections"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <NotesConnections />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paradigms"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <ParadigmsMap />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Profile />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Achievements />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <CoursesManagement />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Settings />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <Documents />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/weekly-planner"
                element={
                  <ProtectedRoute>
                    <SetupRequiredRoute>
                      <WeeklyPlanner />
                    </SetupRequiredRoute>
                  </ProtectedRoute>
                }
              />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </DashboardProvider>
                  </DomainProvider>
              </CourseProvider>
            </BrowserRouter>
          </UserProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
    );
  } catch (error) {
    console.error('Critical error in App:', error);
    return <FallbackApp />;
  }
}

export default App;
