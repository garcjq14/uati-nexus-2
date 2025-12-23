import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'uati-nexus-secret-key-change-in-production', {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: { id: user.id, email: user.email, name: user.name, onboardingCompleted: user.onboardingCompleted }, token });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    
    // Return more detailed error in development
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ 
        error: 'Registration failed', 
        message: error?.message,
        details: error?.code || error?.name
      });
    }
    
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Normalizar email (lowercase e trim)
    const normalizedEmail = email?.toLowerCase().trim();
    const trimmedPassword = password?.trim();
    
    console.log('Login attempt for email:', normalizedEmail);
    console.log('Password length:', trimmedPassword?.length || 0);

    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (!user) {
      console.log('❌ User not found for email:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.name, '(ID:', user.id + ')');
    console.log('🔐 Comparing password...');
    
    const isValid = await bcrypt.compare(trimmedPassword, user.password);
    
    if (!isValid) {
      console.log('❌ Invalid password for email:', normalizedEmail);
      console.log('   Password provided length:', trimmedPassword?.length || 0);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ Password is valid!');

    console.log('Password valid, generating token...');

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'uati-nexus-secret-key-change-in-production', {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Track login activity for achievements (only if it's the first login or user is new)
    // This is optional and should not break login if it fails
    try {
      const existingActivities = await prisma.activity.findMany({
        where: { 
          userId: user.id,
          type: { in: ['login', 'first_login'] }
        } as any,
        take: 1,
      });
      
      if (existingActivities.length === 0) {
        // First login - create activity
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'first_login',
            title: 'Primeiro Login',
            description: 'Usuário fez login pela primeira vez',
          },
        });
      }
    } catch (activityError: any) {
      // Silently fail - don't break login if activity tracking fails
      console.warn('⚠️  Failed to track login activity (non-critical):', activityError?.message);
      // Continue with login even if activity tracking fails
    }

    console.log('✅ Login successful for:', email);
    return res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, onboardingCompleted: user.onboardingCompleted }, token });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error name:', error?.name);
    
    // Check for specific database errors
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('no such table')) {
      console.error('💡 Database table not found. The database may not be initialized.');
      return res.status(500).json({ 
        error: 'Database not initialized', 
        message: 'Please call /api/init to initialize the database',
        hint: 'Access https://seu-backend.onrender.com/api/init in your browser'
      });
    }
    
    // Return detailed error even in production for debugging
    // Incluir mais informações para ajudar no debug
    const errorResponse: any = {
      error: 'Login failed',
      message: error?.message || 'Unknown error',
    };
    
    if (error?.code) {
      errorResponse.code = error?.code;
    }
    
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('no such table')) {
      errorResponse.hint = 'Database may not be initialized. Call /api/init first';
      errorResponse.solution = 'Access https://seu-backend.onrender.com/api/init in your browser';
    } else if (error?.code === 'P2002') {
      errorResponse.hint = 'Database constraint violation';
    } else if (error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
      errorResponse.hint = 'Database connection failed. Check DATABASE_URL';
    }
    
    return res.status(500).json(errorResponse);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'uati-nexus-secret-key-change-in-production') as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        avatar: user.avatar,
        portfolio: user.portfolio,
        linkedin: user.linkedin,
        github: user.github,
        twitter: user.twitter,
        headline: user.headline,
        onboardingCompleted: user.onboardingCompleted 
      } 
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

