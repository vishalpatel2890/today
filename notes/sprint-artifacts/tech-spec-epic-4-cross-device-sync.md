# Epic Technical Specification: Cross-Device Sync

Date: 2026-01-11
Author: Vishal
Epic ID: 4 (Time Tracking)
Status: Draft

---

## Overview

Epic 4 completes the Time Tracking MVP by enabling cross-device synchronization and backup participation for time entries. This epic bridges the gap between the local-first IndexedDB storage (established in Epics 1-3) and cloud persistence via Supabase, ensuring users can track time on one device and view their data on another.

The implementation leverages the existing sync queue pattern used for tasks, extending it to handle time entries. Per the Architecture decision (ADR-TT-002), completed time entries are stored in Supabase with an IndexedDB cache for offline access, while active tracking sessions remain in IndexedDB only (per ADR-TT-001).

This epic delivers two key capabilities:
1. **Cross-Device Sync (FR45)**: Time entries sync to Supabase when online, enabling access from any authenticated device
2. **Export/Backup Participation (FR47)**: Time entries are included in the app's existing export/backup functionality

## Objectives and Scope

**In-Scope:**
- Supabase `time_entries` table creation with proper schema and RLS policies
- Integration with existing sync queue for offline-resilient syncing
- IndexedDB cache for time entries (offline read access)
- Merge logic for cross-device conflict resolution (most recent wins)
- Extension of export functionality to include time entries
- Extension of restore/import functionality to restore time entries
- Time entry sync status tracking (synced/pending)

**Out-of-Scope:**
- Active session sync (active sessions remain local per ADR-TT-001)
- Real-time collaboration or live sync (pull-based sync on app load)
- Time entry editing via Supabase directly (all edits through app)
- Historical data migration (new installations start fresh)
- Billable/rate fields (Growth phase features FR35-40)
- Manual time entry editing (Growth phase FR41-43)

## System Architecture Alignment

This epic extends the architecture established in Epics 1-3:

**Storage Layer:**
- **Supabase**: Primary storage for completed time entries (new `time_entries` table)
- **IndexedDB (Dexie)**: Cache for offline access + active session storage (existing)
- **Sync Queue**: Existing pattern extended for time entry operations

**Hook Extensions:**
- `useTimeEntries.ts`: New hook for CRUD operations with sync queue integration
- `useTimeTracking.ts`: Extended to save completed entries via useTimeEntries
- `useSyncQueue.ts`: Extended to handle `time_entries` entity type

**Data Flow:**
```
Stop Tracking → Create TimeEntry → Save to IndexedDB → Queue for Sync → Push to Supabase
                                                                              ↓
App Load → Fetch from Supabase → Merge with IndexedDB → Display in Insights
```

**Architectural Constraints (from Architecture doc):**
- All dates stored as ISO 8601 strings in Supabase
- Duration stored as milliseconds (integer)
- `user_id` references `auth.users(id)` for RLS
- `task_id` uses `ON DELETE SET NULL` to preserve entries when tasks deleted
- Sync uses existing sync queue pattern (batched, retry with backoff)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `useTimeEntries.ts` | CRUD for time entries with sync queue integration | TimeEntry data | Synced entries, loading/error states |
| `useSyncQueue.ts` (extension) | Handle `time_entries` entity type in sync operations | Pending operations | Sync status, retry handling |
| `timeEntriesDb.ts` | IndexedDB operations for time entries cache | TimeEntry objects | Cached entries, sync metadata |
| `supabaseTimeEntries.ts` | Supabase CRUD operations for time entries | TimeEntry objects | Remote entries, error handling |
| `exportService.ts` (extension) | Include time entries in export payload | Export request | JSON with time_entries array |
| `importService.ts` (extension) | Restore time entries from backup | Import payload | Restored entries |

### Data Models and Contracts

**TimeEntry Interface (from Architecture):**
```typescript
// src/types/timeTracking.ts
export interface TimeEntry {
  id: string;              // UUID (crypto.randomUUID())
  user_id: string;         // References auth.users
  task_id: string | null;  // References tasks (null if task deleted)
  task_name: string;       // Snapshot of task name at creation
  start_time: string;      // ISO 8601 timestamp
  end_time: string;        // ISO 8601 timestamp
  duration: number;        // Milliseconds
  date: string;            // YYYY-MM-DD for grouping/filtering
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}

// Sync metadata for IndexedDB cache
export interface CachedTimeEntry extends TimeEntry {
  _syncStatus: 'synced' | 'pending' | 'error';
  _lastSyncAttempt?: string;  // ISO 8601 timestamp
}
```

