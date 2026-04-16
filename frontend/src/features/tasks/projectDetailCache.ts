import type { GetProjectResponse } from '@/services/projectApi'
import type { CreateTaskBody, UpdateTaskBody } from '@/services/taskApi'
import type { Task } from '@/types/task'

export function mergeTaskPatch(snapshot: GetProjectResponse, taskId: string, body: UpdateTaskBody): GetProjectResponse {
  const stamp = new Date().toISOString()
  return {
    project: {
      ...snapshot.project,
      tasks: snapshot.project.tasks.map((t) => {
        if (t.id !== taskId) {
          return t
        }
        const next = { ...t }
        if (body.title !== undefined) {
          next.title = body.title
        }
        if (body.description !== undefined) {
          next.description = body.description
        }
        if (body.status !== undefined) {
          next.status = body.status
        }
        if (body.priority !== undefined) {
          next.priority = body.priority
        }
        if (body.assignee_id !== undefined) {
          next.assignee_id = body.assignee_id
        }
        next.updated_at = stamp
        return next
      }),
    },
  }
}

export function appendTask(snapshot: GetProjectResponse, task: Task): GetProjectResponse {
  return {
    project: {
      ...snapshot.project,
      tasks: [...snapshot.project.tasks, task],
    },
  }
}

export function removeTaskById(snapshot: GetProjectResponse, taskId: string): GetProjectResponse {
  return {
    project: {
      ...snapshot.project,
      tasks: snapshot.project.tasks.filter((t) => t.id !== taskId),
    },
  }
}

export function replaceTaskWithServer(snapshot: GetProjectResponse, taskId: string, task: Task): GetProjectResponse {
  return {
    project: {
      ...snapshot.project,
      tasks: snapshot.project.tasks.map((t) => (t.id === taskId ? task : t)),
    },
  }
}

export function buildOptimisticTask(
  body: CreateTaskBody,
  tempId: string,
  projectId: string,
  userId: string,
): Task {
  const now = new Date().toISOString()
  return {
    id: tempId,
    title: body.title,
    description: body.description,
    status: body.status ?? 'todo',
    priority: body.priority ?? 'medium',
    project_id: projectId,
    assignee_id: body.assignee_id === undefined ? null : body.assignee_id,
    created_by: userId,
    created_at: now,
    updated_at: now,
  }
}
