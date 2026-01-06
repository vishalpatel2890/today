import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  categories: string[]
  newTaskIds?: Set<string>
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onDefer: (id: string, deferredTo: string | null, category: string) => void
  onCreateCategory: (name: string) => void
  onShowToast?: (message: string) => void
}

export const TaskList = ({ tasks, categories, newTaskIds, onComplete, onDelete, onDefer, onCreateCategory, onShowToast }: TaskListProps) => {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          categories={categories}
          isNew={newTaskIds?.has(task.id)}
          onComplete={onComplete}
          onDelete={onDelete}
          onDefer={onDefer}
          onCreateCategory={onCreateCategory}
          onShowToast={onShowToast}
        />
      ))}
    </div>
  )
}
