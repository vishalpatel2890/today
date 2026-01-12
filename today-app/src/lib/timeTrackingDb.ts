import Dexie from 'dexie'
import type { ActiveSession, TimeEntry, CachedTimeEntry, TimeEntrySyncStatus } from '../types/timeTracking'

/**
 * Time Tracking IndexedDB operations
 *
 * Provides persistence for active tracking sessions and time entries with sync support.
 * Uses a singleton key 'current' for the active session store.
 *
 * Source: notes/architecture-time-tracking.md#ADR-TT-001
 * Source: notes/sprint-artifacts/tech-spec-epic-1.md#IndexedDB Schema
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Data Models
 */

// Singleton key for active session (only one active session at a time)
const ACTIVE_SESSION_KEY = 'current'

/**
 * Time Tracking Database extending the app's Dexie pattern
 *
 * Stores:
 * - activeSession: Persists active tracking session (crash-resistant)
 * - timeEntries: Completed time entries with sync status for offline-first sync
 */
class TimeTrackingDatabase extends Dexie {
  activeSession!: Dexie.Table<{ key: string; session: ActiveSession }, string>
  timeEntries!: Dexie.Table<CachedTimeEntry, string>

  constructor() {
    super('today-time-tracking')

    // Version 1: Active session only
    this.version(1).stores({
      activeSession: 'key',
    })

    // Version 2: Add time entries store
    this.version(2).stores({
      activeSession: 'key',
      // Indexes: id (primary), date (for filtering), task_id (for grouping)
      // Compound index [user_id+date] for efficient user-scoped date queries
      timeEntries: 'id, date, task_id, [user_id+date]',
    })

    // Version 3: Add sync status index for Epic 4 cross-device sync
    // Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md
    this.version(3).stores({
      activeSession: 'key',
      // Added _syncStatus index for querying pending entries
      timeEntries: 'id, date, task_id, [user_id+date], _syncStatus',
    })

    // Version 4: Add user_id index for data isolation fix
    // Source: notes/sprint-artifacts/tech-spec-time-entries-data-isolation.md
    this.version(4).stores({
      activeSession: 'key',
      // Added user_id index for filtering entries by user (data isolation)
      timeEntries: 'id, date, task_id, user_id, [user_id+date], _syncStatus',
    })
  }
}

/**
 * Singleton database instance for time tracking
 */
const timeTrackingDb = new TimeTrackingDatabase()

/**
 * Save active session to IndexedDB
 *
 * Called immediately when tracking starts to ensure crash-resistant persistence.
 * This write must complete before the modal closes (per ADR-TT-001).
 *
 * @param session - The active session to persist
 */
export async function saveActiveSession(session: ActiveSession): Promise<void> {
  await timeTrackingDb.activeSession.put({
    key: ACTIVE_SESSION_KEY,
    session,
  })

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Saved active session', session)
  }
}

/**
 * Load active session from IndexedDB
 *
 * Called on app mount to restore any existing tracking session.
 * Returns null if no active session exists.
 *
 * @returns The active session or null if none exists
 */
export async function loadActiveSession(): Promise<ActiveSession | null> {
  const record = await timeTrackingDb.activeSession.get(ACTIVE_SESSION_KEY)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Loaded active session', record?.session ?? null)
  }

  return record?.session ?? null
}

/**
 * Clear active session from IndexedDB
 *
 * Called when tracking is stopped to remove the active session.
 */
export async function clearActiveSession(): Promise<void> {
  await timeTrackingDb.activeSession.delete(ACTIVE_SESSION_KEY)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Cleared active session')
  }
}

/**
 * Save a completed time entry to IndexedDB with sync status
 *
 * Called when tracking is stopped to persist the time entry.
 * This write must complete before showing success feedback (crash-resistant).
 * Sets _syncStatus to 'pending' by default for sync queue processing.
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.1
 *
 * @param entry - The completed time entry to persist (TimeEntry or CachedTimeEntry)
 */
export async function saveTimeEntry(entry: TimeEntry | CachedTimeEntry): Promise<void> {
  // Ensure sync metadata is set (default to pending for new entries)
  const cachedEntry: CachedTimeEntry = {
    ...entry,
    _syncStatus: '_syncStatus' in entry ? entry._syncStatus : 'pending',
  }

  await timeTrackingDb.timeEntries.add(cachedEntry)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Saved time entry', cachedEntry)
  }
}

/**
 * Get time entries from IndexedDB
 *
 * Retrieves time entries, optionally filtered by date range.
 * Returns CachedTimeEntry with sync metadata for UI display.
 * Used by Epic 2 insights view.
 *
 * @param dateRange - Optional date range filter (YYYY-MM-DD format)
 * @returns Array of cached time entries matching the filter
 */
export async function getTimeEntries(
  dateRange?: { start: string; end: string }
): Promise<CachedTimeEntry[]> {
  let entries: CachedTimeEntry[]

  if (dateRange) {
    // Filter by date range using the date index
    entries = await timeTrackingDb.timeEntries
      .where('date')
      .between(dateRange.start, dateRange.end, true, true)
      .toArray()
  } else {
    // Return all entries
    entries = await timeTrackingDb.timeEntries.toArray()
  }

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Loaded time entries', entries.length)
  }

  return entries
}

