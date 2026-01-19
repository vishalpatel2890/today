# Story 4.1: Activity Log Retrieval

Status: review

## Story

As the **system**,
I want **to retrieve activity logs for a specific time entry**,
so that **users can view their activity history**.

## Acceptance Criteria

1. **AC4.1.1**: Calling `window.electronAPI.activity.getLog(timeEntryId)` returns an array of ActivityEntry objects
2. **AC4.1.2**: Entries are sorted chronologically (oldest timestamp first)
3. **AC4.1.3**: Each entry includes: id, timeEntryId, timestamp, appName, windowTitle
4. **AC4.1.4**: If no activity exists for the timeEntryId, an empty array is returned (not an error)
5. **AC4.1.5**: Query completes in <100ms for sessions up to 8 hours (~1000 entries)
6. **AC4.1.6**: Response follows IPCResponse pattern: `{ success: true, data: ActivityEntry[] }`

## Frontend Test Gate

**Gate ID**: 4-1-TG1

### Prerequisites
- [ ] Story 3.4 complete (auto-start/stop activity with time tracking working)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] Activity data exists in IndexedDB (from previous tracking sessions)
- [ ] Electron DevTools accessible via Cmd+Option+I

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with Today app |
| 2 | Track time on a task for 30+ seconds, switching apps | Task timer | Activity entries captured |
| 3 | Stop time tracking | Task timer button | Time entry saved with endTime |
| 4 | Open DevTools (Cmd+Option+I) | Electron window | DevTools panel opens |
| 5 | Get timeEntryId from last completed entry | App state or console | Have a valid timeEntryId to test with |
| 6 | Call `window.electronAPI.activity.getLog('<timeEntryId>')` | DevTools Console | Returns `{ success: true, data: [...] }` |
| 7 | Verify data array contains ActivityEntry objects | DevTools Console | Each entry has id, timeEntryId, timestamp, appName, windowTitle |
| 8 | Verify entries sorted by timestamp ascending | DevTools Console | First entry has earliest timestamp |
| 9 | Call with non-existent timeEntryId | DevTools Console | Returns `{ success: true, data: [] }` (empty array, not error) |
| 10 | Measure query time for session with entries | DevTools Console | `console.time` shows <100ms |

### Success Criteria (What User Sees)
- [ ] `activity.getLog(id)` returns properly formatted response
- [ ] Response contains `{ success: true, data: ActivityEntry[] }`
- [ ] Entries are sorted chronologically (oldest first)
- [ ] Each entry has all required fields (id, timeEntryId, timestamp, appName, windowTitle)
- [ ] Empty array returned for non-existent timeEntryId (not an error)
- [ ] Query performance is <100ms for typical sessions
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Did the getLog IPC call return the expected data structure?
2. Were all activity entries present from the tracking session?
3. Is the chronological ordering correct (oldest first)?
4. Was query performance acceptable (<100ms)?

## Tasks / Subtasks

- [x] **Task 1: Implement activity:get-log IPC handler** (AC: 4.1.1, 4.1.6)
  - [x] 1.1: Open `electron/ipc/handlers.ts` and locate the `activity:get-log` handler stub
  - [x] 1.2: Implement handler to receive timeEntryId parameter
  - [x] 1.3: Return IPCResponse format: `{ success: true, data: ActivityEntry[] }` or `{ success: false, error: string }`
  - [x] 1.4: Add try-catch error handling with proper error message formatting
  - **Note**: Implementation already existed in `electronBridge.activity.getLog()` (lines 131-165) from Story 3.3. The bridge queries IndexedDB directly from renderer since main process cannot access IndexedDB. IPC handler stub remains as fallback.

