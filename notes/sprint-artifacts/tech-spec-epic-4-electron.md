# Epic Technical Specification: Activity Viewing & Export

Date: 2026-01-18
Author: Vishal
Epic ID: 4 (Electron Migration)
Status: Draft

---

## Overview

Epic 4 delivers the user-facing value of the Electron migration: the ability to view and export activity logs captured during time tracking sessions. Building on Epic 3's activity capture infrastructure (stored in IndexedDB), this epic creates the retrieval APIs, modal UI, duration summaries, and file export functionality that enable users to see exactly which applications they used during tracked time.

This epic completes the activity tracking feature loop: Epic 3 captured the data automatically, and Epic 4 makes it accessible and actionable. Users can review their app usage patterns when viewing completed time entries, see a breakdown of time spent per application, and export the data to JSON or CSV for external analysis or record-keeping.

**User Value:** When users click "View Activity" on a completed time entry (button established in Epic 2), they see a chronological log of apps used during that session with duration summaries. This enables accurate time logging verification and corrections when timers were forgotten.

## Objectives and Scope

### In Scope (Epic 4)

- **FR16**: Activity logs stored in IndexedDB (validation - storage done in Epic 3)
- **FR17**: Activity persists across app restarts (validation - established in Epic 3)
- **FR18**: Activity keyed to time entry IDs for retrieval
- **FR19**: Activity never synced to remote (validation - enforced in Epic 3)
- **FR20**: View activity log for any completed time entry
- **FR21**: Chronological display with timestamps
- **FR22**: Shows app name and window title for each entry
- **FR23**: Shows duration spent per application (summary view)
- **FR24**: Export activity log for a single time entry
- **FR25**: JSON and CSV export formats
- **FR26**: Native file save dialog for exports

### Out of Scope (Epic 4)

- Electron project setup and build pipeline (Epic 1 - DONE)
- Feature detection and IPC bridge (Epic 2 - DONE)
- Activity capture and polling (Epic 3 - DONE)
- Activity data storage implementation (Epic 3 - DONE)
- Weekly/monthly activity reports (Growth feature)
- Productivity insights and app categorization (Growth feature)
- Cross-device sync of activity data (explicitly never synced per PRD)
- Editing or deleting individual activity entries

## System Architecture Alignment

### Architecture Reference

This epic implements the activity viewing and export layer from `notes/architecture-electron-migration.md`:

| Decision | Epic 4 Implementation |
|----------|----------------------|
| ADR-008: Activity in IndexedDB | Retrieval via Dexie queries from `activityLogs` table |
| ADR-007: IPC-Only Communication | `activity:get-log` and `activity:export` IPC handlers |
| Feature Detection Pattern | Modal only renders when `isElectron()` returns true |
| Security | File export via Electron's `dialog.showSaveDialog()`, no remote calls |

### Components Introduced

| Component | Purpose | Location |
|-----------|---------|----------|
| `src/hooks/useActivityLog.ts` | Fetch activity log via IPC, compute duration summaries | `src/hooks/` |
| `src/components/time-tracking/ActivityLogModal.tsx` | Modal UI for viewing activity | `src/components/time-tracking/` |
| `src/components/time-tracking/ActivitySummary.tsx` | Duration-per-app breakdown visualization | `src/components/time-tracking/` |
| `src/components/time-tracking/ActivityLogList.tsx` | Chronological activity list | `src/components/time-tracking/` |
| `electron/ipc/handlers.ts` (extended) | `activity:get-log`, `activity:export` implementations | `electron/ipc/` |

### Project Structure After Epic 4

```
today-app/
├── electron/
│   ├── main.ts                     # Unchanged
│   ├── preload.ts                  # Unchanged
│   ├── activity/
│   │   ├── tracker.ts              # Unchanged (Epic 3)
│   │   ├── types.ts                # Unchanged (Epic 3)
│   │   └── store.ts                # May add retrieval helpers
│   └── ipc/
│       ├── channels.ts             # Unchanged
│       └── handlers.ts             # Extended: getLog, export implementations
├── src/
│   ├── lib/
│   │   ├── platform.ts             # Unchanged (Epic 2)
│   │   └── electronBridge.ts       # Unchanged (Epic 2)
│   ├── hooks/
│   │   ├── useActivityLog.ts       # NEW: Activity retrieval + duration calc
│   │   └── ...existing...
│   ├── components/
│   │   └── time-tracking/
│   │       ├── ViewActivityButton.tsx   # Updated: opens modal
│   │       ├── ActivityLogModal.tsx     # NEW: Main modal container
│   │       ├── ActivitySummary.tsx      # NEW: Duration breakdown
│   │       ├── ActivityLogList.tsx      # NEW: Chronological list
│   │       └── ...existing...
│   └── types/
│       └── electron.d.ts           # Unchanged (Epic 2)
└── dist-electron/                  # Electron build
```

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **useActivityLog.ts** | Fetch activity log, calculate durations, aggregate per-app stats | timeEntryId, timeEntry end time | ActivityLogData with entries, summary, loading/error states |
| **ActivityLogModal.tsx** | Modal container with header, summary, list, export controls | timeEntryId, isOpen, onClose, taskName | Radix Dialog with activity content |
| **ActivitySummary.tsx** | Visual breakdown of time per app with progress bars | ActivitySummaryItem[] (app, duration, percent) | Summary cards/bars |
| **ActivityLogList.tsx** | Scrollable chronological list of activity entries | ActivityEntry[] | Formatted time/app/window list |
| **ViewActivityButton.tsx** (updated) | Opens ActivityLogModal on click | timeEntryId, taskName | Button + modal state management |
| **electron/ipc/handlers.ts** (extended) | `activity:get-log` queries IndexedDB, `activity:export` writes files | IPC args | Activity data or file path |

