import type { Request, RequestHandler } from 'express';

import { readFirstQuery } from '../../lib/readQueryParam';
import { UnauthorizedError, ValidationError } from '../../lib/httpError';
import { createTaskRepository } from './task.repository';
import { createTaskService } from './task.service';
import {
  createTaskSchema,
  listTasksQuerySchema,
  projectIdParamsSchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from './task.schema';

const repository = createTaskRepository();
const taskService = createTaskService(repository);

function requireUserId(req: Request): string {
  const userId = req.user?.user_id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export const listTasks: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = projectIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }

    const queryParsed = listTasksQuerySchema.safeParse({
      status: readFirstQuery(req.query['status']),
      assignee: readFirstQuery(req.query['assignee']),
      page: readFirstQuery(req.query['page']),
      limit: readFirstQuery(req.query['limit']),
    });
    if (!queryParsed.success) {
      next(new ValidationError('Validation failed', queryParsed.error.flatten()));
      return;
    }

    const userId = requireUserId(req);
    const { tasks, meta } = await taskService.listForProject(userId, paramsParsed.data.id, queryParsed.data);
    res.status(200).json({ tasks, meta });
  } catch (err) {
    next(err);
  }
};

export const createTask: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = projectIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }

    const bodyParsed = createTaskSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      next(new ValidationError('Validation failed', bodyParsed.error.flatten()));
      return;
    }

    const userId = requireUserId(req);
    const task = await taskService.createInProject(userId, paramsParsed.data.id, bodyParsed.data);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

export const updateTask: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = taskIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }

    const bodyParsed = updateTaskSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      next(new ValidationError('Validation failed', bodyParsed.error.flatten()));
      return;
    }

    const userId = requireUserId(req);
    const task = await taskService.updateForUser(userId, paramsParsed.data.id, bodyParsed.data);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
};

export const getProjectStats: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = projectIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }
    const userId = requireUserId(req);
    const stats = await taskService.getProjectStats(userId, paramsParsed.data.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

export const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = taskIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }

    const userId = requireUserId(req);
    await taskService.deleteForUser(userId, paramsParsed.data.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
