import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircleIcon, GripVerticalIcon, MoreHorizontalIcon } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  collectAssigneeIds,
  filterTasksByAssignee,
  formatAssigneeLabel,
  groupTasksByStatus,
  normalizeTask,
  STATUS_COLUMNS,
  type AssigneeFilterValue,
} from '@/features/tasks/boardUtils'
import {
  columnDroppableId,
  parseColumnDroppableId,
  parseTaskDraggableId,
  taskDraggableId,
} from '@/features/tasks/dndIds'
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog'
import { useTaskMutations } from '@/features/tasks/useTaskMutations'
import { ApiError } from '@/services/http'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import type { Task, TaskStatus } from '@/types/task'
import { TASK_STATUSES } from '@/types/task'

type ProjectTaskBoardProps = {
  projectId: string
  rawTasks: Array<{
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
  }>
}

function priorityBadgeVariant(p: Task['priority']): 'secondary' | 'outline' | 'destructive' {
  if (p === 'high') {
    return 'destructive'
  }
  if (p === 'medium') {
    return 'secondary'
  }
  return 'outline'
}

function resolveDropStatus(
  overId: string | undefined,
  tasks: Task[],
): TaskStatus | null {
  const column = parseColumnDroppableId(overId)
  if (column) {
    return column
  }
  const overTaskId = parseTaskDraggableId(overId)
  if (!overTaskId) {
    return null
  }
  const overTask = tasks.find((t) => t.id === overTaskId)
  return overTask ? overTask.status : null
}

type BoardColumnProps = {
  status: TaskStatus
  label: string
  count: number
  children: React.ReactNode
}

