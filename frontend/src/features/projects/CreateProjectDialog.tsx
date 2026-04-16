import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { createProjectFormSchema, type CreateProjectFormValues } from '@/features/projects/projectFormSchema'
import { useCreateProjectMutation } from '@/features/projects/useProjectQueries'
import { ApiError } from '@/services/http'

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const mutation = useCreateProjectMutation()
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ name: '', description: '' })
      mutation.reset()
    }
  }, [open, form, mutation])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Add a name and description. You can refine tasks on the project page next.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
          noValidate
        >
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Could not create project</AlertTitle>
              <AlertDescription>
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Something went wrong. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="project-name">Name</FieldLabel>
                <Input id="project-name" autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="project-description">Description</FieldLabel>
                <Textarea
                  id="project-description"
                  rows={4}
                  className="min-h-24 resize-y"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldDescription>Brief context for collaborators (required by the API).</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Creating…
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
