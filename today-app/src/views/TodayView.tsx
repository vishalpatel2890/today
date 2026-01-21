import type { Task, TaskNotes } from '../types'
import { TaskList } from '../components/TaskList'
import { AddTaskInput } from '../components/AddTaskInput'
import { EmptyState } from '../components/EmptyState'

interface TodayViewProps {
  tasks: Task[]  // Pre-filtered by useAutoSurface hook
  categories: string[]
  onAddTask?: (text: string) => void
  onCompleteTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onUpdateTask: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  onCreateCategory: (name: string) => void
  onNotesUpdate?: (id: string, notes: TaskNotes | null) => void
  onReorderTask?: (taskId: string, newSortOrder: number) => void
  newTaskIds?: Set<string>
}

/**
 * TodayView - displays tasks for today
 * AC-4.2.1: Shows tasks deferred to today's date
 * AC-4.2.5: Tasks are pre-filtered by useAutoSurface hook in App.tsx
 * AC-4.2.6: Completed tasks already filtered out by hook
 * Story 7.1: Supports drag-and-drop task reordering
 */
export const TodayView = ({ tasks, categories, onAddTask, onCompleteTask, onDeleteTask, onUpdateTask, onCreateCategory, onNotesUpdate, onReorderTask, newTaskIds }: TodayViewProps) => {
  // Tasks are now pre-filtered by useAutoSurface hook in App.tsx
  // No internal filtering needed - AC-4.2.5

  // AC-4.4.1: Empty state with two messages and Add input
  // AC-4.4.6: Add task input visible below empty state
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Nothing for today."
        subtitle="Add a task to get started."
      >
        {onAddTask && <AddTaskInput onAddTask={onAddTask} />}
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <TaskList
        tasks={tasks}
        categories={categories}
        newTaskIds={newTaskIds}
        onComplete={onCompleteTask}
        onDelete={onDeleteTask}
        onUpdate={onUpdateTask}
        onCreateCategory={onCreateCategory}
        onNotesUpdate={onNotesUpdate}
        onReorder={onReorderTask}
      />
      {onAddTask && <AddTaskInput onAddTask={onAddTask} />}
    </div>
  )
}
