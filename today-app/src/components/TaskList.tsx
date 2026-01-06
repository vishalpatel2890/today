import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  newTaskIds?: Set<string>
}

export const TaskList = ({ tasks, newTaskIds }: TaskListProps) => {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} isNew={newTaskIds?.has(task.id)} />
      ))}
    </div>
  )
}