**Supabase Schema (Migration):**
```sql
-- Migration: create_time_entries_table

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

-- Indexes for efficient querying
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_user_task ON time_entries(user_id, task_id);
CREATE INDEX idx_time_entries_user_updated ON time_entries(user_id, updated_at);

-- RLS policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  USING (auth.uid() = user_id);
```

**IndexedDB Schema (Dexie):**
```typescript
// Extension to existing Dexie database
db.version(X).stores({
  // ... existing stores
  timeEntries: 'id, user_id, task_id, date, updated_at, _syncStatus',
  syncQueue: '++id, entity, operation, created_at'
});
```

**Export Schema Extension:**
```typescript
interface ExportPayload {
  version: string;
  exported_at: string;
  tasks: Task[];
  categories: string[];
  time_entries: TimeEntry[];  // NEW
}
```

### APIs and Interfaces

**useTimeEntries Hook:**
```typescript
interface UseTimeEntriesReturn {
  entries: TimeEntry[];
  isLoading: boolean;
  error: Error | null;
  addEntry: (entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<TimeEntry>;
  deleteEntry: (id: string) => Promise<void>;
  syncEntries: () => Promise<void>;
  pendingCount: number;
}

function useTimeEntries(): UseTimeEntriesReturn;
```

**Supabase Client Operations:**
```typescript
// supabaseTimeEntries.ts
async function fetchTimeEntries(userId: string, since?: string): Promise<TimeEntry[]>;
async function upsertTimeEntry(entry: TimeEntry): Promise<TimeEntry>;
async function deleteTimeEntry(id: string): Promise<void>;
async function batchUpsertTimeEntries(entries: TimeEntry[]): Promise<TimeEntry[]>;
```

**Sync Queue Extension:**
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

### Workflows and Sequencing

**Stop Tracking → Sync Flow:**
```
1. User clicks "Stop" in TimeTrackingModal
2. useTimeTracking.stopTracking() called
3. Create TimeEntry object with calculated duration
4. Save to IndexedDB via timeEntriesDb.addEntry()
   - Set _syncStatus = 'pending'
5. Add to sync queue: { entity: 'time_entries', operation: 'insert', payload: entry }
6. Clear active session from IndexedDB
7. Update React state
8. Show success toast
9. (Background) Sync queue processes:
   a. Check online status
   b. If online: upsertTimeEntry() to Supabase
   c. On success: Update _syncStatus = 'synced' in IndexedDB
   d. On failure: Increment retry_count, exponential backoff
```

**App Load → Merge Flow:**
```
1. App mounts, useTimeEntries hook initializes
2. Load cached entries from IndexedDB
3. Display cached entries immediately (optimistic)
4. If online:
   a. Fetch entries from Supabase (GET where user_id = current user)
   b. For each remote entry:
      - If not in local: Add to IndexedDB with _syncStatus = 'synced'
      - If in local with older updated_at: Replace local with remote
      - If in local with newer updated_at: Keep local, will sync on next push
5. Process any pending sync queue items
6. Update React state with merged entries
```

**Export Flow:**
```
1. User triggers export
2. Gather all tasks, categories from existing export logic
3. Fetch all time entries from IndexedDB (all statuses)
4. Build ExportPayload with time_entries array
5. Generate JSON file with human-readable duration formatting
6. Download file
```

**Import/Restore Flow:**
```
1. User uploads backup JSON file
2. Parse and validate schema version
3. For time_entries in payload:
   a. Upsert to IndexedDB with _syncStatus = 'pending'
   b. Add to sync queue for Supabase push
4. Trigger sync queue processing
5. Show success toast with entry count
```

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Sync latency | < 2s for batch of 50 entries | Batch upsert operations |
| IndexedDB read | < 50ms for 1000 entries | Indexed queries on date, user_id |
| Initial load with cache | < 100ms | Display cached data before network fetch |
| Export generation | < 500ms for 1 year of data | Client-side JSON serialization |
| Merge operation | < 100ms for 100 entries | In-memory comparison with Map lookup |

