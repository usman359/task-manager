import { useCallback, useEffect, useState } from "react"
import { z } from "zod"
import { createTask, deleteTask, fetchTasks, patchTask, type ListFilters } from "@/lib/api"
import { formatCreatedAt, priorityVariant, statusBadgeVariant, statusLabel } from "@/lib/task-presentation"
import type { Task, TaskPriority, TaskStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const taskStatusSchema = z.enum(["todo", "in-progress", "done"])
const taskPrioritySchema = z.enum(["low", "medium", "high"])

const createFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(500, "Title must be 500 characters or less"),
  description: z.string().max(10_000, "Description is too long").default(""),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
})

type FilterValueStatus = "all" | TaskStatus
type FilterValuePriority = "all" | TaskPriority

function toListFilters(
  st: FilterValueStatus,
  pr: FilterValuePriority,
): ListFilters {
  const f: ListFilters = {}
  if (st !== "all") f.status = st
  if (pr !== "all") f.priority = pr
  return f
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<FilterValueStatus>("all")
  const [priorityFilter, setPriorityFilter] = useState<FilterValuePriority>("all")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo")
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [pending, setPending] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [createBusy, setCreateBusy] = useState(false)
  const [toDelete, setToDelete] = useState<Task | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await fetchTasks(toListFilters(statusFilter, priorityFilter))
      setTasks(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    void load()
  }, [load])

  function validateAndSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErrors({})
    const raw = {
      title,
      description,
      status: newStatus,
      priority: newPriority,
    }
    const parsed = createFormSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
        const msg = (v as string[] | undefined)?.[0]
        if (msg) fieldErrors[k] = msg
      }
      setFormErrors(fieldErrors)
      return
    }
    setCreateBusy(true)
    setError(null)
    void createTask(parsed.data)
      .then(() => {
        setTitle("")
        setDescription("")
        setNewStatus("todo")
        setNewPriority("medium")
        return load()
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Create failed")
      })
      .finally(() => {
        setCreateBusy(false)
      })
  }

  function onStatusChange(task: Task, value: string) {
    const next = z.union([z.literal("todo"), z.literal("in-progress"), z.literal("done")]).safeParse(value)
    if (!next.success) return
    setPending(task.id)
    setError(null)
    void patchTask(task.id, { status: next.data })
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Update failed")
      })
      .finally(() => {
        setPending(null)
      })
  }

  function confirmDelete() {
    if (!toDelete) return
    setDeleting(toDelete.id)
    setError(null)
    void deleteTask(toDelete.id)
      .then(() => {
        setToDelete(null)
        setTasks((prev) => prev.filter((t) => t.id !== toDelete.id))
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Delete failed")
      })
      .finally(() => {
        setDeleting(null)
      })
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Task manager</h1>
          <p className="text-sm text-muted-foreground">
            Create, filter, and update tasks. Changes sync to the server without a full page reload.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>New task</CardTitle>
            <CardDescription>Add a title, optional description, status, and priority.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={validateAndSubmit} className="flex flex-col gap-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoComplete="off"
                  aria-invalid={formErrors.title ? "true" : "false"}
                />
                {formErrors.title ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formErrors.title}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                {formErrors.description ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formErrors.description}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <span className="text-sm font-medium" id="new-status-label">
                    Status
                  </span>
                  <Select
                    value={newStatus}
                    onValueChange={(v) => {
                      const p = z.union([z.literal("todo"), z.literal("in-progress"), z.literal("done")]).safeParse(v)
                      if (p.success) setNewStatus(p.data)
                    }}
                  >
                    <SelectTrigger className="w-full" id="new-status" aria-labelledby="new-status-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To do</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium" id="new-priority-label">
                    Priority
                  </span>
                  <Select
                    value={newPriority}
                    onValueChange={(v) => {
                      const p = z.union([z.literal("low"), z.literal("medium"), z.literal("high")]).safeParse(v)
                      if (p.success) setNewPriority(p.data)
                    }}
                  >
                    <SelectTrigger className="w-full" id="new-priority" aria-labelledby="new-priority-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Button type="submit" disabled={createBusy} className="w-full sm:w-auto">
                  {createBusy ? "Creating…" : "Create task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">All tasks</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 sm:min-w-40">
              <span className="text-sm font-medium" id="filter-status-label">
                Filter: status
              </span>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  const p = z
                    .union([z.literal("all"), z.literal("todo"), z.literal("in-progress"), z.literal("done")])
                    .safeParse(v)
                  if (p.success) setStatusFilter(p.data)
                }}
              >
                <SelectTrigger
                  className="w-full min-w-0"
                  id="filter-status"
                  aria-labelledby="filter-status-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:min-w-40">
              <span className="text-sm font-medium" id="filter-priority-label">
                Filter: priority
              </span>
              <Select
                value={priorityFilter}
                onValueChange={(v) => {
                  const p = z
                    .union([z.literal("all"), z.literal("low"), z.literal("medium"), z.literal("high")])
                    .safeParse(v)
                  if (p.success) setPriorityFilter(p.data)
                }}
              >
                <SelectTrigger
                  className="w-full min-w-0"
                  id="filter-priority"
                  aria-labelledby="filter-priority-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:ms-auto sm:pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {!loading && tasks.length === 0 && !error ? (
            <p className="text-sm text-muted-foreground">No tasks match these filters yet.</p>
          ) : null}
          <ul className="flex list-none flex-col gap-3 p-0">
            {tasks.map((t) => (
              <li key={t.id}>
                <Card>
                  <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base sm:text-lg">{t.title}</CardTitle>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={priorityVariant(t.priority)}>{t.priority} priority</Badge>
                        <Badge variant={statusBadgeVariant(t.status)}>{statusLabel(t.status)}</Badge>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:max-w-56 sm:shrink-0">
                      <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground" id={`st-${t.id}`}>
                          Change status
                        </span>
                        <Select
                          value={t.status}
                          onValueChange={(v) => onStatusChange(t, v)}
                          disabled={pending === t.id}
                        >
                          <SelectTrigger
                            className="w-full"
                            id={`sel-${t.id}`}
                            aria-labelledby={`st-${t.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To do</SelectItem>
                            <SelectItem value="in-progress">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setToDelete(t)}
                        disabled={deleting === t.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs text-muted-foreground">
                    {t.description ? (
                      <p className="whitespace-pre-wrap text-sm text-foreground/90">{t.description}</p>
                    ) : null}
                    <p>Created {formatCreatedAt(t.createdAt)}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <AlertDialog open={toDelete != null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.title}” will be removed. This can’t be undone.`
                : "This can’t be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void confirmDelete()
              }}
            >
              {deleting != null ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
