import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { getApp } from './setup.js';

test('GET /api/health returns ok status', async () => {
  const app = await getApp();
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});