**Module Interaction Flow:**

```
ViewActivityButton clicked
    │
    ▼
Sets modalOpen state to true
    │
    ▼
ActivityLogModal mounts, calls useActivityLog(timeEntryId)
    │
    ├── useActivityLog calls electronBridge.activity.getLog(timeEntryId)
    │       └── IPC: activity:get-log → Main process
    │           └── Dexie query: db.activityLogs.where('timeEntryId').equals(id)
    │               └── Returns ActivityEntry[]
    │
    ├── useActivityLog calculates duration for each entry
    │       └── duration = next entry timestamp - current timestamp
    │       └── Last entry duration = session end - last timestamp
    │
    └── useActivityLog aggregates summary
            └── Group by appName, sum durations, calculate percentages
    │
    ▼
Modal renders:
    ├── Header: Task name, date range
    ├── ActivitySummary: Per-app breakdown with bars
    └── ActivityLogList: Chronological entries
    │
    ▼
Export button clicked
    └── electronBridge.activity.export(timeEntryId, format)
        └── IPC: activity:export → Main process
            └── dialog.showSaveDialog() → fs.writeFile()
                └── Returns { filePath: '/path/to/file' }
```

### Data Models and Contracts

**ActivityEntry (from Epic 3, used for retrieval):**

```typescript
interface ActivityEntry {
  id: string;                    // Auto-generated UUID
  timeEntryId: string;           // Links to time_entries table
  timestamp: string;             // ISO 8601 when this app became active
  appName: string;               // e.g., "Visual Studio Code"
  windowTitle: string;           // e.g., "App.tsx - today-app"
}
```

**ActivityEntryWithDuration (computed in Epic 4):**

```typescript
interface ActivityEntryWithDuration extends ActivityEntry {
  durationMs: number;            // Calculated: next timestamp - this timestamp
  durationFormatted: string;     // e.g., "5m 32s" or "1h 15m"
}
```

**ActivitySummaryItem (aggregated per-app stats):**

```typescript
interface ActivitySummaryItem {
  appName: string;               // e.g., "Visual Studio Code"
  totalDurationMs: number;       // Sum of all entries for this app
  totalDurationFormatted: string;// e.g., "45m 12s"
  percentage: number;            // (totalDuration / sessionDuration) * 100
}
```

**ActivityLogData (hook return type):**

```typescript
interface ActivityLogData {
  entries: ActivityEntryWithDuration[];
  summary: ActivitySummaryItem[];
  totalDurationMs: number;
  totalDurationFormatted: string;
  isLoading: boolean;
  error: string | null;
}
```

**ExportOptions:**

```typescript
interface ExportOptions {
  timeEntryId: string;
  format: 'json' | 'csv';
  suggestedFilename?: string;    // e.g., "activity-TaskName-2026-01-18"
}
```

### APIs and Interfaces

**IPC: activity:get-log (Implementation)**

```typescript
// Request
ipcRenderer.invoke('activity:get-log', timeEntryId: string)

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

**IPC: activity:export (Implementation)**

```typescript
// Request
ipcRenderer.invoke('activity:export', {
  timeEntryId: string,
  format: 'json' | 'csv',
  suggestedFilename?: string
})

// Response - Success
{
  success: true,
  data: { filePath: '/Users/.../activity-export.json' }
}

// Response - Cancelled (user closed dialog)
{
  success: true,
  data: { filePath: '' }  // Empty means cancelled
}

// Response - Error
{
  success: false,
  error: "Write failed: ..."
}
```

**useActivityLog Hook API:**

```typescript
function useActivityLog(
  timeEntryId: string | null,
  sessionEndTime: string | null  // ISO 8601 - needed for last entry duration
): ActivityLogData;

// Usage
const { entries, summary, isLoading, error } = useActivityLog(
  entry.id,
  entry.endTime
);
```

**ActivityLogModal Props:**

```typescript
interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntryId: string;
  taskName: string;
  startTime: string;             // ISO 8601
  endTime: string;               // ISO 8601
}
```

**ActivitySummary Props:**

```typescript
interface ActivitySummaryProps {
  items: ActivitySummaryItem[];
  totalDurationFormatted: string;
}
```

**ActivityLogList Props:**

```typescript
interface ActivityLogListProps {
  entries: ActivityEntryWithDuration[];
}
```

### Workflows and Sequencing

**Flow 1: View Activity Log**

```
User clicks "View Activity" on completed time entry
    │
    ▼
ViewActivityButton sets isModalOpen = true
    │
    ▼
ActivityLogModal renders with isOpen={true}
    │
    ▼
