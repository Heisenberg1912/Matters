// Vercel serverless handler
let app, initApp;
let initialized = false;

export default async function handler(req, res) {
  try {
    // Lazy load the app
    if (!app) {
      const appModule = await import('../src/app.js');
      app = appModule.default;
      initApp = appModule.initApp;
    }

    // Initialize database
    if (!initialized) {
      await initApp();
      initialized = true;
    }

    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
}
