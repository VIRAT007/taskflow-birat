import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { projectKeys } from '@/features/projects/queryKeys'
import { createProjectRequest, getProjectRequest, listProjectsRequest } from '@/services/projectApi'
import type { CreateProjectBody } from '@/services/projectApi'
import { useAuthStore } from '@/store/useAuthStore'

const DEFAULT_LIMIT = 20

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isProjectIdParam(id: string | undefined): id is string {
  return typeof id === 'string' && uuidRegex.test(id)
}

export function useProjectsListQuery(page: number, limit: number = DEFAULT_LIMIT) {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: projectKeys.list(page, limit),
    queryFn: () => listProjectsRequest(token!, { page, limit }),
    enabled: Boolean(token),
  })
}

export function useProjectDetailQuery(projectId: string | undefined) {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => getProjectRequest(token!, projectId!),
    enabled: Boolean(token) && isProjectIdParam(projectId),
  })
}

export function useCreateProjectMutation() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (body: CreateProjectBody) => {
      if (!token) {
        throw new Error('Not signed in')
      }
      return createProjectRequest(token, body)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all })
    },
    onSuccess: (res) => {
      navigate(`/projects/${res.project.id}`, { replace: true })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}
