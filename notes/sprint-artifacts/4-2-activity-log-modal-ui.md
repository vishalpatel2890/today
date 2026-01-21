# Story 4.2: Activity Log Modal UI

Status: done

## Story

As a **user**,
I want **to view my activity log in a modal when I click "View Activity"**,
so that **I can see which apps I used during a time tracking session**.

## Acceptance Criteria

1. **AC4.2.1**: Clicking "View Activity" button opens a modal dialog
2. **AC4.2.2**: Modal header displays the task name and session date/time range
3. **AC4.2.3**: Modal shows a loading spinner while fetching data
4. **AC4.2.4**: Activity entries are displayed as a chronological list
5. **AC4.2.5**: Each list row shows: time (HH:MM:SS AM/PM), app name, window title, duration
6. **AC4.2.6**: The list is scrollable for sessions with many entries
7. **AC4.2.7**: Modal can be closed via X button, Escape key, or clicking outside
8. **AC4.2.8**: Modal uses existing design patterns (Radix Dialog, Tailwind classes)
9. **AC4.2.9**: If no activity was recorded, modal shows "No activity recorded" message

## Frontend Test Gate

**Gate ID**: 4-2-TG1

### Prerequisites
- [ ] Story 4.1 complete (`electronBridge.activity.getLog()` working)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] Activity data exists in IndexedDB from previous tracking sessions
- [ ] Completed time entries visible in Time Insights modal

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with Today app |
| 2 | Track time on a task for 30+ seconds, switching between apps | Task timer | Activity entries captured (verify via DevTools) |
| 3 | Stop time tracking | Task timer button | Time entry saved with endTime |
| 4 | Open Time Insights modal (double-tap T hotkey) | Main view | Time Insights modal opens |
| 5 | Find the completed time entry in Recent Entries | Time Insights modal | Entry visible with "View Activity" button |
| 6 | Click "View Activity" button | Time entry row | Activity Log Modal opens |
| 7 | Verify modal header | Modal top | Shows task name, date, and time range |
| 8 | Verify loading state | Modal body | Brief loading spinner appears then content loads |
| 9 | Verify chronological list | Modal body | Activity entries shown with time, app, window title, duration |
| 10 | Scroll the list (if many entries) | Modal body | List scrolls smoothly |
| 11 | Press Escape key | Keyboard | Modal closes |
| 12 | Re-open modal, click X button | Modal header | Modal closes |
| 13 | Re-open modal, click outside | Modal overlay | Modal closes |
| 14 | View entry with no activity | Time entry without activity | "No activity recorded" message shown |

### Success Criteria (What User Sees)
- [ ] "View Activity" button opens modal dialog
- [ ] Modal header shows task name and date/time range (e.g., "Fix bug - Jan 18, 2026 • 9:00 AM - 10:30 AM")
- [ ] Loading spinner appears briefly while fetching
- [ ] Activity list displays chronologically (oldest first)
- [ ] Each row shows: time, app icon/name, window title, duration
- [ ] List is scrollable when content exceeds viewport
- [ ] Modal closes via X, Escape, or backdrop click
- [ ] Empty state message for entries without activity
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you open and close the modal without confusion?
2. Was the activity list easy to scan and understand?
3. Did the modal load quickly enough (<100ms perceived)?
4. Any UX friction or unexpected behavior?

## Tasks / Subtasks

- [x] **Task 1: Create useActivityLog hook** (AC: 4.2.3, 4.2.4)
  - [x] 1.1: Create `src/hooks/useActivityLog.ts`
  - [x] 1.2: Implement hook that calls `electronBridge.activity.getLog(timeEntryId)`
  - [x] 1.3: Add loading state (`isLoading: boolean`)
  - [x] 1.4: Add error state (`error: string | null`)
  - [x] 1.5: Calculate duration for each entry (diff to next entry timestamp, last entry to session end)
  - [x] 1.6: Return `ActivityLogData` type: `{ entries, isLoading, error }`

- [x] **Task 2: Create ActivityLogModal component** (AC: 4.2.1, 4.2.2, 4.2.7, 4.2.8)
  - [x] 2.1: Create `src/components/time-tracking/ActivityLogModal.tsx`
  - [x] 2.2: Use Radix Dialog (`@radix-ui/react-dialog`) for modal
  - [x] 2.3: Implement modal header with task name and date/time range
  - [x] 2.4: Format date/time using date-fns (e.g., "Jan 18, 2026 • 9:00 AM - 10:30 AM")
  - [x] 2.5: Add X close button in header
  - [x] 2.6: Configure modal to close on Escape key and backdrop click
  - [x] 2.7: Style with Tailwind classes matching existing app design

