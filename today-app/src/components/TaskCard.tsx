import { useState } from 'react'
import { Circle, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import type { Task } from '../types'
import { DeferModal } from './DeferModal'

interface TaskCardProps {
  task: Task
  isNew?: boolean
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onDefer: (id: string) => void
}

export const TaskCard = ({ task, isNew = false, onComplete, onDelete, onDefer: _onDefer }: TaskCardProps) => {
  const [showCheck, setShowCheck] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDeferModalOpen, setIsDeferModalOpen] = useState(false)

  const handleComplete = () => {
    // Prevent double-clicks
    if (showCheck || isCompleting) return

    // Immediate visual feedback - green checkmark
    setShowCheck(true)

    // After 300ms pause, start fade animation
    setTimeout(() => {
      setIsCompleting(true)

      // After fade animation completes, update state
      setTimeout(() => {
        onComplete(task.id)
      }, 300)
    }, 300)
  }

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      onDelete(task.id)
    }
  }

  const handleDeferClick = () => {
    setIsDeferModalOpen(true)
  }

  return (
    <>
      <div
        className={`group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm ${isNew ? 'animate-slide-in' : ''} ${isCompleting ? 'animate-task-complete' : ''}`}
      >
        <button
          type="button"
          onClick={handleComplete}
          className="flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Mark task complete"
          disabled={showCheck}
        >
          {showCheck ? (
            <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={2} />
          ) : (
            <Circle className="h-5 w-5" strokeWidth={2} />
          )}
        </button>
        <span className="flex-1 font-body text-base text-foreground">{task.text}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeferClick}
            className="flex-shrink-0 cursor-pointer text-muted-foreground opacity-100 transition-opacity hover:text-primary md:opacity-0 md:group-hover:opacity-100"
            aria-label="Defer task"
          >
            <Clock className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-shrink-0 cursor-pointer text-muted-foreground opacity-100 transition-opacity hover:text-error md:opacity-0 md:group-hover:opacity-100"
            aria-label="Delete task"
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      <DeferModal
        task={task}
        isOpen={isDeferModalOpen}
        onClose={() => setIsDeferModalOpen(false)}
      />
    </>
  )
}
