import type { Task } from '../types'
import { TaskList } from '../components/TaskList'
import { EmptyState } from '../components/EmptyState'

interface TomorrowViewProps {
  tasks: Task[]  // Pre-filtered by useAutoSurface hook
  categories: string[]
  onCompleteTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onUpdateTask: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  onCreateCategory: (name: string) => void
}

/**
 * TomorrowView - displays tasks deferred to tomorrow
 * AC-4.2.2: Shows tasks deferred to tomorrow's date
 * AC-4.2.5: Tasks are pre-filtered by useAutoSurface hook in App.tsx
 * AC-4.2.6: Completed tasks already filtered out by hook
 */
export const TomorrowView = ({
  tasks,
  categories,
  onCompleteTask,
  onDeleteTask,
  onUpdateTask,
  onCreateCategory,
}: TomorrowViewProps) => {
  // Tasks are now pre-filtered by useAutoSurface hook in App.tsx
  // No internal filtering needed - AC-4.2.5

  // AC-4.4.2: Empty state with single message (no subtitle per UX spec)
  if (tasks.length === 0) {
    return <EmptyState title="Nothing planned for tomorrow." />
  }

  return (
    <div className="flex flex-col gap-3">
      <TaskList
        tasks={tasks}
        categories={categories}
        onComplete={onCompleteTask}
        onDelete={onDeleteTask}
        onUpdate={onUpdateTask}
        onCreateCategory={onCreateCategory}
      />
    </div>
  )
}
