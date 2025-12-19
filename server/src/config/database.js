import mongoose from 'mongoose';

const state = globalThis.__mattersMongo || {
  conn: null,
  promise: null,
  listenersAttached: false,
};

globalThis.__mattersMongo = state;

const attachListeners = () => {
  if (state.listenersAttached) {
    return;
  }
  state.listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
};

const connectDB = async () => {
  if (state.conn) {
    return state.conn;
  }

  if (!state.promise) {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    const options = {
      dbName: process.env.MONGO_DBNAME || process.env.MONGODB_DB || 'matters',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    state.promise = mongoose.connect(mongoURI, options).then((conn) => {
      attachListeners();
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Database: ${conn.connection.name}`);
      return conn;
    });
  }

  state.conn = await state.promise;
  return state.conn;
};

export default connectDB;
