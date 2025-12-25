import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const state = globalThis.__mattersMongo || {
  conn: null,
  promise: null,
  listenersAttached: false,
  memoryServer: null,
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
    let mongoURI;
    const useInMemory = process.env.USE_IN_MEMORY_DB === 'true';

    if (useInMemory) {
      console.log('Starting in-memory MongoDB server...');
      state.memoryServer = await MongoMemoryServer.create();
      mongoURI = state.memoryServer.getUri();
      console.log('In-memory MongoDB server started');
    } else {
      mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (!mongoURI) {
        throw new Error('MongoDB URI not found in environment variables');
      }
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
