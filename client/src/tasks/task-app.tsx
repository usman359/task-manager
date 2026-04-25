import { useTasksPage } from "./use-tasks-page"
import { NewTaskForm } from "./new-task-form"
import { TaskFilters } from "./task-filters"
import { TaskBoard } from "./task-board"
import { DeleteTaskDialog } from "./delete-task-dialog"
import { ErrorBanner } from "./error-banner"

export default function App() {
  const page = useTasksPage()

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Task manager</h1>
          <p className="text-sm text-muted-foreground">
            Create, filter, and update tasks. Drag the handle to reorder within a status column.
          </p>
        </header>

        <NewTaskForm
          draft={page.draft}
          onChange={page.setDraft}
          titleError={page.titleError}
          saving={page.saving}
          onSubmit={page.submitNewTask}
        />

        <section className="space-y-3">
          <h2 className="text-lg font-medium">All tasks</h2>
          <TaskFilters
            status={page.filterStatus}
            priority={page.filterPriority}
            onStatus={page.setFilterStatus}
            onPriority={page.setFilterPriority}
          />
          <ErrorBanner text={page.error} />
          {page.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {!page.loading && page.tasks.length === 0 && !page.error ? (
            <p className="text-sm text-muted-foreground">No tasks match these filters yet.</p>
          ) : null}
          {!page.loading && page.tasks.length > 0 ? (
            <TaskBoard
              tasks={page.tasks}
              filterStatus={page.filterStatus}
              updatingTaskId={page.updatingTaskId}
              deletingTaskId={page.deletingTaskId}
              dndDisabled={page.dragLocked}
              onStatusChange={page.updateStatus}
              onDelete={page.setTaskToDelete}
              onReorder={page.reorderInColumn}
            />
          ) : null}
        </section>
      </div>

      <DeleteTaskDialog
        task={page.taskToDelete}
        loading={page.deletingTaskId != null}
        onClose={() => page.setTaskToDelete(null)}
        onConfirm={() => void page.removeTask()}
      />
    </div>
  )
}
