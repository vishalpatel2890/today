import { db, type SyncQueueItem, type SyncTable, type LocalTask } from './db'
import { supabase } from './supabase'
import { updateSyncStatus as updateTimeEntrySyncStatus } from './timeTrackingDb'

/**
 * Sync operation type matching the SyncQueueItem interface
 */
export type SyncOperation = SyncQueueItem
export type { SyncTable }

/**
 * Result of processing the sync queue
 */
export interface SyncResult {
  processed: number
  failed: number
  remaining: number
  conflicts: number
}

/**
 * Callback for conflict notifications
 * AC-7.4.5: Notify user when server wins conflict resolution
 */
type ConflictCallback = (message: string) => void
let onConflictCallback: ConflictCallback | null = null

/**
 * Set the callback for conflict notifications
 * Called from useSyncQueue to connect to toast system
 */
export function setConflictCallback(callback: ConflictCallback | null): void {
  onConflictCallback = callback
}

/**
 * Retry configuration for failed sync operations
 */
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000] // ms - exponential backoff

/**
 * Queue an operation for later sync when online
 *
 * @param operation - Type of operation (INSERT, UPDATE, DELETE)
 * @param table - Target table (tasks, categories)
 * @param entityId - ID of the entity being modified
 * @param payload - Operation data to be synced
 */
export async function queueOperation(
  operation: SyncQueueItem['operation'],
  table: SyncTable,
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    operation,
    table,
    entityId,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }

  await db.syncQueue.put(item)

  if (import.meta.env.DEV) {
    console.log('[Today] Sync queue: added operation', {
      operation,
      table,
      entityId,
    })
  }
}

/**
 * Coalesce operations for the same entity
 * - DELETE wins: removes all other operations for that entity
 * - Multiple UPDATEs: keep only the latest
 * - INSERT followed by UPDATE: merge into single INSERT with updated payload
 * - INSERT followed by DELETE: cancel both out (no-op)
 *
 * @param items - Array of sync queue items
 * @returns Coalesced array with redundant operations removed
 */