/**
 * Get time entry by ID
 *
 * @param id - The time entry ID
 * @returns The cached time entry or undefined if not found
 */
export async function getTimeEntryById(id: string): Promise<CachedTimeEntry | undefined> {
  return timeTrackingDb.timeEntries.get(id)
}

/**
 * Update sync status for a time entry
 *
 * Called after sync operations to update the entry's sync state.
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.3
 *
 * @param id - The time entry ID
 * @param status - New sync status ('synced', 'pending', or 'error')
 * @param lastSyncAttempt - Optional timestamp of the sync attempt
 */
export async function updateSyncStatus(
  id: string,
  status: TimeEntrySyncStatus,
  lastSyncAttempt?: string
): Promise<void> {
  const updateData: Partial<CachedTimeEntry> = { _syncStatus: status }
  if (lastSyncAttempt) {
    updateData._lastSyncAttempt = lastSyncAttempt
  }

  await timeTrackingDb.timeEntries.update(id, updateData)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Updated sync status', { id, status })
  }
}

/**
 * Get all entries with pending sync status
 *
 * Used by sync queue to find entries that need to be pushed to Supabase.
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.2
 *
 * @returns Array of entries with _syncStatus = 'pending'
 */
export async function getPendingEntries(): Promise<CachedTimeEntry[]> {
  const entries = await timeTrackingDb.timeEntries
    .where('_syncStatus')
    .equals('pending')
    .toArray()

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Found pending entries', entries.length)
  }

  return entries
}

/**
 * Upsert a time entry (insert or update)
 *
 * Used during merge operations to update local cache with remote data.
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.5
 *
 * @param entry - The cached time entry to upsert
 */
export async function upsertTimeEntry(entry: CachedTimeEntry): Promise<void> {
  await timeTrackingDb.timeEntries.put(entry)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Upserted time entry', entry.id)
  }
}

/**
 * Bulk upsert time entries
 *
 * Used during merge operations to efficiently update multiple entries.
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.4
 *
 * @param entries - Array of cached time entries to upsert
 */
export async function bulkUpsertTimeEntries(entries: CachedTimeEntry[]): Promise<void> {
  await timeTrackingDb.timeEntries.bulkPut(entries)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Bulk upserted time entries', entries.length)
  }
}

/**
 * Delete a time entry by ID
 *
 * @param id - The time entry ID to delete
 */
export async function deleteTimeEntry(id: string): Promise<void> {
  await timeTrackingDb.timeEntries.delete(id)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Deleted time entry', id)
  }
}

/**
 * Update a time entry in IndexedDB
 *
 * Updates an existing time entry with new field values.
 * Used by edit functionality to modify duration, date, task assignment, etc.
 *
 * Source: notes/tech-spec-swipe-actions.md#Update Entry Logic
 *
 * @param id - The time entry ID to update
 * @param updates - Partial time entry fields to update (excluding id, user_id, created_at)
 * @returns The updated cached time entry
 * @throws Error if entry not found
 */
export async function updateTimeEntry(
  id: string,
  updates: Partial<Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>>
): Promise<CachedTimeEntry> {
  const existing = await timeTrackingDb.timeEntries.get(id)

  if (!existing) {
    throw new Error(`Time entry not found: ${id}`)
  }

  const now = new Date().toISOString()

  // Merge updates with existing entry
  const updated: CachedTimeEntry = {
    ...existing,
    ...updates,
    updated_at: now,
    _syncStatus: 'pending', // Mark for re-sync
  }

  // Recalculate date field if start_time changed
  if (updates.start_time) {
    updated.date = updates.start_time.split('T')[0]
  }

  await timeTrackingDb.timeEntries.put(updated)

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Updated time entry', id, updates)
  }

  return updated
}

/**
 * Get time entries from IndexedDB filtered by user_id
 *
 * Used for offline fallback when Supabase is unavailable.
 * Ensures data isolation - users only see their own entries.
 *
 * Source: notes/sprint-artifacts/tech-spec-time-entries-data-isolation.md
 *
 * @param userId - The user ID to filter by
 * @returns Array of cached time entries for this user only
 */
export async function getTimeEntriesByUserId(userId: string): Promise<CachedTimeEntry[]> {
  const entries = await timeTrackingDb.timeEntries
    .where('user_id')
    .equals(userId)
    .toArray()

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Loaded time entries for user', { userId, count: entries.length })
  }

  return entries
}

/**
 * Clear ALL time entries from IndexedDB
 *
 * Called on user logout or user change to prevent data leakage.
 * Ensures that entries from one user are not visible to another user
 * on the same device/browser.
 *
 * Source: notes/sprint-artifacts/tech-spec-time-entries-data-isolation.md
 */
export async function clearAllTimeEntries(): Promise<void> {
  await timeTrackingDb.timeEntries.clear()

  if (import.meta.env.DEV) {
    console.log('[Today] TimeTracking: Cleared all time entries from cache')
  }
}

// Export the database instance for testing purposes
export { timeTrackingDb }
