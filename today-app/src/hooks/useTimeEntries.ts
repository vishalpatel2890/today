import { useState, useCallback, useEffect, useMemo } from 'react'
import type { TimeEntry, CachedTimeEntry } from '../types/timeTracking'
import {
  getTimeEntries,
  saveTimeEntry,
  updateSyncStatus,
  getPendingEntries,
  bulkUpsertTimeEntries as bulkUpsertTimeEntriesDb,
  deleteTimeEntry as deleteTimeEntryDb,
  updateTimeEntry as updateTimeEntryDb,
} from '../lib/timeTrackingDb'
import { queueOperation } from '../lib/syncQueue'
import {
  fetchTimeEntries as fetchTimeEntriesSupabase,
  upsertTimeEntry as upsertTimeEntrySupabase,
} from '../lib/supabaseTimeEntries'

/**
 * useTimeEntries hook for time entry management with sync support
 *
 * Provides CRUD operations for time entries with offline-first architecture:
 * - Saves to IndexedDB immediately
 * - Queues for Supabase sync when online
 * - Merges remote entries on load
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#APIs and Interfaces
 * Source: notes/architecture-time-tracking.md#ADR-TT-002
 */

export interface UseTimeEntriesResult {
  /** All cached time entries */
  entries: CachedTimeEntry[]
  /** Loading state for initial fetch */
  isLoading: boolean
  /** Error from last operation */
  error: Error | null
  /** Count of entries pending sync */
  pendingCount: number
  /** Add a new time entry */
  addEntry: (entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<TimeEntry>
  /** Update an existing time entry */
  updateEntry: (id: string, updates: Partial<Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>>) => Promise<TimeEntry>
  /** Delete a time entry by ID */
  deleteEntry: (id: string) => Promise<void>
  /** Trigger sync of pending entries to Supabase */
  syncEntries: () => Promise<void>
  /** Refresh entries from IndexedDB */
  refreshEntries: () => Promise<void>
  /** Fetch and merge entries from Supabase */
  fetchAndMerge: (userId: string) => Promise<void>
}

/**
 * Hook for managing time entries with offline-first sync
 *
 * @returns Time entries state and operations
 */
export function useTimeEntries(): UseTimeEntriesResult {
  const [entries, setEntries] = useState<CachedTimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Compute pending count from entries
  const pendingCount = useMemo(() => {
    return entries.filter(e => e._syncStatus === 'pending').length
  }, [entries])

  /**
   * Load entries from IndexedDB
   */
  const loadEntries = useCallback(async () => {
    try {
      const cached = await getTimeEntries()
      setEntries(cached)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load time entries')
      setError(error)
      if (import.meta.env.DEV) {
        console.error('[Today] useTimeEntries: Failed to load entries', err)
      }
    }
  }, [])

  /**
   * Initial load on mount
   */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await loadEntries()
      setIsLoading(false)
    }
    init()
  }, [loadEntries])

  /**
   * Refresh entries from IndexedDB
   */
  const refreshEntries = useCallback(async () => {
    await loadEntries()
  }, [loadEntries])

  /**
   * Add a new time entry
   *
   * 1. Generates UUID with crypto.randomUUID()
   * 2. Saves to IndexedDB with _syncStatus = 'pending'
   * 3. Queues for sync
   * 4. Updates React state
   *
   * Source: notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.md#AC-4.1.1
   *
   * @param entryData - Entry data without id, created_at, updated_at
   * @returns The created time entry
   */
  const addEntry = useCallback(
    async (
      entryData: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>
    ): Promise<TimeEntry> => {
      const now = new Date().toISOString()
      const entry: TimeEntry = {
        ...entryData,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      }

      try {
        // Save to IndexedDB with pending sync status
        await saveTimeEntry(entry)

        // Queue for sync
        await queueOperation('INSERT', 'time_entries', entry.id, {
          id: entry.id,
          user_id: entry.user_id,
          task_id: entry.task_id,
          task_name: entry.task_name,
          start_time: entry.start_time,
          end_time: entry.end_time,
          duration: entry.duration,
          date: entry.date,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
        })

        // Update local state
        const cachedEntry: CachedTimeEntry = {
          ...entry,
          _syncStatus: 'pending',
        }
        setEntries(prev => [cachedEntry, ...prev])
        setError(null)

        if (import.meta.env.DEV) {
          console.log('[Today] useTimeEntries: Added entry', entry.id)
        }

        return entry
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add time entry')
        setError(error)
        throw error
      }
    },
    []
  )

  /**
   * Delete a time entry
   *
   * 1. Removes from IndexedDB
   * 2. Queues DELETE for sync
   * 3. Updates React state
   *
   * @param id - Time entry ID to delete
   */
  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      // Delete from IndexedDB
      await deleteTimeEntryDb(id)

      // Queue for sync
      await queueOperation('DELETE', 'time_entries', id, {})

      // Update local state
      setEntries(prev => prev.filter(e => e.id !== id))
      setError(null)

      if (import.meta.env.DEV) {
        console.log('[Today] useTimeEntries: Deleted entry', id)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete time entry')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Update an existing time entry
   *
   * 1. Updates in IndexedDB
   * 2. Queues UPDATE for sync
   * 3. Updates React state optimistically
   *
   * Source: notes/tech-spec-swipe-actions.md#Update Entry Logic
   *
   * @param id - Time entry ID to update
   * @param updates - Partial time entry fields to update
   * @returns The updated time entry
   */
  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>>
    ): Promise<TimeEntry> => {
      try {
        // Update in IndexedDB (sets _syncStatus to 'pending')
        const updated = await updateTimeEntryDb(id, updates)

        // Queue for sync
        await queueOperation('UPDATE', 'time_entries', id, {
          id: updated.id,
          user_id: updated.user_id,
          task_id: updated.task_id,
          task_name: updated.task_name,
          start_time: updated.start_time,
          end_time: updated.end_time,
          duration: updated.duration,
          date: updated.date,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        })

        // Update local state
        setEntries(prev =>
          prev.map(e =>
            e.id === id
              ? { ...updated, _syncStatus: 'pending' }
              : e
          )
        )
        setError(null)

        if (import.meta.env.DEV) {
          console.log('[Today] useTimeEntries: Updated entry', id)
        }

        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update time entry')
        setError(error)
        throw error
      }
    },
    []
  )

  /**
   * Sync pending entries to Supabase
   *
   * Processes entries with _syncStatus = 'pending' and pushes to Supabase.
   * Updates sync status on success.
   *
   * Source: notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.md#AC-4.1.2
   */
  const syncEntries = useCallback(async (): Promise<void> => {
    try {
      const pending = await getPendingEntries()

      if (pending.length === 0) {
        if (import.meta.env.DEV) {
          console.log('[Today] useTimeEntries: No pending entries to sync')
        }
        return
      }

      if (import.meta.env.DEV) {
        console.log('[Today] useTimeEntries: Syncing entries', pending.length)
      }

      // Process each pending entry
      for (const entry of pending) {
        try {
          // Strip sync metadata for Supabase
          const { _syncStatus, _lastSyncAttempt, ...timeEntry } = entry
          await upsertTimeEntrySupabase(timeEntry)

          // Update local sync status
          await updateSyncStatus(entry.id, 'synced', new Date().toISOString())

          // Update React state
          setEntries(prev =>
            prev.map(e =>
              e.id === entry.id
                ? { ...e, _syncStatus: 'synced', _lastSyncAttempt: new Date().toISOString() }
                : e
            )
          )
        } catch (syncError) {
          // Mark as error, will retry later
          await updateSyncStatus(entry.id, 'error', new Date().toISOString())

          setEntries(prev =>
            prev.map(e =>
              e.id === entry.id
                ? { ...e, _syncStatus: 'error', _lastSyncAttempt: new Date().toISOString() }
                : e
            )
          )

          if (import.meta.env.DEV) {
            console.error('[Today] useTimeEntries: Failed to sync entry', entry.id, syncError)
          }
        }
      }

      setError(null)

      if (import.meta.env.DEV) {
        console.log('[Today] useTimeEntries: Sync complete')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sync time entries')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Fetch entries from Supabase and merge with local cache
   *
   * Merge strategy (AC-4.1.5):
   * - Remote entry not in local: Add with _syncStatus = 'synced'
   * - Local entry older than remote: Replace with remote
   * - Local entry newer than remote: Keep local (will sync on next push)
   * - Local entry with _syncStatus = 'pending': Preserve (don't overwrite)
   *
   * Source: notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.md#AC-4.1.4, AC-4.1.5
   *
   * @param userId - User ID to fetch entries for
   */
  const fetchAndMerge = useCallback(
    async (userId: string): Promise<void> => {
      try {
        if (import.meta.env.DEV) {
          console.log('[Today] useTimeEntries: Fetching from Supabase for merge')
        }

        const remoteEntries = await fetchTimeEntriesSupabase(userId)
        const localEntries = await getTimeEntries()

        // Build lookup map for local entries
        const localMap = new Map<string, CachedTimeEntry>()
        for (const entry of localEntries) {
          localMap.set(entry.id, entry)
        }

        // Process remote entries
        const toUpsert: CachedTimeEntry[] = []

        for (const remote of remoteEntries) {
          const local = localMap.get(remote.id)

          if (!local) {
            // Not in local: add with synced status
            toUpsert.push({
              ...remote,
              _syncStatus: 'synced',
            })
          } else if (local._syncStatus === 'pending') {
            // Local has pending changes: keep local, will sync later
            continue
          } else {
            // Compare timestamps
            const remoteTime = new Date(remote.updated_at).getTime()
            const localTime = new Date(local.updated_at).getTime()

            if (remoteTime > localTime) {
              // Remote is newer: replace local
              toUpsert.push({
                ...remote,
                _syncStatus: 'synced',
              })
            }
            // Else: local is newer or same, keep local
          }
        }

        if (toUpsert.length > 0) {
          await bulkUpsertTimeEntriesDb(toUpsert)

          if (import.meta.env.DEV) {
            console.log('[Today] useTimeEntries: Merged entries from Supabase', toUpsert.length)
          }
        }

        // Refresh state from IndexedDB
        await loadEntries()
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch and merge entries')
        setError(error)

        if (import.meta.env.DEV) {
          console.error('[Today] useTimeEntries: Fetch and merge failed', err)
        }
      }
    },
    [loadEntries]
  )

  return {
    entries,
    isLoading,
    error,
    pendingCount,
    addEntry,
    updateEntry,
    deleteEntry,
    syncEntries,
    refreshEntries,
    fetchAndMerge,
  }
}
