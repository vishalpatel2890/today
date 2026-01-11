/**
 * Export service for creating app backup files
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Story 4.2
 * Source: notes/sprint-artifacts/4-2-time-entries-in-export-backup.md
 */

import { db, type LocalTask } from './db'
import { getTimeEntries } from './timeTrackingDb'
import { formatDurationSummary } from './timeFormatters'
import type { Task } from '../types'
import type { CachedTimeEntry } from '../types/timeTracking'
import type { ExportPayload, ExportedTimeEntry } from '../types/export'

/**
 * Convert LocalTask to Task for export
 * Strips internal sync fields
 */
const localTaskToTask = (localTask: LocalTask): Task => ({
  id: localTask.id,
  text: localTask.text,
  createdAt: localTask.created_at,
  deferredTo: localTask.deferred_to,
  category: localTask.category,
  completedAt: localTask.completed_at,
  notes: localTask.notes,
})

/**
 * Convert CachedTimeEntry to ExportedTimeEntry
 * AC-4.2.2: Includes id, task_name, start_time, end_time, duration, date
 * AC-4.2.3: Includes human-readable duration_formatted
 * AC-4.2.4: Entries with null task_id are included with task_name preserved
 */
const timeEntryToExported = (entry: CachedTimeEntry): ExportedTimeEntry => ({
  id: entry.id,
  task_name: entry.task_name,
  start_time: entry.start_time,
  end_time: entry.end_time,
  duration: entry.duration,
  duration_formatted: formatDurationSummary(entry.duration),
  date: entry.date,
})

/**
 * Get all tasks from IndexedDB for export
 * Returns Task[] suitable for export (without sync metadata)
 */
export async function getTasksForExport(): Promise<Task[]> {
  try {
    const localTasks = await db.tasks.toArray()

    if (import.meta.env.DEV) {
      console.log('[Today] Export: loaded tasks', localTasks.length)
    }

    return localTasks.map(localTaskToTask)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Export: failed to load tasks', error)
    }
    return []
  }
}

/**
 * Get unique categories from tasks
 */
export function getCategoriesFromTasks(tasks: Task[]): string[] {
  const categorySet = new Set<string>()

  for (const task of tasks) {
    if (task.category) {
      categorySet.add(task.category)
    }
  }

  return Array.from(categorySet).sort()
}

/**
 * Get all time entries for export
 * AC-4.2.1: Includes time_entries array in export
 * AC-4.2.4: Entries with null task_id included (deleted tasks)
 * AC-4.2.9: Sorted by start_time ascending (oldest first)
 */
export async function getTimeEntriesForExport(): Promise<ExportedTimeEntry[]> {
  try {
    // Get all entries regardless of sync status
    const entries = await getTimeEntries()

    if (import.meta.env.DEV) {
      console.log('[Today] Export: loaded time entries', entries.length)
    }

    // Convert to export format
    const exported = entries.map(timeEntryToExported)

    // Sort by start_time ascending (oldest first) - AC-4.2.9
    exported.sort((a, b) => a.start_time.localeCompare(b.start_time))

    return exported
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Export: failed to load time entries', error)
    }
    return []
  }
}

/**
 * Create a complete export payload
 * AC-4.2.1: Exported JSON includes time_entries array
 */
export async function createExportPayload(): Promise<ExportPayload> {
  const tasks = await getTasksForExport()
  const categories = getCategoriesFromTasks(tasks)
  const timeEntries = await getTimeEntriesForExport()

  const payload: ExportPayload = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    tasks,
    categories,
    time_entries: timeEntries,
  }

  if (import.meta.env.DEV) {
    console.log('[Today] Export: created payload', {
      tasks: tasks.length,
      categories: categories.length,
      timeEntries: timeEntries.length,
    })
  }

  return payload
}

/**
 * Export app data to a downloadable JSON file
 * Triggers browser download of the backup file
 */
export async function exportToFile(): Promise<void> {
  try {
    const payload = await createExportPayload()
    const json = JSON.stringify(payload, null, 2)

    // Create blob and download link
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `today-backup-${date}.json`

    // Create and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    URL.revokeObjectURL(url)

    if (import.meta.env.DEV) {
      console.log('[Today] Export: file downloaded', filename)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Export: failed to create file', error)
    }
    throw error
  }
}
