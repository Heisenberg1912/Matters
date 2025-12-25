const validateEnv = () => {
  const missing = [];

  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    missing.push('MONGODB_URI');
  }

  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
  }
};

export default validateEnv;