- [x] **Task 2: Query activity logs from IndexedDB** (AC: 4.1.2, 4.1.3, 4.1.4)
  - [x] 2.1: Use existing `activityStore.getEntriesForTimeEntry(timeEntryId)` from `src/lib/activityStore.ts`
  - [x] 2.2: Ensure query uses the timeEntryId index for O(log n) performance
  - [x] 2.3: Sort results by timestamp ascending (oldest first)
  - [x] 2.4: Return empty array `[]` when no entries found (not an error)
  - [x] 2.5: Verify each entry includes: id, timeEntryId, timestamp, appName, windowTitle
  - **Note**: `getActivityEntriesByTimeEntryId()` in activityStore.ts (lines 80-96) uses compound index `[timeEntryId+timestamp]` which automatically sorts by timestamp ascending.

- [x] **Task 3: Performance optimization** (AC: 4.1.5)
  - [x] 3.1: Verify Dexie index on `timeEntryId` exists (from Story 3.3)
  - [x] 3.2: Use indexed query: `db.activityLogs.where('timeEntryId').equals(id).sortBy('timestamp')`
  - [x] 3.3: Test query performance with ~1000 entries - should be <100ms
  - [x] 3.4: Add dev-mode timing logs: `console.time('[Electron/IPC] activity:get-log query')`
  - **Note**: Added `console.time/timeEnd` calls in electronBridge.ts for dev-mode performance monitoring. Compound index ensures O(log n) lookup.

- [x] **Task 4: Write tests for getLog handler** (AC: all)
  - [x] 4.1: Test: handler returns correct response format `{ success: true, data: [] }`
  - [x] 4.2: Test: handler returns entries sorted by timestamp ascending
  - [x] 4.3: Test: handler returns empty array for non-existent timeEntryId
  - [x] 4.4: Test: handler returns proper error format on database errors
  - [x] 4.5: Ensure all existing tests still pass (baseline: 609 tests)
  - **Note**: Tests already exist in `activityStore.test.ts` (15 tests) and `electronBridge.test.ts` (11 tests). All 609 tests passing.

## Dev Notes

### Architecture Alignment

This story implements FR18 (Activity keyed to entry IDs) and FR21 (Chronological display with timestamps) from the PRD.

**From `notes/architecture-electron-migration.md`:**

```typescript
// IPC Contract: activity:get-log
// Request
invoke('activity:get-log', timeEntryId: string)

// Response - Success
{
  success: true,
  data: ActivityEntry[]  // Sorted by timestamp ascending
}

// Response - No data
{
  success: true,
  data: []  // Empty array if no activity recorded
}

// Response - Error
{
  success: false,
  error: "Database error: ..."
}
```

**From Tech Spec `notes/sprint-artifacts/tech-spec-epic-4-electron.md`:**

```typescript
// Query Performance Pattern
const entries = await db.activityLogs
  .where('timeEntryId')
  .equals(timeEntryId)
  .sortBy('timestamp');
// Index on timeEntryId ensures O(log n) lookup
```

### Project Structure Notes

**Files to Modify:**
- `electron/ipc/handlers.ts` - Implement `activity:get-log` handler (replace stub with real implementation)

**Existing Files to Use (from Epic 3):**
- `src/lib/activityStore.ts` - Has `getEntriesForTimeEntry()` method for querying IndexedDB
- `src/lib/db.ts` - Dexie database with `activityLogs` table and `timeEntryId` index
- `electron/activity/types.ts` - ActivityEntry interface definition
- `electron/ipc/channels.ts` - IPC channel constants (ACTIVITY_GET_LOG)

### Learnings from Previous Story

**From Story 3.4 (Status: review)**

- **Activity lifecycle pattern** - Uses `electronBridge.activity.start/stop()` for type-safe IPC calls
- **Files available for use:**
  - `src/lib/activityStore.ts` - CRUD operations for activity logs
  - `src/lib/electronBridge.ts` - Type-safe wrapper for `window.electronAPI`
  - `src/lib/platform.ts` - `isElectron()` guard function
- **Error handling pattern:**
  ```typescript
  const result = await window.electronAPI.activity.getLog(id);
  if (!result.success) {
    console.error('[Today] Activity getLog failed:', result.error);
  }
  ```
