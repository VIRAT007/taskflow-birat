import type { Prisma, TaskPriority, TaskStatus } from '@prisma/client';

import { prisma } from '../../lib/prisma';

export function projectVisibleWhere(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [
      { owner_id: userId },
      { tasks: { some: { assignee_id: userId } } },
      { tasks: { some: { created_by: userId } } },
    ],
  };
}

export interface TaskListFilters {
  status?: TaskStatus;
  /** `null` means filter for unassigned tasks */
  assigneeId?: string | null;
}

function buildTaskListWhere(projectId: string, userId: string, filters: TaskListFilters): Prisma.TaskWhereInput {
  const assigneeClause: Prisma.TaskWhereInput =
    filters.assigneeId === undefined
      ? {}
      : filters.assigneeId === null
        ? { assignee_id: null }
        : { assignee_id: filters.assigneeId };

  return {
    project_id: projectId,
    project: projectVisibleWhere(userId),
    ...(filters.status !== undefined ? { status: filters.status } : {}),
    ...assigneeClause,
  };
}

export function createTaskRepository() {
  return {
    async findManyForProjectPaginated(
      projectId: string,
      userId: string,
      filters: TaskListFilters,
      skip: number,
      take: number,
    ) {
      return prisma.task.findMany({
        where: buildTaskListWhere(projectId, userId, filters),
        orderBy: { created_at: 'asc' },
        skip,
        take,
      });
    },

    async countForProject(projectId: string, userId: string, filters: TaskListFilters): Promise<number> {
      return prisma.task.count({
        where: buildTaskListWhere(projectId, userId, filters),
      });
    },

    async groupTaskCountsByStatus(projectId: string, userId: string) {
      return prisma.task.groupBy({
        by: ['status'],
        where: buildTaskListWhere(projectId, userId, {}),
        _count: { _all: true },
      });
    },

    async groupTaskCountsByAssignee(projectId: string, userId: string) {
      return prisma.task.groupBy({
        by: ['assignee_id'],
        where: buildTaskListWhere(projectId, userId, {}),
        _count: { _all: true },
      });
    },

    async findProjectForMember(projectId: string, userId: string) {
      return prisma.project.findFirst({
        where: {
          id: projectId,
          ...projectVisibleWhere(userId),
        },
        select: { id: true },
      });
    },

    async create(data: {
      project_id: string;
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      assignee_id: string | null;
      created_by: string;
    }) {
      return prisma.task.create({ data });
    },

    async findByIdForUserIfVisible(taskId: string, userId: string) {
      return prisma.task.findFirst({
        where: {
          id: taskId,
          project: projectVisibleWhere(userId),
        },
        include: {
          project: {
            select: { owner_id: true },
          },
        },
      });
    },

    async update(taskId: string, data: Prisma.TaskUpdateInput) {
      return prisma.task.update({
        where: { id: taskId },
        data,
      });
    },

    async delete(taskId: string): Promise<void> {
      await prisma.task.delete({ where: { id: taskId } });
    },
  };
}

export type TaskRepository = ReturnType<typeof createTaskRepository>;
