import type { Task } from '../types'
import { TaskList } from '../components/TaskList'
import { AddTaskInput } from '../components/AddTaskInput'

interface TodayViewProps {
  tasks: Task[]
  onAddTask?: (text: string) => void
  newTaskIds?: Set<string>
}

export const TodayView = ({ tasks, onAddTask, newTaskIds }: TodayViewProps) => {
  if (tasks.length === 0) {
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
      <TaskList tasks={tasks} newTaskIds={newTaskIds} />
      {onAddTask && <AddTaskInput onAddTask={onAddTask} />}
    </div>
  )
}
