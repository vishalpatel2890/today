import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Check } from 'lucide-react'
import { isToday, isPast, startOfDay, parseISO, isValid } from 'date-fns'
import { TaskSelector, type SelectedTask } from './TaskSelector'
import { useTimeTracking } from '../../hooks/useTimeTracking'
import { useTimeEntries } from '../../hooks/useTimeEntries'
import { formatDurationSummary } from '../../lib/timeFormatters'
import type { Task } from '../../types'
import type { TimeEntry } from '../../types/timeTracking'

interface TimeTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  /** User ID for syncing time entries (Epic 4) */
  userId: string | null
}

/**
 * Format duration in milliseconds to HH:MM:SS or MM:SS
 * Uses tabular-nums for stable width during updates
 *
 * Source: notes/architecture-time-tracking.md#Timer Display Pattern
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }
  return `${minutes}:${pad(secs)}`
}

/**
 * Live elapsed time display component
 * Updates every second while mounted using derived calculation
 *
 * Source: notes/architecture-time-tracking.md#ADR-TT-005
 */
const ElapsedTimeDisplay = ({ startTime }: { startTime: string }) => {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    // Update every second for live display
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Derived calculation prevents drift (ADR-TT-005)
  const elapsed = Date.now() - new Date(startTime).getTime()

  return (
    <span className="font-semibold text-3xl tabular-nums text-foreground">
      {formatDuration(elapsed)}
    </span>
  )
}

/**
 * Time Tracking Modal - Story 1.2 + 1.3
 *
 * Compact command palette style modal (320px width) with two states:
 * - Idle state: Task selection dropdown with Track button
 * - Active state: Shows currently tracking task with elapsed time
 *
 * Features:
 * - Task dropdown with type-ahead filtering
 * - Auto-focus on dropdown when modal opens (idle state)
 * - Empty state handling when no tasks for today
 * - Track button that enables when task is selected
 * - Session persists across browser refresh (IndexedDB)
 * - Enter key triggers Track when task selected
 *
 * Source: notes/ux-design-time-tracking.md#4.1 Design Direction
 * Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC2, AC3, AC6
 */
export const TimeTrackingModal = ({ isOpen, onClose, tasks, userId }: TimeTrackingModalProps) => {
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastEntry, setLastEntry] = useState<TimeEntry | null>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Epic 4: Use useTimeEntries for sync-aware entry saving
  const { addEntry } = useTimeEntries()

  // Memoize the options to prevent re-renders
  const trackingOptions = useMemo(
    () => ({
      userId: userId ?? 'local',
      addEntryFn: userId ? addEntry : undefined,
    }),
    [userId, addEntry]
  )

  const { activeSession, isTracking, isLoading, startTracking, stopTracking } =
    useTimeTracking(trackingOptions)

  // Filter tasks using same logic as useAutoSurface for Today view
  // This ensures dropdown shows the same tasks visible in the Today tab
  const todayTasks = tasks.filter(task => {
    // Exclude completed tasks
    if (task.completedAt) return false

    // Parse the deferred date if present
    if (!task.deferredTo) {
      // No deferred date - task is NOT in Today view (it's in Deferred)
      // This matches useAutoSurface.ts line 47-49
      return false
    }

    const taskDate = parseISO(task.deferredTo)
    if (!isValid(taskDate)) {
      // Invalid date - task is in Deferred view
      return false
    }

    // Include tasks deferred to today OR overdue (past date)
    // This matches useAutoSurface.ts lines 50-55
    return isToday(taskDate) || isPast(startOfDay(taskDate))
  })

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTask(null)
      setShowFeedback(false)
      setLastEntry(null)
    }
  }, [isOpen])

  const handleTaskSelect = (task: SelectedTask) => {
    setSelectedTask(task)
  }

  /**
   * Start tracking the selected task
   * Persists to IndexedDB before closing modal (crash-resistant per ADR-TT-001)
   */
  const handleTrack = useCallback(async () => {
    if (!selectedTask) return

    try {
      // Start tracking - IndexedDB write happens before modal closes
      await startTracking(selectedTask.id, selectedTask.name)
      onClose()
    } catch (error) {
      console.error('[Today] TimeTracking: Failed to start tracking', error)
    }
  }, [selectedTask, startTracking, onClose])

  /**
   * Stop tracking and show success feedback
   * Saves time entry to IndexedDB, shows feedback for 1.5s, then resets to idle
   *
   * Source: notes/ux-design-time-tracking.md#5.2 Flow: Stop Tracking
   * Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC5
   */
  const handleStop = useCallback(async () => {
    try {
      const entry = await stopTracking()
      if (entry) {
        // Show success feedback
        setLastEntry(entry)
        setShowFeedback(true)

        // Auto-dismiss after 1.5 seconds per UX spec
        setTimeout(() => {
          setShowFeedback(false)
          setLastEntry(null)
        }, 1500)
      }
    } catch (error) {
      console.error('[Today] TimeTracking: Failed to stop tracking', error)
    }
  }, [stopTracking])

  // Handle Enter key for Track (idle state) or Stop (active state)
  // AC6: Enter triggers Stop in active state
  // AC9: Enter triggers Track in idle state when task selected
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return

      const activeElement = document.activeElement
      const isInInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement

      // Don't trigger if typing in an input
      if (isInInput) return

      e.preventDefault()

      if (isTracking && !showFeedback) {
        // Active state: trigger Stop
        handleStop()
      } else if (!isTracking && selectedTask && !showFeedback) {
        // Idle state with task selected: trigger Track
        handleTrack()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isTracking, selectedTask, showFeedback, handleTrack, handleStop])

  // Determine button states
  const hasNoTasks = todayTasks.length === 0
  const canTrack = selectedTask !== null && !hasNoTasks

  // Show loading state while restoring session from IndexedDB
  if (isLoading) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[320px] md:rounded-lg">
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Loading...</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          ref={modalContentRef}
          className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[320px] md:rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              Time Tracking
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

          {showFeedback && lastEntry ? (
            // Success feedback state: Show saved confirmation
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                <Check className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Saved: {formatDurationSummary(lastEntry.duration)} on "{lastEntry.task_name}"
              </p>
            </div>
          ) : isTracking && activeSession ? (
            // Active state: Show currently tracking task with elapsed time and Stop button
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Currently tracking</p>
              <p className="font-medium text-foreground mb-4 truncate">
                {activeSession.taskName}
              </p>
              <div className="mb-6">
                <ElapsedTimeDisplay startTime={activeSession.startTime} />
              </div>
              <button
                type="button"
                onClick={handleStop}
                className="w-full py-2 px-4 text-sm font-medium rounded-md bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors"
              >
                Stop
              </button>
            </div>
          ) : (
            // Idle state: Task selection with Track button
            <>
              {/* Task selector dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select task to track
                </label>
                <TaskSelector
                  tasks={todayTasks}
                  selectedTask={selectedTask}
                  onSelect={handleTaskSelect}
                  autoFocus={isOpen}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTrack}
                  disabled={!canTrack}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    canTrack
                      ? 'bg-slate-600 text-white hover:bg-slate-700 cursor-pointer'
                      : 'bg-slate-600/50 text-white/70 cursor-not-allowed'
                  }`}
                  title={hasNoTasks ? 'No tasks available to track' : !selectedTask ? 'Select a task first' : 'Start tracking'}
                >
                  Track
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
