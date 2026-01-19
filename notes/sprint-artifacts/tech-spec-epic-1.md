# Epic Technical Specification: Time Tracking Foundation

Date: 2026-01-10
Author: Vishal
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the core time tracking foundation for the Today app—a hidden power-user feature activated via `Cmd+Shift+T` keyboard shortcut. This epic delivers the complete start-to-stop tracking workflow: users can open a compact modal, select from today's tasks, start tracking time in the background, and stop tracking to save time entries locally. The timer persists across browser refresh via IndexedDB, enabling crash-resistant tracking even offline.

This foundation directly supports the PRD's vision of "invisible power at your fingertips"—enabling productivity enthusiasts and freelancers to track billable hours with minimal friction (<2 seconds to start/stop) while preserving the app's minimalist aesthetic. No visible UI hints exist for non-users, maintaining the "easter egg" philosophy.

## Objectives and Scope

### In Scope (Epic 1)

- **FR1**: Global keyboard shortcut registration (`Cmd+Shift+T` / `Ctrl+Shift+T`)
- **FR2-3**: Task selection dropdown with today's tasks and tracking initiation
- **FR4-6**: Background timer tracking and stop functionality
- **FR7-8**: Time entry persistence and modal state reset
- **FR9-12**: IndexedDB storage with referential integrity and task name snapshots
- **FR44**: Active session persistence across browser refresh
- **FR46**: Offline functionality (local-first storage)
- Double-tap detection infrastructure for insights modal (FR13 prep)

### Out of Scope (Epic 1)

- Insights view and filtering (Epic 2 & 3)
- Supabase sync and cross-device access (Epic 4)
- Export/backup functionality (Epic 4)
- Manual time entry editing (Growth phase)
- Billable/non-billable marking (Growth phase)
- Visual trend charts and analytics (Growth phase)

## System Architecture Alignment

### Architecture Reference

This epic aligns with the decisions documented in `notes/architecture-time-tracking.md`:

| Decision | Epic 1 Implementation |
|----------|----------------------|
| ADR-TT-001: IndexedDB for Active Session | `timeTrackingDb.ts` stores `activeSession` immediately on tracking start |
| ADR-TT-003: Native Keyboard Shortcut Hook | `useTimeTrackingHotkeys.ts` with `document.addEventListener('keydown')` |
| ADR-TT-005: Derived Timer Display | Elapsed time calculated as `Date.now() - startTime` on each render |

### Components Introduced

| Component | Purpose | Location |
|-----------|---------|----------|
| `TimeTrackingModal.tsx` | Main tracking modal (idle/active states) | `src/components/time-tracking/` |
| `TimeDisplay.tsx` | Live elapsed time counter | `src/components/time-tracking/` |
| `TaskSelector.tsx` | Dropdown for today's tasks | `src/components/time-tracking/` |
| `useTimeTracking.ts` | Active session management | `src/hooks/` |
| `useTimeTrackingHotkeys.ts` | Global keyboard shortcuts | `src/hooks/` |
| `timeTrackingDb.ts` | IndexedDB operations | `src/lib/` |
| `timeTracking.ts` | TypeScript interfaces | `src/types/` |

### Integration Points

- **App.tsx**: Registers global hotkeys via `useTimeTrackingHotkeys`
- **useTasks hook**: Provides today's tasks for dropdown population
- **Existing Radix Dialog patterns**: Modal UI consistency with DeferModal, LinkEmailModal

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **useTimeTrackingHotkeys** | Global keyboard shortcut detection | KeyboardEvent | `onOpenTracking()`, `onOpenInsights()` callbacks |
| **useTimeTracking** | Active session state management | Task selection, start/stop actions | `activeSession`, `isTracking`, `startTracking()`, `stopTracking()` |
| **timeTrackingDb** | IndexedDB persistence layer | ActiveSession, TimeEntry objects | Promise<void>, Promise<ActiveSession \| null> |
| **TimeTrackingModal** | UI orchestration (idle/active states) | Modal open state, active session | User interactions, visual feedback |
| **TaskSelector** | Task dropdown with filtering | Today's tasks array | Selected task ID and name |
| **TimeDisplay** | Live elapsed time rendering | Start time ISO string | Formatted duration string |

**Module Interactions:**

