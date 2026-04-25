import { z } from "zod"

export const taskStatusSchema = z.enum(["todo", "in-progress", "done"])
export const taskPrioritySchema = z.enum(["low", "medium", "high"])

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

export const getTasksQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, taskStatusSchema).optional(),
  priority: z.preprocess(emptyToUndefined, taskPrioritySchema).optional(),
})

export const createTaskBodySchema = z
  .object({
    title: z.string().min(1, "Title is required").max(500),
    description: z.string().max(10_000).default(""),
    status: taskStatusSchema.default("todo"),
    priority: taskPrioritySchema.default("medium"),
  })
  .strict()

export const patchTaskBodySchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty").max(500).optional(),
    description: z.string().max(10_000).optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" })

/** Reorder tasks within one status column (`sort_order` 0 = top). */
export const reorderBodySchema = z
  .object({
    status: taskStatusSchema,
    orderedIds: z.array(z.string().min(1)),
  })
  .strict()
  .refine((d) => d.orderedIds.length > 0, { message: "orderedIds must not be empty" })

export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>
export type PatchTaskBody = z.infer<typeof patchTaskBodySchema>
export type ReorderBody = z.infer<typeof reorderBodySchema>
