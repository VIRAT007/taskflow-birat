import { AlertCircleIcon, FolderKanbanIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateProjectDialog } from '@/features/projects/CreateProjectDialog'
import { useProjectsListQuery } from '@/features/projects/useProjectQueries'
import { ApiError } from '@/services/http'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20
/** Opens the create dialog when set to `1` (see `/projects/new` redirect in `App.tsx`). */
const CREATE_PROJECT_QUERY = 'create'

function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="gap-3 py-4">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const createOpen = searchParams.get(CREATE_PROJECT_QUERY) === '1'

  const setCreateOpen = useCallback(
    (open: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (open) {
            next.set(CREATE_PROJECT_QUERY, '1')
          } else {
            next.delete(CREATE_PROJECT_QUERY)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const { data, isLoading, isError, error, isFetching } = useProjectsListQuery(page, PAGE_SIZE)

  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.limit)) : 1

  return (
    <div className="container max-w-screen-2xl px-4 py-8">
      <div className="relative z-10 flex flex-col gap-4 bg-background sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Workspaces you own or collaborate on.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New project
        </Button>
      </div>

      {createOpen ? <CreateProjectDialog open onOpenChange={setCreateOpen} /> : null}

      <div className="mt-10">
        {isError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Could not load projects</AlertTitle>
            <AlertDescription>
              {error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && <ProjectListSkeleton />}

        {!isLoading && !isError && data && data.projects.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <FolderKanbanIcon className="mb-4 size-12 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-medium">No projects yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first project to start organizing tasks with your team.
            </p>
            <Button type="button" className="mt-6" onClick={() => setCreateOpen(true)}>
              Create project
            </Button>
          </div>
        )}

        {!isLoading && !isError && data && data.projects.length > 0 && (
          <>
            <div
              className={cn(
                'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
                isFetching && !isLoading && 'opacity-70 transition-opacity',
              )}
            >
              {data.projects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} className="block h-full outline-none">
                  <Card className="h-full py-4 transition-colors hover:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="line-clamp-1 text-base">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
                <span>
                  Page {data.meta.page} of {totalPages} · {data.meta.total} total
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
