import { useState } from 'react'
import { Circle, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import type { Task, TaskNotes } from '../types'
import { UpdateModal } from './DeferModal'
import { NotesModal } from './NotesModal'
import { useToast } from '../contexts/ToastContext'

interface TaskCardProps {
  task: Task
  categories: string[]
  isNew?: boolean
  isDragging?: boolean
  draggable?: boolean
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  onCreateCategory: (name: string) => void
  onNotesUpdate?: (id: string, notes: TaskNotes | null) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent) => void
}

/**
 * TaskCard component
 * AC-4.3.2: Toast on delete
 * Update button opens modal to edit task name, date, category
 * Supports drag-and-drop for task reordering (Story 7.1)
 */
export const TaskCard = ({
  task,
  categories,
  isNew = false,
  isDragging = false,
  draggable = false,
  onComplete,
  onDelete,
  onUpdate,
  onCreateCategory,
  onNotesUpdate,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: TaskCardProps) => {
  const [showCheck, setShowCheck] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const { addToast } = useToast()

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

  // AC-4.3.2: Show toast on delete
  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      onDelete(task.id)
      addToast('Task deleted')
    }
  }

  const handleUpdateClick = () => {
    setIsUpdateModalOpen(true)
  }

  // Handle update from modal
  const handleUpdateFromModal = (text: string, deferredTo: string | null, category: string | null) => {
    setIsUpdateModalOpen(false)
    onUpdate(task.id, text, deferredTo, category)
    addToast('Task updated')
  }

  /**
   * Handle double-click to open notes modal
   * AC-1.2.1: Double-click opens NotesModal
   * AC-1.2.2: Single-click still completes task (handled by button)
   * AC-1.2.3: Button clicks don't trigger modal
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    // AC-1.2.2: Prevent if completing task
    if (showCheck || isCompleting) return

    // AC-1.2.3: Prevent if clicking on a button
    if ((e.target as HTMLElement).closest('button')) return

    // Open notes modal
    setIsNotesModalOpen(true)
  }

  // Handle notes save from modal
  const handleNotesSave = (notes: TaskNotes | null) => {
    if (onNotesUpdate) {
      onNotesUpdate(task.id, notes)
      addToast(notes ? 'Notes saved' : 'Notes cleared')
    }
  }

  // Build class names for drag state
  const dragClasses = isDragging
    ? 'opacity-80 scale-[1.02] shadow-lg z-50'
    : ''

  return (
    <>
      <div
        className={`group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-all hover:shadow-sm cursor-pointer ${isNew ? 'animate-slide-in' : ''} ${isCompleting ? 'animate-task-complete' : ''} ${dragClasses}`}
        onDoubleClick={handleDoubleClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
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
        <span className="flex-1 font-body text-base text-foreground">
          {task.text}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUpdateClick}
            className="flex-shrink-0 cursor-pointer text-muted-foreground opacity-100 transition-opacity hover:text-primary md:opacity-0 md:group-hover:opacity-100"
            aria-label="Update task"
          >
            <Pencil className="h-[18px] w-[18px]" strokeWidth={2} />
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

      <UpdateModal
        task={task}
        categories={categories}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onCreateCategory={onCreateCategory}
        onUpdate={handleUpdateFromModal}
      />

      {onNotesUpdate && (
        <NotesModal
          task={task}
          isOpen={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          onSave={handleNotesSave}
        />
      )}
    </>
  )
}
