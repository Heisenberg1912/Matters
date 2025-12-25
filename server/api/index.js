// Simple test handler - no complex imports
export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel!',
    path: req.url,
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
