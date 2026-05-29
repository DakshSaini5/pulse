import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Routes imports
import authRouter from './routes/auth';
import hospitalsRouter from './routes/hospitals';
import prescriptionsRouter from './routes/prescriptions';
import reportsRouter from './routes/reports';
import trendsRouter from './routes/trends';
import adminRouter from './routes/admin';

// Load Environment Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup security firewalls & middlewares
app.use(cors({ origin: '*' }));
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser Leaflet icons to load correctly
}));
app.use(morgan('dev'));
app.use(express.json());

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded prescription and report files statically
app.use('/uploads', express.static(uploadsDir));

// Register REST API endpoints
app.use('/api/auth', authRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/admin', adminRouter);

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
  console.error('[System Exception Caught]', err);
  res.status(err.status || 500).json({
    message: err.message || 'A core server exception occurred during computation.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Listen
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  💖 PULSE CORE SERVICE RUNNING ON PORT ${PORT}      `);
  console.log(`  🚀 API gateway: http://localhost:${PORT}/api        `);
  console.log(`  📂 Static assets hosted at: /uploads               `);
  console.log(`====================================================`);
});
