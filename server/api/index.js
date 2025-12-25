// Vercel serverless entry point
import app, { initApp } from '../src/app.js';

let initialized = false;

export default async function handler(req, res) {
  try {
    if (!initialized) {
      console.log('Initializing app...');
      await initApp();
      initialized = true;
      console.log('App initialized');
    }
    return app(req, res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
