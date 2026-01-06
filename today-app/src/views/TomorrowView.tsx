import { isTomorrow, parseISO } from 'date-fns'
import type { Task } from '../types'
import { TaskList } from '../components/TaskList'

interface TomorrowViewProps {
  tasks: Task[]
  categories: string[]
  onCompleteTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onDeferTask: (id: string, deferredTo: string | null, category: string) => void
  onCreateCategory: (name: string) => void
  onShowToast: (message: string) => void
}

/**
 * TomorrowView - displays tasks deferred to tomorrow
 * AC-3.4.5: Show tasks where deferredTo equals tomorrow's date
 * AC-3.4.6: Display in same card format as Today view
 */
export const TomorrowView = ({
  tasks,
  categories,
  onCompleteTask,
  onDeleteTask,
  onDeferTask,
  onCreateCategory,
  onShowToast,
}: TomorrowViewProps) => {
  // Filter for tasks deferred to tomorrow - AC-3.4.5
  const tomorrowTasks = tasks.filter(task =>
    task.deferredTo &&
    isTomorrow(parseISO(task.deferredTo)) &&
    !task.completedAt
  )

  if (tomorrowTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-foreground">Nothing planned for tomorrow.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Defer tasks from Today to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <TaskList
        tasks={tomorrowTasks}
        categories={categories}
        onComplete={onCompleteTask}
        onDelete={onDeleteTask}
        onDefer={onDeferTask}
        onCreateCategory={onCreateCategory}
        onShowToast={onShowToast}
      />
    </div>
  )
}