**PRD Reference:** NFR3 states insights calculations complete within 500ms for 1 year of data; sync operations should not add significant overhead.

### Security

- **Row Level Security (RLS)**: All Supabase operations filtered by `auth.uid() = user_id`
- **Authentication**: Time entries linked to authenticated user (anonymous or linked)
- **Data Isolation**: Users can only read/write their own time entries
- **No Sensitive Data**: Time entries contain only task names and timestamps (user-defined content)
- **Export Security**: Exported files contain only user's own data, no system metadata
- **Transport Security**: All Supabase calls over HTTPS
- **RLS Policies**: Four policies (SELECT, INSERT, UPDATE, DELETE) all require `auth.uid() = user_id`

**PRD Reference:** NFR5 states time data follows same security model as task data; NFR6 ensures exported reports contain no sensitive metadata.

### Reliability/Availability

| Scenario | Behavior |
|----------|----------|
| Offline when stopping tracking | Entry saved to IndexedDB, queued for sync |
| Network failure during sync | Retry with exponential backoff (1s, 2s, 4s, max 30s) |
| Sync conflict (same entry modified on two devices) | Most recent `updated_at` wins |
| Supabase unavailable | App continues with IndexedDB cache, sync when available |
| IndexedDB unavailable | Graceful degradation to memory-only (unlikely) |
| Partial sync failure | Successful entries marked synced, failed entries retry |
| App crash during sync | Pending entries still in sync queue on restart |

**PRD Reference:** NFR7 states tracking persists through backgrounding; NFR8 ensures no data loss on unexpected termination. Sync mechanism extends these guarantees across devices.

### Observability

| Signal | Implementation |
|--------|----------------|
| Sync status indicator | Subtle icon in Insights modal showing pending count |
| Sync errors | Toast notification: "Sync failed. Will retry automatically." |
| Console logging | `[Today] TimeEntries: synced X entries` (dev mode only) |
| Pending count | Available via `useTimeEntries().pendingCount` |
| Last sync time | Stored in IndexedDB, displayable in future settings |

**Logging Pattern:**
```typescript
if (import.meta.env.DEV) {
  console.log('[Today] TimeEntries:', action, { count: entries.length, pending: pendingCount });
}
```

## Dependencies and Integrations

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | ^2.89.0 | Supabase client for database operations |
| dexie | ^4.2.1 | IndexedDB wrapper for local cache |
| dexie-react-hooks | ^4.2.0 | React hooks for Dexie |
| date-fns | ^4.1.0 | Date formatting for export (format, parseISO) |
| react | ^19.2.0 | UI framework |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ~5.9.3 | Type safety |
| vitest | ^3.2.4 | Unit/integration testing |
| fake-indexeddb | ^6.2.5 | IndexedDB mocking in tests |

### Internal Dependencies

| Artifact | Location | Purpose |
|----------|----------|---------|
| Epic 1-3 time tracking components | `src/components/time-tracking/` | UI components to integrate with |
| useTimeTracking hook | `src/hooks/useTimeTracking.ts` | Extend to use useTimeEntries for persistence |
| timeTrackingDb | `src/lib/timeTrackingDb.ts` | Extend for sync metadata |
| Existing sync queue pattern | `src/hooks/useSyncQueue.ts` | Reuse for time entries |
| Export functionality | `src/lib/exportService.ts` | Extend with time entries |
| Toast system | `src/components/Toast.tsx` | Sync status feedback |

### External Integrations

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Supabase PostgreSQL | REST API via supabase-js | Primary storage for time entries |
| Supabase Auth | JWT tokens | User identification for RLS |
| Browser IndexedDB | Native API via Dexie | Local cache and offline support |

### Migration Dependency

The Supabase migration must be applied before Epic 4 stories can be implemented:
- Migration file: `create_time_entries_table`
- Dependencies: `tasks` table must exist (for foreign key)
- RLS: Must be enabled after table creation

## Acceptance Criteria (Authoritative)

**Story 4.1: Supabase Time Entries Table and Sync**

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

**Story 4.2: Time Entries in Export/Backup**

