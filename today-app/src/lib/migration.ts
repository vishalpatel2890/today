import { db, hasMigratedToIndexedDB, setMigrationComplete, type LocalTask } from './db'
import { STORAGE_KEY } from '../utils/storage'
import type { AppState, Task } from '../types'

/**
 * Convert a localStorage Task to IndexedDB LocalTask format
 * Adds sync tracking fields for offline-first functionality
 */
const taskToLocalTask = (task: Task, userId: string): LocalTask => ({
  id: task.id,
  user_id: userId,
  text: task.text,
  created_at: task.createdAt,
  deferred_to: task.deferredTo,
  category: task.category,
  completed_at: task.completedAt,
  updated_at: task.createdAt, // Use createdAt as initial updated_at
  notes: task.notes,
  sort_order: task.sortOrder,
  _syncStatus: 'pending', // Mark as pending to sync on next online
  _localUpdatedAt: new Date().toISOString(),
})

/**
 * Migrate existing localStorage data to IndexedDB
 *
 * This runs once on first app load after the update.
 * - Checks migration flag to prevent duplicate migrations
 * - Reads tasks from localStorage 'today-app-state'
 * - Converts to LocalTask format with sync fields
 * - Bulk inserts into IndexedDB
 * - Sets migration flag to prevent re-migration
 * - Preserves localStorage as backup (does not delete)
 *
 * @param userId - Current user ID (empty string for anonymous)
 * @returns Object with success status and migrated task count
 */
export const migrateFromLocalStorage = async (
  userId: string = ''
): Promise<{ success: boolean; taskCount: number; error?: Error }> => {
  // Check if already migrated
  if (hasMigratedToIndexedDB()) {
    if (import.meta.env.DEV) {
      console.log('[Today] Migration: Already migrated to IndexedDB')
    }
    return { success: true, taskCount: 0 }
  }

  try {
    // Read from localStorage
    const savedState = localStorage.getItem(STORAGE_KEY)

    if (!savedState) {
      // No data to migrate - mark as complete
      setMigrationComplete()
      if (import.meta.env.DEV) {
        console.log('[Today] Migration: No localStorage data found')
      }
      return { success: true, taskCount: 0 }
    }

    // Parse localStorage state
    const state = JSON.parse(savedState) as AppState

    if (!state.tasks || state.tasks.length === 0) {
      // No tasks to migrate
      setMigrationComplete()
      if (import.meta.env.DEV) {
        console.log('[Today] Migration: No tasks to migrate')
      }
      return { success: true, taskCount: 0 }
    }

    // Convert tasks to LocalTask format
    const localTasks: LocalTask[] = state.tasks.map(task =>
      taskToLocalTask(task, userId)
    )

    // Bulk insert into IndexedDB
    await db.tasks.bulkPut(localTasks)

    // Mark migration as complete
    setMigrationComplete()

    if (import.meta.env.DEV) {
      console.log('[Today] Migration: Successfully migrated', {
        taskCount: localTasks.length,
        userId: userId || '(anonymous)',
      })
    }

    return { success: true, taskCount: localTasks.length }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Migration: Failed', error)
    }
    return {
      success: false,
      taskCount: 0,
      error: error as Error,
    }
  }
}

/**
 * Check if IndexedDB has any tasks
 * Useful for determining if we need to run migration
 */
export const hasTasksInIndexedDB = async (): Promise<boolean> => {
  const count = await db.tasks.count()
  return count > 0
}

/**
 * Get all tasks from IndexedDB for a specific user
 *
 * @param userId - User ID to filter by (empty string for anonymous/all)
 * @returns Array of LocalTask objects
 */
export const getTasksFromIndexedDB = async (
  userId: string = ''
): Promise<LocalTask[]> => {
  if (userId) {
    return db.tasks.where('user_id').equals(userId).toArray()
  }
  // Return all tasks for anonymous users
  return db.tasks.toArray()
}

/**
 * Convert LocalTask back to app Task format
 * Strips sync tracking fields for use in UI
 */
export const localTaskToTask = (localTask: LocalTask): Task => ({
  id: localTask.id,
  text: localTask.text,
  createdAt: localTask.created_at,
  deferredTo: localTask.deferred_to,
  category: localTask.category,
  completedAt: localTask.completed_at,
  notes: localTask.notes,
  sortOrder: localTask.sort_order ?? Date.parse(localTask.created_at),
})
