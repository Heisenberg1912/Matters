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

// =============================================================================
// Get Jobs Tests
// =============================================================================

test('GET /api/jobs - should return jobs for authenticated user', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);
  await createTestJob(user._id, project._id);

  const response = await request(app)
    .get('/api/jobs')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.jobs));
  assert.ok(response.body.data.pagination);
});

test('GET /api/jobs - should require authentication', async () => {
  const response = await request(app).get('/api/jobs');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('GET /api/jobs - contractor should see open jobs', async () => {
  // Create a customer with a project and job
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  await createTestJob(customer._id, project._id, { status: 'open' });

  // Create a contractor
  const { token: contractorToken } = await createTestContractor();

  const response = await request(app)
    .get('/api/jobs')
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.jobs.length > 0);
  // Contractor should see open jobs
  assert.equal(response.body.data.jobs[0].status, 'open');
});

test('GET /api/jobs - should support pagination', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  // Create multiple jobs
  for (let i = 0; i < 5; i++) {
    await createTestJob(user._id, project._id);
  }

  const response = await request(app)
    .get('/api/jobs')
    .query({ page: 1, limit: 2 })
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.pagination.page, 1);
  assert.equal(response.body.data.pagination.limit, 2);
  assert.ok(response.body.data.jobs.length <= 2);
});

// =============================================================================
// Get Single Job Tests
// =============================================================================

test('GET /api/jobs/:id - should return job details', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);
  const job = await createTestJob(user._id, project._id);

  const response = await request(app)
    .get(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data._id, job._id.toString());
  assert.equal(response.body.data.title, job.title);
});

test('GET /api/jobs/:id - should return 404 for non-existent job', async () => {
  const { token } = await createTestUser();
  const fakeId = '507f1f77bcf86cd799439011';

  const response = await request(app)
    .get(`/api/jobs/${fakeId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Create Job Tests
// =============================================================================

test('POST /api/jobs - should create a new job', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);

  const jobData = {
    projectId: project._id.toString(),
    title: 'New Test Job',
    description: 'Test job description',
    budget: { min: 5000, max: 10000 },
    requiredSpecializations: ['Plumbing'],
    workType: 'repair',
  };

  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${token}`)
    .send(jobData);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.title, 'New Test Job');
  assert.equal(response.body.data.status, 'open');
});

test('POST /api/jobs - should fail without project', async () => {
  const { token } = await createTestUser();

  const jobData = {
    title: 'Test Job',
    description: 'Test description',
  };

  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${token}`)
    .send(jobData);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});

test('POST /api/jobs - contractor should not be able to create jobs', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const { token: contractorToken } = await createTestContractor();

  const jobData = {
    projectId: project._id.toString(),
    title: 'Test Job',
    description: 'Test description',
  };

  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${contractorToken}`)
    .send(jobData);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('POST /api/jobs - should fail for other users project', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);

  const jobData = {
    projectId: project._id.toString(),
    title: 'Test Job',
    description: 'Test description',
  };

  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${otherToken}`)
    .send(jobData);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Update Job Tests
// =============================================================================

test('PATCH /api/jobs/:id - should update job', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);
  const job = await createTestJob(user._id, project._id);

  const response = await request(app)
    .patch(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Updated Job Title',
      description: 'Updated description',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.title, 'Updated Job Title');
});

test('PATCH /api/jobs/:id - should fail for non-owner', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);
  const job = await createTestJob(owner._id, project._id);

  const response = await request(app)
    .patch(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .send({ title: 'Hacked Title' });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Delete/Cancel Job Tests
// =============================================================================

test('DELETE /api/jobs/:id - should cancel job', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);
  const job = await createTestJob(user._id, project._id);

  const response = await request(app)
    .delete(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ reason: 'No longer needed' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('DELETE /api/jobs/:id - should fail for non-owner', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);
  const job = await createTestJob(owner._id, project._id);

  const response = await request(app)
    .delete(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${otherToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Bid Tests
// =============================================================================

test('POST /api/jobs/:id/bid - contractor should be able to submit bid', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id, { status: 'open' });
  const { token: contractorToken } = await createTestContractor();

  const bidData = {
    amount: 7500,
    proposal: 'I can complete this job efficiently with my experience.',
    estimatedDuration: '2 weeks',
  };

  const response = await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send(bidData);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
});

test('POST /api/jobs/:id/bid - customer should not be able to bid', async () => {
  const { user: customer, token } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id);

  const response = await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 7500,
      proposal: 'Test proposal',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('POST /api/jobs/:id/bid - should fail without amount', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id);
  const { token: contractorToken } = await createTestContractor();

  const response = await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      proposal: 'Test proposal only',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('POST /api/jobs/:id/bid - should fail for duplicate bid', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id, { status: 'open' });
  const { token: contractorToken } = await createTestContractor();

  const bidData = {
    amount: 7500,
    proposal: 'First bid proposal.',
  };

  // First bid should succeed
  await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send(bidData);

  // Second bid should fail
  const response = await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send(bidData);

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.error.includes('already'));
});

// =============================================================================
// My Postings Tests
// =============================================================================

test('GET /api/jobs/my-postings - should return user posted jobs', async () => {
  const { user, token } = await createTestUser();
  const project = await createTestProject(user._id);
  await createTestJob(user._id, project._id);
  await createTestJob(user._id, project._id);

  const response = await request(app)
    .get('/api/jobs/my-postings')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.jobs));
  assert.equal(response.body.data.jobs.length, 2);
});

test('GET /api/jobs/my-postings - contractor should not access', async () => {
  const { token: contractorToken } = await createTestContractor();

  const response = await request(app)
    .get('/api/jobs/my-postings')
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// My Bids Tests
// =============================================================================

test('GET /api/jobs/my-bids - should return contractor bids', async () => {
  const { user: customer } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id, { status: 'open' });
  const { token: contractorToken } = await createTestContractor();

  // Submit a bid first
  await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      amount: 7500,
      proposal: 'Test proposal',
    });

  const response = await request(app)
    .get('/api/jobs/my-bids')
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.bids));
});

test('GET /api/jobs/my-bids - customer should not access', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .get('/api/jobs/my-bids')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Accept/Reject Bid Tests
// =============================================================================

test('POST /api/jobs/:id/bid/:bidId/accept - owner should accept bid', async () => {
  const { user: customer, token } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id, { status: 'open' });
  const { token: contractorToken } = await createTestContractor();

  // Submit a bid
  await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      amount: 7500,
      proposal: 'Test proposal',
    });

  // Get the job with bids
  const jobResponse = await request(app)
    .get(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${token}`);

  const bidId = jobResponse.body.data.bids[0]._id;

  // Accept the bid
  const response = await request(app)
    .post(`/api/jobs/${job._id}/bid/${bidId}/accept`)
    .set('Authorization', `Bearer ${token}`)
    .send({ note: 'Looking forward to working with you!' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.job.status, 'assigned');
});

