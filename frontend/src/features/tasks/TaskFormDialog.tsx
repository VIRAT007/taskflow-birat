import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { taskFormSchema, type TaskFormValues } from '@/features/tasks/taskFormSchema'
import { useTaskMutations } from '@/features/tasks/useTaskMutations'
import { formatAssigneeLabel } from '@/features/tasks/boardUtils'
import { ApiError } from '@/services/http'
import type { Task } from '@/types/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/task'

type TaskFormDialogProps = {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  task: Task | null
  /** UUIDs of assignees seen on this project (plus current user). */
  assigneeOptionIds: string[]
  currentUserId: string | undefined
}

function toAssigneeFieldValue(task: Task | null): TaskFormValues['assignee'] {
  if (!task?.assignee_id) {
    return '__none__'
  }
  return task.assignee_id
}

export function TaskFormDialog({
  projectId,
  open,
  onOpenChange,
  mode,
  task,
  assigneeOptionIds,
  currentUserId,
}: TaskFormDialogProps) {
  const { createTask, updateTask } = useTaskMutations(projectId)
  const activeMutation = mode === 'create' ? createTask : updateTask

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: '__none__',
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '__none__',
      })
      return
    }
    if (mode === 'edit' && task) {
      form.reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: toAssigneeFieldValue(task),
      })
      return
    }
    form.reset({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: '__none__',
    })
  }, [open, mode, task, form])

  const assigneeIds = Array.from(
    new Set([
      ...(currentUserId ? [currentUserId] : []),
      ...assigneeOptionIds,
      ...(task?.assignee_id ? [task.assignee_id] : []),
    ]),
  ).sort()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New task' : 'Edit task'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a task to this project. Fields match server validation rules.'
              : 'Update task details. Your permissions may restrict some actions.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => {
            const assignee_id = values.assignee === '__none__' ? null : values.assignee
            if (mode === 'create') {
              createTask.mutate(
                {
                  title: values.title,
                  description: values.description,
                  status: values.status,
                  priority: values.priority,
                  assignee_id,
                },
                { onSuccess: () => onOpenChange(false) },
              )
            } else if (task) {
              updateTask.mutate(
                {
                  taskId: task.id,
                  body: {
                    title: values.title,
                    description: values.description,
                    status: values.status,
                    priority: values.priority,
                    assignee_id,
                  },
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          })}
          noValidate
        >
          {activeMutation.isError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {activeMutation.error instanceof ApiError
                  ? activeMutation.error.message
                  : 'Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="task-title">Title</FieldLabel>
                <Input id="task-title" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="task-description">Description</FieldLabel>
                <Textarea id="task-description" rows={4} className="min-h-24 resize-y" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-status" className="w-full min-w-0" aria-invalid={fieldState.invalid}>
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
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="priority"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-priority" className="w-full min-w-0" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          <Controller
            name="assignee"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Assignee</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-assignee" className="w-full min-w-0" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {assigneeIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        {formatAssigneeLabel(id, currentUserId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Pick from people already assigned on tasks in this project, or yourself.</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={activeMutation.isPending}>
              {activeMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Saving…
                </>
              ) : mode === 'create' ? (
                'Create task'
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
