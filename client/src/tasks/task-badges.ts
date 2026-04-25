import type { TaskPriority, TaskStatus } from "@/types"
import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge"

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

export function priorityBadge(p: TaskPriority): BadgeVariant {
  if (p === "high") return "destructive"
  if (p === "medium") return "default"
  return "secondary"
}

export function statusBadge(s: TaskStatus): BadgeVariant {
  if (s === "done") return "secondary"
  if (s === "in-progress") return "default"
  return "outline"
}

export function statusLabel(s: TaskStatus): string {
  if (s === "todo") return "To do"
  if (s === "in-progress") return "In progress"
  return "Done"
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}
