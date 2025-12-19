const collectMissing = (vars) => vars.filter((key) => !process.env[key]);

const requireIf = (condition, vars) => (condition ? collectMissing(vars) : []);

const validateEnv = () => {
  const missing = [];

  if (process.env.NODE_ENV === 'production') {
    missing.push(
      ...collectMissing([
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'CLERK_SECRET_KEY',
      ])
    );

    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      missing.push('MONGO_URI');
    }
  }

  missing.push(
    ...requireIf(process.env.PAYMENTS_ENABLED === 'true', [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
    ])
  );

  missing.push(
    ...requireIf(process.env.PUSHER_ENABLED === 'true', [
      'PUSHER_APP_ID',
      'PUSHER_KEY',
      'PUSHER_SECRET',
      'PUSHER_CLUSTER',
    ])
  );

  const uniqueMissing = [...new Set(missing)].filter(Boolean);

  if (uniqueMissing.length === 0) {
    return;
  }

  const message = `Missing required environment variables: ${uniqueMissing.join(', ')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }

  console.warn(message);
};

export default validateEnv;
