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

/** Thrown on non-2xx/3xx; includes HTTP status and optional response body. */
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

function firstZodFlattenMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null
  const d = details as { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] }
  if (d.fieldErrors && typeof d.fieldErrors === "object") {
    for (const msgs of Object.values(d.fieldErrors)) {
      if (Array.isArray(msgs) && msgs[0]) return msgs[0]
    }
  }
  if (Array.isArray(d.formErrors) && d.formErrors[0]) return d.formErrors[0]
  return null
}

/**
 * Build a user-facing string from the API JSON and status line.
 * Backend sends `{ error, details? }` on 400; `{ error }` on 401/404.
 */
export function parseErrorResponse(res: Response, body: unknown): string {
  const st = res.status
  if (body && typeof body === "object") {
    const o = body as { error?: unknown; message?: unknown; details?: unknown }
    if (typeof o.error === "string") {
      const fromZod = o.details ? firstZodFlattenMessage(o.details) : null
      if (fromZod) {
        return `${o.error} — ${fromZod}`
      }
      return o.error
    }
    if (typeof o.message === "string") {
      return o.message
    }
  }
  if (st === 401) {
    return "Unauthorized (check X-API-Key / VITE_API_KEY if the server requires an API key)"
  }
  if (st === 403) return "Forbidden"
  if (st === 404) return "Not found"
  if (st === 400) return "Bad request — check your input"
  if (st === 422) return "Validation failed on the server"
  if (st >= 500) return "Server error — try again later"
  return `Request failed (HTTP ${st})`
}

function throwOnNotOk(res: Response, data: unknown): void {
  if (res.ok) return
  throw new ApiError(parseErrorResponse(res, data), res.status, data)
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
  throwOnNotOk(res, data)
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
  throwOnNotOk(res, data)
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
  throwOnNotOk(res, data)
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${base}/tasks/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  if (res.status === 204) return
  const data = (await res.json().catch(() => ({}))) as unknown
  throwOnNotOk(res, data)
}
