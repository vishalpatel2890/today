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
 */
export type SyncTable = 'tasks' | 'categories'

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
 */
class TodayDatabase extends Dexie {
  tasks!: EntityTable<LocalTask, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('today-app')

    // Version 1: Initial schema
    this.version(1).stores({
      // Primary key 'id', indexed fields: user_id, _syncStatus
      tasks: 'id, user_id, _syncStatus',
      // Primary key 'id', indexed field: createdAt (for FIFO processing)
      syncQueue: 'id, createdAt',
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
