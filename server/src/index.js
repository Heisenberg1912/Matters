import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '../..', '.env') });

// Database connection
import connectDB from './config/database.js';

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import stageRoutes from './routes/stages.js';
import budgetRoutes from './routes/budget.js';
import uploadRoutes from './routes/uploads.js';
import chatRoutes from './routes/chat.js';
import inventoryRoutes from './routes/inventory.js';
import mlRoutes from './routes/ml.js';

const app = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Add localhost for development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000');
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow in development, restrict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased for image uploads
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
      googleDrive: !!(process.env.GOOGLE_OAUTH_REFRESH_TOKEN),
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

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
    });
  }

  // JWT errors
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

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    const server = app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
      console.log(`
========================================
  MATTERS Server Started Successfully
========================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  API Base: ${API_PREFIX}
  Health Check: http://localhost:${PORT}${API_PREFIX}/health
========================================
  Configured Services:
  - MongoDB: Connected
  - Weather API: ${process.env.OPENWEATHER_API_KEY ? 'Configured' : 'Not configured'}
  - Gemini AI: ${process.env.GEMINI_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
  - Google Drive: ${process.env.GOOGLE_OAUTH_REFRESH_TOKEN ? 'Configured' : 'Not configured'}
  - Email (SMTP): ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}
========================================
      `);
    });

    // Handle server timeout
    server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS) || 620000;
    server.headersTimeout = server.keepAliveTimeout + 1000;

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