export function coalesceOperations(items: SyncQueueItem[]): SyncQueueItem[] {
  const entityOps = new Map<string, SyncQueueItem[]>()

  // Group operations by entityId
  for (const item of items) {
    const key = `${item.table}:${item.entityId}`
    if (!entityOps.has(key)) {
      entityOps.set(key, [])
    }
    entityOps.get(key)!.push(item)
  }

  const result: SyncQueueItem[] = []

  for (const [, ops] of entityOps) {
    // Sort by createdAt to ensure correct order
    ops.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const hasDelete = ops.some(op => op.operation === 'DELETE')
    const hasInsert = ops.some(op => op.operation === 'INSERT')

    if (hasDelete) {
      if (hasInsert) {
        // INSERT followed by DELETE = no-op, skip entirely
        // The entity was created offline and deleted offline, never needs to sync
        if (import.meta.env.DEV) {
          console.log('[Today] Sync queue: coalesced INSERT+DELETE = no-op', {
            entityId: ops[0].entityId,
          })
        }
        continue
      }
      // DELETE wins - only keep the DELETE operation
      const deleteOp = ops.find(op => op.operation === 'DELETE')!
      result.push(deleteOp)
      continue
    }

    if (hasInsert) {
      // INSERT with potential UPDATEs - merge into single INSERT
      const insertOp = ops.find(op => op.operation === 'INSERT')!
      const updates = ops.filter(op => op.operation === 'UPDATE')

      if (updates.length > 0) {
        // Merge all UPDATE payloads into the INSERT
        let mergedPayload = JSON.parse(insertOp.payload)
        for (const update of updates) {
          mergedPayload = { ...mergedPayload, ...JSON.parse(update.payload) }
        }
        result.push({
          ...insertOp,
          payload: JSON.stringify(mergedPayload),
        })
      } else {
        result.push(insertOp)
      }
      continue
    }

    // Only UPDATEs - keep only the latest
    const latestUpdate = ops[ops.length - 1]
    // Merge all update payloads to capture all field changes
    let mergedPayload: Record<string, unknown> = {}
    for (const update of ops) {
      mergedPayload = { ...mergedPayload, ...JSON.parse(update.payload) }
    }
    result.push({
      ...latestUpdate,
      payload: JSON.stringify(mergedPayload),
    })
  }

  // Sort by createdAt for FIFO processing
  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * Result of processing a single sync item
 */
interface ProcessItemResult {
  success: boolean
  conflict: boolean
}

/**
 * Process a single sync item against Supabase
 * Includes conflict detection for UPDATE operations (AC-7.4.5)
 *
 * @param item - Sync queue item to process
 * @param userId - User ID for the operation
 * @returns Result indicating success and whether a conflict was resolved
 * @throws Error if the operation fails
 */
async function processSyncItem(
  item: SyncQueueItem,
  userId: string
): Promise<ProcessItemResult> {
  const payload = JSON.parse(item.payload)

  switch (item.operation) {
    case 'INSERT': {
      const { error } = await supabase.from(item.table).insert({
        ...payload,
        user_id: userId,
      })
      if (error) {
        throw new Error(`INSERT failed: ${error.message}`)
      }
      return { success: true, conflict: false }
    }
    case 'UPDATE': {
      // AC-7.4.5: Conflict detection for tasks table
      if (item.table === 'tasks') {
        const conflictResolved = await checkAndResolveConflict(item.entityId, userId)
        if (conflictResolved) {
          // Server version wins - don't push local changes
          return { success: true, conflict: true }
        }
      }

      // No conflict or not a task - proceed with update
      const { error } = await supabase
        .from(item.table)
        .update(payload)
        .eq('id', item.entityId)
        .eq('user_id', userId)
      if (error) {
        throw new Error(`UPDATE failed: ${error.message}`)
      }
      return { success: true, conflict: false }
    }
    case 'DELETE': {
      const { error } = await supabase
        .from(item.table)
        .delete()
        .eq('id', item.entityId)
        .eq('user_id', userId)
      if (error) {
        throw new Error(`DELETE failed: ${error.message}`)
      }
      return { success: true, conflict: false }
    }
  }
}

/**
 * Check for conflict and resolve using last-write-wins strategy
 * AC-7.4.5: Server wins when server updated_at > local _localUpdatedAt
 *
 * @param entityId - Task ID to check
 * @param userId - User ID for the operation
 * @returns true if conflict was detected and resolved (server wins), false otherwise
 */
async function checkAndResolveConflict(
  entityId: string,
  userId: string
): Promise<boolean> {
  try {
    // Fetch server version timestamp
    const { data: serverTask, error: fetchError } = await supabase
      .from('tasks')
      .select('updated_at')
      .eq('id', entityId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !serverTask) {
      // Task doesn't exist on server or error - no conflict
      return false
    }

    // Get local version
    const localTask = await db.tasks.get(entityId)
    if (!localTask) {
      // Local task not found - no conflict
      return false
    }

    const serverTime = new Date(serverTask.updated_at).getTime()
    const localTime = new Date(localTask._localUpdatedAt).getTime()

    if (import.meta.env.DEV) {
      console.log('[Today] Conflict check:', {
        entityId,
        serverTime: serverTask.updated_at,
        localTime: localTask._localUpdatedAt,
        serverWins: serverTime > localTime,
      })
    }

    // AC-7.4.5: Server wins if server has newer timestamp
    if (serverTime > localTime) {
      // Fetch full server version
      const { data: fullServerTask, error: fullError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', entityId)
        .eq('user_id', userId)
        .single()

      if (fullError || !fullServerTask) {
        // Can't fetch full task - let the update proceed
        return false
      }

      // Update local IndexedDB with server data
      const updatedLocalTask: LocalTask = {
        id: fullServerTask.id,
        user_id: fullServerTask.user_id,
        text: fullServerTask.text,
        created_at: fullServerTask.created_at,
        deferred_to: fullServerTask.deferred_to,
        category: fullServerTask.category,
        completed_at: fullServerTask.completed_at,
        updated_at: fullServerTask.updated_at,
        notes: fullServerTask.notes,
        _syncStatus: 'synced',
        _localUpdatedAt: fullServerTask.updated_at,
      }

      await db.tasks.put(updatedLocalTask)

      if (import.meta.env.DEV) {
        console.log('[Today] Conflict resolved: server wins', { entityId })
      }

      // Notify user via callback (AC-7.4.5)
      if (onConflictCallback) {
        onConflictCallback('Task updated from another device')
      }

      return true
    }

    return false
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] Conflict check failed:', error)
    }
    // On error, let the update proceed
    return false
  }
}