11. **AC-4.2.1**: When the user triggers export, the exported JSON includes a `time_entries` array
12. **AC-4.2.2**: Each exported time entry includes: `id`, `task_name`, `start_time`, `end_time`, `duration`, `date`
13. **AC-4.2.3**: The `duration` field in export is human-readable (e.g., "1h 23m") in addition to the raw milliseconds value
14. **AC-4.2.4**: Time entries with deleted tasks (null `task_id`) are still included in exports with their `task_name` snapshot
15. **AC-4.2.5**: When the user restores from backup, time entries are imported to IndexedDB and queued for sync
16. **AC-4.2.6**: Restored entries appear in the Insights modal after import completes
17. **AC-4.2.7**: Import shows success toast: "Restored X tasks and Y time entries"
18. **AC-4.2.8**: Duplicate entries (same `id`) are updated rather than creating duplicates (upsert behavior)
19. **AC-4.2.9**: Time entries are exported in chronological order (oldest first)

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-4.1.1 | Workflows - Stop Tracking | useTimeTracking, timeEntriesDb | Stop tracking, verify IndexedDB entry with pending status |
| AC-4.1.2 | Workflows - Sync Flow | useTimeEntries, useSyncQueue | Stop tracking online, verify network call to Supabase |
| AC-4.1.3 | Workflows - Sync Flow | useTimeEntries, timeEntriesDb | After sync, query IndexedDB, verify synced status |
| AC-4.1.4 | Workflows - App Load | useTimeEntries, supabaseTimeEntries | Track on Device A, load app on Device B, verify entry appears |
| AC-4.1.5 | Workflows - Merge Flow | useTimeEntries | Modify same entry on two devices, verify newer wins |
| AC-4.1.6 | NFR - Reliability | useTimeEntries, useSyncQueue | Disconnect network, stop tracking, reconnect, verify sync |
| AC-4.1.7 | Data Models - Supabase | Supabase RLS | Try to fetch other user's entries, verify empty result |
| AC-4.1.8 | Data Models - Supabase | Supabase schema | Check migration, verify indexes created |
| AC-4.1.9 | Data Models - TimeEntry | supabaseTimeEntries | Delete task with time entries, verify entries preserved |
| AC-4.1.10 | NFR - Reliability | useTimeEntries, Toast | Simulate network error, verify toast and retry |
| AC-4.2.1 | Workflows - Export | exportService | Trigger export, verify JSON has time_entries key |
| AC-4.2.2 | Workflows - Export | exportService | Export with entries, verify all fields present |
| AC-4.2.3 | Data Models - Export | exportService | Export entry, verify duration_formatted field |
| AC-4.2.4 | Workflows - Export | exportService | Delete task, export, verify entry with null task_id included |
| AC-4.2.5 | Workflows - Import | importService | Import backup file, verify entries in IndexedDB |
| AC-4.2.6 | Workflows - Import | importService, useTimeInsights | Import, open Insights, verify entries visible |
| AC-4.2.7 | Workflows - Import | importService, Toast | Import file, verify toast with counts |
| AC-4.2.8 | Workflows - Import | importService | Import same file twice, verify no duplicates |
| AC-4.2.9 | Workflows - Export | exportService | Export multiple entries, verify chronological order |

**FR to AC Mapping:**

| FR | Description | Covered By |
|----|-------------|------------|
| FR45 | System syncs time entries via existing sync mechanism | AC-4.1.1 through AC-4.1.10 |
| FR47 | Time entry data participates in app's export/backup functionality | AC-4.2.1 through AC-4.2.9 |

## Risks, Assumptions, Open Questions

**Risks:**

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| R1 | Sync conflicts lose data | High | Use `updated_at` comparison with clear winner; log conflicts for debugging |
| R2 | Large sync payloads slow app load | Medium | Paginate fetches (100 entries per page); use `since` parameter for incremental sync |
| R3 | Offline period creates large sync queue | Medium | Batch sync operations (50 entries per request); show progress indicator for large syncs |
| R4 | Migration fails on existing databases | Medium | Test migration on staging first; add rollback migration script |
| R5 | RLS misconfiguration exposes data | High | Automated test to verify RLS with multiple test users; security review before deploy |
| R6 | Export file too large for download | Low | Time entries are small (~150 bytes each); 10,000 entries = ~1.5MB (acceptable) |

**Assumptions:**

