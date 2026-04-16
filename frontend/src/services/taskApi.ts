import { apiJson, apiVoid } from '@/services/http'
import type { Task } from '@/types/task'

export type CreateTaskBody = {
  title: string
  description: string
  status?: Task['status']
  priority?: Task['priority']
  assignee_id?: string | null
}

export type UpdateTaskBody = {
  title?: string
  description?: string
  status?: Task['status']
  priority?: Task['priority']
  assignee_id?: string | null
}

export type CreateTaskResponse = {
  task: Task
}

export type UpdateTaskResponse = {
  task: Task
}

export function createTaskRequest(token: string, projectId: string, body: CreateTaskBody): Promise<CreateTaskResponse> {
  return apiJson<CreateTaskResponse>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  })
}

export function updateTaskRequest(token: string, taskId: string, body: UpdateTaskBody): Promise<UpdateTaskResponse> {
  return apiJson<UpdateTaskResponse>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  })
}

export function deleteTaskRequest(token: string, taskId: string): Promise<void> {
  return apiVoid(`/tasks/${taskId}`, {
    method: 'DELETE',
    token,
  })
}
