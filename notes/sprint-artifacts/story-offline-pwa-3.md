# Story 7.3: Sync Queue Implementation

**Status:** Review

---

## User Story

As a **user**,
I want **my offline changes to automatically sync when I reconnect**,
So that **I never lose data and my tasks are consistent across devices**.

---

## Acceptance Criteria

**AC-7.3.1: Queue Operations When Offline**
- **Given** the device is offline (navigator.onLine = false)
- **When** user adds/edits/completes/deletes a task
- **Then** the operation is saved to `syncQueue` table in IndexedDB
- **And** the local task is updated immediately (optimistic update)
- **And** no Supabase API calls are attempted

**AC-7.3.2: Process Queue When Online**
- **Given** pending operations in syncQueue
- **When** device comes online
- **Then** operations are processed in FIFO order
- **And** successful operations are removed from queue
- **And** local task `_syncStatus` is updated to 'synced'

**AC-7.3.3: Retry Logic**
- **Given** a sync operation fails (network error, server error)
- **When** retry is attempted
- **Then** exponential backoff is used (1s, 5s, 15s delays)
- **And** after 3 failures, operation is marked as failed
- **And** failed operations are logged for debugging

**AC-7.3.4: Idempotent Operations**
- **Given** the same operation is queued multiple times (e.g., multiple edits)
- **When** queue is processed
- **Then** only the latest state is synced (coalescing)
- **And** intermediate operations are skipped

**AC-7.3.5: Delete Handling**
- **Given** a task is deleted while offline
- **When** sync queue is processed
- **Then** delete is applied to Supabase
- **And** any pending UPDATE operations for that task are discarded

---

## Implementation Details

### Tasks / Subtasks

- [x] Create `src/lib/syncQueue.ts` with queue management functions
- [x] Create `src/hooks/useSyncQueue.ts` React hook
- [x] Add queue operation function: `queueOperation(type, entityId, payload)`
- [x] Add queue processor function: `processQueue(userId)`
- [x] Implement retry logic with exponential backoff
- [x] Implement operation coalescing (latest wins for same entity)
- [x] Add online event listener to trigger queue processing
- [x] Update `useTasks.ts` to use queue when offline
- [x] Test offline add → online sync
- [x] Test offline edit → online sync
- [x] Test offline delete → online sync
- [x] Test multiple offline edits → single sync

### Technical Summary

**Queue Operation Structure:**
```typescript
// src/lib/syncQueue.ts
export interface SyncOperation {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: 'tasks' | 'categories'
  entityId: string
  payload: Record<string, unknown>
  createdAt: string
  retryCount: number
}

export async function queueOperation(
  operation: SyncOperation['operation'],
  table: SyncOperation['table'],
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const item: SyncOperation = {
    id: crypto.randomUUID(),
    operation,
    table,
    entityId,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }
  await db.syncQueue.put(item)
}
```

**Queue Processing:**
```typescript
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000]

export async function processQueue(userId: string): Promise<SyncResult> {
  const items = await db.syncQueue.orderBy('createdAt').toArray()

  // Coalesce: group by entityId, keep only latest operation
  const coalesced = coalesceOperations(items)

  for (const item of coalesced) {
    try {
      await processSyncItem(item, userId)
      await db.syncQueue.delete(item.id)
      await db.tasks.update(item.entityId, { _syncStatus: 'synced' })
    } catch (error) {
      if (item.retryCount >= MAX_RETRIES) {
        console.error('[Today] Sync failed permanently:', item)
        await db.syncQueue.delete(item.id)
      } else {
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1
        })
        // Schedule retry with backoff
        setTimeout(() => processQueue(userId), RETRY_DELAYS[item.retryCount])
        break // Stop processing, will retry
      }
    }
  }
}

async function processSyncItem(item: SyncOperation, userId: string) {
  const payload = JSON.parse(item.payload)

  switch (item.operation) {
    case 'INSERT':
      await supabase.from(item.table).insert({ ...payload, user_id: userId })
      break
    case 'UPDATE':
      await supabase.from(item.table).update(payload).eq('id', item.entityId)
      break
    case 'DELETE':
      await supabase.from(item.table).delete().eq('id', item.entityId)
      break
  }
}
```

**useSyncQueue Hook:**
```typescript
// src/hooks/useSyncQueue.ts
export function useSyncQueue(userId: string | null) {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Count pending operations
  useEffect(() => {
    const updateCount = async () => {
      const count = await db.syncQueue.count()
      setPendingCount(count)
    }
    updateCount()

    // Re-check when online
    window.addEventListener('online', updateCount)
    return () => window.removeEventListener('online', updateCount)
  }, [])

  // Process queue when online
  useEffect(() => {
    if (!userId) return

    const handleOnline = async () => {
      setIsSyncing(true)
      await processQueue(userId)
      setIsSyncing(false)
      setPendingCount(await db.syncQueue.count())
    }

    window.addEventListener('online', handleOnline)

    // Also process on mount if online
    if (navigator.onLine) {
      handleOnline()
    }

    return () => window.removeEventListener('online', handleOnline)
  }, [userId])

  return { pendingCount, isSyncing }
}
```

### Project Structure Notes

- **Files to create:** `src/lib/syncQueue.ts`, `src/hooks/useSyncQueue.ts`
- **Files to modify:** `src/hooks/useTasks.ts`
- **Expected test locations:** `tests/lib/syncQueue.test.ts`
- **Prerequisites:** Story 7.2 (IndexedDB + Dexie)