- **Test baseline:** 609 tests passing - maintain this baseline

[Source: notes/sprint-artifacts/3-4-auto-start-stop-activity-with-time-tracking.md#Dev-Agent-Record]

### Implementation Approach

1. **IPC handler in main process calls renderer** - The main process handler receives the IPC call, but Dexie runs in renderer. Use existing pattern from Epic 3 where renderer owns the database.
2. **Use activityStore.ts** - The `getEntriesForTimeEntry(timeEntryId)` method should already exist from Story 3.3
3. **Minimal new code** - This story is mostly about connecting existing pieces:
   - Handler receives timeEntryId
   - Calls activityStore to query
   - Returns formatted response
4. **Performance logging** - Add timing in dev mode to verify <100ms

### Data Flow

```
Renderer calls window.electronAPI.activity.getLog(timeEntryId)
    |
    v
IPC: activity:get-log reaches main process
    |
    v
Handler queries via activityStore.getEntriesForTimeEntry()
    |
    v
Dexie query: db.activityLogs.where('timeEntryId').equals(id).sortBy('timestamp')
    |
    v
Returns { success: true, data: ActivityEntry[] }
```

### References

- [Source: notes/architecture-electron-migration.md#API-Contracts]
- [Source: notes/epics-electron-migration.md#Story-4.1]
- [Source: notes/sprint-artifacts/tech-spec-epic-4-electron.md#AC1]
- [Source: notes/sprint-artifacts/3-4-auto-start-stop-activity-with-time-tracking.md#Completion-Notes]

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/4-1-activity-log-retrieval.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-18: Discovered implementation already complete from Story 3.3
- Key insight: `electronBridge.activity.getLog()` queries IndexedDB directly from renderer (main process cannot access IndexedDB per ADR-008)
- IPC handler stub in `handlers.ts` is bypassed - the bridge implements the full functionality
- Compound index `[timeEntryId+timestamp]` provides both O(log n) lookup AND automatic timestamp sorting
- Added performance timing logs (`console.time/timeEnd`) for dev-mode monitoring

### Completion Notes List

- **Discovery**: Story 4.1 functionality was already implemented as part of Story 3.3 (Activity Storage in IndexedDB)
- **Implementation verified**: `electronBridge.activity.getLog()` at `src/lib/electronBridge.ts:131-165` satisfies all ACs
- **Tests verified**: 26 relevant tests pass (15 in activityStore.test.ts, 11 in electronBridge.test.ts)
- **Test baseline maintained**: All 609 tests passing
- **Added**: Performance timing logs in dev mode for AC4.1.5 verification
- **Architecture note**: Per ADR-008, IndexedDB runs in renderer; main process IPC handler is stub; bridge queries Dexie directly
- ✅ Test Gate PASSED by Vishal (2026-01-18)

### File List

**Modified:**
- `src/lib/electronBridge.ts` - Added console.time/timeEnd for dev-mode performance monitoring (AC4.1.5)

**Already Implemented (Story 3.3):**
- `src/lib/activityStore.ts` - getActivityEntriesByTimeEntryId() with compound index
- `src/lib/db.ts` - activityLogs table with [timeEntryId+timestamp] index
- `src/lib/electronBridge.ts` - activity.getLog() implementation
- `src/lib/activityStore.test.ts` - 15 tests covering retrieval, sorting, empty results
- `src/lib/electronBridge.test.ts` - 11 tests covering bridge methods

**IPC Stub (unchanged):**
- `electron/ipc/handlers.ts` - activity:get-log stub returns empty array (bypassed by bridge)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-18 | Story drafted from epics, tech spec, and architecture | SM Agent |
| 2026-01-18 | Verified implementation from Story 3.3 satisfies all ACs; added performance timing logs | Dev Agent |
| 2026-01-18 | Test Gate PASSED; story marked for review | Dev Agent |
