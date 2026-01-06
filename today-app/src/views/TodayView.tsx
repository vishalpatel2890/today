import { isToday, parseISO } from 'date-fns'
import type { Task } from '../types'
import { TaskList } from '../components/TaskList'
import { AddTaskInput } from '../components/AddTaskInput'

interface TodayViewProps {
  tasks: Task[]
  categories: string[]
  onAddTask?: (text: string) => void
  onCompleteTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onDeferTask: (id: string, deferredTo: string | null, category: string) => void
  onCreateCategory: (name: string) => void
  onShowToast: (message: string) => void
  newTaskIds?: Set<string>
}

/**
 * TodayView - displays tasks for today
 * AC-3.4.2: Filters out deferred tasks (except those deferred to today)
 */
export const TodayView = ({ tasks, categories, onAddTask, onCompleteTask, onDeleteTask, onDeferTask, onCreateCategory, onShowToast, newTaskIds }: TodayViewProps) => {
  // Filter for today's tasks - AC-3.4.2
  // Show tasks that: are not completed AND (have no deferredTo AND no category, OR are deferred to today)
  // Tasks with category but no deferredTo are "Someday" tasks - they go to Deferred view
  const todayTasks = tasks.filter(task => {
    if (task.completedAt) return false
    // "Someday" tasks (no date but has category) go to Deferred view, not Today
    if (!task.deferredTo && task.category) return false
    // Tasks deferred to a specific date only show if that date is today
    if (task.deferredTo && !isToday(parseISO(task.deferredTo))) return false
    return true
  })

  if (todayTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-foreground">Nothing for today.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a task to get started.
        </p>
        {onAddTask && (
          <div className="mt-6 w-full">
            <AddTaskInput onAddTask={onAddTask} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <TaskList
        tasks={todayTasks}
        categories={categories}
        newTaskIds={newTaskIds}
        onComplete={onCompleteTask}
        onDelete={onDeleteTask}
        onDefer={onDeferTask}
        onCreateCategory={onCreateCategory}
        onShowToast={onShowToast}
      />
      {onAddTask && <AddTaskInput onAddTask={onAddTask} />}
    </div>
  )
}
