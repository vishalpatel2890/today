import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  newTaskIds?: Set<string>
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onDefer: (id: string) => void
}

export const TaskList = ({ tasks, newTaskIds, onComplete, onDelete, onDefer }: TaskListProps) => {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isNew={newTaskIds?.has(task.id)}
          onComplete={onComplete}
          onDelete={onDelete}
          onDefer={onDefer}
        />
      ))}
    </div>
  )
}
