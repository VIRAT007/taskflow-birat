import { z } from 'zod'

export const createProjectFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required').max(10_000),
})

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>
