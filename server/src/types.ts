export type Task = {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  createdAt: string
}

export type TaskRow = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
}

export function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status as Task["status"],
    priority: r.priority as Task["priority"],
    createdAt: r.created_at,
  }
}