useActivityLog hook initializes with timeEntryId
    │
    ├── Sets isLoading = true
    │
    ├── Calls electronBridge.activity.getLog(timeEntryId)
    │   │
    │   ▼
    │   IPC: activity:get-log reaches main process
    │   │
    │   ▼
    │   Handler queries: db.activityLogs.where('timeEntryId').equals(id).sortBy('timestamp')
    │   │
    │   ▼
    │   Returns entries array to renderer
    │
    ├── Hook receives entries, calculates durations
    │   │
    │   ▼
    │   For each entry[i]:
    │       if (i < entries.length - 1):
    │           duration = entries[i+1].timestamp - entries[i].timestamp
    │       else:
    │           duration = sessionEndTime - entries[i].timestamp
    │
    ├── Hook aggregates summary
    │   │
    │   ▼
    │   Group entries by appName
    │   Sum durations per app
    │   Sort by total duration descending
    │   Calculate percentage = (appDuration / totalDuration) * 100
    │
    └── Sets isLoading = false, returns data
    │
    ▼
Modal renders:
    ├── Header: "{taskName} - Activity Log"
    │           "Jan 18, 2026 • 2h 15m"
    │
    ├── ActivitySummary section
    │   ├── "Visual Studio Code" [===========] 45% • 1h 1m
    │   ├── "Chrome" [======] 30% • 40m
    │   └── "Slack" [===] 15% • 20m
    │
    ├── ActivityLogList section (scrollable)
    │   ├── 9:00:15 AM • Visual Studio Code • App.tsx - today-app • 15m
    │   ├── 9:15:20 AM • Chrome • GitHub PR #123 • 10m
    │   └── ...
    │
    └── Footer: [Export JSON ▼] [Close]
```

**Flow 2: Export Activity Log**

```
User clicks "Export" dropdown in modal footer
    │
    ▼
Dropdown shows: "JSON" | "CSV"
    │
    ▼
User selects format (e.g., "JSON")
    │
    ▼
Component calls electronBridge.activity.export(timeEntryId, 'json')
    │
    ▼
IPC: activity:export reaches main process
    │
    ├── Handler constructs suggested filename
    │   └── "activity-{taskName}-{date}.json"
    │
    ├── dialog.showSaveDialog({
    │       title: 'Export Activity Log',
    │       defaultPath: suggestedFilename,
    │       filters: [{ name: 'JSON', extensions: ['json'] }]
    │   })
    │
    ├── User selects save location (or cancels)
    │
    ├── If cancelled: return { success: true, data: { filePath: '' } }
    │
    ├── If saved:
    │   ├── Query activity entries from DB
    │   ├── Format as JSON (pretty-printed) or CSV
    │   │   JSON: JSON.stringify(entries, null, 2)
    │   │   CSV: "timestamp,app_name,window_title,duration_seconds\n" + rows
    │   ├── fs.writeFile(selectedPath, content)
    │   └── return { success: true, data: { filePath: selectedPath } }
    │
    └── If error: return { success: false, error: message }
    │
    ▼
Renderer receives response
    │
    ├── If filePath empty: Do nothing (user cancelled)
    │
    ├── If filePath present: Show toast "Exported to {filename}"
    │
    └── If error: Show toast "Export failed: {error}"
```

**Flow 3: Modal Close**

```
User clicks X button, Escape key, or clicks outside modal
    │
    ▼
Radix Dialog onOpenChange(false) fires
    │
    ▼
ViewActivityButton sets isModalOpen = false
    │
    ▼
ActivityLogModal unmounts
    │
    ▼
useActivityLog cleanup (if any pending requests, ignore responses)
```

## Non-Functional Requirements

### Performance

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **NFR3**: Activity query < 100ms | Query returns in <100ms for 8-hour sessions | Dexie indexed query on `timeEntryId`; index already defined in Epic 3 | PRD NFR3 |
| **Modal open** | < 100ms perceived | Show loading spinner immediately, data fetches in background | UX best practice |
| **Duration calculation** | < 50ms for 1000 entries | Pure JS computation, O(n) single pass | Architecture |
| **Summary aggregation** | < 20ms for 1000 entries | Map-based grouping, O(n) | Architecture |
| **Export file generation** | < 500ms for 1000 entries | JSON.stringify is fast; CSV via string concatenation | Best practice |
| **NFR4**: Web bundle unchanged | 0 KB increase | Modal components gated by `isElectron()`, tree-shaken | PRD NFR4 |

**Implementation Notes:**

- Dexie IndexedDB queries are async but fast for indexed fields
- Duration calculation is done client-side (renderer) to reduce IPC payload
- For very long sessions (8+ hours, ~2000+ entries), consider pagination or virtual scrolling (not MVP)
- Export writes to local filesystem - no network latency

**Query Performance Pattern:**

```typescript
// In main process handler
const entries = await db.activityLogs
  .where('timeEntryId')
  .equals(timeEntryId)
  .sortBy('timestamp');
