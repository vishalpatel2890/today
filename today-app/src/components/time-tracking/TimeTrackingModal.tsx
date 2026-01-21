import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import X from 'lucide-react/dist/esm/icons/x'
import Check from 'lucide-react/dist/esm/icons/check'
import Plus from 'lucide-react/dist/esm/icons/plus'
import { isToday, isPast, startOfDay, parseISO, isValid, format } from 'date-fns'
import { TaskSelector, type SelectedTask } from './TaskSelector'
import { DurationInput } from './DurationInput'
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
 * Modal state machine
 * - idle: Task selection with Track button
 * - tracking: Active tracking with elapsed time
 * - feedback: Success confirmation after stopping/saving
 * - manual: Manual time entry form
 */
type ModalState = 'idle' | 'tracking' | 'feedback' | 'manual'

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
 * Time Tracking Modal - Story 1.2 + 1.3 + Manual Entry
 *
 * Compact command palette style modal (320px width) with four states:
 * - Idle state: Task selection dropdown with Track button + manual entry button
 * - Active state: Shows currently tracking task with elapsed time
 * - Feedback state: Success confirmation after saving
 * - Manual state: Form to add time entry retroactively
 *
 * Features:
 * - Task dropdown with type-ahead filtering
 * - Auto-focus on dropdown when modal opens (idle state)
 * - Empty state handling when no tasks for today
 * - Track button that enables when task is selected
 * - Session persists across browser refresh (IndexedDB)
 * - Enter key triggers Track when task selected
 * - Manual entry for forgotten time tracking
 *
 * Source: notes/ux-design-time-tracking.md#4.1 Design Direction
 * Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC2, AC3, AC6
 * Source: notes/sprint-artifacts/tech-spec-manual-time-entry.md
 */
