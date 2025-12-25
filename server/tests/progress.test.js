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
  createTestProject,
  createTestJob,
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

// Helper to assign contractor to a project via job
async function assignContractorToProject(customerId, projectId, contractorId) {
  const Job = (await import('../src/models/Job.js')).default;
  const Project = (await import('../src/models/Project.js')).default;

  const job = await Job.create({
    project: projectId,
    postedBy: customerId,
    title: 'Test Job for Progress',
    description: 'Test job',
    budget: { min: 5000, max: 10000 },
    status: 'assigned',
    assignedContractor: contractorId,
  });

  await Project.findByIdAndUpdate(projectId, { contractor: contractorId });

  return job;
}

// =============================================================================
// Get Progress Updates Tests
// =============================================================================

test('GET /api/progress/project/:projectId - should return project progress updates', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  const response = await request(app)
    .get(`/api/progress/project/${project._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.updates));
  assert.ok(response.body.data.pagination);
});

test('GET /api/progress/project/:projectId - should require authentication', async () => {
  const { user } = await createTestUser();
  const project = await createTestProject(user._id);

  const response = await request(app)
    .get(`/api/progress/project/${project._id}`);

  assert.equal(response.status, 401);
});

test('GET /api/progress/project/:projectId - should return 404 for non-existent project', async () => {
  const { token } = await createTestUser();
  const fakeId = '507f1f77bcf86cd799439011';

  const response = await request(app)
    .get(`/api/progress/project/${fakeId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test('GET /api/progress/project/:projectId - should deny access to non-member', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);

  const response = await request(app)
    .get(`/api/progress/project/${project._id}`)
    .set('Authorization', `Bearer ${otherToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Contractor My Updates Tests
// =============================================================================

test('GET /api/progress/my-updates - contractor should see own updates', async () => {
  const { token: contractorToken } = await createTestContractor();

  const response = await request(app)
    .get('/api/progress/my-updates')
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.updates));
});

test('GET /api/progress/my-updates - customer should not access', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .get('/api/progress/my-updates')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Create Progress Update Tests
// =============================================================================

test('POST /api/progress - contractor should create progress update', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  // Assign contractor to project
  await assignContractorToProject(customer._id, project._id, contractor._id);

  const progressData = {
    projectId: project._id.toString(),
    type: 'daily',
    title: 'Day 1 Progress',
    description: 'Completed foundation work',
    workDone: ['Excavation', 'Foundation laying'],
    hoursWorked: 8,
    workersOnSite: 5,
    progressPercentage: 10,
    customerVisible: true,
  };

  const response = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send(progressData);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.title, 'Day 1 Progress');
  assert.equal(response.body.data.type, 'daily');
});

test('POST /api/progress - customer should not create progress updates', async () => {
  const { user: customer, token } = await createTestUser();
  const project = await createTestProject(customer._id);

  const response = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${token}`)
    .send({
      projectId: project._id.toString(),
      title: 'Test Progress',
      description: 'Test description',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('POST /api/progress - should fail for project not found', async () => {
  const { token: contractorToken } = await createTestContractor();
  const fakeId = '507f1f77bcf86cd799439011';

  const response = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: fakeId,
      title: 'Test Progress',
      description: 'Test description',
    });

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test('POST /api/progress - should fail for unassigned contractor', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  // Contractor is NOT assigned to project

  const response = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Test Progress',
      description: 'Test description',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('not assigned'));
});

// =============================================================================
// Update Progress Tests
// =============================================================================

test('PATCH /api/progress/:id - contractor should update own progress', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Original Title',
      description: 'Original description',
    });

  const progressId = createResponse.body.data._id;

  // Update it
  const response = await request(app)
    .patch(`/api/progress/${progressId}`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      title: 'Updated Title',
      description: 'Updated description',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.title, 'Updated Title');
});

test('PATCH /api/progress/:id - should fail for other contractors updates', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor1, token: contractorToken1 } = await createTestContractor({ email: 'contractor1@test.com' });
  const { token: contractorToken2 } = await createTestContractor({ email: 'contractor2@test.com' });
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor1._id);

  // Create progress update as contractor1
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken1}`)
    .send({
      projectId: project._id.toString(),
      title: 'Contractor 1 Progress',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Try to update as contractor2
  const response = await request(app)
    .patch(`/api/progress/${progressId}`)
    .set('Authorization', `Bearer ${contractorToken2}`)
    .send({
      title: 'Hacked Title',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Delete Progress Tests
// =============================================================================

test('DELETE /api/progress/:id - contractor should delete own recent progress', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'To Be Deleted',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Delete it (within 1 hour)
  const response = await request(app)
    .delete(`/api/progress/${progressId}`)
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('DELETE /api/progress/:id - should fail for other contractors updates', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor1, token: contractorToken1 } = await createTestContractor({ email: 'contractor1@test.com' });
  const { token: contractorToken2 } = await createTestContractor({ email: 'contractor2@test.com' });
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor1._id);

  // Create progress update as contractor1
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken1}`)
    .send({
      projectId: project._id.toString(),
      title: 'Contractor 1 Progress',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Try to delete as contractor2
  const response = await request(app)
    .delete(`/api/progress/${progressId}`)
    .set('Authorization', `Bearer ${contractorToken2}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Acknowledge Progress Tests
// =============================================================================

test('POST /api/progress/:id/acknowledge - customer should acknowledge update', async () => {
  const { user: customer, token: customerToken } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Progress to Acknowledge',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Customer acknowledges
  const response = await request(app)
    .post(`/api/progress/${progressId}/acknowledge`)
    .set('Authorization', `Bearer ${customerToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('POST /api/progress/:id/acknowledge - contractor should not acknowledge', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Progress Update',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Contractor tries to acknowledge (should fail)
  const response = await request(app)
    .post(`/api/progress/${progressId}/acknowledge`)
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Comment Tests
// =============================================================================

test('POST /api/progress/:id/comment - should add comment', async () => {
  const { user: customer, token: customerToken } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Progress Update',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Add comment
  const response = await request(app)
    .post(`/api/progress/${progressId}/comment`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ text: 'Looks great!' });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.text);
});

test('POST /api/progress/:id/comment - should fail without text', async () => {
  const { user: customer, token: customerToken } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Progress Update',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Try to add empty comment
  const response = await request(app)
    .post(`/api/progress/${progressId}/comment`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ text: '' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Get Single Progress Update Tests
// =============================================================================

test('GET /api/progress/:id - should return progress update details', async () => {
  const { user: customer, token: customerToken } = await createTestUser({ email: 'customer@test.com' });
  const { user: contractor, token: contractorToken } = await createTestContractor();
  const project = await createTestProject(customer._id);

  await assignContractorToProject(customer._id, project._id, contractor._id);

  // Create progress update
  const createResponse = await request(app)
    .post('/api/progress')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      projectId: project._id.toString(),
      title: 'Detailed Progress',
      description: 'Test description',
    });

  const progressId = createResponse.body.data._id;

  // Get the update
  const response = await request(app)
    .get(`/api/progress/${progressId}`)
    .set('Authorization', `Bearer ${customerToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.title, 'Detailed Progress');
});

test('GET /api/progress/:id - should return 404 for non-existent update', async () => {
  const { token } = await createTestUser();
  const fakeId = '507f1f77bcf86cd799439011';

  const response = await request(app)
    .get(`/api/progress/${fakeId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});
