/**
 * Import service for restoring app data from backup files
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Story 4.2
 * Source: notes/sprint-artifacts/4-2-time-entries-in-export-backup.md
 */

import { db, type LocalTask } from './db'
import { bulkUpsertTimeEntries } from './timeTrackingDb'
import { queueOperation } from './syncQueue'
import type { Task } from '../types'
import type { CachedTimeEntry } from '../types/timeTracking'
import type { ExportPayload, ExportedTimeEntry, ImportResult } from '../types/export'

/**
 * Validate required fields for a time entry
 * AC-4.2.5: Validate required fields (id, task_name, start_time, end_time, duration, date)
 */
function validateTimeEntry(entry: unknown): entry is ExportedTimeEntry {
  if (!entry || typeof entry !== 'object') return false

  const e = entry as Record<string, unknown>

  return (
    typeof e.id === 'string' &&
    typeof e.task_name === 'string' &&
    typeof e.start_time === 'string' &&
    typeof e.end_time === 'string' &&
    typeof e.duration === 'number' &&
    typeof e.date === 'string'
  )
}

/**
 * Validate required fields for a task
 */
function validateTask(task: unknown): task is Task {
  if (!task || typeof task !== 'object') return false

  const t = task as Record<string, unknown>

  return (
    typeof t.id === 'string' &&
    typeof t.text === 'string' &&
    typeof t.createdAt === 'string'
  )
}

/**
 * Validate export payload structure
 */
function validatePayload(payload: unknown): payload is ExportPayload {
  if (!payload || typeof payload !== 'object') return false

  const p = payload as Record<string, unknown>

  return (
    typeof p.version === 'string' &&
    typeof p.exported_at === 'string' &&
    Array.isArray(p.tasks) &&
    Array.isArray(p.categories) &&
    Array.isArray(p.time_entries)
  )
}

/**
 * Convert Task to LocalTask for IndexedDB storage
 * Sets _syncStatus to 'pending' for Supabase sync (AC-4.2.5)
 */
function taskToLocalTask(task: Task, userId: string): LocalTask {
  return {
    id: task.id,
    user_id: userId,
    text: task.text,
    created_at: task.createdAt,
    deferred_to: task.deferredTo,
    category: task.category,
    completed_at: task.completedAt,
    updated_at: new Date().toISOString(),
    notes: task.notes,
    _syncStatus: 'pending',
    _localUpdatedAt: new Date().toISOString(),
  }
}

/**
 * Convert ExportedTimeEntry to CachedTimeEntry for IndexedDB storage
 * AC-4.2.5: Sets _syncStatus to 'pending' for Supabase sync
 */
function exportedToTimeEntry(entry: ExportedTimeEntry, userId: string): CachedTimeEntry {
  const now = new Date().toISOString()

  return {
    id: entry.id,
    user_id: userId,
    task_id: null, // Original task_id not preserved in export
    task_name: entry.task_name,
    start_time: entry.start_time,
    end_time: entry.end_time,
    duration: entry.duration,
    date: entry.date,
    created_at: now,
    updated_at: now,
    _syncStatus: 'pending',
  }
}

/**
 * Import tasks from backup
 * AC-4.2.8: Uses upsert behavior (put not add) to handle duplicates
 */
async function importTasks(
  tasks: Task[],
  userId: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = []
  let count = 0

  for (const task of tasks) {
    if (!validateTask(task)) {
      errors.push(`Invalid task: ${JSON.stringify(task).substring(0, 100)}`)
      continue
    }

    try {
      const localTask = taskToLocalTask(task, userId)
      // Use put for upsert behavior (AC-4.2.8)
      await db.tasks.put(localTask)
      count++

      // Queue for Supabase sync
      await queueOperation('INSERT', 'tasks', task.id, {
        id: task.id,
        user_id: userId,
        text: task.text,
        created_at: task.createdAt,
        deferred_to: task.deferredTo,
        category: task.category,
        completed_at: task.completedAt,
        notes: task.notes,
      })
    } catch (error) {
      errors.push(`Failed to import task ${task.id}: ${error}`)
    }
  }

  if (import.meta.env.DEV) {
    console.log('[Today] Import: imported tasks', { count, errors: errors.length })
  }

  return { count, errors }
}

