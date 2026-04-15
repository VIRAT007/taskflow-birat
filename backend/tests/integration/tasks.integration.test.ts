import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('create task', () => {
  it('creates a project and a task when authenticated', async () => {
    const app = createApp();
    const email = `task-owner-${Date.now()}@integration.test`;
    const password = 'password-integration-12';

    const reg = await request(app).post('/auth/register').send({
      name: 'Task Owner',
      email,
      password,
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token as string;

    const proj = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Integration project',
        description: 'For task creation test',
      });

    expect(proj.status).toBe(201);
    const projectId = proj.body.project.id as string;

    const taskRes = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Integration task',
        description: 'Task body',
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.task).toMatchObject({
      title: 'Integration task',
      description: 'Task body',
      project_id: projectId,
    });
    expect(taskRes.body.task).toHaveProperty('id');
    expect(taskRes.body.task).toHaveProperty('created_by');
  });
});
