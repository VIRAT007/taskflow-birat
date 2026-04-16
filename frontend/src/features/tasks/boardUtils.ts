import type { Task, TaskStatus } from '@/types/task'
import { TASK_STATUSES } from '@/types/task'

export const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
]

export function normalizeTask(row: {
  id: string
  title: string
  description: string
  status: string
  priority: string
  project_id: string
  assignee_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}): Task {
  return {
    ...row,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
  }
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
  }
  for (const t of tasks) {
    if ((TASK_STATUSES as readonly string[]).includes(t.status)) {
      map[t.status as TaskStatus].push(t)
    }
  }
  return map
}

export type AssigneeFilterValue = 'all' | 'unassigned' | 'me' | string

export function filterTasksByAssignee(
  tasks: Task[],
  filter: AssigneeFilterValue,
  currentUserId: string | undefined,
): Task[] {
  if (filter === 'all') {
    return tasks
  }
  if (filter === 'unassigned') {
    return tasks.filter((t) => t.assignee_id === null)
  }
  if (filter === 'me') {
    if (!currentUserId) {
      return []
    }
    return tasks.filter((t) => t.assignee_id === currentUserId)
  }
  return tasks.filter((t) => t.assignee_id === filter)
}

export function collectAssigneeIds(tasks: Task[]): string[] {
  const set = new Set<string>()
  for (const t of tasks) {
    if (t.assignee_id) {
      set.add(t.assignee_id)
    }
  }
  return [...set].sort()
}

export function formatAssigneeLabel(id: string, currentUserId: string | undefined): string {
  if (currentUserId && id === currentUserId) {
    return 'You'
  }
  return `User ${id.slice(0, 8)}…`
}
