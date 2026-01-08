# Story 7.2: IndexedDB + Dexie Setup

**Status:** Review

---

## User Story

As a **user**,
I want **my tasks stored in a robust offline database**,
So that **my data persists reliably even with large task lists and survives browser storage clearing**.

---

## Acceptance Criteria

**AC-7.2.1: Dexie Database Schema**
- **Given** the app initializes
- **When** IndexedDB is accessed
- **Then** a `today-app` database exists with `tasks` and `syncQueue` tables
- **And** the schema matches the Supabase task structure

**AC-7.2.2: Migration from localStorage**
- **Given** existing tasks in localStorage (`today-app-state`)
- **When** the app loads for the first time after update
- **Then** tasks are migrated to IndexedDB
- **And** localStorage data is preserved as backup
- **And** a migration flag prevents duplicate migrations

**AC-7.2.3: useTasks Integration**
- **Given** `useTasks` hook is called
- **When** tasks are loaded
- **Then** data is read from IndexedDB (not localStorage)
- **And** the existing reducer pattern continues to work

**AC-7.2.4: Write Operations**
- **Given** user adds/edits/completes a task
- **When** the action is dispatched
- **Then** the change is written to IndexedDB immediately
- **And** localStorage is updated as secondary backup

**AC-7.2.5: Sync Status Tracking**
- **Given** a task in IndexedDB
- **When** it's modified offline
- **Then** its `_syncStatus` field is set to `'pending'`
- **And** `_localUpdatedAt` timestamp is updated

---

## Implementation Details

### Tasks / Subtasks

- [x] Install Dexie: `npm install dexie dexie-react-hooks`
- [x] Create `src/lib/db.ts` with Dexie schema (tasks, syncQueue tables)
- [x] Add sync-related fields to local task type (`_syncStatus`, `_localUpdatedAt`)
- [x] Create migration utility to move localStorage data to IndexedDB
- [x] Update `useTasks.ts` to read/write from IndexedDB
- [x] Keep localStorage writes as backup (graceful degradation)
- [x] Add migration flag to prevent re-migration
- [x] Test with existing localStorage data
- [x] Test fresh install (no migration needed)
- [x] Verify DevTools > Application > IndexedDB shows data

### Technical Summary

**Dexie Schema:**
```typescript
// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie'
import type { TaskNotes } from '../types'

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
  // Sync tracking fields
  _syncStatus: 'synced' | 'pending' | 'conflict'
  _localUpdatedAt: string
}

export interface SyncQueueItem {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  entityId: string
  payload: string
  createdAt: string
  retryCount: number
}

class TodayDatabase extends Dexie {
  tasks!: EntityTable<LocalTask, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('today-app')
    this.version(1).stores({
      tasks: 'id, user_id, _syncStatus',
      syncQueue: 'id, createdAt',
    })
  }
}

export const db = new TodayDatabase()
```

**Migration Logic:**
```typescript
// Run once on app init
async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem('today-app-migrated-to-idb')
  if (migrated) return

  const savedState = localStorage.getItem('today-app-state')
  if (!savedState) {
    localStorage.setItem('today-app-migrated-to-idb', 'true')
    return
  }

  const state = JSON.parse(savedState)
  const localTasks = state.tasks.map(task => ({
    ...task,
    user_id: '', // Will be set on first sync
    updated_at: task.createdAt,
    _syncStatus: 'pending' as const,
    _localUpdatedAt: new Date().toISOString(),
  }))

  await db.tasks.bulkPut(localTasks)
  localStorage.setItem('today-app-migrated-to-idb', 'true')
}
```

### Project Structure Notes

- **Files to create:** `src/lib/db.ts`
- **Files to modify:** `src/hooks/useTasks.ts`, `src/types/index.ts`
- **Expected test locations:** `tests/lib/db.test.ts`
- **Prerequisites:** Story 7.1 (PWA Foundation)

### Key Code References

**useTasks.ts (current pattern to preserve):**
```typescript
// src/hooks/useTasks.ts:142-166
// Initial data load pattern - will change to use IndexedDB
useEffect(() => {
  const initData = async () => {
    const savedState = loadState()  // <- Change to read from IndexedDB
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', tasks: savedState.tasks })
      // ...
    }
    if (userId) {
      await fetchFromSupabase(userId)
    }
    setIsHydrated(true)
  }
  initData()
}, [userId, fetchFromSupabase])
```

