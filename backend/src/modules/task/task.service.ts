import { TaskPriority, TaskStatus } from '@prisma/client';

import { buildPaginationMeta } from '../../lib/pagination.schema';
import type { PaginationMeta } from '../../lib/pagination.schema';
import { ForbiddenError, NotFoundError } from '../../lib/httpError';
import type { TaskListFilters, TaskRepository } from './task.repository';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './task.schema';

function toListFilters(query: ListTasksQuery): TaskListFilters {
  const filters: TaskListFilters = {};
  if (query.status !== undefined) {
    filters.status = query.status;
  }
  if (query.assignee === 'unassigned') {
    filters.assigneeId = null;
  } else if (query.assignee !== undefined) {
    filters.assigneeId = query.assignee;
  }
  return filters;
}

export interface ProjectTaskStats {
  by_status: Record<TaskStatus, number>;
  by_assignee: { assignee_id: string | null; count: number }[];
}

export interface PaginatedTasks {
  tasks: Awaited<ReturnType<TaskRepository['findManyForProjectPaginated']>>;
  meta: PaginationMeta;
}

export function createTaskService(repository: TaskRepository) {
  return {
    async listForProject(userId: string, projectId: string, query: ListTasksQuery): Promise<PaginatedTasks> {
      const filters = toListFilters(query);
      const skip = (query.page - 1) * query.limit;
      const [tasks, total] = await Promise.all([
        repository.findManyForProjectPaginated(projectId, userId, filters, skip, query.limit),
        repository.countForProject(projectId, userId, filters),
      ]);
      return {
        tasks,
        meta: buildPaginationMeta(
          { page: query.page, limit: query.limit },
          total,
        ),
      };
    },

    async getProjectStats(userId: string, projectId: string): Promise<ProjectTaskStats> {
      const access = await repository.findProjectForMember(projectId, userId);
      if (!access) {
        throw new NotFoundError('Project not found');
      }

      const [byStatusRows, byAssigneeRows] = await Promise.all([
        repository.groupTaskCountsByStatus(projectId, userId),
        repository.groupTaskCountsByAssignee(projectId, userId),
      ]);

      const by_status: Record<TaskStatus, number> = {
        [TaskStatus.todo]: 0,
        [TaskStatus.in_progress]: 0,
        [TaskStatus.done]: 0,
      };
      for (const row of byStatusRows) {
        by_status[row.status] = row._count._all;
      }

      const by_assignee = byAssigneeRows.map((row) => ({
        assignee_id: row.assignee_id,
        count: row._count._all,
      }));

      return { by_status, by_assignee };
    },

    async createInProject(userId: string, projectId: string, input: CreateTaskInput) {
      const project = await repository.findProjectForMember(projectId, userId);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return repository.create({
        project_id: projectId,
        title: input.title,
        description: input.description,
        status: input.status ?? TaskStatus.todo,
        priority: input.priority ?? TaskPriority.medium,
        assignee_id: input.assignee_id === undefined ? null : input.assignee_id,
        created_by: userId,
      });
    },

    async updateForUser(userId: string, taskId: string, input: UpdateTaskInput) {
      const task = await repository.findByIdForUserIfVisible(taskId, userId);
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const ownerId = task.project.owner_id;
      const isOwner = ownerId === userId;
      const isCreator = task.created_by === userId;
      const isAssignee = task.assignee_id === userId;
      if (!isOwner && !isCreator && !isAssignee) {
        throw new ForbiddenError('You cannot update this task');
      }

      return repository.update(taskId, {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assignee_id !== undefined ? { assignee_id: input.assignee_id } : {}),
      });
    },

    async deleteForUser(userId: string, taskId: string): Promise<void> {
      const task = await repository.findByIdForUserIfVisible(taskId, userId);
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const isOwner = task.project.owner_id === userId;
      const isCreator = task.created_by === userId;
      if (!isOwner && !isCreator) {
        throw new ForbiddenError('Only the project owner or task creator can delete this task');
      }

      await repository.delete(taskId);
    },
  };
}
