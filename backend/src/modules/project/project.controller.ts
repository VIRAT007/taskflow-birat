import type { Request, RequestHandler } from 'express';

import { paginationQuerySchema } from '../../lib/pagination.schema';
import { readFirstQuery } from '../../lib/readQueryParam';
import { UnauthorizedError, ValidationError } from '../../lib/httpError';
import { createProjectRepository } from './project.repository';
import { createProjectService } from './project.service';
import {
  createProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from './project.schema';

const repository = createProjectRepository();
const projectService = createProjectService(repository);

function requireUserId(req: Request): string {
  const userId = req.user?.user_id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export const listProjects: RequestHandler = async (req, res, next) => {
  try {
    const paginationParsed = paginationQuerySchema.safeParse({
      page: readFirstQuery(req.query['page']),
      limit: readFirstQuery(req.query['limit']),
    });
    if (!paginationParsed.success) {
      next(new ValidationError('Validation failed', paginationParsed.error.flatten()));
      return;
    }
    const userId = requireUserId(req);
    const { projects, meta } = await projectService.listForUser(userId, paginationParsed.data);
    res.status(200).json({ projects, meta });
  } catch (err) {
    next(err);
  }
};

export const createProject: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ValidationError('Validation failed', parsed.error.flatten()));
      return;
    }
    const userId = requireUserId(req);
    const project = await projectService.createForOwner(userId, parsed.data);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
};

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = projectIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }
    const userId = requireUserId(req);
    const project = await projectService.getByIdForUser(userId, paramsParsed.data.id);
    res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
};

export const updateProject: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = projectIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }
    const bodyParsed = updateProjectSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      next(new ValidationError('Validation failed', bodyParsed.error.flatten()));
      return;
    }
    const userId = requireUserId(req);
    const project = await projectService.updateByOwner(userId, paramsParsed.data.id, bodyParsed.data);
    res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject: RequestHandler = async (req, res, next) => {
  try {
    const paramsParsed = projectIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      next(new ValidationError('Validation failed', paramsParsed.error.flatten()));
      return;
    }
    const userId = requireUserId(req);
    await projectService.deleteByOwner(userId, paramsParsed.data.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
