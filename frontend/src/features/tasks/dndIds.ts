import { TASK_STATUSES, type TaskStatus } from '@/types/task'

export const COLUMN_PREFIX = 'column-' as const
export const TASK_PREFIX = 'task-' as const

export function columnDroppableId(status: TaskStatus): string {
  return `${COLUMN_PREFIX}${status}`
}

export function parseColumnDroppableId(overId: string | null | undefined): TaskStatus | null {
  if (!overId?.startsWith(COLUMN_PREFIX)) {
    return null
  }
  const rest = overId.slice(COLUMN_PREFIX.length)
  return (TASK_STATUSES as readonly string[]).includes(rest) ? (rest as TaskStatus) : null
}

export function taskDraggableId(taskId: string): string {
  return `${TASK_PREFIX}${taskId}`
}

export function parseTaskDraggableId(activeId: string | null | undefined): string | null {
  if (!activeId?.startsWith(TASK_PREFIX)) {
    return null
  }
  return activeId.slice(TASK_PREFIX.length)
}
