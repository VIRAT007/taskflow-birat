import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  appendTask,
  buildOptimisticTask,
  mergeTaskPatch,
  removeTaskById,
  replaceTaskWithServer,
} from '@/features/tasks/projectDetailCache'
import { projectKeys } from '@/features/projects/queryKeys'
import type { GetProjectResponse } from '@/services/projectApi'
import { createTaskRequest, deleteTaskRequest, updateTaskRequest } from '@/services/taskApi'
import type { CreateTaskBody, CreateTaskResponse, UpdateTaskBody, UpdateTaskResponse } from '@/services/taskApi'
import { useAuthStore } from '@/store/useAuthStore'

type DetailContext = {
  previous: GetProjectResponse | undefined
}

type CreateTaskContext = DetailContext & {
  tempTaskId?: string
}

export function useTaskMutations(projectId: string) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const detailKey = projectKeys.detail(projectId)

  const invalidateProjectDetail = () => {
    void queryClient.invalidateQueries({ queryKey: detailKey })
  }

  const createTask = useMutation({
    mutationFn: (body: CreateTaskBody) => {
      if (!token) {
        throw new Error('Not signed in')
      }
      return createTaskRequest(token, projectId, body)
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<GetProjectResponse>(detailKey)
      if (!previous || !user?.id) {
        return { previous } satisfies CreateTaskContext
      }
      const tempTaskId = crypto.randomUUID()
      const optimistic = buildOptimisticTask(body, tempTaskId, projectId, user.id)
      queryClient.setQueryData<GetProjectResponse>(detailKey, appendTask(previous, optimistic))
      return { previous, tempTaskId } satisfies CreateTaskContext
    },
    onError: (_err, _body, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(detailKey, context.previous)
      }
    },
    onSuccess: (data: CreateTaskResponse, _body, context) => {
      if (!context?.tempTaskId) {
        return
      }
      queryClient.setQueryData<GetProjectResponse>(detailKey, (current) => {
        if (!current) {
          return current
        }
        return replaceTaskWithServer(current, context.tempTaskId!, data.task)
      })
    },
    onSettled: invalidateProjectDetail,
  })

  const updateTask = useMutation({
    mutationFn: (vars: { taskId: string; body: UpdateTaskBody }) => {
      if (!token) {
        throw new Error('Not signed in')
      }
      return updateTaskRequest(token, vars.taskId, vars.body)
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<GetProjectResponse>(detailKey)
      if (previous) {
        queryClient.setQueryData<GetProjectResponse>(detailKey, mergeTaskPatch(previous, vars.taskId, vars.body))
      }
      return { previous } satisfies DetailContext
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(detailKey, context.previous)
      }
    },
    onSuccess: (data: UpdateTaskResponse, vars) => {
      queryClient.setQueryData<GetProjectResponse>(detailKey, (current) => {
        if (!current) {
          return current
        }
        return replaceTaskWithServer(current, vars.taskId, data.task)
      })
    },
    onSettled: invalidateProjectDetail,
  })

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => {
      if (!token) {
        throw new Error('Not signed in')
      }
      return deleteTaskRequest(token, taskId)
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<GetProjectResponse>(detailKey)
      if (previous) {
        queryClient.setQueryData<GetProjectResponse>(detailKey, removeTaskById(previous, taskId))
      }
      return { previous } satisfies DetailContext
    },
    onError: (_err, _taskId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(detailKey, context.previous)
      }
    },
    onSettled: invalidateProjectDetail,
  })

  return { createTask, updateTask, deleteTask }
}
