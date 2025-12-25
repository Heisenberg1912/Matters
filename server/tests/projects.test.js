import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestUser,
  createTestContractor,
  createTestAdmin,
  createTestProject,
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
// Get Projects Tests
// =============================================================================

test('GET /api/projects - should return user projects', async () => {
  const { user, token } = await createTestUser();
  await createTestProject(user._id);
  await createTestProject(user._id);

  const response = await request(app)
    .get('/api/projects')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.projects));
  assert.equal(response.body.data.projects.length, 2);
  assert.ok(response.body.data.pagination);
});

test('GET /api/projects - should require authentication', async () => {
  const response = await request(app).get('/api/projects');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('GET /api/projects - should support filtering by status', async () => {
  const { user, token } = await createTestUser();
  await createTestProject(user._id, { status: 'in_progress' });
  await createTestProject(user._id, { status: 'completed' });

  const response = await request(app)
    .get('/api/projects')
    .query({ status: 'in_progress' })
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.projects.length, 1);
  assert.equal(response.body.data.projects[0].status, 'in_progress');
});

test('GET /api/projects - should support pagination', async () => {
  const { user, token } = await createTestUser();

  // Create multiple projects
  for (let i = 0; i < 5; i++) {
    await createTestProject(user._id);
  }

  const response = await request(app)
    .get('/api/projects')
    .query({ page: 1, limit: 2 })
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.pagination.page, 1);
  assert.equal(response.body.data.pagination.limit, 2);
  assert.ok(response.body.data.projects.length <= 2);
});

// =============================================================================
// Get Single Project Tests
// =============================================================================

test('GET /api/projects/:id - should return project details', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id, { name: 'Test Project' });

  const response = await request(app)
    .get(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.project.name, 'Test Project');
});

test('GET /api/projects/:id - should return 404 for non-existent project', async () => {
  const { token } = await createTestUser();
  const fakeId = '507f1f77bcf86cd799439011';

  const response = await request(app)
    .get(`/api/projects/${fakeId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test('GET /api/projects/:id - should deny access to non-member', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .get(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${otherToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('GET /api/projects/:id - admin should have access', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: adminToken } = await createTestAdmin();
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .get(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

// =============================================================================
// Create Project Tests
// =============================================================================

test('POST /api/projects - should create a new project', async () => {
  const { token } = await createTestUser();

  const projectData = {
    name: 'New Test Project',
    description: 'A test project description',
    type: 'residential',
    priority: 'high',
    budget: { estimated: 500000 },
    location: {
      address: '456 Test Ave',
      city: 'Test City',
      state: 'Test State',
    },
  };

  const response = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send(projectData);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.project.name, 'New Test Project');
  assert.equal(response.body.data.project.type, 'residential');
});

test('POST /api/projects - should fail without name', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      description: 'Missing name',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('POST /api/projects - should create default stages', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Project with Stages',
      createDefaultStages: true,
    });

  assert.equal(response.status, 201);
  // Check that stages were created
  assert.ok(response.body.data.project.stages);
  assert.ok(response.body.data.project.stages.length > 0);
});

// =============================================================================
// Update Project Tests
// =============================================================================

test('PATCH /api/projects/:id - should update project', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  const response = await request(app)
    .patch(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Updated Project Name',
      description: 'Updated description',
      priority: 'high',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.project.name, 'Updated Project Name');
  assert.equal(response.body.data.project.priority, 'high');
});

test('PATCH /api/projects/:id - should fail for non-owner', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .patch(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .send({ name: 'Hacked Name' });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('PATCH /api/projects/:id - admin can update any project', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: adminToken } = await createTestAdmin();
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .patch(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Admin Updated Name' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.project.name, 'Admin Updated Name');
});

// =============================================================================
// Delete Project Tests
// =============================================================================

test('DELETE /api/projects/:id - should delete project', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  const response = await request(app)
    .delete(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  // Verify it's deleted
  const getResponse = await request(app)
    .get(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(getResponse.status, 404);
});

test('DELETE /api/projects/:id - should fail for non-owner', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .delete(`/api/projects/${project._id}`)
    .set('Authorization', `Bearer ${otherToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Team Management Tests
// =============================================================================

test('GET /api/projects/:id/team - should return project team', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  const response = await request(app)
    .get(`/api/projects/${project._id}/team`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.team !== undefined);
});

test('POST /api/projects/:id/team - should add team member by userId', async () => {
  const { user: owner, token } = await createTestUser({ email: 'owner@test.com' });
  const { user: member } = await createTestUser({ email: 'member@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .post(`/api/projects/${project._id}/team`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      userId: member._id.toString(),
      role: 'editor',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('POST /api/projects/:id/team - should send invitation for new email', async () => {
  const { user: owner, token } = await createTestUser({ email: 'owner@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .post(`/api/projects/${project._id}/team`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      email: 'newuser@example.com',
      role: 'viewer',
    });

  // Should return 202 for invitation sent
  assert.equal(response.status, 202);
  assert.equal(response.body.success, true);
  assert.ok(response.body.message.includes('Invitation'));
});

test('POST /api/projects/:id/team - non-owner should not add members', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken, user: other } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .post(`/api/projects/${project._id}/team`)
    .set('Authorization', `Bearer ${otherToken}`)
    .send({
      userId: other._id.toString(),
      role: 'editor',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('POST /api/projects/:id/team - should fail without userId or email', async () => {
  const { user: owner, token } = await createTestUser({ email: 'owner@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .post(`/api/projects/${project._id}/team`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      role: 'editor',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('DELETE /api/projects/:id/team/:userId - should remove team member', async () => {
  const { user: owner, token } = await createTestUser({ email: 'owner@test.com' });
  const { user: member } = await createTestUser({ email: 'member@test.com' });
  const project = await createTestProject(owner._id);

  // Add member first
  await request(app)
    .post(`/api/projects/${project._id}/team`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      userId: member._id.toString(),
      role: 'editor',
    });

  // Remove member
  const response = await request(app)
    .delete(`/api/projects/${project._id}/team/${member._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

// =============================================================================
// Project Stats Tests
// =============================================================================

test('GET /api/projects/:id/stats - should return project statistics', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  const response = await request(app)
    .get(`/api/projects/${project._id}/stats`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.stages !== undefined);
  assert.ok(response.body.data.progress !== undefined);
  assert.ok(response.body.data.budget !== undefined);
});

// =============================================================================
// Accept Invitation Tests
// =============================================================================

test('POST /api/projects/invites/accept - should fail without token', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .post('/api/projects/invites/accept')
    .set('Authorization', `Bearer ${token}`)
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('POST /api/projects/invites/accept - should fail with invalid token', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .post('/api/projects/invites/accept')
    .set('Authorization', `Bearer ${token}`)
    .send({ token: 'invalidtoken123' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
