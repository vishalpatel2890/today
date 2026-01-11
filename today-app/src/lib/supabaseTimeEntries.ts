import { supabase } from './supabase'
import type { TimeEntry } from '../types/timeTracking'
import type { TimeEntryInsert } from '../types/database'

/**
 * Supabase CRUD operations for time_entries table
 *
 * Provides server-side persistence for time tracking data.
 * Used by sync queue to push/pull entries from cloud storage.
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#APIs and Interfaces
 */

/**
 * Error types for Supabase time entry operations
 */
export class TimeEntryError extends Error {
  readonly code: string
  readonly details?: unknown

  constructor(
    message: string,
    code: string,
    details?: unknown
  ) {
    super(message)
    this.name = 'TimeEntryError'
    this.code = code
    this.details = details
  }
}

/**
 * Fetch time entries from Supabase for a user
 *
 * Retrieves all time entries for the authenticated user.
 * Optionally filters to entries updated since a timestamp (for incremental sync).
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.4
 *
 * @param userId - The user ID to fetch entries for
 * @param since - Optional ISO timestamp to fetch only entries updated after this time
 * @returns Array of time entries from Supabase
 * @throws TimeEntryError if the fetch fails
 */
export async function fetchTimeEntries(
  userId: string,
  since?: string
): Promise<TimeEntry[]> {
  let query = supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (since) {
    query = query.gt('updated_at', since)
  }

  const { data, error } = await query

  if (error) {
    throw new TimeEntryError(
      `Failed to fetch time entries: ${error.message}`,
      error.code,
      error
    )
  }

  if (import.meta.env.DEV) {
    console.log('[Today] Supabase: Fetched time entries', data?.length ?? 0)
  }

  // Map database rows to TimeEntry interface
  return (data ?? []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    task_id: row.task_id,
    task_name: row.task_name,
    start_time: row.start_time,
    end_time: row.end_time,
    duration: row.duration,
    date: row.date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

/**
 * Upsert a single time entry to Supabase
 *
 * Creates or updates a time entry in the database.
 * Uses the entry's ID for conflict resolution.
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#AC-4.1.2
 *
 * @param entry - The time entry to upsert
 * @returns The upserted time entry
 * @throws TimeEntryError if the upsert fails
 */
export async function upsertTimeEntry(entry: TimeEntry): Promise<TimeEntry> {
  const insertData: TimeEntryInsert = {
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
  }

  const { data, error } = await supabase
    .from('time_entries')
    .upsert(insertData, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    throw new TimeEntryError(
      `Failed to upsert time entry: ${error.message}`,
      error.code,
      error
    )
  }

  if (import.meta.env.DEV) {
    console.log('[Today] Supabase: Upserted time entry', entry.id)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    task_id: data.task_id,
    task_name: data.task_name,
    start_time: data.start_time,
    end_time: data.end_time,
    duration: data.duration,
    date: data.date,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Batch upsert multiple time entries to Supabase
 *
 * Efficiently creates or updates multiple entries in a single request.
 * Used for bulk sync operations.
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#APIs and Interfaces
 *
 * @param entries - Array of time entries to upsert
 * @returns Array of upserted time entries
 * @throws TimeEntryError if the batch upsert fails
 */
export async function batchUpsertTimeEntries(
  entries: TimeEntry[]
): Promise<TimeEntry[]> {
  if (entries.length === 0) {
    return []
  }

  const insertData: TimeEntryInsert[] = entries.map(entry => ({
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
  }))

  const { data, error } = await supabase
    .from('time_entries')
    .upsert(insertData, { onConflict: 'id' })
    .select()

  if (error) {
    throw new TimeEntryError(
      `Failed to batch upsert time entries: ${error.message}`,
      error.code,
      error
    )
  }

  if (import.meta.env.DEV) {
    console.log('[Today] Supabase: Batch upserted time entries', data?.length ?? 0)
  }

  return (data ?? []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    task_id: row.task_id,
    task_name: row.task_name,
    start_time: row.start_time,
    end_time: row.end_time,
    duration: row.duration,
    date: row.date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

/**
 * Delete a time entry from Supabase
 *
 * Removes a time entry from the database by ID.
 * RLS ensures users can only delete their own entries.
 *
 * @param id - The time entry ID to delete
 * @throws TimeEntryError if the delete fails
 */
export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)

  if (error) {
    throw new TimeEntryError(
      `Failed to delete time entry: ${error.message}`,
      error.code,
      error
    )
  }

  if (import.meta.env.DEV) {
    console.log('[Today] Supabase: Deleted time entry', id)
  }
}

/**
 * Fetch a single time entry by ID
 *
 * @param id - The time entry ID to fetch
 * @returns The time entry or null if not found
 * @throws TimeEntryError if the fetch fails
 */
export async function fetchTimeEntryById(id: string): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - entry doesn't exist
      return null
    }
    throw new TimeEntryError(
      `Failed to fetch time entry: ${error.message}`,
      error.code,
      error
    )
  }

  return {
    id: data.id,
    user_id: data.user_id,
    task_id: data.task_id,
    task_name: data.task_name,
    start_time: data.start_time,
    end_time: data.end_time,
    duration: data.duration,
    date: data.date,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}