/**
 * Import time entries from backup
 * AC-4.2.5: Imported to IndexedDB and queued for sync
 * AC-4.2.6: Entries will appear in Insights modal after import
 * AC-4.2.8: Uses bulkUpsertTimeEntries for upsert behavior
 */
async function importTimeEntries(
  entries: ExportedTimeEntry[],
  userId: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = []
  const validEntries: CachedTimeEntry[] = []

  for (const entry of entries) {
    if (!validateTimeEntry(entry)) {
      errors.push(`Invalid time entry: ${JSON.stringify(entry).substring(0, 100)}`)
      continue
    }

    validEntries.push(exportedToTimeEntry(entry, userId))
  }

  try {
    // AC-4.2.8: bulkUpsertTimeEntries uses put for upsert behavior
    await bulkUpsertTimeEntries(validEntries)

    // Queue each entry for Supabase sync (AC-4.2.5)
    for (const entry of validEntries) {
      await queueOperation('INSERT', 'time_entries', entry.id, {
        id: entry.id,
        user_id: entry.user_id,
        task_id: entry.task_id,
        task_name: entry.task_name,
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration: entry.duration,
        date: entry.date,
      })
    }

    if (import.meta.env.DEV) {
      console.log('[Today] Import: imported time entries', {
        count: validEntries.length,
        errors: errors.length,
      })
    }

    return { count: validEntries.length, errors }
  } catch (error) {
    errors.push(`Failed to bulk import time entries: ${error}`)
    return { count: 0, errors }
  }
}

/**
 * Read file contents as text
 * Uses FileReader for better browser compatibility
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Parse and import data from a backup JSON string
 * Internal function that handles the actual import logic
 */
export async function importFromJson(
  json: string,
  userId: string
): Promise<ImportResult> {
  const errors: string[] = []

  try {
    const payload = JSON.parse(json)

    // Validate payload structure
    if (!validatePayload(payload)) {
      return {
        success: false,
        tasksCount: 0,
        categoriesCount: 0,
        timeEntriesCount: 0,
        errors: ['Invalid backup file format'],
      }
    }

    if (import.meta.env.DEV) {
      console.log('[Today] Import: parsed payload', {
        version: payload.version,
        tasks: payload.tasks.length,
        categories: payload.categories.length,
        timeEntries: payload.time_entries.length,
      })
    }

    // Import tasks
    const tasksResult = await importTasks(payload.tasks, userId)
    errors.push(...tasksResult.errors)

    // Import time entries (AC-4.2.5)
    const timeEntriesResult = await importTimeEntries(payload.time_entries, userId)
    errors.push(...timeEntriesResult.errors)

    // Categories are derived from tasks, not imported separately
    // They'll be synced via the task sync process
    const categoriesCount = payload.categories.length

    return {
      success: errors.length === 0,
      tasksCount: tasksResult.count,
      categoriesCount,
      timeEntriesCount: timeEntriesResult.count,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Import: failed to parse JSON', error)
    }

    return {
      success: false,
      tasksCount: 0,
      categoriesCount: 0,
      timeEntriesCount: 0,
      errors: [`Failed to parse backup: ${error}`],
    }
  }
}

/**
 * Parse and import data from a backup JSON file
 * AC-4.2.7: Returns counts for success toast message
 */
export async function importFromFile(
  file: File,
  userId: string
): Promise<ImportResult> {
  try {
    const text = await readFileAsText(file)
    return importFromJson(text, userId)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Import: failed to read file', error)
    }

    return {
      success: false,
      tasksCount: 0,
      categoriesCount: 0,
      timeEntriesCount: 0,
      errors: [`Failed to read file: ${error}`],
    }
  }
}

/**
 * Format import result for toast message
 * AC-4.2.7: "Restored X tasks and Y time entries"
 */
export function formatImportMessage(result: ImportResult): string {
  const { tasksCount, timeEntriesCount } = result

  const taskStr = tasksCount === 1 ? '1 task' : `${tasksCount} tasks`
  const timeStr = timeEntriesCount === 1 ? '1 time entry' : `${timeEntriesCount} time entries`

  // Handle edge cases for singular/plural
  if (tasksCount === 0 && timeEntriesCount === 0) {
    return 'No data to restore'
  }

  if (tasksCount === 0) {
    return `Restored ${timeStr}`
  }

  if (timeEntriesCount === 0) {
    return `Restored ${taskStr}`
  }

  return `Restored ${taskStr} and ${timeStr}`
}