**New IndexedDB read pattern:**
```typescript
useEffect(() => {
  const initData = async () => {
    // Read from IndexedDB first
    const localTasks = await db.tasks
      .where('user_id')
      .equals(userId || '')
      .toArray()

    if (localTasks.length > 0) {
      dispatch({ type: 'LOAD_STATE', tasks: localTasks.map(taskFromLocal) })
    }

    // Then sync with Supabase if online
    if (userId && navigator.onLine) {
      await fetchFromSupabase(userId)
    }

    setIsHydrated(true)
  }
  initData()
}, [userId, fetchFromSupabase])
```

---

## Context References

**Tech-Spec:** [tech-spec-offline-pwa.md](../tech-spec-offline-pwa.md) - Primary context document containing:
- Complete Dexie schema definition
- Migration strategy details
- Sync status field specifications

**Architecture:** [architecture.md](../architecture.md) - Data architecture patterns

**Existing Code:**
- `src/utils/storage.ts` - Current localStorage implementation
- `src/hooks/useTasks.ts` - Current data loading pattern

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log
- Installed dexie 4.0.10 and dexie-react-hooks 1.1.7
- Created `src/lib/db.ts` with TodayDatabase class extending Dexie
- Created `src/lib/migration.ts` with localStorage to IndexedDB migration
- Updated `src/hooks/useTasks.ts` to:
  - Load from IndexedDB first (with migration if needed)
  - Fall back to localStorage if IndexedDB is empty
  - Save to IndexedDB on every write operation
  - Continue saving to localStorage as backup
  - Track sync status (_syncStatus field) for offline-first pattern

### Completion Notes
- All acceptance criteria verified via automated browser testing
- IndexedDB `today-app` database created with `tasks` and `syncQueue` tables
- Migration from localStorage works correctly with flag to prevent re-migration
- Write operations update both IndexedDB and localStorage backup
- Sync status tracking (`_syncStatus`, `_localUpdatedAt`) working correctly
- Data persists across page refreshes

### Files Modified
- `today-app/package.json` - Added dexie dependencies
- `today-app/src/lib/db.ts` - NEW: Dexie database schema
- `today-app/src/lib/migration.ts` - NEW: localStorage migration utility
- `today-app/src/hooks/useTasks.ts` - MODIFIED: IndexedDB integration

### Test Results
- Build: PASS (TypeScript compilation successful)
- Lint: PASS (no new errors in modified files)
- Browser Test: PASS (all acceptance criteria verified)

---

## Frontend Test Gate Results

**Gate ID:** 7-2-TG-IndexedDB
**Status:** ✅ PASSED
**Executed:** 2026-01-08
**Executor:** Claude Opus 4.5 (automated browser testing)

### Test Execution Summary

| Step | Acceptance Criteria | Status | Notes |
|------|---------------------|--------|-------|
| 1 | App loads with existing tasks | ✅ PASS | Task persisted from previous session |
| 2 | AC-7.2.1: Dexie Database Schema | ✅ PASS | `today-app` DB with `tasks` and `syncQueue` tables |
| 3 | AC-7.2.2: Migration Flag & Backup | ✅ PASS | Migration flag set, localStorage preserved |
| 4 | AC-7.2.4: Write Operations | ✅ PASS | New task written to IndexedDB + localStorage |
| 5 | AC-7.2.5: Sync Status Tracking | ✅ PASS | `_syncStatus` and `_localUpdatedAt` tracked |
| 6 | Data Persistence | ✅ PASS | Tasks persist across page refreshes |

### Verification Details

**IndexedDB Schema:**
- Database: `today-app` (version 10)
- Object stores: `tasks`, `syncQueue`
- Task fields include: `_syncStatus`, `_localUpdatedAt`

**Migration:**
- Flag: `today-app-migrated-to-idb` = `"true"`
- localStorage backup: Maintained alongside IndexedDB

**Console/Network:**
- No errors detected
- No failed network requests

---

## Review Notes
<!-- Will be populated during code review -->
