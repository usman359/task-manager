import type { TaskPriority, TaskStatus } from "@/types"

/** List filter: status. */
export const FILTER_STATUS = ["all", "todo", "in-progress", "done"] as const
export type FilterStatus = (typeof FILTER_STATUS)[number]

export const FILTER_STATUS_LABEL: Record<FilterStatus, string> = {
  all: "All",
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
}

/** List filter: priority. */
export const FILTER_PRIORITY = ["all", "low", "medium", "high"] as const
export type FilterPriority = (typeof FILTER_PRIORITY)[number]

export const FILTER_PRIORITY_LABEL: Record<FilterPriority, string> = {
  all: "All",
  low: "Low",
  medium: "Medium",
  high: "High",
}

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
]

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

/** Form state for creating a task (same fields as POST /tasks). */
export type NewTaskDraft = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

export const defaultDraft = (): NewTaskDraft => ({
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
})