/**
 * Schedule a retry with exponential backoff
 *
 * @param userId - User ID for the operation
 * @param retryCount - Current retry count (0-indexed)
 */
function scheduleRetry(userId: string, retryCount: number): void {
  const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]

  if (import.meta.env.DEV) {
    console.log('[Today] Sync queue: scheduling retry', {
      delay,
      retryCount: retryCount + 1,
    })
  }

  setTimeout(() => {
    if (navigator.onLine) {
      processQueue(userId)
    }
  }, delay)
}

/**
 * Process the sync queue
 * - Coalesces operations to minimize API calls
 * - Processes in FIFO order
 * - Retries failed operations with exponential backoff
 * - Updates IndexedDB sync status on success
 * - Detects and resolves conflicts (AC-7.4.5)
 *
 * @param userId - User ID for all operations
 * @returns Result with processed, failed, remaining, and conflicts counts
 */
export async function processQueue(userId: string): Promise<SyncResult> {
  const items = await db.syncQueue.orderBy('createdAt').toArray()

  if (items.length === 0) {
    return { processed: 0, failed: 0, remaining: 0, conflicts: 0 }
  }

  // Coalesce operations for efficiency
  const coalesced = coalesceOperations(items)

  if (import.meta.env.DEV) {
    console.log('[Today] Sync queue: processing', {
      original: items.length,
      coalesced: coalesced.length,
    })
  }

  const result: SyncResult = {
    processed: 0,
    failed: 0,
    remaining: 0,
    conflicts: 0,
  }

  // Track which original items to remove on success
  const processedItemIds = new Set<string>()

  for (const item of coalesced) {
    try {
      const itemResult = await processSyncItem(item, userId)

      // Mark all original operations for this entity as processed
      const entityKey = `${item.table}:${item.entityId}`
      for (const original of items) {
        if (`${original.table}:${original.entityId}` === entityKey) {
          processedItemIds.add(original.id)
        }
      }

      // Track conflicts (AC-7.4.5)
      if (itemResult.conflict) {
        result.conflicts++
      }

      // Update sync status in IndexedDB (if no conflict)
      if (item.operation !== 'DELETE' && !itemResult.conflict) {
        if (item.table === 'tasks') {
          await db.tasks.update(item.entityId, { _syncStatus: 'synced' })
        } else if (item.table === 'time_entries') {
          // Epic 4: Update time entry sync status in separate IndexedDB
          await updateTimeEntrySyncStatus(item.entityId, 'synced', new Date().toISOString())
        }
      }

      result.processed++

      if (import.meta.env.DEV) {
        console.log('[Today] Sync queue: processed', {
          operation: item.operation,
          entityId: item.entityId,
          conflict: itemResult.conflict,
        })
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Today] Sync queue: operation failed', {
          operation: item.operation,
          entityId: item.entityId,
          error,
        })
      }

      if (item.retryCount >= MAX_RETRIES) {
        // Max retries exceeded - mark as permanently failed
        result.failed++
        // Remove the failed item to prevent infinite retries
        processedItemIds.add(item.id)

        if (import.meta.env.DEV) {
          console.error('[Today] Sync queue: max retries exceeded, giving up', {
            operation: item.operation,
            entityId: item.entityId,
          })
        }
      } else {
        // Increment retry count and schedule retry
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1,
        })
        scheduleRetry(userId, item.retryCount)

        // Stop processing remaining items - will retry later
        result.remaining = coalesced.length - result.processed - result.failed
        break
      }
    }
  }

  // Bulk delete processed items
  if (processedItemIds.size > 0) {
    await db.syncQueue.bulkDelete([...processedItemIds])
  }

  // Update remaining count
  result.remaining = await db.syncQueue.count()

  if (import.meta.env.DEV) {
    console.log('[Today] Sync queue: complete', result)
  }

  return result
}

/**
 * Get the current count of pending sync operations
 */
export async function getPendingCount(): Promise<number> {
  return db.syncQueue.count()
}

/**
 * Clear all items from the sync queue
 * Use with caution - this will discard all pending operations
 */
export async function clearQueue(): Promise<void> {
  await db.syncQueue.clear()

  if (import.meta.env.DEV) {
    console.log('[Today] Sync queue: cleared')
  }
}