- [x] **Task 3: Create ActivityLogList component** (AC: 4.2.4, 4.2.5, 4.2.6, 4.2.9)
  - [x] 3.1: Create `src/components/time-tracking/ActivityLogList.tsx`
  - [x] 3.2: Render chronological list of activity entries
  - [x] 3.3: Each row shows: time (format: "9:00:15 AM"), app name, window title, duration (format: "5m 32s")
  - [x] 3.4: Make list scrollable with max-height and overflow-y-auto
  - [x] 3.5: Truncate long window titles with ellipsis (full title on hover via tooltip)
  - [x] 3.6: Implement empty state: "No activity recorded for this session"

- [x] **Task 4: Update ViewActivityButton to open modal** (AC: 4.2.1)
  - [x] 4.1: Open `src/components/time-tracking/ViewActivityButton.tsx`
  - [x] 4.2: Add state: `const [isModalOpen, setIsModalOpen] = useState(false)`
  - [x] 4.3: Render ActivityLogModal with isOpen={isModalOpen}
  - [x] 4.4: Pass timeEntryId, taskName, startTime, endTime to modal

- [x] **Task 5: Implement loading state** (AC: 4.2.3)
  - [x] 5.1: In ActivityLogModal, show loading spinner while `useActivityLog.isLoading` is true
  - [x] 5.2: Use existing Loader component or simple spinner (animate-spin)
  - [x] 5.3: Center spinner in modal body

- [x] **Task 6: Write tests** (AC: all)
  - [x] 6.1: Unit test: `useActivityLog` returns loading state initially
  - [x] 6.2: Unit test: `useActivityLog` calculates durations correctly
  - [x] 6.3: Component test: `ActivityLogList` renders entries with correct format
  - [x] 6.4: Component test: `ActivityLogList` shows empty state when no entries
  - [x] 6.5: Component test: `ActivityLogModal` renders header with task name and date
  - [x] 6.6: Ensure all existing tests pass (baseline: 609 tests) - **627 tests passing**

## Dev Notes

### Architecture Alignment

This story implements FR20 (View activity log), FR21 (Chronological display with timestamps), and FR22 (Shows app name and window title) from the PRD.

**From Tech Spec `notes/sprint-artifacts/tech-spec-epic-4-electron.md`:**

```typescript
// Data flow
ViewActivityButton clicked
    │
    ▼
Sets modalOpen state to true
    │
    ▼
ActivityLogModal mounts, calls useActivityLog(timeEntryId, endTime)
    │
    ├── Calls electronBridge.activity.getLog(timeEntryId)
    │       └── Returns ActivityEntry[]
    │
    ├── Calculates duration for each entry
    │       └── duration = next entry timestamp - current timestamp
    │       └── Last entry duration = session end - last timestamp
    │
    └── Returns data to modal for rendering
```

**Component Props (from Tech Spec):**

```typescript
interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntryId: string;
  taskName: string;
  startTime: string;             // ISO 8601
  endTime: string;               // ISO 8601
}

interface ActivityLogListProps {
  entries: ActivityEntryWithDuration[];
}

interface ActivityEntryWithDuration {
  id: string;
  timeEntryId: string;
  timestamp: string;
  appName: string;
  windowTitle: string;
  durationMs: number;
  durationFormatted: string;  // e.g., "5m 32s"
}
```

### Project Structure Notes

**Files to Create:**
- `src/hooks/useActivityLog.ts` - Data fetching and duration calculation hook
- `src/components/time-tracking/ActivityLogModal.tsx` - Main modal container
- `src/components/time-tracking/ActivityLogList.tsx` - Chronological entry list

**Files to Modify:**
- `src/components/time-tracking/ViewActivityButton.tsx` - Add modal state and rendering

**Existing Files to Use:**
- `src/lib/electronBridge.ts` - `activity.getLog(timeEntryId)` method (Story 4.1)
- `src/lib/platform.ts` - `isElectron()` guard
- `@radix-ui/react-dialog` - Modal component (already installed)
- `date-fns` - Date/time formatting (already installed)
- `lucide-react` - Icons (X, Clock, etc.)

### Learnings from Previous Story

