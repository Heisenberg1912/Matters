import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestUser,
  generateTestToken,
} from './setup.js';

// Setup and teardown
test.before(async () => {
  await setupTestDatabase();
});

test.after(async () => {
  await teardownTestDatabase();
});

test.beforeEach(async () => {
  await clearDatabase();
});

// =============================================================================
// Registration Tests
// =============================================================================

test('POST /api/session/register - should register a new user', async () => {
  const userData = {
    email: 'newuser@example.com',
    password: 'password123',
    name: 'New User',
  };

  const response = await request(app)
    .post('/api/session/register')
    .send(userData);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.user);
  assert.ok(response.body.data.token);
  assert.equal(response.body.data.user.email, userData.email.toLowerCase());
  assert.equal(response.body.data.user.name, userData.name);
  assert.equal(response.body.data.user.role, 'user');
  // Password should not be returned
  assert.equal(response.body.data.user.password, undefined);
});

test('POST /api/session/register - should register a contractor with specializations', async () => {
  const userData = {
    email: 'contractor@example.com',
    password: 'password123',
    name: 'New Contractor',
    role: 'contractor',
    company: { name: 'Test Company' },
    specializations: ['Plumbing', 'Electrical'],
  };

  const response = await request(app)
    .post('/api/session/register')
    .send(userData);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.role, 'contractor');
  assert.deepEqual(response.body.data.user.specializations, ['Plumbing', 'Electrical']);
});

test('POST /api/session/register - should fail with missing email', async () => {
  const userData = {
    password: 'password123',
    name: 'New User',
  };

  const response = await request(app)
    .post('/api/session/register')
    .send(userData);

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('required'));
});

test('POST /api/session/register - should fail with missing password', async () => {
  const userData = {
    email: 'test@example.com',
    name: 'New User',
  };

  const response = await request(app)
    .post('/api/session/register')
    .send(userData);

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('POST /api/session/register - should fail with short password', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'short',
    name: 'New User',
  };

  const response = await request(app)
    .post('/api/session/register')
    .send(userData);

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('8 characters'));
});

