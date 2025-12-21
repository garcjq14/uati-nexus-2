import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import majorRoutes from './routes/majors';
import courseRoutes from './routes/courses';
import domainRoutes from './routes/domains';
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
import initRoutes from './routes/init';
import setupDbRoutes from './routes/setup-db';
import migrateRoutes from './routes/migrate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow all origins in development
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS allowed: No origin (direct request)');
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ CORS allowed (dev): ${origin}`);
      return callback(null, true);
    }
    
    // Get allowed origins from environment
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, '')) // Remove trailing slashes
      : [];
    
    // Check if it's a Vercel URL (production or preview)
    const isVercelUrl = origin.includes('.vercel.app');
    
    // If no FRONTEND_URL is set, allow all (fallback for safety)
    if (allowedOrigins.length === 0) {
      console.warn('⚠️  FRONTEND_URL not set - allowing all origins');
      console.log(`✅ CORS allowed (no config): ${origin}`);
      return callback(null, true);
    }
    
    // Log for debugging
    console.log(`🔍 CORS check - Origin: ${origin}`);
    console.log(`🔍 CORS check - Allowed: ${allowedOrigins.join(', ')}`);
    
    // Check if origin matches allowed origins
    let isAllowed = false;
    
    // First, try exact match
    if (allowedOrigins.includes(origin)) {
      isAllowed = true;
      console.log(`✅ CORS allowed: Exact match`);
    }
    // If it's a Vercel URL, be more permissive
    else if (isVercelUrl) {
      // For Vercel URLs, check if any allowed origin is also a Vercel URL
      const hasVercelAllowed = allowedOrigins.some(allowed => allowed.includes('.vercel.app'));
      
      if (hasVercelAllowed) {
        // For simplicity: if we have any Vercel URL configured, allow ALL Vercel URLs
        // This handles both production and preview URLs automatically
        isAllowed = true;
        console.log(`✅ CORS allowed: Vercel URL (any Vercel URL allowed when Vercel is configured)`);
        console.log(`   Origin: ${origin}`);
      }
    }
    
    // If still not allowed, check if it's a localhost or development URL
    if (!isAllowed && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      isAllowed = true;
      console.log(`✅ CORS allowed: Local development`);
    }
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked for origin: ${origin}`);
      console.error(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      console.error(`   Is Vercel URL: ${isVercelUrl}`);
      console.error(`   Origin project: ${origin.split('.vercel.app')[0]}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400 // Cache preflight for 24 hours
};

// Handle OPTIONS requests FIRST - before any other middleware
app.options('*', (req, res) => {
  console.log(`🔵 OPTIONS preflight: ${req.headers.origin} -> ${req.path}`);
  cors(corsOptions)(req, res, () => {
    res.status(200).end();
  });
});

// Apply CORS to all routes
app.use(cors(corsOptions));

// Security Middleware (after CORS to not interfere)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for API
}));

// Rate Limiting - Skip for OPTIONS requests (preflight)
app.use('/api/', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Skip rate limiting for preflight requests
  }
  return apiLimiter(req, res, next);
});

// Body Parsing
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware - log all requests
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'UATI Nexus API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      docs: 'See README.md for API documentation'
    }
  });
});

// Routes
app.use('/api/migrate', migrateRoutes); // Migração rápida: adiciona coluna currentCourseId
app.use('/api/setup-db', setupDbRoutes); // Criar tabelas do banco (chamar primeiro se necessário)
app.use('/api/init', initRoutes); // Endpoint de inicialização (chamar após setup-db)
app.use('/api/auth', authRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/domains', domainRoutes);
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`🔗 FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set (allowing all origins)'}`);
  console.log(`🔐 CORS configured for production: ${process.env.NODE_ENV === 'production'}`);
});

