import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';

const projectListSelect = {
  id: true,
  name: true,
  description: true,
  owner_id: true,
  created_at: true,
} satisfies Prisma.ProjectSelect;

export type ProjectListRow = Prisma.ProjectGetPayload<{ select: typeof projectListSelect }>;

const projectWithTasksInclude = {
  tasks: {
    orderBy: { created_at: 'asc' as const },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectWithTasks = Prisma.ProjectGetPayload<{ include: typeof projectWithTasksInclude }>;

function visibleToUserWhere(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [
      { owner_id: userId },
      { tasks: { some: { assignee_id: userId } } },
      { tasks: { some: { created_by: userId } } },
    ],
  };
}

export function createProjectRepository() {
  return {
    async findManyVisibleToUserPaginated(
      userId: string,
      skip: number,
      take: number,
    ): Promise<ProjectListRow[]> {
      return prisma.project.findMany({
        where: visibleToUserWhere(userId),
        select: projectListSelect,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      });
    },

    async countVisibleToUser(userId: string): Promise<number> {
      return prisma.project.count({
        where: visibleToUserWhere(userId),
      });
    },

    async findById(projectId: string) {
      return prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, owner_id: true },
      });
    },

    async findByIdWithTasksIfVisible(projectId: string, userId: string): Promise<ProjectWithTasks | null> {
      return prisma.project.findFirst({
        where: {
          AND: [{ id: projectId }, visibleToUserWhere(userId)],
        },
        include: projectWithTasksInclude,
      });
    },

    async create(data: { name: string; description: string; owner_id: string }) {
      return prisma.project.create({
        data,
        select: projectListSelect,
      });
    },

    async update(projectId: string, data: Prisma.ProjectUpdateInput) {
      return prisma.project.update({
        where: { id: projectId },
        data,
        select: projectListSelect,
      });
    },

    async delete(projectId: string): Promise<void> {
      await prisma.project.delete({
        where: { id: projectId },
      });
    },
  };
}

export type ProjectRepository = ReturnType<typeof createProjectRepository>;
