# Story 4.1: Supabase Time Entries Table and Sync

Status: ready-for-dev

## Story

As a power user,
I want my time entries to sync to the cloud,
so that I can access my time tracking data from any device and never lose my productivity history.

## Acceptance Criteria

1. **AC-4.1.1**: When a user stops time tracking, the time entry is saved to IndexedDB immediately with `_syncStatus = 'pending'`
2. **AC-4.1.2**: When online, pending time entries are pushed to the Supabase `time_entries` table via the sync queue
3. **AC-4.1.3**: Upon successful sync, the entry's `_syncStatus` is updated to `'synced'` in IndexedDB
4. **AC-4.1.4**: When the app loads on a different device (same account), time entries from Supabase are fetched and displayed
5. **AC-4.1.5**: When the same entry exists locally and remotely, the one with the more recent `updated_at` wins (merge conflict resolution)
6. **AC-4.1.6**: When offline, time entries are saved locally and sync automatically when connectivity is restored
7. **AC-4.1.7**: The `time_entries` Supabase table has RLS policies ensuring users can only access their own entries
8. **AC-4.1.8**: Indexes exist on `(user_id, date)` and `(user_id, task_id)` for efficient querying
9. **AC-4.1.9**: When a referenced task is deleted, the time entry's `task_id` becomes null but `task_name` is preserved
10. **AC-4.1.10**: Sync failures show a toast: "Sync failed. Will retry automatically." and retry with exponential backoff

## Frontend Test Gate

**Gate ID**: 4-1-TG1

### Prerequisites
- [ ] App running locally at http://localhost:5173
- [ ] User is logged in with Supabase auth (not anonymous)
- [ ] Network connectivity available (for initial test)
- [ ] Browser DevTools open (Network tab + Console)
- [ ] Supabase dashboard accessible to verify data

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open Time Tracking modal with `Cmd+Shift+T` | Anywhere in app | Tracking modal opens |
| 2 | Select a task and click "Track" | Time Tracking Modal | Timer starts, modal closes |
| 3 | Wait 30+ seconds, reopen modal with `Cmd+Shift+T` | Anywhere | Modal shows active tracking with elapsed time |
| 4 | Click "Stop" button | Time Tracking Modal (active state) | Success message: "Saved: 0h Xm on [task]" |
| 5 | Open DevTools Network tab | Browser DevTools | See POST/PATCH request to Supabase time_entries |
| 6 | Open Supabase dashboard, query time_entries | Supabase SQL Editor | Entry visible with correct data |
| 7 | Open app in another browser (same account) | Different browser/incognito | Time entry appears in Insights modal |
| 8 | Disconnect network (DevTools > Network > Offline) | Browser DevTools | App continues to work |
| 9 | Stop another tracking session while offline | Time Tracking Modal | Success message shown, entry saved locally |
| 10 | Reconnect network (disable Offline mode) | Browser DevTools | Entry syncs automatically (check Network tab) |
| 11 | Verify entry appears in Supabase | Supabase SQL Editor | Both entries now synced |
| 12 | Delete a task that has time entries | Task list | Task deleted |
| 13 | Open Insights modal | `Cmd+Shift+T T` | Time entry still visible with original task name |
| 14 | Simulate network error during sync | Disconnect mid-sync | Toast: "Sync failed. Will retry automatically." |

### Success Criteria (What User Sees)
- [ ] Time entry saved immediately on stop (no delay)
- [ ] Entry appears in Insights modal right away
- [ ] Entry syncs to Supabase (visible in dashboard)
- [ ] Entry accessible from different device/browser
- [ ] Offline tracking works without errors
- [ ] Automatic sync when back online
- [ ] Task deletion preserves time entries
- [ ] Sync errors show toast with retry message
- [ ] No console errors in browser DevTools
- [ ] No network request failures (except intentional offline tests)

### Feedback Questions
1. Did the sync feel seamless (not noticeable delay)?
2. Was the offline experience smooth?
3. Did cross-device access work as expected?
4. Were error messages clear when sync failed?