// Index on timeEntryId ensures O(log n) lookup
```

### Security

| NFR | Implementation | Source |
|-----|----------------|--------|
| **NFR5**: Activity data local only | No network calls in Epic 4 handlers; data never leaves device | PRD NFR5, FR19 |
| **NFR7**: Secure IPC | contextIsolation enforced; no arbitrary channel invocation | PRD NFR7, Epic 2 |
| **File export safety** | `dialog.showSaveDialog()` lets user choose location; no auto-write | Best practice |
| **No sensitive data in URLs** | Activity data not passed via query params or URLs | Best practice |

**Export Security Pattern:**

```typescript
// Main process - user controls where file is saved
const { filePath } = await dialog.showSaveDialog({
  title: 'Export Activity Log',
  defaultPath: suggestedFilename,
  filters: [{ name: 'JSON', extensions: ['json'] }],
});

// Only write if user selected a path
if (filePath) {
  await fs.promises.writeFile(filePath, content, 'utf-8');
}
```

**Privacy Considerations:**

- Window titles may contain sensitive information (document names, URLs, etc.)
- Users are aware of this since they initiated tracking
- Export files should be treated as potentially sensitive by user
- No automatic sharing or upload functionality

### Reliability/Availability

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **Data integrity** | Activity data from Epic 3 is read-only | No mutations to activity records in Epic 4 | Best practice |
| **Missing data handling** | Empty array returned if no activity | Hook displays "No activity recorded" message | UX |
| **Export failure recovery** | User can retry; no data loss | Export reads fresh from DB each time | Best practice |
| **Modal dismissal safety** | No side effects on close | Cancel any pending IPC, reset state | React best practice |

**Error Handling Patterns:**

```typescript
// Hook error handling
const { entries, error } = useActivityLog(timeEntryId, endTime);

if (error) {
  return <ErrorState message={error} onRetry={refetch} />;
}

if (entries.length === 0) {
  return <EmptyState message="No activity recorded for this session" />;
}
```

```typescript
// Export error handling
const handleExport = async (format: 'json' | 'csv') => {
  setExporting(true);
  try {
    const result = await electronBridge.activity.export(timeEntryId, format);
    if (!result.success) {
      showToast(`Export failed: ${result.error}`, 'error');
    } else if (result.data?.filePath) {
      showToast(`Exported to ${path.basename(result.data.filePath)}`, 'success');
    }
    // filePath empty = user cancelled, no message needed
  } finally {
    setExporting(false);
  }
};
```

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| **IPC logging (main)** | `console.log('[Electron/IPC] activity:get-log', { timeEntryId, entryCount })` | Debug retrieval |
| **Export logging (main)** | `console.log('[Electron/IPC] activity:export', { format, filePath })` | Debug exports |
| **Hook state logging** | Dev-only logging of loading/error states | Debug UI issues |
| **Performance timing** | `console.time/timeEnd` for query + calculation in dev mode | Identify bottlenecks |

**Development Mode Logging:**

```typescript
// In main process handler
ipcMain.handle(IPC_CHANNELS.ACTIVITY_GET_LOG, async (event, timeEntryId: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.time('[Electron/IPC] activity:get-log query');
  }

  const entries = await db.activityLogs
    .where('timeEntryId')
    .equals(timeEntryId)
    .sortBy('timestamp');

  if (process.env.NODE_ENV === 'development') {
    console.timeEnd('[Electron/IPC] activity:get-log query');
    console.log('[Electron/IPC] activity:get-log', { timeEntryId, entryCount: entries.length });
  }

  return { success: true, data: entries };
});
```

**Metrics to Track (Future):**

- Average query time per session length
- Export format preference (JSON vs CSV)
- Modal open-to-render time
- Not implemented in MVP; manual testing sufficient

## Dependencies and Integrations

### Dependencies From Previous Epics (Required)

Epic 4 builds on the complete foundation from Epics 1-3. These are prerequisites:

| Dependency | Established In | Used By Epic 4 |
|------------|----------------|----------------|
| `electron` ^39.x | Epic 1 | Main process handlers, dialog API |
| `electron-vite` ^5.x | Epic 1 | Build tooling |
| `@electron-toolkit/preload` ^3.x | Epic 1 | contextBridge (unchanged) |
| `src/lib/platform.ts` | Epic 2 | `isElectron()` for conditional rendering |
| `src/lib/electronBridge.ts` | Epic 2 | IPC wrapper for activity calls |
| `src/types/electron.d.ts` | Epic 2 | TypeScript types for window.electronAPI |
| `electron/ipc/channels.ts` | Epic 2 | IPC channel constants |
| `electron/activity/types.ts` | Epic 3 | ActivityEntry interface |
| `activityLogs` Dexie table | Epic 3 | Data storage with timeEntryId index |

### No New Dependencies Required

**Epic 4 introduces no new npm dependencies.** All required packages are already installed:

| Existing Dependency | Version | Usage in Epic 4 |
|---------------------|---------|-----------------|
| `react` | ^19.2.0 | Modal components |
| `@radix-ui/react-dialog` | ^1.x | ActivityLogModal |
| `@radix-ui/react-dropdown-menu` | ^2.x | Export format dropdown |
| `date-fns` | ^4.x | Timestamp formatting, duration calculation |
| `lucide-react` | ^0.562.0 | Icons (Download, X, Clock, etc.) |
| `dexie` | ^4.x | IndexedDB queries (via existing db.ts) |
| `tailwindcss` | ^4.x | Component styling |

### Internal Module Dependencies

| Module | Depends On | Integration Point |
|--------|------------|-------------------|
| `useActivityLog.ts` | `electronBridge.ts`, `date-fns` | Fetches data, calculates durations |
| `ActivityLogModal.tsx` | `useActivityLog.ts`, `@radix-ui/react-dialog` | Container component |
| `ActivitySummary.tsx` | `ActivitySummaryItem[]` type | Receives summary data as props |
| `ActivityLogList.tsx` | `ActivityEntryWithDuration[]` type | Receives entries as props |
| `ViewActivityButton.tsx` | `ActivityLogModal.tsx`, `platform.ts` | Opens modal, gates on isElectron() |
| `electron/ipc/handlers.ts` | `dexie`, `electron.dialog`, `fs` | Queries DB, shows dialog, writes files |

### Integration Points with Existing Code

**Files Modified:**

| File | Change | Reason |
|------|--------|--------|
| `electron/ipc/handlers.ts` | Implement `activity:get-log` and `activity:export` | Replace stubs with real implementations |
| `src/components/time-tracking/ViewActivityButton.tsx` | Add modal state, render ActivityLogModal | Connect button to modal |
| `src/lib/db.ts` (potentially) | May need to export db instance or add query helpers | Enable queries from main process |

**Files Added:**

| File | Purpose |
|------|---------|
| `src/hooks/useActivityLog.ts` | Data fetching and processing hook |
| `src/components/time-tracking/ActivityLogModal.tsx` | Main modal container |
| `src/components/time-tracking/ActivitySummary.tsx` | Duration breakdown UI |
| `src/components/time-tracking/ActivityLogList.tsx` | Chronological list UI |

**Files Unchanged:**

- `electron/main.ts` - Handler registration already done in Epic 2
- `electron/preload.ts` - Bridge already exposes activity methods
- `electron/ipc/channels.ts` - Channels already defined
- `src/lib/platform.ts` - Detection logic unchanged
- `src/lib/electronBridge.ts` - Wrapper already complete
- `src/types/electron.d.ts` - Types already defined
- `electron/activity/tracker.ts` - Capture logic unchanged
- `vite.config.ts` - Web build config unchanged
- `electron.vite.config.ts` - Electron build config unchanged

### Integration with Time Entry Display

The "View Activity" button needs access to time entry data. Integration point:

```typescript
// In TimeEntryItem or similar component
import { isElectron } from '@/lib/platform';
import { ViewActivityButton } from './ViewActivityButton';

