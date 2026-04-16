export type ProjectSummary = {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
}

export type TaskRow = {
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
}

export type ProjectDetail = ProjectSummary & {
  tasks: TaskRow[]
}