## Tasks / Subtasks

- [ ] Task 1: Create Supabase time_entries table migration (AC: 7, 8, 9)
  - [ ] Create migration SQL with table schema per tech spec
  - [ ] Add indexes: `idx_time_entries_user_date`, `idx_time_entries_user_task`, `idx_time_entries_user_updated`
  - [ ] Enable RLS on table
  - [ ] Create 4 RLS policies: SELECT, INSERT, UPDATE, DELETE (all require `auth.uid() = user_id`)
  - [ ] Verify foreign key to tasks with `ON DELETE SET NULL`
  - [ ] Apply migration via Supabase MCP or dashboard
  - [ ] Test RLS: verify user can only access own entries

- [ ] Task 2: Extend timeTrackingDb for sync metadata (AC: 1, 3)
  - [ ] Add `CachedTimeEntry` interface extending `TimeEntry` with `_syncStatus`, `_lastSyncAttempt`
  - [ ] Update IndexedDB schema version with new fields
  - [ ] Update `saveTimeEntry` to set `_syncStatus = 'pending'` by default
  - [ ] Add `updateSyncStatus(id, status)` function
  - [ ] Add `getPendingEntries()` function to query `_syncStatus = 'pending'`
  - [ ] Write unit tests for sync status operations

- [ ] Task 3: Create supabaseTimeEntries service module (AC: 2, 4, 7)
  - [ ] Create `src/lib/supabaseTimeEntries.ts` module
  - [ ] Implement `fetchTimeEntries(userId, since?)` - fetch all user entries, optionally since timestamp
  - [ ] Implement `upsertTimeEntry(entry)` - single entry upsert
  - [ ] Implement `batchUpsertTimeEntries(entries)` - batch upsert for efficiency
  - [ ] Implement `deleteTimeEntry(id)` - single entry deletion
  - [ ] Add error handling with typed errors
  - [ ] Write unit tests with Supabase client mocking

- [ ] Task 4: Create useTimeEntries hook with sync queue integration (AC: 1, 2, 3, 6)
  - [ ] Create `src/hooks/useTimeEntries.ts` hook
  - [ ] State: `entries`, `isLoading`, `error`, `pendingCount`
  - [ ] Implement `addEntry` function:
    1. Generate UUID with `crypto.randomUUID()`
    2. Save to IndexedDB with `_syncStatus = 'pending'`
    3. Add to sync queue: `{ entity: 'time_entries', operation: 'insert', payload }`
    4. Update React state
  - [ ] Implement `deleteEntry` function (similar pattern)
  - [ ] Implement `syncEntries` function to process pending items
  - [ ] Integrate with existing sync queue pattern from app
  - [ ] Write unit tests with fake-indexeddb

