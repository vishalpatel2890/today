import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  categories: string[]
  newTaskIds?: Set<string>
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  onCreateCategory: (name: string) => void
}

export const TaskList = ({ tasks, categories, newTaskIds, onComplete, onDelete, onUpdate, onCreateCategory }: TaskListProps) => {
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
          onUpdate={onUpdate}
          onCreateCategory={onCreateCategory}
        />
      ))}
    </div>
  )
}
