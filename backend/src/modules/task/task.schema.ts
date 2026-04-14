import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

import { paginationQuerySchema } from '../../lib/pagination.schema';

export const listTasksQuerySchema = z
  .object({
    status: z.nativeEnum(TaskStatus).optional(),
    assignee: z.union([z.literal('unassigned'), z.string().uuid()]).optional(),
  })
  .merge(paginationQuerySchema);

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const projectIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const taskIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10_000),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignee_id: z.union([z.string().uuid(), z.null()]).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().min(1).max(10_000).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assignee_id: z.union([z.string().uuid(), z.null()]).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.assignee_id !== undefined,
    { message: 'At least one field is required' },
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
