/**
 * Export/Import types for the Today app backup functionality
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Story 4.2
 * Source: notes/sprint-artifacts/4-2-time-entries-in-export-backup.md
 */

import type { Task } from './index'

/**
 * Exported time entry format for backup JSON
 * Includes human-readable duration_formatted field (AC-4.2.3)
 * Omits internal sync fields (_syncStatus, _lastSyncAttempt)
 *
 * AC-4.2.2: Required fields: id, task_name, start_time, end_time, duration, date
 */
export interface ExportedTimeEntry {
  id: string
  task_name: string
  start_time: string      // ISO 8601 timestamp
  end_time: string        // ISO 8601 timestamp
  duration: number        // Milliseconds
  duration_formatted: string  // Human-readable "Xh Ym" format (AC-4.2.3)
  date: string            // YYYY-MM-DD
}

/**
 * Export payload schema for app backup
 * Contains all user data: tasks, categories, and time entries
 *
 * AC-4.2.1: Includes time_entries array
 */
export interface ExportPayload {
  version: string         // Schema version for future compatibility
  exported_at: string     // ISO 8601 timestamp of export
  tasks: Task[]
  categories: string[]
  time_entries: ExportedTimeEntry[]
}

/**
 * Import result containing counts and status
 * AC-4.2.7: Used for success toast message
 */
export interface ImportResult {
  success: boolean
  tasksCount: number
  categoriesCount: number
  timeEntriesCount: number
  errors?: string[]
}

/**
 * Current export schema version
 * Increment when making breaking changes to ExportPayload structure
 */
export const EXPORT_SCHEMA_VERSION = '1.0'
