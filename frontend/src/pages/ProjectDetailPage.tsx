import { AlertCircleIcon, ArrowLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isProjectIdParam, useProjectDetailQuery } from '@/features/projects/useProjectQueries'
import { ProjectTaskBoard } from '@/features/tasks/ProjectTaskBoard'
import { ApiError } from '@/services/http'
import { cn } from '@/lib/utils'

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-1/2 max-w-md" />
      <Skeleton className="h-24 w-full max-w-2xl" />
      <Skeleton className="h-4 w-40" />
    </div>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const validId = isProjectIdParam(projectId)
  const { data, isLoading, isError, error } = useProjectDetailQuery(projectId)

  if (!validId) {
    return (
      <div key={projectId ?? 'invalid'} className="container max-w-screen-2xl px-4 py-8">
        <Link
          to="/projects"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'mb-6 inline-flex w-fit items-center gap-1',
          )}
        >
          <ArrowLeftIcon className="size-4" />
          Back to projects
        </Link>
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Invalid project</AlertTitle>
          <AlertDescription>The link does not contain a valid project id.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div key={projectId} className="container max-w-screen-2xl px-4 py-8">
      <Link
        to="/projects"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'mb-6 inline-flex w-fit items-center gap-1',
        )}
      >
        <ArrowLeftIcon className="size-4" />
        Back to projects
      </Link>

      {isLoading && <DetailSkeleton />}

      {isError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not load project</AlertTitle>
          <AlertDescription>
            {error instanceof ApiError && error.code === 'NOT_FOUND'
              ? 'This project does not exist or you do not have access.'
              : error instanceof ApiError
                ? error.message
                : 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{data.project.name}</h1>
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-muted-foreground">{data.project.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Created {new Date(data.project.created_at).toLocaleString()}
            </p>
          </div>

          <ProjectTaskBoard projectId={data.project.id} rawTasks={data.project.tasks} />
        </div>
      )}
    </div>
  )
}
