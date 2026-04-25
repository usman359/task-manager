import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { NewTaskDraft } from "./task-constants"
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "./task-constants"

type Props = {
  draft: NewTaskDraft
  onChange: (d: NewTaskDraft) => void
  titleError: string | null
  saving: boolean
  onSubmit: () => void | Promise<void>
}

export function NewTaskForm(props: Props) {
  const d = props.draft

  return (
    <Card>
      <CardHeader>
        <CardTitle>New task</CardTitle>
        <CardDescription>Add a title, optional description, status, and priority.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void props.onSubmit()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="new-title">Title</Label>
            <Input
              id="new-title"
              value={d.title}
              onChange={(e) => props.onChange({ ...d, title: e.target.value })}
              aria-invalid={!!props.titleError}
              className={cn(props.titleError && "border-destructive")}
            />
            {props.titleError ? <p className="text-destructive text-sm">{props.titleError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-desc">Description</Label>
            <Textarea
              id="new-desc"
              rows={3}
              value={d.description}
              onChange={(e) => props.onChange({ ...d, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <Select
                value={d.status}
                onValueChange={(v) => {
                  if (v === "todo" || v === "in-progress" || v === "done")
                    props.onChange({ ...d, status: v })
                }}
              >
                <SelectTrigger className="w-full">
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
            <div className="space-y-2">
              <span className="text-sm font-medium">Priority</span>
              <Select
                value={d.priority}
                onValueChange={(v) => {
                  if (v === "low" || v === "medium" || v === "high")
                    props.onChange({ ...d, priority: v })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Button type="submit" disabled={props.saving} className="w-full sm:w-auto">
              {props.saving ? "Creating…" : "Create task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
