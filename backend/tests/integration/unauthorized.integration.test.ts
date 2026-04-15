import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('unauthorized access', () => {
  it('returns 401 when calling a protected route without a bearer token', async () => {
    const app = createApp();

    const res = await request(app).get('/projects');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('requestId');
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
