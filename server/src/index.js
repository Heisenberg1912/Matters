import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mlRoutes from './routes/ml.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      weather: !!process.env.OPENWEATHER_API_KEY,
      vision: !!process.env.GOOGLE_CLOUD_VISION_KEY
    }
  });
});

// ML Routes
app.use('/api/ml', mlRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MATTERS ML Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  // Log API key status
  if (!process.env.OPENWEATHER_API_KEY) {
    console.warn('Warning: OPENWEATHER_API_KEY not set - weather endpoints will return mock data');
  }
  if (!process.env.GOOGLE_CLOUD_VISION_KEY) {
    console.warn('Warning: GOOGLE_CLOUD_VISION_KEY not set - vision endpoints will return mock data');
  }
});

export default app;
