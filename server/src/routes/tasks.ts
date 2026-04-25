import { Router } from "express"
import { nanoid } from "nanoid"
import { getDb } from "../db.js"
import { rowToTask } from "../types.js"
import type { TaskRow } from "../types.js"
import {
  createTaskBodySchema,
  getTasksQuerySchema,
  patchTaskBodySchema,
  reorderBodySchema,
} from "../validation.js"
import { ZodError } from "zod"

const router = Router()

function zodToJson(err: ZodError) {
  return {
    error: "Validation failed",
    details: err.flatten(),
  }
}

const orderByColumn = `
  ORDER BY
    CASE status
      WHEN 'todo' THEN 0
      WHEN 'in-progress' THEN 1
      WHEN 'done' THEN 2
      ELSE 3
    END,
    sort_order ASC,
    datetime(created_at) ASC
`

/** GET /tasks?status&priority */
router.get("/", (req, res) => {
  const parsed = getTasksQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json(zodToJson(parsed.error))
  }
  const { status, priority } = parsed.data
  const conditions: string[] = ["1=1"]
  const params: string[] = []
  if (status) {
    conditions.push("status = ?")
    params.push(status)
  }
  if (priority) {
    conditions.push("priority = ?")
    params.push(priority)
  }
  const db = getDb()
  const sql = `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ${orderByColumn}`
  const rows = db.prepare(sql).all(...params) as TaskRow[]
  res.json(rows.map(rowToTask))
})

/** POST /tasks */
router.post("/", (req, res) => {
  const parsed = createTaskBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(zodToJson(parsed.error))
  }
  const { title, description, status, priority } = parsed.data
  const db = getDb()
  const id = nanoid()
  const createdAt = new Date().toISOString()
  const maxRow = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM tasks WHERE status = ?")
    .get(status) as { n: number }
  const sortOrder = maxRow.n
  db.prepare(
    `INSERT INTO tasks (id, title, description, status, priority, created_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, title, description, status, priority, createdAt, sortOrder)
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow
  res.status(201).json(rowToTask(row))
})

/**
 * PATCH /tasks/reorder — set `sort_order` for tasks in one status.
 * (Registered before /:id so "reorder" is not treated as an id.)
 */
router.patch("/reorder", (req, res) => {
  const parsed = reorderBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(zodToJson(parsed.error))
  }
  const { status, orderedIds } = parsed.data
  const unique = new Set(orderedIds)
  if (unique.size !== orderedIds.length) {
    return res.status(400).json({ error: "Duplicate ids" })
  }
  const db = getDb()
  for (const id of orderedIds) {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined
    if (!row || row.status !== status) {
      return res.status(400).json({ error: "All tasks must exist and match the given status" })
    }
  }
  const run = db.transaction((ids: string[]) => {
    for (let i = 0; i < ids.length; i++) {
      db.prepare("UPDATE tasks SET sort_order = ? WHERE id = ?").run(i, ids[i])
    }
  })
  run(orderedIds)
  res.status(204).send()
})

/** PATCH /tasks/:id */
router.patch("/:id", (req, res) => {
  const db = getDb()
  const parsed = patchTaskBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(zodToJson(parsed.error))
  }
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as
    | TaskRow
    | undefined
  if (!existing) {
    return res.status(404).json({ error: "Task not found" })
  }
  const patch = parsed.data
  const next: TaskRow = { ...existing }
  if (patch.title !== undefined) next.title = patch.title
  if (patch.description !== undefined) next.description = patch.description
  if (patch.priority !== undefined) next.priority = patch.priority
  if (patch.status !== undefined) {
    if (patch.status !== existing.status) {
      next.status = patch.status
      const maxRow = db
        .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM tasks WHERE status = ?")
        .get(patch.status) as { n: number }
      next.sort_order = maxRow.n
    } else {
      next.status = patch.status
    }
  }
  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, sort_order = ? WHERE id = ?`,
  ).run(next.title, next.description, next.status, next.priority, next.sort_order, next.id)
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(next.id) as TaskRow
  res.json(rowToTask(row))
})

/** DELETE /tasks/:id */
router.delete("/:id", (req, res) => {
  const db = getDb()
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: "Task not found" })
  }
  res.status(204).send()
})

export { router as tasksRouter }