function BoardColumn({ status, label, count, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(status),
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-40 flex-col gap-3 rounded-xl border border-border bg-muted/10 p-3 transition-colors',
        isOver && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Badge variant="outline">{count}</Badge>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

type TaskCardProps = {
  task: Task
  currentUserId: string | undefined
  onEdit: (task: Task) => void
  onRequestDelete: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  statusBusy: boolean
}

function TaskCard({
  task,
  currentUserId,
  onEdit,
  onRequestDelete,
  onStatusChange,
  statusBusy,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: taskDraggableId(task.id),
    data: { task },
    disabled: statusBusy,
  })

  const style: CSSProperties = {
    ...(transform && !isDragging ? { transform: CSS.Translate.toString(transform) } : {}),
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('gap-0 py-3', isDragging && 'ring-2 ring-primary/20')}
      size="sm"
    >
      <CardHeader className="gap-2 px-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 inline-flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label={`Drag task ${task.title}`}
            {...listeners}
            {...attributes}
          >
            <GripVerticalIcon className="size-4" />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium leading-snug">{task.title}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={priorityBadgeVariant(task.priority)}>{task.priority}</Badge>
              <span className="text-xs text-muted-foreground">
                {task.assignee_id ? formatAssigneeLabel(task.assignee_id, currentUserId) : 'Unassigned'}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Task actions"
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onRequestDelete(task)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pt-0">
        <p className="line-clamp-3 text-xs text-muted-foreground">{task.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status</span>
          <Select
            value={task.status}
            disabled={statusBusy}
            onValueChange={(next) => {
              if (next === task.status) {
                return
              }
              onStatusChange(task.id, next as TaskStatus)
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-7 min-w-0 flex-1 text-xs"
              disabled={statusBusy}
              aria-label={`Status for ${task.title}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'todo' ? 'To do' : s === 'in_progress' ? 'In progress' : 'Done'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskDragPreview({ task }: { task: Task }) {
  return (
    <Card className="max-w-xs cursor-grabbing gap-0 py-3 shadow-lg" size="sm">
      <CardHeader className="px-3">
        <p className="font-medium leading-snug">{task.title}</p>
        <Badge variant={priorityBadgeVariant(task.priority)} className="mt-1 w-fit">
          {task.priority}
        </Badge>
      </CardHeader>
    </Card>
  )
}

export function ProjectTaskBoard({ projectId, rawTasks }: ProjectTaskBoardProps) {
  const user = useAuthStore((s) => s.user)
  const { deleteTask, updateTask } = useTaskMutations(projectId)

  const tasks = useMemo(() => rawTasks.map(normalizeTask), [rawTasks])
  const assigneeOptionIds = useMemo(() => collectAssigneeIds(tasks), [tasks])

  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterValue>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
  )

  const filtered = useMemo(
    () => filterTasksByAssignee(tasks, assigneeFilter, user?.id),
    [tasks, assigneeFilter, user?.id],
  )
  const grouped = useMemo(() => groupTasksByStatus(filtered), [filtered])

  const mutationError =
    (deleteTask.isError && deleteTask.error instanceof ApiError && deleteTask.error.message) ||
    (updateTask.isError && updateTask.error instanceof ApiError && updateTask.error.message) ||
    null

  function handleDragStart(event: DragStartEvent) {
    const taskId = parseTaskDraggableId(String(event.active.id))
    if (!taskId) {
      return
    }
    const found = tasks.find((t) => t.id === taskId) ?? null
    setActiveTask(found)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const taskId = parseTaskDraggableId(String(event.active.id))
    const overId = event.over?.id !== undefined && event.over?.id !== null ? String(event.over.id) : undefined
    const targetStatus = resolveDropStatus(overId, tasks)
    if (!taskId || !targetStatus) {
      return
    }
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === targetStatus) {
      return
    }
    updateTask.mutate({ taskId, body: { status: targetStatus } })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Drag tasks between columns to update status (optimistic, rolls back if the server rejects). You can also
            use the status menu on each card.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Assignee</span>
            <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v as AssigneeFilterValue)}>
              <SelectTrigger className="w-full min-w-48 sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {user?.id ? <SelectItem value="me">Assigned to me</SelectItem> : null}
                {assigneeOptionIds
                  .filter((id) => id !== user?.id)
                  .map((id) => (
                    <SelectItem key={id} value={id}>
                      {formatAssigneeLabel(id, user?.id)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="sm:ml-2"
            onClick={() => {
              setFormMode('create')
              setEditingTask(null)
              setFormOpen(true)
            }}
          >
            Add task
          </Button>
        </div>
      </div>

      {mutationError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      <TaskFormDialog
        projectId={projectId}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        task={editingTask}
        assigneeOptionIds={assigneeOptionIds}
        currentUserId={user?.id}
      />

      <AlertDialog open={Boolean(taskToDelete)} onOpenChange={(o) => !o && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskToDelete ? `"${taskToDelete.title}" will be removed permanently.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => {
                if (!taskToDelete) {
                  return
                }
                deleteTask.mutate(taskToDelete.id, {
                  onSuccess: () => setTaskToDelete(null),
                })
              }}
            >
              {deleteTask.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          {tasks.length === 0
            ? 'No tasks yet. Use “Add task” to create one.'
            : 'No tasks match this assignee filter.'}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
            {STATUS_COLUMNS.map(({ status, label }) => (
              <BoardColumn key={status} status={status} label={label} count={grouped[status].length}>
                {grouped[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={user?.id}
                    onEdit={(t) => {
                      setFormMode('edit')
                      setEditingTask(t)
                      setFormOpen(true)
                    }}
                    onRequestDelete={setTaskToDelete}
                    onStatusChange={(taskId, nextStatus) => {
                      updateTask.mutate({ taskId, body: { status: nextStatus } })
                    }}
                    statusBusy={
                      updateTask.isPending &&
                      updateTask.variables?.taskId === task.id &&
                      updateTask.variables.body.status !== undefined
                    }
                  />
                ))}
                {grouped[status].length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">Drop tasks here</p>
                )}
              </BoardColumn>
            ))}
          </div>
          <DragOverlay dropAnimation={null}>{activeTask ? <TaskDragPreview task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      )}
    </section>
  )
}
