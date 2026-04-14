import express, { Router } from 'express';

import { authMiddleware } from './middlewares/auth.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { requestContextMiddleware } from './middlewares/requestContext.middleware';
import { requestLogMiddleware } from './middlewares/requestLog.middleware';
import { login, register } from './modules/auth/auth.controller';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from './modules/project/project.controller';
import { createTask, deleteTask, getProjectStats, listTasks, updateTask } from './modules/task/task.controller';
import { healthRouter } from './routes/health.routes';

export function createApp(): express.Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestContextMiddleware);
  app.use(requestLogMiddleware);
  app.use(express.json());

  app.use('/health', healthRouter);

  const authRouter = Router();
  authRouter.post('/register', register);
  authRouter.post('/login', login);
  app.use('/auth', authRouter);

  const projectRouter = Router();
  projectRouter.use(authMiddleware);
  projectRouter.get('/', listProjects);
  projectRouter.post('/', createProject);
  projectRouter.get('/:id/stats', getProjectStats);
  projectRouter.get('/:id/tasks', listTasks);
  projectRouter.post('/:id/tasks', createTask);
  projectRouter.get('/:id', getProject);
  projectRouter.patch('/:id', updateProject);
  projectRouter.delete('/:id', deleteProject);
  app.use('/projects', projectRouter);

  const taskRouter = Router();
  taskRouter.use(authMiddleware);
  taskRouter.patch('/:id', updateTask);
  taskRouter.delete('/:id', deleteTask);
  app.use('/tasks', taskRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
