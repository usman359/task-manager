import { Router } from "express"
import { nanoid } from "nanoid"
import { getDb } from "../db.js"
import { rowToTask } from "../types.js"
import type { TaskRow } from "../types.js"
import {
  createTaskBodySchema,
  getTasksQuerySchema,
  patchTaskBodySchema,
} from "../validation.js"
import { ZodError } from "zod"

const router = Router()

function zodToJson(err: ZodError) {
  return {
    error: "Validation failed",
    details: err.flatten(),
  }
}

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
  const sql = `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY datetime(created_at) DESC`
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
  db.prepare(
    `INSERT INTO tasks (id, title, description, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, title, description, status, priority, createdAt)
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow
  res.status(201).json(rowToTask(row))
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
  if (patch.status !== undefined) next.status = patch.status
  if (patch.priority !== undefined) next.priority = patch.priority
  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ? WHERE id = ?`,
  ).run(next.title, next.description, next.status, next.priority, next.id)
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
