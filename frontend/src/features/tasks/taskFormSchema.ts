import { z } from 'zod'

import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/task'

const statusEnum = z.enum(TASK_STATUSES)
const priorityEnum = z.enum(TASK_PRIORITIES)

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1, 'Description is required').max(10_000),
  status: statusEnum,
  priority: priorityEnum,
  assignee: z.union([z.literal('__none__'), z.string().uuid()]),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
