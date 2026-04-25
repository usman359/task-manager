import type { Task, TaskPriority, TaskStatus } from "@/types"

const base = import.meta.env.VITE_API_BASE ?? ""

function getHeaders(isJson: boolean): HeadersInit {
  const h: Record<string, string> = {}
  if (isJson) h["Content-Type"] = "application/json"
  const k = import.meta.env.VITE_API_KEY
  if (k) h["X-API-Key"] = k
  return h
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function errorMessage(res: Response, body: unknown): string {
  if (res.status === 401) {
    return "Unauthorized — set VITE_API_KEY in client env to match server API_KEY"
  }
  if (body && typeof body === "object") {
    const o = body as { error?: unknown; message?: unknown }
    if (typeof o.error === "string") return o.error
    if (typeof o.message === "string") return o.message
  }
  if (res.status === 404) return "Not found"
  if (res.status === 400) return "Invalid request"
  if (res.status >= 500) return "Server error"
  return `Request failed (HTTP ${res.status})`
}

function throwOnBad(res: Response, data: unknown): void {
  if (res.ok) return
  throw new ApiError(errorMessage(res, data), res.status, data)
}

export type ListFilters = { status?: TaskStatus; priority?: TaskPriority }

export async function fetchTasks(filters: ListFilters = {}): Promise<Task[]> {
  const q = new URLSearchParams()
  if (filters.status) q.set("status", filters.status)
  if (filters.priority) q.set("priority", filters.priority)
  const qs = q.toString()
  const url = qs ? `${base}/tasks?${qs}` : `${base}/tasks`
  const res = await fetch(url, { headers: getHeaders(false) })
  const data = (await res.json().catch(() => ({}))) as unknown
  throwOnBad(res, data)
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
    headers: getHeaders(true),
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as unknown
  throwOnBad(res, data)
  return data as Task
}

export async function patchTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "description" | "status" | "priority">>,
): Promise<Task> {
  const res = await fetch(`${base}/tasks/${id}`, {
    method: "PATCH",
    headers: getHeaders(true),
    body: JSON.stringify(patch),
  })
  const data = (await res.json().catch(() => ({}))) as unknown
  throwOnBad(res, data)
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${base}/tasks/${id}`, {
    method: "DELETE",
    headers: getHeaders(false),
  })
  if (res.status === 204) return
  const data = (await res.json().catch(() => ({}))) as unknown
  throwOnBad(res, data)
}

/** Persist order after drag within one status (bonus). */
export async function reorderTasksInStatus(body: {
  status: TaskStatus
  orderedIds: string[]
}): Promise<void> {
  const res = await fetch(`${base}/tasks/reorder`, {
    method: "PATCH",
    headers: getHeaders(true),
    body: JSON.stringify(body),
  })
  if (res.status === 204) return
  const data = (await res.json().catch(() => ({}))) as unknown
  throwOnBad(res, data)
}
