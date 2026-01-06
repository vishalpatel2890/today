import { useState } from 'react'
import { Circle, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import type { Task } from '../types'
import { DeferModal } from './DeferModal'

interface TaskCardProps {
  task: Task
  categories: string[]
  isNew?: boolean
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onDefer: (id: string, deferredTo: string | null, category: string) => void
  onCreateCategory: (name: string) => void
  onShowToast?: (message: string) => void
}

export const TaskCard = ({ task, categories, isNew = false, onComplete, onDelete, onDefer, onCreateCategory, onShowToast }: TaskCardProps) => {
  const [showCheck, setShowCheck] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDeferModalOpen, setIsDeferModalOpen] = useState(false)
  const [isSliding, setIsSliding] = useState(false)

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

  // Handle defer from modal - AC-3.4.2: Slide out animation before defer
  const handleDeferFromModal = (deferredTo: string | null, category: string) => {
    // Close modal first
    setIsDeferModalOpen(false)

    // Start slide-out animation
    setIsSliding(true)

    // After animation completes (300ms), execute the defer action
    setTimeout(() => {
      onDefer(task.id, deferredTo, category)
      // Show toast if handler provided
      onShowToast?.(formatToastMessage(deferredTo, category))
    }, 300)
  }

  // Format toast message based on deferredTo value - AC-3.4.3
  const formatToastMessage = (deferredTo: string | null, category: string): string => {
    if (deferredTo === null) {
      return `Deferred to Someday / ${category}`
    }

    const deferDate = new Date(deferredTo)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const deferDateNormalized = new Date(deferDate)
    deferDateNormalized.setHours(0, 0, 0, 0)

    if (deferDateNormalized.getTime() === tomorrow.getTime()) {
      return `Deferred to Tomorrow / ${category}`
    }

    // Format as "Jan 15" style
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const formattedDate = `${monthNames[deferDate.getMonth()]} ${deferDate.getDate()}`
    return `Deferred to ${formattedDate} / ${category}`
  }

  return (
    <>
      <div
        className={`group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm ${isNew ? 'animate-slide-in' : ''} ${isCompleting ? 'animate-task-complete' : ''} ${isSliding ? 'animate-defer-slide-out' : ''}`}
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
        categories={categories}
        isOpen={isDeferModalOpen}
        onClose={() => setIsDeferModalOpen(false)}
        onCreateCategory={onCreateCategory}
        onDefer={handleDeferFromModal}
      />
    </>
  )
}