- [ ] Task 5: Implement merge logic for cross-device sync (AC: 4, 5)
  - [ ] Add `mergeEntries(local, remote)` function to useTimeEntries
  - [ ] For each remote entry:
    - If not in local: Add to IndexedDB with `_syncStatus = 'synced'`
    - If in local with older `updated_at`: Replace local with remote
    - If in local with newer `updated_at`: Keep local (will sync on next push)
  - [ ] Call merge on app load (after fetching from Supabase)
  - [ ] Preserve entries with `_syncStatus = 'pending'` (don't overwrite)
  - [ ] Write unit tests for merge scenarios

- [ ] Task 6: Integrate useTimeTracking with useTimeEntries (AC: 1)
  - [ ] Modify `stopTracking` in `useTimeTracking.ts`:
    1. Create TimeEntry object from active session
    2. Call `useTimeEntries.addEntry()` instead of direct IndexedDB save
    3. Clear active session
    4. Return created entry for UI feedback
  - [ ] Ensure backwards compatibility with existing tracking flow
  - [ ] Write integration tests

- [ ] Task 7: Implement sync queue handling for time_entries (AC: 2, 6, 10)
  - [ ] Extend sync queue to recognize `time_entries` entity type
  - [ ] Process time_entries operations:
    - `insert`: Call `supabaseTimeEntries.upsertTimeEntry()`
    - `update`: Call `supabaseTimeEntries.upsertTimeEntry()`
    - `delete`: Call `supabaseTimeEntries.deleteTimeEntry()`
  - [ ] On success: Update `_syncStatus = 'synced'` in IndexedDB
  - [ ] On failure: Increment retry_count, exponential backoff (1s, 2s, 4s... max 30s)
  - [ ] On failure: Show toast: "Sync failed. Will retry automatically."
  - [ ] Write unit tests for sync queue processing

- [ ] Task 8: Implement online status detection and auto-sync (AC: 6)
  - [ ] Listen to `navigator.onLine` and `online`/`offline` events
  - [ ] When coming back online: Trigger `syncEntries()` automatically
  - [ ] Add sync status indicator (optional): pending count badge in UI
  - [ ] Write tests for online/offline transitions

- [ ] Task 9: Update useTimeInsights to use synced entries (AC: 4)
  - [ ] Ensure useTimeInsights reads from IndexedDB (cache) for offline support
  - [ ] Entries with any `_syncStatus` should be displayed (synced, pending, error)
  - [ ] Verify insights calculations work with merged entries
  - [ ] Write integration tests

- [ ] Task 10: Add sync status logging (AC: 10)
  - [ ] Add dev-mode logging: `[Today] TimeEntries: synced X entries`
  - [ ] Log sync failures with error details (dev mode)
  - [ ] Use existing logging pattern: `if (import.meta.env.DEV)`

- [ ] Task 11: Write integration tests for full sync flow (AC: 1-10)
  - [ ] Test: Stop tracking → entry saved to IndexedDB with pending status
  - [ ] Test: Online → entry syncs to Supabase (mock client)
  - [ ] Test: Offline → entry queued, syncs when online
  - [ ] Test: Cross-device merge (seed remote data, verify merge)
  - [ ] Test: Task deletion → entry preserved with null task_id
  - [ ] Test: Sync error → toast shown, retry scheduled

- [ ] Task 12: Manual browser testing (AC: 1-10)
  - [ ] All automated tests pass
  - [ ] Complete Frontend Test Gate checklist above
  - [ ] Test with actual Supabase (not just mocks)
  - [ ] Test on two different browsers/devices
  - [ ] Verify RLS by attempting to access other user's data (should fail)

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From Architecture (ADR-TT-002 - Supabase for Completed Time Entries):**
- Completed time entries stored in Supabase with IndexedDB cache for offline
- Leverages existing sync queue pattern from task syncing
- RLS provides security (users only access own entries)
- Anonymous users have their own `user_id` from anonymous auth

**From Architecture (Timer Updates Pattern):**
- Duration stored as milliseconds (integer)
- All dates as ISO 8601 strings
- Use `crypto.randomUUID()` for entry IDs

**From Tech Spec (Sync Queue Extension):**
```typescript
interface SyncOperation {
  id: number;
  entity: 'tasks' | 'categories' | 'time_entries';  // Extended
  operation: 'insert' | 'update' | 'delete';
  payload: unknown;
  created_at: string;
  retry_count: number;
}
```

**From Tech Spec (Data Flow):**
```
Stop Tracking → Create TimeEntry → Save to IndexedDB → Queue for Sync → Push to Supabase
                                                                              ↓
App Load → Fetch from Supabase → Merge with IndexedDB → Display in Insights
```

**From Tech Spec (Reliability Requirements):**
- Retry with exponential backoff (1s, 2s, 4s... max 30s)
- Partial sync failure: successful entries marked synced, failed entries retry
- Sync conflict resolution: most recent `updated_at` wins

### Project Structure Notes

**Files to Create:**
```
src/lib/supabaseTimeEntries.ts           # NEW: Supabase CRUD operations
src/lib/supabaseTimeEntries.test.ts      # NEW: Service tests
src/hooks/useTimeEntries.ts              # NEW: Hook for entries with sync
src/hooks/useTimeEntries.test.ts         # NEW: Hook tests
```

**Files to Modify:**
```
src/types/timeTracking.ts                # ADD: CachedTimeEntry interface
src/lib/timeTrackingDb.ts                # MODIFY: Add sync status fields, getPendingEntries()
src/lib/timeTrackingDb.test.ts           # ADD: Sync status tests
src/hooks/useTimeTracking.ts             # MODIFY: Use useTimeEntries.addEntry() on stop
src/hooks/useTimeTracking.test.ts        # ADD: Integration tests
src/hooks/useSyncQueue.ts                # MODIFY: Add time_entries entity handling (if exists)
```

**Supabase Migration:**
```sql
-- Run via Supabase MCP apply_migration or dashboard
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_user_task ON time_entries(user_id, task_id);
CREATE INDEX idx_time_entries_user_updated ON time_entries(user_id, updated_at);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON time_entries FOR DELETE USING (auth.uid() = user_id);
```

**Existing Dependencies:**
- `@supabase/supabase-js` (^2.89.0) - Supabase client
- `dexie` (^4.2.1) - IndexedDB wrapper
- `dexie-react-hooks` (^4.2.0) - React hooks for Dexie
- Existing sync queue pattern from task syncing

### Learnings from Previous Story

**From Story 3-3-task-and-category-filter-dropdowns (Status: done)**

- **Test Count**: 309 tests passing - maintain this baseline
- **New Files Created**:
  - `src/components/time-tracking/FilterDropdown.tsx` - Filter dropdown using Radix Select
  - `src/components/time-tracking/FilterDropdown.test.tsx` - Component tests

- **Modified Files**:
  - `src/hooks/useTimeInsights.ts` - Extended InsightFilters, added taskId/category filtering
  - `src/App.tsx` - Passes tasks prop to TimeInsightsModal for category lookup
  - `src/test/setup.ts` - Added jsdom mocks for Radix Select (scrollIntoView, hasPointerCapture)

- **Technical Decisions from 3-3**:
  - `__all__` sentinel value used instead of empty string for Radix Select (prevents empty value error)
  - jsdom mocks needed for scrollIntoView, hasPointerCapture for Radix components
  - Filter state managed in TimeInsightsModal useState with useMemo for filtered calculations

- **Integration Points for This Story**:
  - useTimeInsights already reads from time entries - ensure it works with CachedTimeEntry format
  - TimeInsightsModal displays entries - should display regardless of _syncStatus
  - Toast system exists for user feedback - reuse for sync error messages

- **Patterns to Follow**:
  - Existing test setup with fake-indexeddb for IndexedDB mocking
  - useMemo for computed values
  - Error handling with try/catch and toast notifications

[Source: notes/sprint-artifacts/3-3-task-and-category-filter-dropdowns.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Story 4.1] - Acceptance criteria AC-4.1.1 through AC-4.1.10
- [Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Data Models and Contracts] - TimeEntry, CachedTimeEntry, Supabase schema
- [Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Workflows and Sequencing] - Stop Tracking → Sync Flow, App Load → Merge Flow
- [Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#APIs and Interfaces] - useTimeEntries hook interface, Supabase client operations
- [Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Non-Functional Requirements] - Performance targets, reliability scenarios
- [Source: notes/epics-time-tracking.md#Story 4.1] - Story definition and ACs
- [Source: notes/architecture-time-tracking.md#ADR-TT-002] - Supabase for Completed Time Entries decision
- [Source: notes/architecture-time-tracking.md#Data Architecture] - TypeScript interfaces, Supabase schema
- [Source: notes/architecture-time-tracking.md#Implementation Patterns] - Hook patterns, error handling, logging

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.context.xml

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-11 | SM Agent | Initial story creation from sprint-status backlog |
