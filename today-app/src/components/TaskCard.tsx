import { Circle } from 'lucide-react'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
  isNew?: boolean
}

export const TaskCard = ({ task, isNew = false }: TaskCardProps) => {
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm ${isNew ? 'animate-slide-in' : ''}`}>
      <button
        type="button"
        className="flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
        aria-label="Mark task complete"
      >
        <Circle className="h-5 w-5" strokeWidth={2} />
      </button>
      <span className="font-body text-base text-foreground">{task.text}</span>
    </div>
  )
}
