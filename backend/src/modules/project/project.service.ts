import type { PaginationMeta, PaginationQuery } from '../../lib/pagination.schema';
import { buildPaginationMeta } from '../../lib/pagination.schema';
import { ForbiddenError, NotFoundError } from '../../lib/httpError';
import type { ProjectRepository } from './project.repository';
import type { CreateProjectInput, UpdateProjectInput } from './project.schema';

export interface PaginatedProjects {
  projects: Awaited<ReturnType<ProjectRepository['findManyVisibleToUserPaginated']>>;
  meta: PaginationMeta;
}

export function createProjectService(repository: ProjectRepository) {
  return {
    async listForUser(userId: string, pagination: PaginationQuery): Promise<PaginatedProjects> {
      const skip = (pagination.page - 1) * pagination.limit;
      const [projects, total] = await Promise.all([
        repository.findManyVisibleToUserPaginated(userId, skip, pagination.limit),
        repository.countVisibleToUser(userId),
      ]);
      return {
        projects,
        meta: buildPaginationMeta(pagination, total),
      };
    },

    async createForOwner(userId: string, input: CreateProjectInput) {
      return repository.create({
        name: input.name,
        description: input.description,
        owner_id: userId,
      });
    },

    async getByIdForUser(userId: string, projectId: string) {
      const project = await repository.findByIdWithTasksIfVisible(projectId, userId);
      if (!project) {
        throw new NotFoundError('Project not found');
      }
      return project;
    },

    async updateByOwner(userId: string, projectId: string, input: UpdateProjectInput) {
      const existing = await repository.findById(projectId);
      if (!existing) {
        throw new NotFoundError('Project not found');
      }
      if (existing.owner_id !== userId) {
        throw new ForbiddenError('Only the project owner can update this project');
      }
      return repository.update(projectId, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      });
    },

    async deleteByOwner(userId: string, projectId: string): Promise<void> {
      const existing = await repository.findById(projectId);
      if (!existing) {
        throw new NotFoundError('Project not found');
      }
      if (existing.owner_id !== userId) {
        throw new ForbiddenError('Only the project owner can delete this project');
      }
      await repository.delete(projectId);
    },
  };
}
