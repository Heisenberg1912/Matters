import app, { initApp } from './app.js';
const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await initApp();

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
