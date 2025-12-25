import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongoServer;
let isSetup = false;
let appInstance = null;

const JWT_SECRET = process.env.JWT_SECRET || 'matters-secret-key-change-in-production';

/**
 * Connect to in-memory MongoDB for testing
 * This must be called before importing the app
 */
export async function setupTestDatabase() {
  if (isSetup) return;

  // Disconnect any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Clear the global state used by the app's database.js
  if (globalThis.__mattersMongo) {
    globalThis.__mattersMongo.conn = null;
    globalThis.__mattersMongo.promise = null;
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  const conn = await mongoose.connect(mongoUri, {
    dbName: 'test',
  });

  // Set the global state so the app's connectDB() uses our test connection
  if (!globalThis.__mattersMongo) {
    globalThis.__mattersMongo = {};
  }
  globalThis.__mattersMongo.conn = conn;
  globalThis.__mattersMongo.promise = Promise.resolve(conn);

  isSetup = true;
  return mongoUri;
}

/**
 * Get the app instance (must be called after setupTestDatabase)
 * This ensures the app is imported AFTER the test database is connected
 */
export async function getApp() {
  if (!isSetup) {
    await setupTestDatabase();
  }
  if (!appInstance) {
    const module = await import('../src/app.js');
    appInstance = module.default;
  }
  return appInstance;
}

/**
 * Disconnect and cleanup
 */
export async function teardownTestDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  isSetup = false;
}

/**
 * Clear all collections
 */
export async function clearDatabase() {
  if (mongoose.connection.readyState === 0) {
    console.warn('Database not connected, skipping clear');
    return;
  }
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Generate JWT token for testing
 */
export function generateTestToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Create a test user
 */
export async function createTestUser(userData = {}) {
  const User = (await import('../src/models/User.js')).default;

  const defaultData = {
    email: `test${Date.now()}${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    name: 'Test User',
    role: 'user',
    isVerified: true,
    isActive: true,
  };

  const user = await User.create({ ...defaultData, ...userData });
  const token = generateTestToken(user);

  return { user, token };
}

/**
 * Create a test contractor
 */
export async function createTestContractor(userData = {}) {
  return createTestUser({
    email: `contractor${Date.now()}${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test Contractor',
    role: 'contractor',
    contractor: {
      isVerified: true,
      availabilityStatus: 'available',
      completedProjects: 0,
      activeProjects: 0,
      totalEarnings: 0,
    },
    specializations: ['Residential', 'Plumbing'],
    ...userData,
  });
}

/**
 * Create a test admin
 */
export async function createTestAdmin(userData = {}) {
  return createTestUser({
    email: `admin${Date.now()}${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test Admin',
    role: 'admin',
    ...userData,
  });
}

/**
 * Create a test project
 */
export async function createTestProject(ownerId, projectData = {}) {
  const Project = (await import('../src/models/Project.js')).default;

  const defaultData = {
    name: `Test Project ${Date.now()}`,
    description: 'A test project',
    type: 'residential',
    owner: ownerId,
    status: 'in_progress',
    budget: {
      estimated: 100000,
      spent: 0,
    },
    location: {
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '12345',
    },
  };

  return Project.create({ ...defaultData, ...projectData });
}

/**
 * Create a test job
 */
export async function createTestJob(postedBy, projectId, jobData = {}) {
  const Job = (await import('../src/models/Job.js')).default;

  const defaultData = {
    project: projectId,
    postedBy,
    title: `Test Job ${Date.now()}`,
    description: 'A test job description',
    budget: {
      min: 5000,
      max: 10000,
    },
    requiredSpecializations: ['Residential'],
    location: {
      city: 'Test City',
      state: 'Test State',
    },
    workType: 'specific_task',
    status: 'open',
  };

  return Job.create({ ...defaultData, ...jobData });
}