| ID | Assumption | Rationale |
|----|------------|-----------|
| A1 | Users have Supabase auth set up | Epic 4 depends on existing auth infrastructure from main app |
| A2 | Existing sync queue pattern is reusable | Architecture doc specifies extending existing pattern |
| A3 | IndexedDB is available | PWA requirement ensures modern browser with IndexedDB |
| A4 | Network connectivity is intermittent | Designed for offline-first with eventual sync |
| A5 | Single user per device | No multi-user scenarios on same device |
| A6 | Export format compatible with future versions | Include version field for migration path |

**Open Questions:**

| ID | Question | Decision Path |
|----|----------|---------------|
| Q1 | ~~Should we add a "last synced" indicator in the UI?~~ | **Resolved:** Yes, show subtle pending count badge in Insights modal header |
| Q2 | ~~How to handle very old entries during initial sync?~~ | **Resolved:** Fetch all entries for user (no pagination needed for MVP volumes) |
| Q3 | Should we support selective sync (only recent entries)? | **Deferred to Growth:** Full sync for MVP, optimize later if needed |

## Test Strategy Summary

**Test Levels:**

| Level | Framework | Scope |
|-------|-----------|-------|
| Unit | Vitest | useTimeEntries hook, sync queue logic, merge algorithm |
| Integration | Vitest + fake-indexeddb | IndexedDB operations, Supabase client mocking |
| E2E | Manual + Playwright (optional) | Cross-device sync scenario, export/import flow |

**Test Coverage by AC:**

| AC Group | Test Type | Key Test Cases |
|----------|-----------|----------------|
| AC-4.1.1-3 (Local + Sync) | Unit + Integration | Stop tracking → IndexedDB → sync queue → mock Supabase |
| AC-4.1.4-5 (Cross-device) | Integration | Seed remote data, load app, verify merge |
| AC-4.1.6 (Offline) | Integration | Mock navigator.onLine, verify queue processing |
| AC-4.1.7-8 (RLS + Indexes) | Migration test | SQL verification in Supabase dashboard |
| AC-4.1.9 (Task deletion) | Integration | Create entry, delete task, verify entry preserved |
| AC-4.1.10 (Error handling) | Unit | Mock fetch failure, verify retry logic |
| AC-4.2.1-4 (Export) | Unit | Generate export, verify JSON structure |
| AC-4.2.5-8 (Import) | Integration | Parse import file, verify IndexedDB state |
| AC-4.2.9 (Order) | Unit | Export multiple entries, verify sort order |

**Edge Cases:**

| Scenario | Test Approach |
|----------|---------------|
| Empty sync queue | Verify no network calls made |
| 1000+ entries to sync | Performance test with mock data |
| Conflicting timestamps (same second) | Use ID as tiebreaker |
| Malformed import file | Graceful error handling, toast message |
| Network timeout during sync | Retry with backoff, no data loss |
| Duplicate import | Upsert behavior, no duplicates |
| Export with deleted tasks | Entries included with null task_id |
| Sync during active tracking | Active session not synced (by design) |

**Manual Testing Script:**

1. **Cross-Device Sync:**
   - Device A: Start and stop tracking on a task
   - Verify entry appears in Insights modal
   - Device B: Open app (same account)
   - Verify same entry appears in Insights modal
   - Device B: Track a different task
   - Device A: Refresh, verify both entries present

2. **Offline Resilience:**
   - Disconnect network
   - Stop tracking (should succeed)
   - Verify entry appears in Insights (from cache)
   - Reconnect network
   - Wait for sync (check toast or pending count)
   - Refresh, verify entry persisted

3. **Export/Import:**
   - Track several tasks over multiple days
   - Trigger export, download file
   - Inspect JSON: verify time_entries array present
   - Clear local data (or use different browser)
   - Import the backup file
   - Verify all entries restored in Insights

4. **Conflict Resolution:**
   - Track same task on two devices simultaneously
   - Stop on Device A at T1
   - Stop on Device B at T2 (T2 > T1)
   - Sync both devices
   - Verify two separate entries exist (no conflict, different IDs)

**RLS Security Test:**
```sql
-- Run as User A
SELECT * FROM time_entries WHERE user_id = 'user-b-id';
-- Expected: Empty result (RLS blocks cross-user access)
```
