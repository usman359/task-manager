import { useMemo } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types"
import type { FilterStatus } from "./task-constants"
import { statusLabel } from "./task-badges"
import { TaskCard } from "./task-card"

const ALL_STATUS: TaskStatus[] = ["todo", "in-progress", "done"]

type Props = {
  tasks: Task[]
  filterStatus: FilterStatus
  updatingTaskId: string | null
  deletingTaskId: string | null
  dndDisabled: boolean
  onStatusChange: (task: Task, value: string) => void
  onDelete: (task: Task) => void
  onReorder: (status: TaskStatus, orderedIds: string[]) => void | Promise<void>
}

function SortableRow(
  p: {
    task: Task
  } & Pick<Props, "onStatusChange" | "onDelete" | "updatingTaskId" | "deletingTaskId" | "dndDisabled">,
) {
  const s = useSortable({ id: p.task.id, disabled: p.dndDisabled })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = s
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as const

  return (
    <li ref={setNodeRef} style={style} className={cn("list-none", isDragging && "z-20 opacity-90")}>
      <TaskCard
        task={p.task}
        statusLoading={p.updatingTaskId === p.task.id}
        deleteLoading={p.deletingTaskId === p.task.id}
        onStatusChange={p.onStatusChange}
        onDelete={p.onDelete}
        dragHandle={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Drag to reorder"
            disabled={p.dndDisabled}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </Button>
        }
      />
    </li>
  )
}

function columnTasks(status: TaskStatus, all: Task[]) {
  return all
    .filter((t) => t.status === status)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function visibleColumns(filterStatus: FilterStatus): TaskStatus[] {
  if (filterStatus === "all") return ALL_STATUS
  if (filterStatus === "todo" || filterStatus === "in-progress" || filterStatus === "done") {
    return [filterStatus]
  }
  return ALL_STATUS
}

function TaskColumnList(
  p: {
    status: TaskStatus
  } & Pick<
    Props,
    | "tasks"
    | "onStatusChange"
    | "onDelete"
    | "updatingTaskId"
    | "deletingTaskId"
    | "dndDisabled"
  >,
) {
  const col = columnTasks(p.status, p.tasks)
  const ids = col.map((t) => t.id)
  return (
    <SortableContext id={p.status} items={ids} strategy={verticalListSortingStrategy}>
      <ul className="flex list-none flex-col gap-3 p-0">
        {col.map((t) => (
          <SortableRow
            key={t.id}
            task={t}
            updatingTaskId={p.updatingTaskId}
            deletingTaskId={p.deletingTaskId}
            dndDisabled={p.dndDisabled}
            onStatusChange={p.onStatusChange}
            onDelete={p.onDelete}
          />
        ))}
      </ul>
    </SortableContext>
  )
}

export function TaskBoard(props: Props) {
  const { tasks, filterStatus, onReorder } = props
  const columns = useMemo(() => visibleColumns(filterStatus), [filterStatus])
  const filterKey = `${filterStatus}`
  const defaultTab = columns[0] ?? "todo"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeTask = tasks.find((t) => t.id === String(active.id))
    const overTask = tasks.find((t) => t.id === String(over.id))
    if (!activeTask || !overTask || activeTask.status !== overTask.status) {
      return
    }
    const col = columnTasks(activeTask.status, tasks)
    const ids = col.map((t) => t.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
    onReorder(activeTask.status, arrayMove(ids, oldIndex, newIndex))
  }

  const common = {
    tasks,
    onStatusChange: props.onStatusChange,
    onDelete: props.onDelete,
    updatingTaskId: props.updatingTaskId,
    deletingTaskId: props.deletingTaskId,
    dndDisabled: props.dndDisabled,
  }

  if (columns.length === 1) {
    const st = columns[0]!
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="w-full min-w-0 max-w-full">
          <h3 className="mb-2 text-sm font-semibold text-foreground/90">
            {statusLabel(st)} ({columnTasks(st, tasks).length})
          </h3>
          <TaskColumnList key={st} status={st} {...common} />
        </div>
      </DndContext>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Tabs key={filterKey} defaultValue={defaultTab} className="w-full min-w-0 max-w-full">
        <TabsList className="h-auto w-full min-w-0 flex-wrap sm:flex-nowrap" aria-label="Task status">
          {columns.map((st) => {
            const n = columnTasks(st, tasks).length
            return (
              <TabsTrigger key={st} value={st} className="min-w-0 max-w-full">
                <span className="truncate">
                  {statusLabel(st)} ({n})
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        {columns.map((st) => (
          <TabsContent key={st} value={st} className="w-full min-w-0">
            <div className="w-full min-w-0">
              <TaskColumnList status={st} {...common} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </DndContext>
  )
}
