import { useCallback, useEffect, useState } from "react"
import {
  createTask,
  deleteTask,
  fetchTasks,
  patchTask,
  reorderTasksInStatus,
  type ListFilters,
} from "@/lib/api"
import type { Task, TaskStatus } from "@/types"
import type { FilterPriority, FilterStatus, NewTaskDraft } from "./task-constants"
import { defaultDraft } from "./task-constants"

function errText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback
}

function listFilters(
  status: FilterStatus,
  priority: FilterPriority,
): ListFilters {
  const out: ListFilters = {}
  if (status !== "all") out.status = status
  if (priority !== "all") out.priority = priority
  return out
}

function validStatus(v: string): v is TaskStatus {
  return v === "todo" || v === "in-progress" || v === "done"
}

export function useTasksPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all")
  const [draft, setDraft] = useState<NewTaskDraft>(defaultDraft)
  const [titleError, setTitleError] = useState<string | null>(null)

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const list = await fetchTasks(listFilters(filterStatus, filterPriority))
      setTasks(list)
    } catch (e) {
      setError(errText(e, "Failed to load tasks"))
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPriority])

  useEffect(() => {
    void load()
  }, [load])

  async function submitNewTask() {
    setTitleError(null)
    const title = draft.title.trim()
    if (!title) {
      setTitleError("Title is required")
      return
    }
    if (title.length > 500) {
      setTitleError("Title is too long (max 500 characters)")
      return
    }
    if (draft.description.length > 10_000) {
      setError("Description is too long")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createTask({
        title,
        description: draft.description,
        status: draft.status,
        priority: draft.priority,
      })
      setDraft(defaultDraft())
      await load()
    } catch (e) {
      setError(errText(e, "Create failed"))
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(task: Task, value: string) {
    if (!validStatus(value)) return
    setUpdatingTaskId(task.id)
    setError(null)
    try {
      const updated = await patchTask(task.id, { status: value })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
    } catch (e) {
      setError(errText(e, "Update failed"))
    } finally {
      setUpdatingTaskId(null)
    }
  }

  async function reorderInColumn(status: TaskStatus, orderedIds: string[]) {
    if (saving || loading || updatingTaskId !== null || deletingTaskId !== null) {
      return
    }
    setError(null)
    try {
      await reorderTasksInStatus({ status, orderedIds })
      await load()
    } catch (e) {
      setError(errText(e, "Reorder failed"))
    }
  }

  const dragLocked =
    saving || loading || updatingTaskId !== null || deletingTaskId !== null

  async function removeTask() {
    if (!taskToDelete) return
    setDeletingTaskId(taskToDelete.id)
    setError(null)
    const id = taskToDelete.id
    try {
      await deleteTask(id)
      setTaskToDelete(null)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      setError(errText(e, "Delete failed"))
    } finally {
      setDeletingTaskId(null)
    }
  }

  return {
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    draft,
    setDraft,
    titleError,
    tasks,
    loading,
    error,
    saving,
    updatingTaskId,
    deletingTaskId,
    taskToDelete,
    setTaskToDelete,
    submitNewTask,
    updateStatus,
    removeTask,
    reorderInColumn,
    dragLocked,
  }
}
