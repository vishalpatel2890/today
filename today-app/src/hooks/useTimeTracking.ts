import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import type { ActiveSession, TimeEntry } from '../types/timeTracking'
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  saveTimeEntry,
} from '../lib/timeTrackingDb'

/**
 * Options for useTimeTracking hook
 * Enables integration with sync system (Epic 4)
 */
export interface UseTimeTrackingOptions {
  /** User ID for time entries (required for sync) */
  userId?: string
  /** Custom function to add entry (from useTimeEntries for sync support) */
  addEntryFn?: (entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<TimeEntry>
}

/**
 * Return type for useTimeTracking hook
 */
export interface UseTimeTrackingReturn {
  /** Current active tracking session, or null if not tracking */
  activeSession: ActiveSession | null
  /** Whether there is an active tracking session */
  isTracking: boolean
  /** Whether the hook is loading the session from IndexedDB */
  isLoading: boolean
  /** Start tracking a task. Persists to IndexedDB immediately. */
  startTracking: (taskId: string, taskName: string) => Promise<void>
  /** Stop tracking, save time entry, and clear session. Returns the created TimeEntry. */
  stopTracking: () => Promise<TimeEntry | null>
}

/**
 * Hook for managing active time tracking session
 *
 * Provides:
 * - Active session state that persists across browser refresh
 * - Start/stop tracking functions
 * - Loading state for initial session restoration
 *
 * Implementation follows ADR-TT-001:
 * - IndexedDB write completes BEFORE updating React state
 * - Session is crash-resistant (persisted immediately on start)
 *
 * Epic 4 Integration:
 * - Pass userId and addEntryFn from useTimeEntries for sync support
 * - When addEntryFn is provided, entries are saved with sync queue
 * - Falls back to direct IndexedDB save for backwards compatibility
 *
 * Source: notes/architecture-time-tracking.md#ADR-TT-001
 * Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC3, AC6
 * Source: notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.md#Task 6
 */
export function useTimeTracking(options: UseTimeTrackingOptions = {}): UseTimeTrackingReturn {
  const { userId = 'local', addEntryFn } = options
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load active session from IndexedDB on mount
  // This restores tracking state after browser refresh (AC6.1, AC6.2)
  useEffect(() => {
    let mounted = true

    const loadSession = async () => {
      try {
        const session = await loadActiveSession()
        if (mounted) {
          setActiveSession(session)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[Today] TimeTracking: Failed to load session', error)
        if (mounted) {
          setActiveSession(null)
          setIsLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      mounted = false
    }
  }, [])

  /**
   * Start tracking a task
   *
   * Creates an ActiveSession and persists it to IndexedDB BEFORE
   * updating React state. This ensures crash-resistant tracking (NFR7, NFR8).
   *
   * @param taskId - The ID of the task to track
   * @param taskName - Snapshot of task name (persisted even if task is deleted)
   */
  const startTracking = async (taskId: string, taskName: string): Promise<void> => {
    const session: ActiveSession = {
      taskId,
      taskName,
      startTime: new Date().toISOString(),
    }

    // IndexedDB write FIRST (crash-resistant per ADR-TT-001)
    await saveActiveSession(session)

    // Then update React state
    setActiveSession(session)

    if (import.meta.env.DEV) {
      console.log('[Today] TimeTracking: Started tracking', session)
    }
  }

  /**
   * Stop tracking, create a TimeEntry, and clear the active session
   *
   * Creates a TimeEntry with all required fields and saves it to IndexedDB.
   * Returns the created entry for UI feedback display.
   *
   * Epic 4 Integration:
   * - When addEntryFn is provided, uses it for sync-aware save
   * - Falls back to direct IndexedDB save for backwards compatibility
   *
   * Handles edge cases:
   * - If no active session, returns null
   * - task_id is preserved from session (may be null if task was deleted)
   * - task_name is the snapshot from when tracking started
   *
   * Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC5
   * Source: notes/PRD-time-tracking.md#FR6, FR7, FR11
   * Source: notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.md#AC-4.1.1
   */
  const stopTracking = useCallback(async (): Promise<TimeEntry | null> => {
    // If no active session, nothing to stop
    if (!activeSession) {
      if (import.meta.env.DEV) {
        console.log('[Today] TimeTracking: No active session to stop')
      }
      return null
    }

    // Calculate end time and duration
    const endTime = new Date()
    const startTime = new Date(activeSession.startTime)
    const duration = endTime.getTime() - startTime.getTime()

    // Prepare entry data (without id/timestamps when using addEntryFn)
    const entryData = {
      user_id: userId,
      task_id: activeSession.taskId, // Preserved from session, may be null if task deleted
      task_name: activeSession.taskName, // Snapshot from session start
      start_time: activeSession.startTime,
      end_time: endTime.toISOString(),
      duration,
      date: format(startTime, 'yyyy-MM-dd'), // Date of when tracking started
    }

    let entry: TimeEntry

    if (addEntryFn) {
      // Epic 4: Use sync-aware save via useTimeEntries.addEntry
      // This saves to IndexedDB with _syncStatus='pending' and queues for sync
      entry = await addEntryFn(entryData)

      if (import.meta.env.DEV) {
        console.log('[Today] TimeTracking: Stopped tracking, saved entry via sync', entry.id)
      }
    } else {
      // Fallback: Direct IndexedDB save (backwards compatibility)
      const now = new Date().toISOString()
      entry = {
        ...entryData,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      }
      await saveTimeEntry(entry)

      if (import.meta.env.DEV) {
        console.log('[Today] TimeTracking: Stopped tracking, saved entry directly', entry.id)
      }
    }

    // Clear active session
    await clearActiveSession()

    // Update React state
    setActiveSession(null)

    return entry
  }, [activeSession, userId, addEntryFn])

  return {
    activeSession,
    isTracking: activeSession !== null,
    isLoading,
    startTracking,
    stopTracking,
  }
}
