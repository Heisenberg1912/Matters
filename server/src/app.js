import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Database connection
import connectDB from './config/database.js';
import validateEnv from './config/validateEnv.js';

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import stageRoutes from './routes/stages.js';
import budgetRoutes from './routes/budget.js';
import uploadRoutes from './routes/uploads.js';
import chatRoutes from './routes/chat.js';
import inventoryRoutes from './routes/inventory.js';
import mlRoutes from './routes/ml.js';
import realtimeRoutes from './routes/realtime.js';
import paymentsRoutes from './routes/payments.js';
import contractorRoutes from './routes/contractors.js';
import supportRoutes from './routes/support.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadEnv = () => {
  if (process.env.MATTERS_ENV_LOADED === 'true') {
    return;
  }

  dotenv.config({ path: join(__dirname, '../..', '.env') });
  process.env.MATTERS_ENV_LOADED = 'true';
};

loadEnv();
validateEnv();

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api';

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000'
      );
    }

    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.length === 0;

    if (isAllowed) {
      callback(null, true);
      return;
    }

    console.warn(`CORS blocked origin: ${origin}`);
    if (process.env.NODE_ENV === 'production') {
      callback(null, false);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.use(
  express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'matters-server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'mongodb',
      weather: !!process.env.OPENWEATHER_API_KEY,
      gemini: process.env.GEMINI_ENABLED === 'true',
      googleDrive: !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    },
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/stages`, stageRoutes);
app.use(`${API_PREFIX}/budget`, budgetRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/ml`, mlRoutes);
app.use(`${API_PREFIX}/realtime`, realtimeRoutes);
app.use(`${API_PREFIX}/payments`, paymentsRoutes);
app.use(`${API_PREFIX}/contractors`, contractorRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Matters API',
    version: '1.0.0',
    documentation: `${API_PREFIX}/docs`,
    health: `${API_PREFIX}/health`,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

let initPromise;

export const initApp = async () => {
  if (!initPromise) {
    initPromise = connectDB();
  }
  return initPromise;
};

export default app;
