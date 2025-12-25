import app, { initApp } from './app.js';

const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Initialize database on cold start for Vercel
let dbInitialized = false;
const ensureDbConnection = async () => {
  if (!dbInitialized) {
    await initApp();
    dbInitialized = true;
  }
};

// For Vercel serverless - export handler
export default async function handler(req, res) {
  await ensureDbConnection();
  return app(req, res);
}

// For local development - start server with app.listen()
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await initApp();

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
        `);
      });

      server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS) || 620000;
      server.headersTimeout = server.keepAliveTimeout + 1000;

      const shutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(() => process.exit(0));
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}