**From Story 4-1-activity-log-retrieval (Status: done)**

- **Key Discovery**: Story 4.1 functionality was already implemented in Story 3.3
- **Implementation Location**: `electronBridge.activity.getLog()` at `src/lib/electronBridge.ts:131-165`
- **Architecture Note**: Per ADR-008, IndexedDB runs in renderer; main process IPC handler is stub; bridge queries Dexie directly
- **Index Performance**: Compound index `[timeEntryId+timestamp]` provides O(log n) lookup with automatic timestamp sorting
- **Test Baseline**: 609 tests passing - maintain this baseline
- **Performance Logging**: Dev-mode timing logs already added for query monitoring

**Files Available from Story 4.1:**
- `src/lib/electronBridge.ts` - Ready-to-use `activity.getLog()` method
- `src/lib/activityStore.ts` - `getActivityEntriesByTimeEntryId()` with indexed query
- `src/lib/db.ts` - `activityLogs` table with `[timeEntryId+timestamp]` index

[Source: notes/sprint-artifacts/4-1-activity-log-retrieval.md#Dev-Agent-Record]

### Implementation Approach

1. **Create useActivityLog hook first** - This handles data fetching and duration calculation
2. **Build components bottom-up** - ActivityLogList → ActivityLogModal → ViewActivityButton integration
3. **Reuse existing patterns** - Match TimeInsightsModal styling, use Radix Dialog
4. **Duration calculation in hook** - Keeps rendering logic simple

**Duration Calculation Pattern:**
```typescript
function calculateDurations(
  entries: ActivityEntry[],
  sessionEndTime: string
): ActivityEntryWithDuration[] {
  return entries.map((entry, index) => {
    const nextTimestamp = index < entries.length - 1
      ? entries[index + 1].timestamp
      : sessionEndTime;

    const durationMs = new Date(nextTimestamp).getTime() - new Date(entry.timestamp).getTime();

    return {
      ...entry,
      durationMs,
      durationFormatted: formatDuration(durationMs),
    };
  });
}
```

**Time Formatting:**
```typescript
// "9:00:15 AM" format
format(new Date(entry.timestamp), 'h:mm:ss a');

// "5m 32s" or "1h 15m" format
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
```

### References

- [Source: notes/architecture-electron-migration.md#Implementation-Patterns]
- [Source: notes/epics-electron-migration.md#Story-4.2]
- [Source: notes/sprint-artifacts/tech-spec-epic-4-electron.md#AC2]
- [Source: notes/sprint-artifacts/4-1-activity-log-retrieval.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- [notes/sprint-artifacts/4-2-activity-log-modal-ui.context.xml](./4-2-activity-log-modal-ui.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation followed bottom-up approach: hook → list → modal → button integration
- Duration calculation handled in useActivityLog hook to keep components simple
- Modal styling matched TimeInsightsModal patterns for consistency
- Updated InsightRow to pass additional props (taskName, startTime, endTime) to ViewActivityButton

### Completion Notes List

- ✅ Test Gate PASSED by Vishal (2026-01-20)
- Created `useActivityLog` hook with duration calculation for consecutive entries
- Created `ActivityLogModal` with Radix Dialog, loading state, and error handling
- Created `ActivityLogList` with chronological display and empty state
- Updated `ViewActivityButton` to manage modal state and render ActivityLogModal
- Updated `InsightRow` to pass required props to ViewActivityButton
- Updated existing ViewActivityButton tests for new props
- Added 18 new tests across useActivityLog.test.ts and ActivityLogList.test.tsx
- All 627 tests passing (up from 609 baseline)

### File List

**Created:**
- today-app/src/hooks/useActivityLog.ts
- today-app/src/hooks/useActivityLog.test.ts
- today-app/src/components/time-tracking/ActivityLogModal.tsx
- today-app/src/components/time-tracking/ActivityLogList.tsx
- today-app/src/components/time-tracking/ActivityLogList.test.tsx

**Modified:**
- today-app/src/components/time-tracking/ViewActivityButton.tsx
- today-app/src/components/time-tracking/ViewActivityButton.test.tsx
- today-app/src/components/time-tracking/InsightRow.tsx

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-19 | Story drafted from epics, tech spec, and architecture | SM Agent |
| 2026-01-19 | All tasks implemented, 627 tests passing | Dev Agent |
| 2026-01-20 | Test Gate PASSED, story moved to review | Dev Agent |
