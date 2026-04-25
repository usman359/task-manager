import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FILTER_PRIORITY,
  FILTER_PRIORITY_LABEL,
  FILTER_STATUS,
  FILTER_STATUS_LABEL,
  type FilterPriority,
  type FilterStatus,
} from "./task-constants"

type Props = {
  status: FilterStatus
  priority: FilterPriority
  onStatus: (v: FilterStatus) => void
  onPriority: (v: FilterPriority) => void
}

function isStatus(v: string): v is FilterStatus {
  return (FILTER_STATUS as readonly string[]).includes(v)
}
function isPriority(v: string): v is FilterPriority {
  return (FILTER_PRIORITY as readonly string[]).includes(v)
}

export function TaskFilters(props: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-2 sm:min-w-40">
        <span className="text-sm font-medium" id="filter-st">
          Filter: status
        </span>
        <Select
          value={props.status}
          onValueChange={(v) => {
            if (isStatus(v)) props.onStatus(v)
          }}
        >
          <SelectTrigger className="w-full min-w-0" id="filter-status" aria-labelledby="filter-st">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_STATUS.map((val) => (
              <SelectItem key={val} value={val}>
                {FILTER_STATUS_LABEL[val]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:min-w-40">
        <span className="text-sm font-medium" id="filter-pr">
          Filter: priority
        </span>
        <Select
          value={props.priority}
          onValueChange={(v) => {
            if (isPriority(v)) props.onPriority(v)
          }}
        >
          <SelectTrigger className="w-full min-w-0" id="filter-priority" aria-labelledby="filter-pr">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_PRIORITY.map((val) => (
              <SelectItem key={val} value={val}>
                {FILTER_PRIORITY_LABEL[val]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
