import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import X from 'lucide-react/dist/esm/icons/x'
import { format, parseISO, startOfDay } from 'date-fns'
import { TaskSelector, type SelectedTask } from './TaskSelector'
import { DurationInput } from './DurationInput'
import type { TimeEntry } from '../../types/timeTracking'
import type { Task } from '../../types'

interface EditTimeEntryModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** The time entry being edited */
  entry: TimeEntry | null
  /** Available tasks for the task selector */
  tasks: Task[]
  /** Callback when entry is saved */
  onSave: (id: string, updates: Partial<TimeEntry>) => Promise<void>
}

/**
 * EditTimeEntryModal - Modal for editing an existing time entry
 *
 * Allows editing:
 * - Task assignment (TaskSelector)
 * - Duration (DurationInput)
 * - Date (date picker, max = today)
 * - Task name override (text input)
 *
 * Features:
 * - Pre-fills form with entry's current data
 * - Form validation (duration > 0, task required)
 * - Reuses patterns from TimeTrackingModal manual entry
 *
 * Source: notes/tech-spec-swipe-actions.md#Edit Modal Fields
 * Source: AC-4, AC-5, AC-6
 */
export const EditTimeEntryModal = ({
  isOpen,
  onClose,
  entry,
  tasks,
  onSave,
}: EditTimeEntryModalProps) => {
  // Form state
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null)
  const [duration, setDuration] = useState(0)
  const [date, setDate] = useState('')
  const [taskNameOverride, setTaskNameOverride] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [includeCompleted, setIncludeCompleted] = useState(true)

  // Today's date for max constraint
  const today = format(new Date(), 'yyyy-MM-dd')

  // Initialize form when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      // Find matching task
      const matchingTask = tasks.find((t) => t.id === entry.task_id)
      if (matchingTask) {
        setSelectedTask({ id: matchingTask.id, name: matchingTask.text })
      } else if (entry.task_id) {
        // Task was deleted, use the snapshot
        setSelectedTask({ id: entry.task_id, name: entry.task_name })
      } else {
        setSelectedTask(null)
      }

      setDuration(entry.duration)
      setDate(entry.date)
      setTaskNameOverride(entry.task_name)
    }
  }, [entry, isOpen, tasks])

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedTask(null)
      setDuration(0)
      setDate('')
      setTaskNameOverride('')
      setIsSaving(false)
    }
  }, [isOpen])

  // Filter tasks for the selector - include completed since we're editing existing entries
  const availableTasks = tasks.filter((task) => {
    if (includeCompleted) return true
    return !task.completedAt
  })

  const handleTaskSelect = (task: SelectedTask) => {
    setSelectedTask(task)
    // Update task name override to match selected task
    setTaskNameOverride(task.name)
  }

  const handleSave = useCallback(async () => {
    if (!entry || !selectedTask || duration <= 0) return

    setIsSaving(true)

    try {
      // Calculate new start_time and end_time based on date and duration
      const selectedDate = parseISO(date)
      const startTime = startOfDay(selectedDate)
      const endTime = new Date(startTime.getTime() + duration)

      await onSave(entry.id, {
        task_id: selectedTask.id,
        task_name: taskNameOverride || selectedTask.name,
        duration,
        date,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      })

      onClose()
    } catch (error) {
      console.error('[Today] EditTimeEntryModal: Failed to save', error)
    } finally {
      setIsSaving(false)
    }
  }, [entry, selectedTask, duration, date, taskNameOverride, onSave, onClose])

  const canSave = selectedTask !== null && duration > 0

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-[60]" />
        <Dialog.Content
          className="fixed left-1/2 z-[60] w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[320px] md:rounded-lg"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              Edit Time Entry
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Task selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Task
              </label>
              <TaskSelector
                tasks={availableTasks}
                selectedTask={selectedTask}
                onSelect={handleTaskSelect}
                autoFocus={false}
              />
            </div>

            {/* Include completed toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
              />
              <span className="text-sm text-muted-foreground">
                Include completed tasks
              </span>
            </label>

            {/* Task name override */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Task Name
              </label>
              <input
                type="text"
                value={taskNameOverride}
                onChange={(e) => setTaskNameOverride(e.target.value)}
                placeholder="Custom task name (optional)"
                disabled={isSaving}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Override the display name without changing the task
              </p>
            </div>

            {/* Duration input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duration
              </label>
              <DurationInput
                value={duration}
                onChange={setDuration}
                disabled={isSaving}
              />
              {duration === 0 && (
                <p className="text-xs text-red-500 mt-1">Duration must be greater than 0</p>
              )}
            </div>

            {/* Date picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
                disabled={isSaving}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  canSave && !isSaving
                    ? 'bg-slate-600 text-white hover:bg-slate-700 cursor-pointer'
                    : 'bg-slate-600/50 text-white/70 cursor-not-allowed'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
