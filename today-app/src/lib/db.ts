import Dexie, { type EntityTable } from 'dexie'
import type { TaskNotes } from '../types'

/**
 * Sync status for local tasks
 * - 'synced': Task is in sync with Supabase
 * - 'pending': Task has local changes not yet synced
 * - 'conflict': Task has conflicting changes (server vs local)
 */
export type SyncStatus = 'synced' | 'pending' | 'conflict'

/**
 * Local task type for IndexedDB storage
 * Extends the Supabase task structure with sync tracking fields
 */
export interface LocalTask {
  id: string
  user_id: string
  text: string
  created_at: string
  deferred_to: string | null
  category: string | null
  completed_at: string | null
  updated_at: string
  notes: TaskNotes | null
  // Sync tracking fields (prefixed with _ to indicate local-only)
  _syncStatus: SyncStatus
  _localUpdatedAt: string
}

/**
 * Supported table names for sync operations
 * Extended for time tracking sync (Epic 4)
 * NOTE: activityLogs is intentionally NOT included - activity data is local-only (FR19)
 */
export type SyncTable = 'tasks' | 'categories' | 'time_entries'

/**
 * Activity log entry for IndexedDB storage
 * Matches the ActivityEntry type from electron/activity/types.ts
 * Stored locally only - never synced to Supabase (FR19)
 *
 * Source: notes/architecture-electron-migration.md#ADR-008
 */
export interface ActivityLogEntry {
  /** Auto-incremented primary key for IndexedDB */
  id?: number
  /** ID of the time entry this activity belongs to */
  timeEntryId: string
  /** Name of the active application (e.g., "Visual Studio Code") */
  appName: string
  /** Title of the active window (e.g., "App.tsx - today-app") */
  windowTitle: string
  /** ISO 8601 timestamp when this activity was captured */
  timestamp: string
}

/**
 * Sync queue item for offline operations
 * Operations are queued when offline and replayed when online
 */
export interface SyncQueueItem {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: SyncTable
  entityId: string
  payload: string // JSON stringified payload
  createdAt: string
  retryCount: number
}

/**
 * Today app IndexedDB database using Dexie
 *
 * Tables:
 * - tasks: Local task storage with sync status tracking
 * - syncQueue: Queue of pending sync operations
 * - activityLogs: Activity tracking entries (Electron-only, local-only, never synced)
 *
 * Source: notes/architecture-electron-migration.md#ADR-008
 */
class TodayDatabase extends Dexie {
  tasks!: EntityTable<LocalTask, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>
  activityLogs!: EntityTable<ActivityLogEntry, 'id'>

  constructor() {
    super('today-app')

    // Version 1: Initial schema
    this.version(1).stores({
      // Primary key 'id', indexed fields: user_id, _syncStatus
      tasks: 'id, user_id, _syncStatus',
      // Primary key 'id', indexed field: createdAt (for FIFO processing)
      syncQueue: 'id, createdAt',
    })

    // Version 2: Add activityLogs table for Electron activity tracking (Story 3.3)
    // Auto-increment primary key (++id), indexed by timeEntryId for fast retrieval
    // Compound index [timeEntryId+timestamp] for ordered retrieval by time entry
    // NOTE: This table is NEVER synced to Supabase - local only (FR19, ADR-008)
    this.version(2).stores({
      tasks: 'id, user_id, _syncStatus',
      syncQueue: 'id, createdAt',
      activityLogs: '++id, timeEntryId, [timeEntryId+timestamp]',
    })
  }
}

/**
 * Singleton database instance
 */
export const db = new TodayDatabase()

/**
 * Migration flag key in localStorage
 */
export const MIGRATION_FLAG_KEY = 'today-app-migrated-to-idb'

/**
 * Check if migration from localStorage has been completed
 */
export const hasMigratedToIndexedDB = (): boolean => {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true'
}

/**
 * Mark migration as complete
 */
export const setMigrationComplete = (): void => {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
}
