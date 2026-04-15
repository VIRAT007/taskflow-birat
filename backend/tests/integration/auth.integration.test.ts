import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('auth register + login', () => {
  it('registers a user then logs in with the same credentials', async () => {
    const app = createApp();
    const email = `user-${Date.now()}@integration.test`;
    const password = 'password-integration-12';

    const reg = await request(app).post('/auth/register').send({
      name: 'Integration User',
      email,
      password,
    });

    expect(reg.status).toBe(201);
    expect(reg.body).toHaveProperty('token');
    expect(reg.body.user).toMatchObject({
      name: 'Integration User',
      email,
    });
    expect(reg.body.user).not.toHaveProperty('password');

    const login = await request(app).post('/auth/login').send({
      email,
      password,
    });

    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');
    expect(login.body.user).toMatchObject({ email });
    expect(typeof login.body.token).toBe('string');
    expect(login.body.token.length).toBeGreaterThan(10);
  });
});