```
App.tsx
  └── useTimeTrackingHotkeys (registers Cmd+Shift+T listener)
        ├── onOpenTracking() → opens TimeTrackingModal
        └── onOpenInsights() → (Epic 2) opens TimeInsightsModal

TimeTrackingModal
  ├── useTimeTracking (session state)
  │     └── timeTrackingDb (IndexedDB persistence)
  ├── TaskSelector (task selection)
  │     └── useTasks (existing hook for today's tasks)
  └── TimeDisplay (elapsed time when active)
```

### Data Models and Contracts

**TypeScript Interfaces (from Architecture spec):**

```typescript
// src/types/timeTracking.ts

export interface TimeEntry {
  id: string;              // UUID via crypto.randomUUID()
  user_id: string;         // References auth.users (for future sync)
  task_id: string | null;  // References tasks (null if task deleted)
  task_name: string;       // Snapshot of task name at creation
  start_time: string;      // ISO 8601 timestamp
  end_time: string;        // ISO 8601 timestamp
  duration: number;        // Milliseconds
  date: string;            // YYYY-MM-DD for grouping/filtering
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}

export interface ActiveSession {
  taskId: string;
  taskName: string;
  startTime: string;       // ISO 8601 timestamp
}
```

**IndexedDB Schema:**

| Store Name | Key | Value Type | Purpose |
|------------|-----|------------|---------|
| `activeSession` | `'current'` (fixed) | `ActiveSession \| null` | Persists active tracking session |
| `timeEntries` | `id` (UUID) | `TimeEntry` | Stores completed time entries |

**Dexie Schema Definition:**

```typescript
// Extend existing db.ts or create timeTrackingDb.ts
db.version(X).stores({
  // ... existing stores
  activeSession: '', // No index needed, single key
  timeEntries: 'id, date, task_id, [user_id+date]'
});
```

### APIs and Interfaces

**Hook: useTimeTracking**

```typescript
interface UseTimeTrackingReturn {
  activeSession: ActiveSession | null;
  isTracking: boolean;
  isLoading: boolean;
  startTracking: (taskId: string, taskName: string) => Promise<void>;
  stopTracking: () => Promise<TimeEntry | null>;
}

function useTimeTracking(): UseTimeTrackingReturn;
```

**Hook: useTimeTrackingHotkeys**

```typescript
function useTimeTrackingHotkeys(
  onOpenTracking: () => void,
  onOpenInsights: () => void
): void;
```

**IndexedDB Operations (timeTrackingDb.ts)**

```typescript
// Active session operations
async function saveActiveSession(session: ActiveSession): Promise<void>;
async function loadActiveSession(): Promise<ActiveSession | null>;
async function clearActiveSession(): Promise<void>;

// Time entry operations
async function saveTimeEntry(entry: TimeEntry): Promise<void>;
async function getTimeEntries(dateRange?: { start: string; end: string }): Promise<TimeEntry[]>;
```

**Utility Functions**

```typescript
// Duration formatting
function formatDuration(ms: number): string;      // "HH:MM:SS" or "MM:SS"
function formatDurationSummary(ms: number): string; // "Xh Ym"
```

### Workflows and Sequencing

**Flow 1: Start Tracking**

```
User presses Cmd+Shift+T
  │
  ▼
useTimeTrackingHotkeys detects keypress
  │
  ├── Check: Is this a double-tap? (within 300ms)
  │     ├── Yes → call onOpenInsights() (Epic 2)
  │     └── No → setTimeout 300ms, then call onOpenTracking()
  │
  ▼
TimeTrackingModal opens (idle state)
  │
  ├── Auto-focus TaskSelector
  ├── Load today's tasks via useTasks
  │
  ▼
User selects task from dropdown
  │
  ▼
User clicks "Track" or presses Enter
  │
  ▼
useTimeTracking.startTracking(taskId, taskName)
  │
  ├── Create ActiveSession: { taskId, taskName, startTime: now() }
  ├── saveActiveSession(session) → IndexedDB
  ├── Update React state
  │
  ▼
Modal closes automatically
Timer runs in background (no visible UI)
```

**Flow 2: Stop Tracking**

```
User presses Cmd+Shift+T (while tracking active)
  │
  ▼
TimeTrackingModal opens (active state)
  │
  ├── Display: "Currently tracking: [task name]"
  ├── Display: TimeDisplay showing live elapsed time
  ├── Display: "Stop" button
  │
  ▼
User clicks "Stop" or presses Enter
  │
  ▼
useTimeTracking.stopTracking()
  │
  ├── Calculate end_time = new Date().toISOString()
  ├── Calculate duration = endTime - startTime (ms)
  ├── Create TimeEntry object with all fields
  ├── saveTimeEntry(entry) → IndexedDB
  ├── clearActiveSession() → IndexedDB
  ├── Update React state: activeSession = null
  │
  ▼
Show success feedback: "✓ Saved: Xh Ym on [task name]"
  │
  ▼
After 1.5s, modal resets to idle state
```