test('POST /api/jobs/:id/bid/:bidId/reject - owner should reject bid', async () => {
  const { user: customer, token } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id, { status: 'open' });
  const { token: contractorToken } = await createTestContractor();

  // Submit a bid
  await request(app)
    .post(`/api/jobs/${job._id}/bid`)
    .set('Authorization', `Bearer ${contractorToken}`)
    .send({
      amount: 7500,
      proposal: 'Test proposal',
    });

  // Get the job with bids
  const jobResponse = await request(app)
    .get(`/api/jobs/${job._id}`)
    .set('Authorization', `Bearer ${token}`);

  const bidId = jobResponse.body.data.bids[0]._id;

  // Reject the bid
  const response = await request(app)
    .post(`/api/jobs/${job._id}/bid/${bidId}/reject`)
    .set('Authorization', `Bearer ${token}`)
    .send({ note: 'Budget too high' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

// =============================================================================
// Assigned Jobs Tests
// =============================================================================

test('GET /api/jobs/assigned - contractor should see assigned jobs', async () => {
  const { token: contractorToken } = await createTestContractor();

  const response = await request(app)
    .get('/api/jobs/assigned')
    .set('Authorization', `Bearer ${contractorToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
});

test('GET /api/jobs/assigned - customer should not access', async () => {
  const { token } = await createTestUser();

  const response = await request(app)
    .get('/api/jobs/assigned')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

// =============================================================================
// Job Bids List Tests
// =============================================================================

test('GET /api/jobs/:id/bids - owner should see all bids', async () => {
  const { user: customer, token } = await createTestUser({ email: 'customer@test.com' });
  const project = await createTestProject(customer._id);
  const job = await createTestJob(customer._id, project._id, { status: 'open' });

  const response = await request(app)
    .get(`/api/jobs/${job._id}/bids`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.bids !== undefined);
  assert.ok(response.body.data.summary);
});

test('GET /api/jobs/:id/bids - non-owner should not see bids', async () => {
  const { user: owner } = await createTestUser({ email: 'owner@test.com' });
  const { token: otherToken } = await createTestUser({ email: 'other@test.com' });
  const project = await createTestProject(owner._id);
  const job = await createTestJob(owner._id, project._id);

  const response = await request(app)
    .get(`/api/jobs/${job._id}/bids`)
    .set('Authorization', `Bearer ${otherToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});
