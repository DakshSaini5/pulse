import dotenv from 'dotenv';
// Load Environment Configuration immediately before any other internal module imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupChatSocket } from './services/chatSocket';
import { generalLimiter } from './middleware/rateLimiter';

// Routes imports
import authRouter from './routes/auth';
import googleAuthRouter from './routes/googleAuth';
import hospitalsRouter from './routes/hospitals';
import prescriptionsRouter from './routes/prescriptions';
import reportsRouter from './routes/reports';
import trendsRouter from './routes/trends';
import adminRouter from './routes/admin';
import notificationsRouter from './routes/notifications';
import userRouter from './routes/user';
import reviewsRouter from './routes/reviews';
import emergencyRouter from './routes/emergency';
import geocodingRouter from './routes/geocoding';
import chatRouter from './routes/chat';

// Mobile isolated route imports removed to enforce DRY

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first reverse proxy (Render, Cloudflare, etc.)
// Required for rate limiting (x-forwarded-for) and HTTPS redirect (x-forwarded-proto) to work correctly
app.set('trust proxy', 1);

// Validate all required environment variables at startup — fail fast and loudly in production
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL', 'GEMINI_API_KEY', 'SENDER_EMAIL', 'RESEND_API_KEY'];
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Setup security firewalls & middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_DASHBOARD_URL,
  'https://pulsehealthcare.in',
  'https://www.pulsehealthcare.in',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all origins to prevent local network or 127.0.0.1 testing issues
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, strictly enforce allowedOrigins only — no wildcard subdomains
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';
    if (
      !origin || 
      origin === 'null' || 
      allowedOrigins.includes(cleanOrigin) || 
      cleanOrigin.startsWith('capacitor://') || 
      cleanOrigin.startsWith('http://localhost') || 
      cleanOrigin.startsWith('https://localhost')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser Leaflet icons to load correctly
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
}));

// Redirect HTTP → HTTPS in production (behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded prescription and report files statically
app.use('/uploads', express.static(uploadsDir));

// Register REST API endpoints
app.use('/api/auth', authRouter);
app.use('/api/auth', googleAuthRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/hospitals', reviewsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/user', userRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/chat', chatRouter);
app.use('/api/geocoding', geocodingRouter);

// Register New Isolated Mobile APK API endpoints removed. Mobile app now uses standard /api endpoints.

// Base Status API
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Pulse Core Backend Service',
    timestamp: new Date(),
  });
});

// Centralized Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[System Exception Caught]', err.message || err);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'An internal server error occurred.',
    error: isDev ? err.stack : undefined,
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('[Unhandled Promise Rejection]', reason);
});

process.on('uncaughtException', async (error: Error) => {
  console.error('[Uncaught Exception]', error);
  // Graceful shutdown: close DB connections before exiting
  try {
    const { prisma } = await import('./db');
    await prisma.$disconnect();
    console.log('[Shutdown] Database connections closed.');
  } catch (e) {
    console.error('[Shutdown] Error disconnecting DB:', e);
  }
  process.exit(1);
});

// Setup Socket.IO Server
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      // Strictly enforce allowedOrigins for Socket.IO in production — no wildcard subdomains
      const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';
      if (
        !origin || 
        origin === 'null' || 
        allowedOrigins.includes(cleanOrigin) || 
        cleanOrigin.startsWith('capacitor://') || 
        cleanOrigin.startsWith('http://localhost') || 
        cleanOrigin.startsWith('https://localhost')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Socket.IO CORS rejected'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});
setupChatSocket(io);

// Graceful shutdown on SIGTERM/SIGINT (container stop, Ctrl+C)
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Shutdown] Received ${signal}. Shutting down gracefully...`);
  httpServer.close(async () => {
    try {
      const { prisma } = await import('./db');
      await prisma.$disconnect();
      console.log('[Shutdown] Database connections closed. Goodbye!');
    } catch (e) {
      console.error('[Shutdown] Error disconnecting DB:', e);
    }
    process.exit(0);
  });
  // Force kill after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('[Shutdown] Forced exit after timeout.');
    process.exit(1);
  }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Listen
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  💖 PULSE CORE SERVICE RUNNING ON PORT ${PORT}      `);
    console.log(`  🚀 API gateway: http://localhost:${PORT}/api        `);
    console.log(`  📂 Static assets hosted at: /uploads               `);
    console.log(`====================================================`);
  });
}

export default app;
