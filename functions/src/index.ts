import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Importar todas as rotas do backend
import authRoutes from './routes/auth';
import majorRoutes from './routes/majors';
import curriculumRoutes from './routes/curriculum';
import projectRoutes from './routes/projects';
import flashcardRoutes from './routes/flashcards';
import resourceRoutes from './routes/resources';
import knowledgeGraphRoutes from './routes/knowledgeGraph';
import timerRoutes from './routes/timer';
import activityRoutes from './routes/activities';
import notificationRoutes from './routes/notifications';
import topicRoutes from './routes/topics';
import noteRoutes from './routes/notes';
import diaryRoutes from './routes/diary';
import paradigmRoutes from './routes/paradigms';
import userRoutes from './routes/user';
import achievementRoutes from './routes/achievements';
import milestoneRoutes from './routes/milestones';
import weeklyScheduleRoutes from './routes/weekly-schedule';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

admin.initializeApp();

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS - Permitir todas as origens no Firebase
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate Limiting
app.use('/api/', apiLimiter);

// Body Parsing
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'UATI Nexus API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/paradigms', paradigmRoutes);
app.use('/api/user', userRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api', milestoneRoutes);
app.use('/api/weekly-schedule', weeklyScheduleRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

// Exportar como Cloud Function
export const api = functions.https.onRequest(app);