**Flow 3: Session Restoration (App Load)**

```
App mounts
  │
  ▼
useTimeTracking hook initializes
  │
  ├── loadActiveSession() from IndexedDB
  │     ├── Session exists → setActiveSession(session)
  │     └── No session → setActiveSession(null)
  ├── setIsLoading(false)
  │
  ▼
App ready with restored tracking state
(If session exists, next Cmd+Shift+T shows active state)
```

## Non-Functional Requirements

### Performance

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **NFR1**: Modal open time | < 100ms | Lightweight modal, no network fetch on open | PRD NFR1 |
| **NFR2**: Timer updates | No UI jank | setInterval (1s) + derived calculation, not continuous state updates | PRD NFR2 |
| **NFR4**: Battery impact | Negligible | Timer calculation only runs when modal is open; no background intervals | PRD NFR4 |

**Implementation Notes:**
- Modal component should be code-split if needed, but given small size, likely unnecessary
- Timer display uses `useState` force-update pattern with derived elapsed time, avoiding drift
- IndexedDB writes are async and non-blocking

### Security

| NFR | Implementation | Source |
|-----|----------------|--------|
| **NFR5**: Local data security | Time data follows same storage model as tasks (IndexedDB) | PRD NFR5 |

**Implementation Notes:**
- No sensitive data beyond user's own time tracking
- `user_id` field prepared for future Supabase sync (Epic 4)
- No authentication required for local storage operations
- Same-origin policy protects IndexedDB data

### Reliability/Availability

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **NFR7**: Persist through backgrounding | Active session survives | IndexedDB save on tracking start (immediate persistence) | PRD NFR7, ADR-TT-001 |
| **NFR8**: No data loss | Zero loss on unexpected termination | Active session written to IndexedDB before modal closes | PRD NFR8 |
| **NFR9**: Timer accuracy | ±1 second over extended sessions | Derived from startTime (no accumulated drift) | PRD NFR9, ADR-TT-005 |

**Implementation Notes:**
- IndexedDB write happens synchronously with `startTracking()` call
- If IndexedDB write fails, show error toast and don't close modal
- Timer accuracy guaranteed by calculating from persisted `startTime`, not incrementing

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| Console logging | `[Today] TimeTracking: {action}` pattern | Development debugging |
| Error boundaries | Standard React error boundary wrapping modal | Catch render errors |
| Toast notifications | Success/error feedback via existing toast system | User visibility |

**Implementation Notes:**
- Use existing logging pattern: `if (import.meta.env.DEV) console.log('[Today] TimeTracking:', ...)`
- No external analytics or telemetry (privacy-first)
- Error states surface via toast, not silent failures

## Dependencies and Integrations

### External Dependencies (from package.json)

| Dependency | Version | Usage in Epic 1 |
|------------|---------|-----------------|
| `react` | ^19.2.0 | Component framework, hooks |
| `@radix-ui/react-dialog` | ^1.1.15 | Modal component (TimeTrackingModal) |
| `@radix-ui/react-select` | ^2.2.6 | TaskSelector dropdown |
| `date-fns` | ^4.1.0 | Date formatting, `format()` for YYYY-MM-DD |
| `dexie` | ^4.2.1 | IndexedDB wrapper for activeSession and timeEntries |
| `dexie-react-hooks` | ^4.2.0 | React integration for Dexie queries |
| `lucide-react` | ^0.562.0 | Icons (check mark for success feedback) |

### Internal Dependencies

| Module | Dependency | Integration Point |
|--------|------------|-------------------|
| `useTimeTracking` | Existing `useTasks` hook | Get today's tasks for TaskSelector dropdown |
| `TimeTrackingModal` | Existing toast system | Show success/error feedback |
| `timeTrackingDb` | Existing Dexie `db` instance | Extend schema with new stores |
| App.tsx | `useTimeTrackingHotkeys` | Register global hotkeys at app root |

### New Dependencies Required

**None** - Epic 1 uses only existing dependencies. No new packages needed.

### Integration Points with Existing Code