test('POST /api/session/register - should fail with duplicate email', async () => {
  // Create first user
  await createTestUser({ email: 'duplicate@example.com' });

  // Try to create second user with same email
  const response = await request(app)
    .post('/api/session/register')
    .send({
      email: 'duplicate@example.com',
      password: 'password123',
      name: 'Another User',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('already exists'));
});

// =============================================================================
// Login Tests
// =============================================================================

test('POST /api/session/login - should login with valid credentials', async () => {
  // Create a user first
  await createTestUser({
    email: 'login@example.com',
    password: 'password123',
  });

  const response = await request(app)
    .post('/api/session/login')
    .send({
      email: 'login@example.com',
      password: 'password123',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.user);
  assert.ok(response.body.data.token);
  assert.equal(response.body.data.user.email, 'login@example.com');
});

test('POST /api/session/login - should fail with wrong password', async () => {
  await createTestUser({
    email: 'wrongpass@example.com',
    password: 'password123',
  });

  const response = await request(app)
    .post('/api/session/login')
    .send({
      email: 'wrongpass@example.com',
      password: 'wrongpassword',
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('Invalid'));
});

test('POST /api/session/login - should fail with non-existent email', async () => {
  const response = await request(app)
    .post('/api/session/login')
    .send({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('Invalid'));
});

test('POST /api/session/login - should fail with missing credentials', async () => {
  const response = await request(app)
    .post('/api/session/login')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('required'));
});

test('POST /api/session/login - should fail for inactive user', async () => {
  await createTestUser({
    email: 'inactive@example.com',
    password: 'password123',
    isActive: false,
  });

  const response = await request(app)
    .post('/api/session/login')
    .send({
      email: 'inactive@example.com',
      password: 'password123',
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('disabled'));
});

// =============================================================================
// Get Current User Tests
// =============================================================================

test('GET /api/session - should return current user when authenticated', async () => {
  const { user, token } = await createTestUser({
    email: 'current@example.com',
    name: 'Current User',
  });

  const response = await request(app)
    .get('/api/session')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.email, 'current@example.com');
  assert.equal(response.body.data.user.name, 'Current User');
});

test('GET /api/session - should fail without authentication', async () => {
  const response = await request(app).get('/api/session');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('GET /api/session - should fail with invalid token', async () => {
  const response = await request(app)
    .get('/api/session')
    .set('Authorization', 'Bearer invalidtoken123');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Update Profile Tests
// =============================================================================

test('PATCH /api/session - should update user profile', async () => {
  const { token } = await createTestUser({
    email: 'update@example.com',
    name: 'Original Name',
  });

  const response = await request(app)
    .patch('/api/session')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Updated Name',
      phone: '1234567890',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.name, 'Updated Name');
  assert.equal(response.body.data.user.phone, '1234567890');
});

test('PATCH /api/session - should not update disallowed fields', async () => {
  const { token } = await createTestUser({
    email: 'update2@example.com',
    role: 'user',
  });

  const response = await request(app)
    .patch('/api/session')
    .set('Authorization', `Bearer ${token}`)
    .send({
      role: 'admin', // Should not be allowed
      email: 'hacker@example.com', // Should not be allowed
    });

  assert.equal(response.status, 200);
  // Role should NOT be changed
  assert.equal(response.body.data.user.role, 'user');
  // Email should NOT be changed
  assert.equal(response.body.data.user.email, 'update2@example.com');
});

// =============================================================================
// Logout Tests
// =============================================================================

test('POST /api/session/logout - should logout successfully', async () => {
  const { token } = await createTestUser({
    email: 'logout@example.com',
  });

  const response = await request(app)
    .post('/api/session/logout')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.message.includes('Logged out'));
});

test('POST /api/session/logout - should fail without authentication', async () => {
  const response = await request(app).post('/api/session/logout');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Password Reset Tests
// =============================================================================

test('POST /api/session/forgot-password - should accept valid email', async () => {
  await createTestUser({
    email: 'forgot@example.com',
  });

  const response = await request(app)
    .post('/api/session/forgot-password')
    .send({ email: 'forgot@example.com' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  // Should always return success to prevent email enumeration
  assert.ok(response.body.message.includes('reset link'));
});

test('POST /api/session/forgot-password - should return success even for non-existent email', async () => {
  const response = await request(app)
    .post('/api/session/forgot-password')
    .send({ email: 'nonexistent@example.com' });

  // Should return success to prevent email enumeration
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('POST /api/session/forgot-password - should fail without email', async () => {
  const response = await request(app)
    .post('/api/session/forgot-password')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Get Credentials Tests (Demo credentials endpoint)
// =============================================================================

test('GET /api/session/credentials - should return demo credentials', async () => {
  const response = await request(app).get('/api/session/credentials');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.credentials));
  assert.ok(response.body.data.credentials.length > 0);

  // Each credential should have email, password, role, name
  const cred = response.body.data.credentials[0];
  assert.ok(cred.email);
  assert.ok(cred.password);
  assert.ok(cred.role);
  assert.ok(cred.name);
});

// =============================================================================
// Verify Reset Token Tests
// =============================================================================

test('GET /api/session/verify-reset-token - should fail without token', async () => {
  const response = await request(app).get('/api/session/verify-reset-token');

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('GET /api/session/verify-reset-token - should fail with invalid token', async () => {
  const response = await request(app)
    .get('/api/session/verify-reset-token')
    .query({ token: 'invalidtoken123' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Reset Password Tests
// =============================================================================

test('POST /api/session/reset-password - should fail without token', async () => {
  const response = await request(app)
    .post('/api/session/reset-password')
    .send({ password: 'newpassword123' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('POST /api/session/reset-password - should fail with short password', async () => {
  const response = await request(app)
    .post('/api/session/reset-password')
    .send({ token: 'sometoken', password: 'short' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('8 characters'));
});

test('POST /api/session/reset-password - should fail with invalid token', async () => {
  const response = await request(app)
    .post('/api/session/reset-password')
    .send({ token: 'invalidtoken123', password: 'newpassword123' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