### Key Code References

**useTasks.ts addTask (current):**
```typescript
// src/hooks/useTasks.ts:246-275
const addTask = useCallback(async (text: string) => {
  const id = crypto.randomUUID()
  dispatch({ type: 'ADD_TASK', id, text: trimmedText })

  // Sync to Supabase
  if (userId) {
    const { error } = await supabase.from('tasks').insert({...})
  }
}, [userId])
```

**useTasks.ts addTask (target - with queue):**
```typescript
const addTask = useCallback(async (text: string) => {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  // Optimistic local update
  dispatch({ type: 'ADD_TASK', id, text: trimmedText })

  // Save to IndexedDB
  await db.tasks.put({
    id, text: trimmedText, user_id: userId || '',
    created_at: now, updated_at: now,
    _syncStatus: 'pending', _localUpdatedAt: now,
    // ... other fields
  })

  // Queue for sync (will run immediately if online)
  if (userId) {
    if (navigator.onLine) {
      const { error } = await supabase.from('tasks').insert({...})
      if (!error) {
        await db.tasks.update(id, { _syncStatus: 'synced' })
      } else {
        await queueOperation('INSERT', 'tasks', id, {...})
      }
    } else {
      await queueOperation('INSERT', 'tasks', id, {...})
    }
  }
}, [userId])
```

---

## Context References

**Tech-Spec:** [tech-spec-offline-pwa.md](../tech-spec-offline-pwa.md) - Primary context document containing:
- Sync queue data structure
- Retry logic with exponential backoff
- Conflict resolution strategy

**Existing Code:**
- `src/hooks/useTasks.ts` - All CRUD operations to modify
- `src/lib/db.ts` - IndexedDB schema (from Story 7.2)

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log
**2026-01-07 - Implementation Plan:**
1. Create `src/lib/syncQueue.ts` with:
   - SyncOperation interface matching db.ts SyncQueueItem
   - queueOperation() function to add operations to queue
   - processQueue() function with FIFO ordering and retry logic
   - coalesceOperations() for merging duplicate entity operations
   - processSyncItem() for executing individual sync operations
   - Exponential backoff: 1s, 5s, 15s delays, max 3 retries

2. Create `src/hooks/useSyncQueue.ts` with:
   - pendingCount state tracking queue size
   - isSyncing state for UI feedback
   - Online event listener to trigger queue processing
   - Mount-time processing if already online

3. Modify `src/hooks/useTasks.ts` to:
   - Check navigator.onLine before Supabase calls
   - Queue operations when offline instead of calling Supabase
   - Handle failed online sync by queueing for retry

4. Key edge cases:
   - Delete operations discard pending updates for same entity
   - Operation coalescing: latest wins for same entity
   - Network failures trigger retry with backoff

### Completion Notes
**2026-01-07 - Implementation Complete:**
- Created `src/lib/syncQueue.ts` with full queue management:
  - `queueOperation()` - Add operations to sync queue
  - `processQueue()` - Process queue with FIFO order and coalescing
  - `coalesceOperations()` - Merge duplicate operations for efficiency
  - Retry logic with exponential backoff (1s, 5s, 15s delays, max 3 retries)
  - DELETE wins over UPDATEs, INSERT+DELETE = no-op
- Created `src/hooks/useSyncQueue.ts` React hook with:
  - `pendingCount` - Number of pending sync operations
  - `isSyncing` - Whether queue is being processed
  - `triggerSync()` - Manually trigger queue processing
  - Automatic processing on online event and mount
- Modified `src/hooks/useTasks.ts` to:
  - Check `navigator.onLine` before all Supabase API calls
  - Queue operations when offline
  - Queue failed operations for retry
  - All CRUD operations updated: addTask, completeTask, deleteTask, deferTask, updateTask, updateNotes, addCategory
- Added `SyncTable` type to `src/lib/db.ts` for type safety
- Added Vitest test infrastructure with 16 passing tests

### Files Modified
- `src/lib/syncQueue.ts` (created)
- `src/hooks/useSyncQueue.ts` (created)
- `src/lib/syncQueue.test.ts` (created)
- `src/test/setup.ts` (created)
- `src/lib/db.ts` (modified - added SyncTable type)
- `src/hooks/useTasks.ts` (modified - offline queue integration)
- `vite.config.ts` (modified - added vitest config)
- `package.json` (modified - added test scripts and dependencies)

### Test Results
```
 ✓ src/lib/syncQueue.test.ts (16 tests) 32ms
 Test Files  1 passed (1)
      Tests  16 passed (16)
```
- queueOperation tests: INSERT, UPDATE, DELETE, categories
- coalesceOperations tests: UPDATE merging, DELETE wins, INSERT+DELETE cancellation, INSERT+UPDATE merging
- getPendingCount and clearQueue tests
- processQueue integration tests

**2026-01-07 - Frontend Test Gate PASSED:**
- ✅ Test Gate PASSED by Vishal (2026-01-07)
- Browser testing confirmed IndexedDB persistence working
- Task add/edit operations work correctly
- No console errors during testing
- Sync queue infrastructure verified (activates for authenticated users only)

---

## Review Notes
<!-- Will be populated during code review -->
