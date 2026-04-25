import type { ReactNode } from "react"
import type { Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, priorityBadge, statusBadge, statusLabel } from "./task-badges"
import { STATUS_OPTIONS } from "./task-constants"

type Props = {
  task: Task
  statusLoading: boolean
  deleteLoading: boolean
  onStatusChange: (task: Task, value: string) => void
  onDelete: (task: Task) => void
  dragHandle: ReactNode
}

/**
 * One column layout: no side‑by‑side “title + controls” row that squishes on narrow viewports.
 */
export function TaskCard(props: Props) {
  const task = props.task
  return (
    <Card>
      <CardHeader className="space-y-3 sm:px-4">
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-2">
          <div className="pt-0.5">{props.dragHandle}</div>
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-base leading-snug wrap-break-word sm:text-lg">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={priorityBadge(task.priority)} className="max-w-full shrink-0 text-xs">
                {task.priority} priority
              </Badge>
              <Badge variant={statusBadge(task.status)} className="shrink-0 text-xs">
                {statusLabel(task.status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:pl-0">
          <Label className="text-xs text-muted-foreground" htmlFor={`sel-${task.id}`}>
            Change status
          </Label>
          <Select
            value={task.status}
            onValueChange={(v) => props.onStatusChange(task, v)}
            disabled={props.statusLoading}
          >
            <SelectTrigger
              className="w-full min-w-0"
              id={`sel-${task.id}`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => props.onDelete(task)}
          disabled={props.deleteLoading}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Delete
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-xs text-muted-foreground sm:px-4">
        {task.description ? (
          <p className="whitespace-pre-wrap text-sm text-foreground/90 wrap-break-word">{task.description}</p>
        ) : null}
        <p>Created {formatDate(task.createdAt)}</p>
      </CardContent>
    </Card>
  )
}