export const TimeTrackingModal = ({ isOpen, onClose, tasks, userId }: TimeTrackingModalProps) => {
  // Track mode state
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null)
  const [lastEntry, setLastEntry] = useState<TimeEntry | null>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Manual entry state
  const [manualTask, setManualTask] = useState<SelectedTask | null>(null)
  const [manualDuration, setManualDuration] = useState(0)
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Epic 4: Use useTimeEntries for sync-aware entry saving
  const { addEntry, syncEntries } = useTimeEntries()

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

  // Derive modal state from tracking state and local state
  const [explicitState, setExplicitState] = useState<'feedback' | 'manual' | null>(null)

  const modalState: ModalState = useMemo(() => {
    if (explicitState === 'feedback') return 'feedback'
    if (explicitState === 'manual') return 'manual'
    if (isTracking && activeSession) return 'tracking'
    return 'idle'
  }, [explicitState, isTracking, activeSession])

  // Filter tasks using same logic as useAutoSurface for Today view
  // This ensures dropdown shows the same tasks visible in the Today tab
  const todayTasks = useMemo(() => tasks.filter(task => {
    // Exclude completed tasks
    if (task.completedAt) return false

    // Parse the deferred date if present
    if (!task.deferredTo) {
      // No deferred date - task is NOT in Today view (it's in Deferred)
      return false
    }

    const taskDate = parseISO(task.deferredTo)
    if (!isValid(taskDate)) {
      // Invalid date - task is in Deferred view
      return false
    }

    // Include tasks deferred to today OR overdue (past date)
    return isToday(taskDate) || isPast(startOfDay(taskDate))
  }), [tasks])

  // Tasks for manual entry - optionally include completed tasks
  const manualEntryTasks = useMemo(() => {
    if (includeCompleted) {
      // Show today's tasks + all completed tasks
      return tasks.filter(task => {
        // Include all completed tasks
        if (task.completedAt) return true

        // Include today's incomplete tasks (same filter as todayTasks)
        if (!task.deferredTo) return false
        const taskDate = parseISO(task.deferredTo)
        if (!isValid(taskDate)) return false
        return isToday(taskDate) || isPast(startOfDay(taskDate))
      })
    }
    // Default: same as todayTasks
    return todayTasks
  }, [tasks, todayTasks, includeCompleted])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTask(null)
      setLastEntry(null)
      setExplicitState(null)
      // Reset manual entry state
      setManualTask(null)
      setManualDuration(0)
      setManualDate(format(new Date(), 'yyyy-MM-dd'))
      setIncludeCompleted(false)
      setIsSaving(false)
    }
  }, [isOpen])

  const handleTaskSelect = (task: SelectedTask) => {
    setSelectedTask(task)
  }

  const handleManualTaskSelect = (task: SelectedTask) => {
    setManualTask(task)
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
   */
  const handleStop = useCallback(async () => {
    try {
      const entry = await stopTracking()
      if (entry) {
        // Show success feedback
        setLastEntry(entry)
        setExplicitState('feedback')

        // Auto-dismiss after 1.5 seconds per UX spec
        setTimeout(() => {
          setExplicitState(null)
          setLastEntry(null)
        }, 1500)
      }
    } catch (error) {
      console.error('[Today] TimeTracking: Failed to stop tracking', error)
    }
  }, [stopTracking])

  /**
   * Open manual entry form
   */
  const handleOpenManual = useCallback(() => {
    setExplicitState('manual')
    // Reset manual form state
    setManualTask(null)
    setManualDuration(0)
    setManualDate(format(new Date(), 'yyyy-MM-dd'))
    setIncludeCompleted(false)
  }, [])

  /**
   * Cancel manual entry and return to idle
   */
  const handleCancelManual = useCallback(() => {
    setExplicitState(null)
  }, [])

  /**
   * Save manual time entry
   * Computes start_time/end_time from date + duration
   */
  const handleManualSave = useCallback(async () => {
    if (!manualTask || manualDuration <= 0) return

    setIsSaving(true)

    try {
      // Compute start_time as start of selected day
      const selectedDate = parseISO(manualDate)
      const startTime = startOfDay(selectedDate)
      const endTime = new Date(startTime.getTime() + manualDuration)

      // Create entry using addEntry (saves to IndexedDB + queues for sync)
      const entry = await addEntry({
        user_id: userId ?? 'local',
        task_id: manualTask.id,
        task_name: manualTask.name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: manualDuration,
        date: manualDate,
      })

      // Immediately sync to Supabase so insights can fetch it
      // This ensures the entry appears in Time Insights right away
      if (navigator.onLine) {
        try {
          await syncEntries()
        } catch (syncError) {
          // Non-blocking: entry is saved locally, will sync later
          console.warn('[Today] TimeTracking: Sync failed, will retry later', syncError)
        }
      }

      // Show success feedback
      setLastEntry(entry)
      setExplicitState('feedback')

      // Auto-dismiss after 1.5 seconds
      setTimeout(() => {
        setExplicitState(null)
        setLastEntry(null)
      }, 1500)

      if (import.meta.env.DEV) {
        console.log('[Today] TimeTracking: Manual entry saved', entry.id)
      }
    } catch (error) {
      console.error('[Today] TimeTracking: Failed to save manual entry', error)
    } finally {
      setIsSaving(false)
    }
  }, [manualTask, manualDuration, manualDate, userId, addEntry, syncEntries])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape in manual state returns to idle
      if (e.key === 'Escape' && modalState === 'manual') {
        e.preventDefault()
        handleCancelManual()
        return
      }

      if (e.key !== 'Enter') return

      const activeElement = document.activeElement
      const isInInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement

      // Don't trigger if typing in an input (except for manual save validation)
      if (isInInput && modalState !== 'manual') return

      e.preventDefault()

      if (modalState === 'tracking') {
        // Active state: trigger Stop
        handleStop()
      } else if (modalState === 'idle' && selectedTask) {
        // Idle state with task selected: trigger Track
        handleTrack()
      } else if (modalState === 'manual' && manualTask && manualDuration > 0 && !isInInput) {
        // Manual state with valid input: trigger Save
        handleManualSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, modalState, selectedTask, manualTask, manualDuration, handleTrack, handleStop, handleManualSave, handleCancelManual])

  // Determine button states
  const hasNoTasks = todayTasks.length === 0
  const canTrack = selectedTask !== null && !hasNoTasks
  const canSaveManual = manualTask !== null && manualDuration > 0

  // Today's date for max date constraint
  const today = format(new Date(), 'yyyy-MM-dd')

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
              {modalState === 'manual' ? 'Add Time Entry' : 'Time Tracking'}
            </Dialog.Title>
            <div className="flex items-center gap-1">
              {/* Manual entry button - only visible in idle state */}
              {modalState === 'idle' && (
                <button
                  type="button"
                  onClick={handleOpenManual}
                  className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                  aria-label="Add manual time entry"
                  title="Add manual entry"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
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
          </div>

          {modalState === 'feedback' && lastEntry ? (
            // Success feedback state: Show saved confirmation
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                <Check className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Saved: {formatDurationSummary(lastEntry.duration)} on "{lastEntry.task_name}"
              </p>
            </div>
          ) : modalState === 'tracking' && activeSession ? (
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
          ) : modalState === 'manual' ? (
            // Manual entry state: Form to add time entry
            <div className="space-y-4">
              {/* Task selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Task
                </label>
                <TaskSelector
                  tasks={manualEntryTasks}
                  selectedTask={manualTask}
                  onSelect={handleManualTaskSelect}
                  autoFocus={true}
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

              {/* Duration input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duration
                </label>
                <DurationInput
                  value={manualDuration}
                  onChange={setManualDuration}
                  disabled={isSaving}
                />
                {manualDuration === 0 && manualTask && (
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
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  max={today}
                  disabled={isSaving}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelManual}
                  disabled={isSaving}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={!canSaveManual || isSaving}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    canSaveManual && !isSaving
                      ? 'bg-slate-600 text-white hover:bg-slate-700 cursor-pointer'
                      : 'bg-slate-600/50 text-white/70 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Add'}
                </button>
              </div>
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
                  autoFocus={isOpen && modalState === 'idle'}
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
