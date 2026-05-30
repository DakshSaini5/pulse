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

const app = express();
const PORT = process.env.PORT || 5000;

// Setup security firewalls & middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser Leaflet icons to load correctly
}));
app.use(morgan('dev'));
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

process.on('uncaughtException', (error: Error) => {
  console.error('[Uncaught Exception]', error);
  process.exit(1);
});

// Setup Socket.IO Server
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupChatSocket(io);

// Listen
httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  💖 PULSE CORE SERVICE RUNNING ON PORT ${PORT}      `);
  console.log(`  🚀 API gateway: http://localhost:${PORT}/api        `);
  console.log(`  📂 Static assets hosted at: /uploads               `);
  console.log(`====================================================`);
});
