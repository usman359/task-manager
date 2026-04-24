import type { Task, TaskPriority, TaskStatus } from "@/types"

const base = import.meta.env.VITE_API_BASE ?? ""

function getHeaders(): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const key = import.meta.env.VITE_API_KEY
  if (key) h["X-API-Key"] = key
  return h
}

function parseErrorMessage(res: Response, body: unknown): string {
  if (body && typeof body === "object" && "error" in body && typeof (body as { error: string }).error === "string") {
    return (body as { error: string }).error
  }
  return `Request failed (${res.status})`
}

export type ListFilters = { status?: TaskStatus; priority?: TaskPriority }

export async function fetchTasks(filters: ListFilters = {}): Promise<Task[]> {
  const q = new URLSearchParams()
  if (filters.status) q.set("status", filters.status)
  if (filters.priority) q.set("priority", filters.priority)
  const qstr = q.toString()
  const url = qstr ? `${base}/tasks?${qstr}` : `${base}/tasks`
  const res = await fetch(url, { headers: getHeaders() })
  const data = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    throw new Error(parseErrorMessage(res, data))
  }
  return data as Task[]
}

export async function createTask(body: {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}): Promise<Task> {
  const res = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    throw new Error(parseErrorMessage(res, data))
  }
  return data as Task
}

export async function patchTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "description" | "status" | "priority">>,
): Promise<Task> {
  const res = await fetch(`${base}/tasks/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(patch),
  })
  const data = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    throw new Error(parseErrorMessage(res, data))
  }
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${base}/tasks/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  if (res.status === 204) return
  const data = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    throw new Error(parseErrorMessage(res, data))
  }
}
