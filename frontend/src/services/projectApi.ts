import { apiJson } from '@/services/http'
import type { PaginationMeta, ProjectDetail, ProjectSummary } from '@/types/project'

export type ListProjectsResponse = {
  projects: ProjectSummary[]
  meta: PaginationMeta
}

export type CreateProjectBody = {
  name: string
  description: string
}

export type CreateProjectResponse = {
  project: ProjectSummary
}

export type GetProjectResponse = {
  project: ProjectDetail
}

export function listProjectsRequest(
  token: string,
  params: { page?: number; limit?: number } = {},
): Promise<ListProjectsResponse> {
  const search = new URLSearchParams()
  if (params.page !== undefined) {
    search.set('page', String(params.page))
  }
  if (params.limit !== undefined) {
    search.set('limit', String(params.limit))
  }
  const qs = search.toString()
  const path = qs ? `/projects?${qs}` : '/projects'
  return apiJson<ListProjectsResponse>(path, { token })
}

export function createProjectRequest(token: string, body: CreateProjectBody): Promise<CreateProjectResponse> {
  return apiJson<CreateProjectResponse>('/projects', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  })
}

export function getProjectRequest(token: string, projectId: string): Promise<GetProjectResponse> {
  return apiJson<GetProjectResponse>(`/projects/${projectId}`, { token })
}
