import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestUser,
  getApp,
} from './setup.js';

let app;

test.before(async () => {
  await setupTestDatabase();
  app = await getApp();
});

test.after(async () => {
  await teardownTestDatabase();
});

test.beforeEach(async () => {
  await clearDatabase();
});

// Basic registration test
test('POST /api/session/register - should register a new user', async () => {
  const response = await request(app)
    .post('/api/session/register')
    .send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.token);
});

// Basic login test
test('POST /api/session/login - should login with valid credentials', async () => {
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
  assert.ok(response.body.data.token);
});

// Basic auth check
test('GET /api/session - should return current user when authenticated', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .get('/api/session')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('GET /api/session - should fail without authentication', async () => {
  const response = await request(app).get('/api/session');
  assert.equal(response.status, 401);
});