export function TimeEntryItem({ entry }: { entry: TimeEntry }) {
  const isCompleted = entry.endTime !== null;

  return (
    <div>
      {/* Existing time entry UI */}
      {isElectron() && isCompleted && (
        <ViewActivityButton
          timeEntryId={entry.id}
          taskName={entry.taskName}
          startTime={entry.startTime}
          endTime={entry.endTime!}
        />
      )}
    </div>
  );
}
```

### Dexie Query Access Pattern

Activity data is stored in renderer (Epic 3). For Epic 4 retrieval:

**Option A: Query via IPC from main → renderer (recommended)**
- Main process sends IPC to renderer to query Dexie
- More complex but maintains data in one place

**Option B: Main process uses Dexie directly**
- Electron main process can access IndexedDB via electron-store or separate Dexie instance
- Simpler but requires data sync consideration

**Recommended: Option A** - Keeps Dexie instance in renderer, queries via IPC round-trip:

```typescript
// Simplified: renderer queries its own Dexie
// Main process handler calls renderer via IPC, renderer queries and returns
// This matches existing architecture from Epic 3 where renderer owns Dexie
```

Actually, reviewing Epic 3's storage pattern - activity is stored from main process via IPC to renderer. For retrieval, the same pattern applies: main process receives request, forwards to renderer, renderer queries Dexie and returns.

## Acceptance Criteria (Authoritative)

### AC1: Activity Log Retrieval (Story 4.1)

- **AC1.1**: Calling `window.electronAPI.activity.getLog(timeEntryId)` returns an array of ActivityEntry objects
- **AC1.2**: Entries are sorted chronologically (oldest timestamp first)
- **AC1.3**: Each entry includes: id, timeEntryId, timestamp, appName, windowTitle
- **AC1.4**: If no activity exists for the timeEntryId, an empty array is returned (not an error)
- **AC1.5**: Query completes in <100ms for sessions up to 8 hours (~1000 entries)
- **AC1.6**: Response follows IPCResponse pattern: `{ success: true, data: ActivityEntry[] }`

### AC2: Activity Log Modal UI (Story 4.2)

- **AC2.1**: Clicking "View Activity" button opens a modal dialog
- **AC2.2**: Modal header displays the task name and session date/time range
- **AC2.3**: Modal shows a loading spinner while fetching data
- **AC2.4**: Activity entries are displayed as a chronological list
- **AC2.5**: Each list row shows: time (HH:MM:SS AM/PM), app name, window title, duration
- **AC2.6**: The list is scrollable for sessions with many entries
- **AC2.7**: Modal can be closed via X button, Escape key, or clicking outside
- **AC2.8**: Modal uses existing design patterns (Radix Dialog, Tailwind classes)
- **AC2.9**: If no activity was recorded, modal shows "No activity recorded" message

### AC3: Activity Duration Summary (Story 4.3)

- **AC3.1**: Modal displays a summary section above the chronological list
- **AC3.2**: Summary shows time spent per application, sorted by duration (most time first)
- **AC3.3**: Each summary row shows: app name, total duration, percentage of session
- **AC3.4**: A visual indicator (progress bar or similar) shows relative time percentages
- **AC3.5**: Summary section can be collapsed to show only the detailed list (optional)
- **AC3.6**: Duration is formatted human-readable: "Xh Ym" or "Ym Zs" as appropriate

### AC4: Activity Export to File (Story 4.4)

- **AC4.1**: Modal footer contains an "Export" button with format dropdown
- **AC4.2**: Export dropdown offers "JSON" and "CSV" format options
- **AC4.3**: Clicking a format opens native file save dialog
- **AC4.4**: Default filename includes task name and date (e.g., "activity-MyTask-2026-01-18.json")
- **AC4.5**: JSON export contains full activity array with all fields, pretty-printed
- **AC4.6**: CSV export has headers: timestamp, app_name, window_title, duration_seconds
- **AC4.7**: CSV properly escapes commas and quotes in window titles
- **AC4.8**: If user cancels save dialog, no file is created and no error shown
- **AC4.9**: On successful save, toast shows "Exported to {filename}"
- **AC4.10**: On save error, toast shows "Export failed: {reason}"

### AC5: Web Continuity (Cross-cutting)

- **AC5.1**: "View Activity" button does NOT appear in web browser (only Electron)
- **AC5.2**: Web build contains no ActivityLogModal, ActivitySummary, or ActivityLogList code
- **AC5.3**: Running `grep -r "ActivityLogModal" dist/` returns no matches
- **AC5.4**: All existing time tracking features work unchanged in web browser
- **AC5.5**: All existing task management features work unchanged

### AC6: Validation from Previous Epics

- **AC6.1**: Activity data stored in IndexedDB is accessible (FR16, validated)
- **AC6.2**: Activity data persists after Electron app restart (FR17, validated)
- **AC6.3**: Activity data is keyed by timeEntryId (FR18, validated via retrieval)
- **AC6.4**: Activity data is NOT synced to Supabase (FR19, validated - no sync code)

## Traceability Mapping

### FR to AC Mapping

| FR | Description | Story | Acceptance Criteria |
|----|-------------|-------|---------------------|
| FR16 | Activity stored in IndexedDB | Epic 3 (validation) | AC6.1 |
| FR17 | Activity persists across restarts | Epic 3 (validation) | AC6.2 |
| FR18 | Activity keyed to entry IDs | Story 4.1 | AC1.1, AC1.2, AC6.3 |
| FR19 | Activity never synced remote | Epic 3 (validation) | AC6.4 |
| FR20 | View activity log for entry | Story 4.2 | AC2.1, AC2.4, AC2.9 |
| FR21 | Chronological display with timestamps | Story 4.2 | AC1.2, AC2.4, AC2.5 |
| FR22 | Shows app name and window title | Story 4.2 | AC1.3, AC2.5 |
| FR23 | Shows duration per app | Story 4.3 | AC3.1, AC3.2, AC3.3, AC3.6 |
| FR24 | Export for single entry | Story 4.4 | AC4.1, AC4.2, AC4.3 |
| FR25 | JSON and CSV formats | Story 4.4 | AC4.2, AC4.5, AC4.6, AC4.7 |
| FR26 | Native file save dialog | Story 4.4 | AC4.3, AC4.4, AC4.8 |

### AC to Component Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC1.1-1.6 | APIs: activity:get-log | `electron/ipc/handlers.ts`, Dexie | Manual: DevTools invoke, verify response |
| AC2.1-2.9 | Workflows: Flow 1 | `ActivityLogModal.tsx`, `ActivityLogList.tsx` | Manual: Visual inspection, interaction |
| AC3.1-3.6 | Workflows: Flow 1 | `ActivitySummary.tsx`, `useActivityLog.ts` | Manual: Visual inspection, calculation verify |
| AC4.1-4.10 | Workflows: Flow 2 | `electron/ipc/handlers.ts`, modal footer | Manual: Export flow, verify files |
| AC5.1-5.5 | NFR: Web bundle | Conditional rendering, build | Manual: Browser test, grep dist/ |
| AC6.1-6.4 | Dependencies | Epic 3 artifacts | Manual: Verify data retrieval works |

### Story to FR Coverage

| Story | FRs Covered | ACs |
|-------|-------------|-----|
| 4.1: Activity Log Retrieval | FR18, FR21 | AC1.1-1.6 |
| 4.2: Activity Log Modal UI | FR20, FR21, FR22 | AC2.1-2.9 |
| 4.3: Activity Duration Summary | FR23 | AC3.1-3.6 |
| 4.4: Activity Export to File | FR24, FR25, FR26 | AC4.1-4.10 |
| Cross-cutting | FR16, FR17, FR19 | AC5.1-5.5, AC6.1-6.4 |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Long sessions (8+ hours) cause slow modal render | Medium | Medium | Implement virtual scrolling if needed; test with 1000+ entries |
| R2 | CSV export breaks with special characters in window titles | Medium | Low | Proper escaping: wrap in quotes, escape internal quotes |
| R3 | Dexie query access pattern unclear between main/renderer | Medium | High | Clarify in Story 4.1 - likely query in renderer via existing Dexie instance |
| R4 | Modal components not tree-shaken from web build | Medium | High | Verify with `grep -r "ActivityLogModal" dist/`; ensure proper code splitting |
| R5 | Duration calculation edge cases (missing timestamps, timezone) | Low | Medium | Use date-fns consistently; test edge cases in Story 4.3 |
| R6 | File dialog blocked or fails on some macOS versions | Low | Medium | Use standard Electron dialog API; test on macOS 12+ |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A1 | Epic 3 completed: activity data is being captured and stored | Verify `activityLogs` table has data before starting Epic 4 |
| A2 | Epic 2 IPC bridge is working for activity methods | Verify stub responses work before implementing real handlers |
| A3 | Existing Radix Dialog patterns in codebase can be reused | Review existing modal implementations |
| A4 | date-fns is already installed (used elsewhere in app) | Check package.json; install if needed |
| A5 | Sessions are typically <4 hours with <500 activity entries | Based on personal productivity tool use case |
| A6 | Window titles are displayable as-is (no sanitization needed) | May need truncation for very long titles |

### Open Questions

| ID | Question | Owner | Resolution Target | Recommended Answer |
|----|----------|-------|-------------------|-------------------|
| Q1 | Where should duration calculation happen - hook or handler? | Dev | Story 4.1 | Hook (renderer) - reduces IPC payload, keeps logic in React |
| Q2 | Should summary section be collapsible by default? | Dev | Story 4.3 | Start expanded; add collapse toggle if space is tight |
| Q3 | Should export include computed duration or just timestamps? | Dev | Story 4.4 | Include duration_seconds in export for user convenience |
| Q4 | How to handle very long window titles in the UI? | Dev | Story 4.2 | Truncate with ellipsis, show full on hover/tooltip |
| Q5 | Should we show entry count in modal header? | Dev | Story 4.2 | Yes - helps user understand session at a glance |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Unit Tests** | `useActivityLog` duration/summary calculation | Vitest | Core computation logic |
| **Component Tests** | `ActivitySummary`, `ActivityLogList` rendering | Vitest + Testing Library | UI rendering with mock data |
| **Integration Tests** | Full modal flow with mocked IPC | Vitest + Testing Library | End-to-end UI flow |
| **Manual Tests** | All acceptance criteria | Checklist | 100% of ACs |
| **Build Verification** | Web build isolation | Shell scripts | No activity UI code in dist/ |

### Test Scenarios by Story

**Story 4.1: Activity Log Retrieval**

- Manual: In Electron DevTools, call `window.electronAPI.activity.getLog('valid-id')` → returns array of entries
- Manual: Call with ID that has no activity → returns `{ success: true, data: [] }`
- Manual: Verify entries are sorted by timestamp ascending
- Manual: Time the query for a session with ~500 entries → <100ms
- Unit test: Handler returns correct format

**Story 4.2: Activity Log Modal UI**

- Manual: Click "View Activity" on completed time entry → modal opens
- Manual: Verify modal header shows task name and date range
- Manual: Verify loading spinner appears briefly
- Manual: Verify chronological list displays with correct format
- Manual: Scroll list with 50+ entries → smooth scrolling
- Manual: Press Escape → modal closes
- Manual: Click outside modal → modal closes
- Manual: View entry with no activity → "No activity recorded" message
- Component test: ActivityLogList renders entries correctly
- Component test: Modal handles empty state

**Story 4.3: Activity Duration Summary**

- Manual: View modal → summary section shows above list
- Manual: Verify apps sorted by total duration (most first)
- Manual: Verify percentages add up to ~100%
- Manual: Verify progress bars visually match percentages
- Manual: Duration formats correctly: "1h 23m", "45m", "2m 30s"
- Unit test: `useActivityLog` duration calculation with known data
- Unit test: Summary aggregation with known data
- Component test: ActivitySummary renders bars correctly

**Story 4.4: Activity Export to File**

- Manual: Click Export → dropdown shows JSON and CSV
- Manual: Select JSON → native save dialog opens
- Manual: Save JSON file → verify valid JSON with all fields
- Manual: Select CSV → native save dialog opens
- Manual: Save CSV file → verify headers and data rows
- Manual: CSV with comma in window title → properly escaped
- Manual: Cancel save dialog → no error, no file created
- Manual: Successful save → toast shows filename
- Manual: Open exported files in external app (text editor, Excel)

**Story Cross-cutting: Web Continuity**

- Manual: Run `npm run dev`, view time entry in browser → no "View Activity" button
- Manual: Run `npm run build && grep -r "ActivityLogModal" dist/` → no matches
- Manual: Run `npm run build && grep -r "ActivitySummary" dist/` → no matches
- Manual: Verify all existing time tracking features work in browser

### Unit Test Specifications

```typescript
// src/hooks/useActivityLog.test.ts
describe('useActivityLog', () => {
  describe('duration calculation', () => {
    it('calculates duration as diff between consecutive timestamps', () => {
      const entries = [
        { timestamp: '2026-01-18T09:00:00Z', appName: 'VSCode', windowTitle: 'file.ts' },
        { timestamp: '2026-01-18T09:10:00Z', appName: 'Chrome', windowTitle: 'GitHub' },
      ];
      const sessionEnd = '2026-01-18T09:15:00Z';

      const result = calculateDurations(entries, sessionEnd);

      expect(result[0].durationMs).toBe(10 * 60 * 1000); // 10 minutes
      expect(result[1].durationMs).toBe(5 * 60 * 1000);  // 5 minutes
    });

    it('handles single entry (duration = session end - timestamp)', () => {
      const entries = [
        { timestamp: '2026-01-18T09:00:00Z', appName: 'VSCode', windowTitle: 'file.ts' },
      ];
      const sessionEnd = '2026-01-18T10:00:00Z';

      const result = calculateDurations(entries, sessionEnd);

      expect(result[0].durationMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('returns empty array for empty input', () => {
      const result = calculateDurations([], '2026-01-18T10:00:00Z');
      expect(result).toEqual([]);
    });
  });

  describe('summary aggregation', () => {
    it('groups by appName and sums durations', () => {
      const entriesWithDuration = [
        { appName: 'VSCode', durationMs: 600000 },
        { appName: 'Chrome', durationMs: 300000 },
        { appName: 'VSCode', durationMs: 400000 },
      ];

      const summary = aggregateSummary(entriesWithDuration);

      expect(summary).toContainEqual(
        expect.objectContaining({ appName: 'VSCode', totalDurationMs: 1000000 })
      );
      expect(summary).toContainEqual(
        expect.objectContaining({ appName: 'Chrome', totalDurationMs: 300000 })
      );
    });

    it('sorts by duration descending', () => {
      const entriesWithDuration = [
        { appName: 'A', durationMs: 100 },
        { appName: 'B', durationMs: 300 },
        { appName: 'C', durationMs: 200 },
      ];

      const summary = aggregateSummary(entriesWithDuration);

      expect(summary[0].appName).toBe('B');
      expect(summary[1].appName).toBe('C');
      expect(summary[2].appName).toBe('A');
    });

    it('calculates percentages correctly', () => {
      const entriesWithDuration = [
        { appName: 'A', durationMs: 500 },
        { appName: 'B', durationMs: 500 },
      ];

      const summary = aggregateSummary(entriesWithDuration);

      expect(summary[0].percentage).toBe(50);
      expect(summary[1].percentage).toBe(50);
    });
  });
});
```

```typescript
// src/components/time-tracking/ActivitySummary.test.tsx
describe('ActivitySummary', () => {
  it('renders summary items with progress bars', () => {
    const items = [
      { appName: 'VSCode', totalDurationFormatted: '30m', percentage: 60 },
      { appName: 'Chrome', totalDurationFormatted: '20m', percentage: 40 },
    ];

    render(<ActivitySummary items={items} totalDurationFormatted="50m" />);

    expect(screen.getByText('VSCode')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<ActivitySummary items={[]} totalDurationFormatted="0m" />);

    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });
});
```

### Build Verification Script

```bash
#!/bin/bash
# verify-epic4.sh - Run after npm run build

echo "Verifying Epic 4: No activity UI code in web build..."

if grep -rq "ActivityLogModal" dist/; then
  echo "✗ FAIL: ActivityLogModal found in web build!"
  exit 1
else
  echo "✓ No ActivityLogModal in dist/"
fi

if grep -rq "ActivitySummary" dist/; then
  echo "✗ FAIL: ActivitySummary found in web build!"
  exit 1
else
  echo "✓ No ActivitySummary in dist/"
fi

if grep -rq "ActivityLogList" dist/; then
  echo "✗ FAIL: ActivityLogList found in web build!"
  exit 1
else
  echo "✓ No ActivityLogList in dist/"
fi

if grep -rq "useActivityLog" dist/; then
  echo "✗ FAIL: useActivityLog found in web build!"
  exit 1
else
  echo "✓ No useActivityLog in dist/"
fi

echo "All Epic 4 verifications passed!"
```

### Acceptance Criteria Coverage Summary

| AC Range | Test Type | Coverage |
|----------|-----------|----------|
| AC1.1-1.6 (Retrieval) | Manual + Unit | IPC response format, query performance |
| AC2.1-2.9 (Modal UI) | Manual + Component | Visual inspection, interaction, empty state |
| AC3.1-3.6 (Summary) | Manual + Unit | Calculation verification, visual inspection |
| AC4.1-4.10 (Export) | Manual | File dialog flow, file content verification |
| AC5.1-5.5 (Web Continuity) | Manual + Build Script | Browser test, grep verification |
| AC6.1-6.4 (Validation) | Manual | Data retrieval confirms Epic 3 storage |

All 32 acceptance criteria are covered by the test scenarios above.

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2026-01-18_
_For: Vishal_