```
today-app/src/
├── App.tsx                    ← Add useTimeTrackingHotkeys + modal state
├── hooks/
│   ├── useTasks.ts            ← Consumed by TaskSelector (existing)
│   └── [NEW] useTimeTracking.ts
│   └── [NEW] useTimeTrackingHotkeys.ts
├── lib/
│   ├── db.ts                  ← Extend Dexie schema (existing)
│   └── [NEW] timeTrackingDb.ts
├── components/
│   └── [NEW] time-tracking/
│       ├── TimeTrackingModal.tsx
│       ├── TimeDisplay.tsx
│       └── TaskSelector.tsx
└── types/
    └── [NEW] timeTracking.ts
```

### Future Integration Points (Epic 4)

- **Supabase**: `time_entries` table with RLS (not implemented in Epic 1)
- **Sync Queue**: Existing sync queue pattern for offline-first sync (not implemented in Epic 1)
- **Export**: Time entries added to export data (not implemented in Epic 1)

## Acceptance Criteria (Authoritative)

### AC1: Global Keyboard Shortcut
- **AC1.1**: Pressing `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows) opens the Time Tracking modal from any view
- **AC1.2**: The shortcut is blocked from triggering browser default behavior (reopen closed tab)
- **AC1.3**: If modal is already open, pressing the shortcut closes it (toggle behavior)
- **AC1.4**: Shortcut works regardless of focus state (except when in text input fields)

### AC2: Task Selection
- **AC2.1**: Modal displays dropdown showing all tasks scheduled for today
- **AC2.2**: Dropdown auto-focuses when modal opens in idle state
- **AC2.3**: Tasks can be navigated with arrow keys and selected with Enter
- **AC2.4**: Type-ahead filtering works in the dropdown
- **AC2.5**: Empty state message "No tasks for today. Add a task first." displays when no tasks exist
- **AC2.6**: Track button is disabled when no task is selected or no tasks exist

### AC3: Start Tracking
- **AC3.1**: Clicking "Track" with a selected task starts background timer
- **AC3.2**: Modal closes immediately after tracking starts
- **AC3.3**: Active session is persisted to IndexedDB before modal closes
- **AC3.4**: Task name is snapshotted at tracking start (for deleted task handling)

### AC4: View Active Tracking
- **AC4.1**: When tracking is active, opening modal shows active state (not idle state)
- **AC4.2**: Active state displays: "Currently tracking:", task name, elapsed time, "Stop" button
- **AC4.3**: Elapsed time updates every second in format `HH:MM:SS` or `MM:SS` (if under 1 hour)
- **AC4.4**: Elapsed time is calculated from persisted startTime (no drift)

### AC5: Stop Tracking
- **AC5.1**: Clicking "Stop" stops the timer and saves a time entry
- **AC5.2**: Time entry includes: task_id, task_name, start_time, end_time, duration, date
- **AC5.3**: Success feedback "✓ Saved: Xh Ym on [task name]" displays for 1.5 seconds
- **AC5.4**: Modal resets to idle state after success feedback
- **AC5.5**: If tracked task was deleted, entry is saved with task_name snapshot and task_id = null

### AC6: Session Persistence
- **AC6.1**: Active tracking session persists across browser refresh
- **AC6.2**: On app reload, if active session exists, it is restored with correct elapsed time
- **AC6.3**: Time entries are stored in IndexedDB and persist offline
- **AC6.4**: Multiple entries can exist for the same task (separate sessions)

### AC7: Double-Tap Detection (Infrastructure for Epic 2)
- **AC7.1**: If second `T` keypress occurs within 300ms of `Cmd+Shift+T`, insights callback is triggered
- **AC7.2**: Single tap (no second T within 300ms) opens tracking modal

## Traceability Mapping

| AC | FR(s) | Spec Section | Component(s) | Test Approach |
|----|-------|--------------|--------------|---------------|
| AC1.1-1.4 | FR1 | Detailed Design: Workflows | `useTimeTrackingHotkeys`, App.tsx | Unit test hotkey detection; manual browser test |
| AC2.1-2.6 | FR2, FR10 | Detailed Design: Services | `TaskSelector`, `useTasks` | Integration test with mock tasks; empty state test |
| AC3.1-3.4 | FR3, FR4, FR9, FR11 | Detailed Design: Workflows | `useTimeTracking`, `timeTrackingDb` | Unit test startTracking; IndexedDB mock test |
| AC4.1-4.4 | FR5, NFR9 | Detailed Design: APIs | `TimeTrackingModal`, `TimeDisplay` | Component test with active session; timing test |
| AC5.1-5.5 | FR6, FR7, FR8, FR11, FR12 | Detailed Design: Workflows | `useTimeTracking`, `TimeTrackingModal` | Integration test stop flow; deleted task scenario |
| AC6.1-6.4 | FR9, FR44, FR46 | Detailed Design: Data Models | `timeTrackingDb`, `useTimeTracking` | IndexedDB persistence test; refresh simulation |
| AC7.1-7.2 | FR13 (prep) | Detailed Design: Workflows | `useTimeTrackingHotkeys` | Unit test double-tap timing logic |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | `Cmd+Shift+T` conflicts with browser "reopen tab" shortcut | High | Medium | Call `e.preventDefault()` immediately; fallback to `Cmd+Shift+K` if issues persist |
| R2 | Double-tap detection unreliable across different keyboards | Medium | Low | 300ms threshold is generous; fallback to `Cmd+Shift+I` for insights available |
| R3 | IndexedDB quota exceeded on devices with limited storage | Low | High | Time entries are small (~200 bytes each); would need years of data to hit limits |
| R4 | Timer drift over very long sessions (12+ hours) | Low | Low | Derived calculation from startTime prevents drift entirely per ADR-TT-005 |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A1 | User's browser supports IndexedDB | Required for existing app functionality; no additional validation needed |
| A2 | Existing `useTasks` hook provides today's tasks correctly | Review existing hook implementation during Story 1.2 |
| A3 | Dexie schema can be extended without breaking existing data | Use new version number; Dexie handles migrations automatically |
| A4 | Users understand keyboard shortcut without onboarding | Power-user feature; discovery is intentionally low-friction |

### Open Questions

| ID | Question | Owner | Resolution Target |
|----|----------|-------|-------------------|
| Q1 | Should hotkey work when user is typing in a text field? | Dev | Resolve during Story 1.1 implementation - likely skip when activeElement is input/textarea |
| Q2 | What happens if user starts tracking, then clears browser data? | Dev | Session lost - acceptable for MVP; document in Story 1.3 edge cases |
| Q3 | Should we show any indicator that tracking is active in main UI? | UX | No per PRD "hidden feature" philosophy - revisit in Growth phase |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Unit Tests** | Hooks, utilities, formatting | Vitest | 90% for hooks and utilities |
| **Component Tests** | Modal states, TimeDisplay, TaskSelector | Vitest + Testing Library | Key states and interactions |
| **Integration Tests** | Full tracking flow with IndexedDB | Vitest + fake-indexeddb | Start → Stop → Persistence |
| **Manual Tests** | Keyboard shortcuts, browser refresh | Manual checklist | All acceptance criteria |

### Test Scenarios by Story

**Story 1.1: Keyboard Shortcut**
- Unit: `useTimeTrackingHotkeys` detects Cmd+Shift+T correctly
- Unit: Double-tap detection with 300ms threshold
- Manual: Shortcut works in Chrome, Safari, Firefox
- Manual: Shortcut blocked when typing in input field

**Story 1.2: Task Selection**
- Component: TaskSelector renders today's tasks
- Component: Empty state when no tasks
- Component: Keyboard navigation (arrow keys, Enter)
- Integration: TaskSelector uses real useTasks hook

**Story 1.3: Start Tracking**
- Unit: `useTimeTracking.startTracking()` creates session
- Integration: Session persisted to IndexedDB (fake-indexeddb)
- Integration: Session survives hook re-mount

**Story 1.4: Stop Tracking**
- Unit: `useTimeTracking.stopTracking()` creates TimeEntry
- Unit: Duration calculation accuracy
- Integration: Entry persisted to IndexedDB
- Component: Success feedback displays and auto-dismisses
- Component: Modal resets to idle after feedback

### Edge Case Tests

| Scenario | Test Type | Expected Behavior |
|----------|-----------|-------------------|
| No tasks for today | Component | Empty state message, disabled button |
| Task deleted during tracking | Integration | Entry saved with task_name, task_id = null |
| Browser refresh during tracking | Integration | Session restored, elapsed time continues |
| Very long session (1+ hour) | Unit | Format switches to HH:MM:SS |
| IndexedDB write failure | Integration | Error toast, modal stays open |
| Multiple tracking sessions same task | Integration | Separate entries created |

### Test Infrastructure

- **fake-indexeddb**: Already in devDependencies for IndexedDB mocking
- **vitest**: Test runner with React Testing Library
- **jsdom**: DOM environment for component tests

### Acceptance Criteria Coverage

All 19 acceptance criteria (AC1.1 through AC7.2) have mapped test approaches in the Traceability Mapping table.
