# Epic Technical Specification: Time Insights Dashboard

Date: 2026-01-10
Author: Vishal
Epic ID: 2 (Time Tracking Feature)
Status: Draft

---

## Overview

Epic 2 delivers the Time Insights Dashboard for the Today app's Time Tracking feature—a hidden power-user capability to visualize where time has been spent. Building on Epic 1's tracking foundation (start/stop via `Cmd+Shift+T`), this epic enables users to access insights via `Cmd+Shift+T T` (double-tap), seeing their total time tracked today, weekly averages, task-by-task breakdowns, and a chronological list of recent time entries.

This dashboard directly supports the PRD's vision of helping users "discover patterns invisible to conscious perception" and providing freelancers with "accurate time reports for client billing." The insights modal maintains the hidden feature philosophy—no menu items or visible UI for non-users—while delivering scannable, actionable data for power users who seek to understand and optimize their time.

## Objectives and Scope

### In Scope (Epic 2)

- **FR13**: Open insights view via `Cmd+Shift+T T` keyboard shortcut (double-tap detection)
- **FR14**: View total time tracked today
- **FR15**: View time breakdown by individual tasks for today
- **FR16**: View total time tracked for the current week
- **FR17**: View daily totals for the current week
- **FR18**: View chronological list of recent time entries
- **FR19**: Close insights modal and return to main app
- Insights modal UI with summary cards, breakdown section, and entries list
- Empty states for no time tracked scenarios

### Out of Scope (Epic 2)

- Filtering by date range, task, or category (Epic 3)
- Quick date filter bar and custom date picker (Epic 3)
- Filter chips and filter dropdowns (Epic 3)
- Supabase sync and cross-device access (Epic 4)
- Export/backup functionality (Epic 4)
- Trend charts and visualizations (Growth phase)
- Billable/non-billable marking (Growth phase)
- Manual time entry editing (Growth phase)

## System Architecture Alignment

### Architecture Reference

This epic aligns with the decisions documented in `notes/architecture-time-tracking.md`:

| Decision | Epic 2 Implementation |
|----------|----------------------|
| ADR-TT-003: Native Keyboard Shortcut Hook | Extends `useTimeTrackingHotkeys.ts` double-tap detection (300ms threshold) |
| ADR-TT-004: Client-Side Insights Aggregation | `useTimeInsights.ts` fetches entries once, aggregates with `useMemo` |
| ADR-TT-005: Derived Timer Display | Reuses `formatDurationSummary()` utility for consistent time formatting |

### Components Introduced

| Component | Purpose | Location |
|-----------|---------|----------|
| `TimeInsightsModal.tsx` | Main insights modal with summary and lists | `src/components/time-tracking/` |
| `InsightCard.tsx` | Summary metric card (TODAY, AVG/DAY) | `src/components/time-tracking/` |
| `InsightRow.tsx` | Time entry list item | `src/components/time-tracking/` |
| `useTimeInsights.ts` | Aggregation calculations for insights data | `src/hooks/` |

### Integration Points

- **useTimeTrackingHotkeys**: Already implements double-tap detection from Epic 1; now calls `onOpenInsights` callback
- **useTimeTracking**: Provides time entries from IndexedDB for aggregation
- **timeTrackingDb**: Existing IndexedDB operations for querying time entries
- **Existing Radix Dialog patterns**: Modal UI consistency with TimeTrackingModal, DeferModal

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **useTimeInsights** | Aggregates time entries into summary metrics | `TimeEntry[]` from IndexedDB | `TimeInsights` object with totals, breakdowns, entries |
| **TimeInsightsModal** | UI orchestration for insights display | Modal open state, insights data | Rendered summary cards, breakdown list, entries list |
| **InsightCard** | Displays single summary metric | Label, value, sublabel | Card UI element |
| **InsightRow** | Displays single time entry | TimeEntry object | Row with timestamp, task, duration |

**Module Interactions:**

```
App.tsx
  └── useTimeTrackingHotkeys (already registered from Epic 1)
        ├── onOpenTracking() → opens TimeTrackingModal (Epic 1)
        └── onOpenInsights() → opens TimeInsightsModal (Epic 2)

TimeInsightsModal
  ├── useTimeInsights (aggregation hook)
  │     └── timeTrackingDb.getTimeEntries() (IndexedDB query)
  ├── InsightCard × 2 (TODAY total, AVG/DAY)
  └── InsightRow × N (recent entries list)
```

### Data Models and Contracts

**TypeScript Interfaces (extending Epic 1 types):**

```typescript
// src/types/timeTracking.ts (additions for Epic 2)

export interface TimeInsights {
  totalToday: number;      // Milliseconds
  totalWeek: number;       // Milliseconds
  avgPerDay: number;       // Milliseconds (totalWeek ÷ days with entries)
  byTask: Array<{
    taskId: string | null;
    taskName: string;
    duration: number;      // Milliseconds
  }>;
  byDate: Array<{
    date: string;          // YYYY-MM-DD
    duration: number;      // Milliseconds
  }>;
  recentEntries: TimeEntry[]; // Limited to 20 most recent
}
```

**Data Flow:**

```
IndexedDB (timeEntries store)
    ↓
timeTrackingDb.getTimeEntries()
    ↓
useTimeInsights hook
    ├── Filter entries by date range
    ├── Aggregate totals (today, week)
    ├── Group by task for breakdown
    ├── Sort entries by start_time desc
    └── Return TimeInsights object
    ↓
TimeInsightsModal
    ├── InsightCard (TODAY: Xh Ym)
    ├── InsightCard (AVG/DAY: Xh Ym)
    ├── Breakdown section (task → duration)
    └── Recent entries section (entry rows)
```

### APIs and Interfaces

**Hook: useTimeInsights**

```typescript
interface UseTimeInsightsReturn {
  insights: TimeInsights | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useTimeInsights(): UseTimeInsightsReturn;
```

**IndexedDB Operations (additions to timeTrackingDb.ts)**

```typescript
// Query time entries with optional date filtering
async function getTimeEntries(options?: {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  limit?: number;
}): Promise<TimeEntry[]>;
```

**Component Props Interfaces:**

```typescript
// InsightCard.tsx
export interface InsightCardProps {
  label: string;       // e.g., "TODAY"
  value: string;       // e.g., "3h 42m"
  sublabel: string;    // e.g., "tracked"
}

// InsightRow.tsx
export interface InsightRowProps {
  entry: TimeEntry;
}

// TimeInsightsModal.tsx
export interface TimeInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Utility Functions (additions to existing)**

```typescript
// Relative timestamp formatting
function formatRelativeTimestamp(isoString: string): string;
// Returns: "Today 2:30pm", "Yesterday 11:00am", "Mon 9:15am"
```

### Workflows and Sequencing

**Flow 1: Open Insights Modal (Double-Tap)**

```
User presses Cmd+Shift+T
  │
  ▼
useTimeTrackingHotkeys detects keypress
  │
  ├── Store lastTriggerRef.current = Date.now()
  │
  ▼
User presses T again (within 300ms, still holding Cmd+Shift)
  │
  ├── Calculate: now - lastTriggerRef.current < 300ms?
  │     └── Yes → Double-tap detected!
  │
  ▼
Call onOpenInsights() callback
  │
  ▼
TimeInsightsModal opens
  │
  ├── useTimeInsights hook loads data
  │     ├── timeTrackingDb.getTimeEntries() from IndexedDB
  │     ├── Calculate aggregations via useMemo
  │     └── Return TimeInsights object
  │
  ▼
Modal renders:
  ├── Header: "Time Insights" + close button
  ├── InsightCard: TODAY total
  ├── InsightCard: AVG/DAY this week
  ├── BREAKDOWN section: sorted by duration desc
  └── RECENT ENTRIES section: sorted by time desc
```

**Flow 2: Close Insights Modal**

```
User presses Escape OR clicks X button OR clicks outside modal
  │
  ▼
onClose callback fires
  │
  ▼
TimeInsightsModal unmounts
  │
  ▼
User returns to main app
```

**Flow 3: Data Aggregation (useTimeInsights)**

```
Hook mounts
  │
  ▼
getTimeEntries() fetches all entries from IndexedDB
  │
  ▼
useMemo calculates insights:
  │
  ├── Filter for today: entry.date === format(new Date(), 'yyyy-MM-dd')
  │     └── Sum durations → totalToday
  │
  ├── Filter for this week: entry.date >= startOfWeek && entry.date <= today
  │     ├── Sum durations → totalWeek
  │     ├── Count distinct dates with entries → daysWithEntries
  │     └── totalWeek / daysWithEntries → avgPerDay
  │
  ├── Group today's entries by task_id:
  │     ├── Aggregate duration per task
  │     └── Sort by duration desc → byTask[]
  │
  ├── Group week's entries by date:
  │     └── Aggregate duration per date → byDate[]
  │
  └── Sort all entries by start_time desc:
        └── Take first 20 → recentEntries[]
  │
  ▼
Return { insights, isLoading: false, error: null }
```

## Non-Functional Requirements

### Performance

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **NFR3**: Insights calculations | < 500ms for up to 1 year of data | Client-side aggregation with useMemo; no network fetch | PRD NFR3 |
| Modal open time | < 100ms | Lightweight modal, data from local IndexedDB | PRD NFR1 (extended) |
| Re-render performance | Imperceptible | useMemo prevents recalculation unless entries change | Architecture ADR-TT-004 |

**Implementation Notes:**
- IndexedDB queries are fast for expected data volumes (< 1000 entries/year)
- useMemo dependencies: `[timeEntries]` - recalculates only when entries change
- No network requests; all data local
- Limit recent entries to 20 to keep render lightweight

**Calculation Complexity:**
- Total today: O(n) single pass filter
- Total week: O(n) single pass filter
- By task grouping: O(n) with Map aggregation
- By date grouping: O(n) with Map aggregation
- Overall: O(n) where n = number of time entries

### Security

| NFR | Implementation | Source |
|-----|----------------|--------|
| **NFR5**: Local data security | Insights read from same IndexedDB as tracking; same-origin policy protection | PRD NFR5 |

**Implementation Notes:**
- No new security surface - reads from existing IndexedDB
- No sensitive data exposed in insights display
- No network requests; no data leakage risk

### Reliability/Availability

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| Data consistency | Insights reflect current IndexedDB state | Hook refetches on mount; no stale data | Architecture patterns |
| Error handling | Graceful degradation | If IndexedDB read fails, show error state instead of crash | Best practices |
| Offline support | Full functionality | All data local; no network required | FR46 (Epic 1) |

**Implementation Notes:**
- useTimeInsights returns error state if IndexedDB query fails
- Empty state displays if no entries exist (not an error)
- Modal still opens even if data load fails (shows error message)

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| Console logging | `[Today] TimeInsights: loaded {count} entries` | Development debugging |
| Error logging | `[Today] TimeInsights: error loading entries` + error details | Error visibility |
| Performance timing | Optional: `console.time('insights-calc')` in dev | Performance monitoring |

**Implementation Notes:**
- Use existing logging pattern: `if (import.meta.env.DEV) console.log(...)`
- No external analytics or telemetry
- Error states surface via UI, not silent failures

## Dependencies and Integrations

### External Dependencies (from package.json)

| Dependency | Version | Usage in Epic 2 |
|------------|---------|-----------------|
| `react` | ^19.2.0 | Component framework, hooks, useMemo |
| `@radix-ui/react-dialog` | ^1.1.15 | TimeInsightsModal component |
| `date-fns` | ^4.1.0 | `startOfWeek`, `format`, `isToday`, `isYesterday`, `parseISO` |
| `dexie` | ^4.2.1 | IndexedDB queries for time entries |
| `dexie-react-hooks` | ^4.2.0 | React integration for Dexie queries |
| `lucide-react` | ^0.562.0 | Icons (X for close button) |

### Internal Dependencies

| Module | Dependency | Integration Point |
|--------|------------|-------------------|
| `TimeInsightsModal` | `useTimeInsights` hook | Gets aggregated data for display |
| `useTimeInsights` | `timeTrackingDb.getTimeEntries()` | Queries IndexedDB for time entries |
| `useTimeInsights` | Existing utility functions | `formatDurationSummary()` for display |
| App.tsx | `useTimeTrackingHotkeys` | Already registered; calls `onOpenInsights` callback |

### New Dependencies Required

**None** - Epic 2 uses only existing dependencies. No new packages needed.

### Integration with Epic 1 Components

```
today-app/src/
├── App.tsx                              ← Add TimeInsightsModal + open state
├── hooks/
│   ├── useTimeTracking.ts               ← Existing (Epic 1)
│   ├── useTimeTrackingHotkeys.ts        ← Existing; already has onOpenInsights callback
│   └── [NEW] useTimeInsights.ts         ← Aggregation hook
├── lib/
│   ├── timeTrackingDb.ts                ← Add getTimeEntries() function
│   └── [NEW] timeFormatters.ts          ← formatRelativeTimestamp utility
├── components/
│   └── time-tracking/
│       ├── TimeTrackingModal.tsx        ← Existing (Epic 1)
│       ├── TimeDisplay.tsx              ← Existing (Epic 1)
│       ├── TaskSelector.tsx             ← Existing (Epic 1)
│       ├── [NEW] TimeInsightsModal.tsx
│       ├── [NEW] InsightCard.tsx
│       └── [NEW] InsightRow.tsx
└── types/
    └── timeTracking.ts                  ← Add TimeInsights interface
```

## Acceptance Criteria (Authoritative)

### AC1: Double-Tap Hotkey Opens Insights

- **AC1.1**: Pressing `Cmd+Shift+T` and then `T` again within 300ms (while still holding Cmd+Shift) opens the Insights modal instead of the Tracking modal
- **AC1.2**: If only single `Cmd+Shift+T` is pressed (no second T within 300ms), the Tracking modal opens (existing Epic 1 behavior unchanged)
- **AC1.3**: If Insights modal is already open, pressing `Cmd+Shift+T T` again closes it (toggle behavior)
- **AC1.4**: Double-tap detection works on both Mac (Cmd) and Windows (Ctrl)

### AC2: Insights Modal Structure

- **AC2.1**: Modal displays with title "Time Insights" and close button (X)
- **AC2.2**: Modal uses 420px width on desktop, full-width with padding on mobile (per UX spec)
- **AC2.3**: Modal content is scrollable if it exceeds 80vh height
- **AC2.4**: Modal can be closed via Escape key, X button, or clicking outside
- **AC2.5**: Focus is trapped within the modal while open (accessibility)

### AC3: Summary Cards Display

- **AC3.1**: "TODAY" card shows total time tracked today in "Xh Ym" format (e.g., "3h 42m")
- **AC3.2**: "TODAY" card shows "0h 0m" when no time tracked today
- **AC3.3**: "TODAY" card displays "tracked" as sublabel
- **AC3.4**: "AVG / DAY" card shows average daily time this week in "Xh Ym" format
- **AC3.5**: "AVG / DAY" card calculation: totalWeek ÷ (number of days with tracked time this week)
- **AC3.6**: "AVG / DAY" card shows "0h 0m" when no time tracked this week
- **AC3.7**: "AVG / DAY" card displays "this week" as sublabel

### AC4: Task Breakdown Section

- **AC4.1**: "BREAKDOWN" section header shows task count in parentheses: "BREAKDOWN (X tasks)"
- **AC4.2**: Each task row displays: task name (left) and duration (right, "Xh Ym" format)
- **AC4.3**: Tasks are sorted by duration descending (most time first)
- **AC4.4**: If task was deleted, the snapshotted task_name is still displayed
- **AC4.5**: Breakdown shows only today's entries (default, pre-filtering scope)
- **AC4.6**: Long task names are truncated with ellipsis

### AC5: Recent Entries Section

- **AC5.1**: "RECENT ENTRIES" section header shows entry count in parentheses: "RECENT ENTRIES (X entries)"
- **AC5.2**: Each entry row displays: relative timestamp, task name, duration
- **AC5.3**: Relative timestamps format: "Today 2:30pm", "Yesterday 11:00am", "Mon 9:15am"
- **AC5.4**: Entries are sorted by start_time descending (newest first)
- **AC5.5**: Maximum 20 entries displayed (reasonable limit for MVP)
- **AC5.6**: Entries have subtle hover state (light background highlight)
- **AC5.7**: Duration format: "Xh Ym" or just "Xm" if hours = 0 (e.g., "42m")

### AC6: Empty States

- **AC6.1**: When no time tracked today, show: "No time tracked today. Press Cmd+Shift+T to start."
- **AC6.2**: When no time tracked ever, show: "Start tracking time to see insights here."
- **AC6.3**: Empty state text uses muted-foreground color and is centered

### AC7: Accessibility

- **AC7.1**: All modal interactions accessible via keyboard (Tab navigation, Enter/Space activation)
- **AC7.2**: Screen reader announces: "Time insights dialog opened" on open
- **AC7.3**: Screen reader announces: "Time insights dialog closed" on close
- **AC7.4**: Sufficient color contrast for all text (meets WCAG AA)
- **AC7.5**: Focus returns to trigger element after modal closes

## Traceability Mapping

| AC | FR(s) | Spec Section | Component(s) | Test Approach |
|----|-------|--------------|--------------|---------------|
| AC1.1-1.4 | FR13 | Detailed Design: Workflows | `useTimeTrackingHotkeys` | Unit test double-tap timing; manual browser test |
| AC2.1-2.5 | FR13, FR19 | UX Spec: Modal Sizing | `TimeInsightsModal` | Component test; accessibility audit |
| AC3.1-3.7 | FR14, FR16 | Detailed Design: Data Models | `InsightCard`, `useTimeInsights` | Unit test calculations; visual verification |
| AC4.1-4.6 | FR15 | Detailed Design: APIs | `TimeInsightsModal`, `useTimeInsights` | Unit test aggregation; visual verification |
| AC5.1-5.7 | FR18 | Detailed Design: APIs | `InsightRow`, `useTimeInsights` | Unit test sorting; visual verification |
| AC6.1-6.3 | FR14-FR18 | UX Spec: Empty States | `TimeInsightsModal` | Empty state test with no entries |
| AC7.1-7.5 | NFR10-NFR11 | UX Spec: Accessibility | All components | Manual keyboard test; screen reader test |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Double-tap detection unreliable across different keyboards/input methods | Medium | Low | 300ms threshold is generous; fallback to `Cmd+Shift+I` documented if issues persist |
| R2 | Performance degradation with many entries (1000+) | Low | Medium | useMemo caching; limit recent entries to 20; can add pagination later |
| R3 | IndexedDB query fails silently | Low | High | Error state handling in useTimeInsights; toast notification on error |
| R4 | Week calculation edge cases (week starts Sunday vs Monday) | Medium | Low | Use date-fns `startOfWeek` with `{ weekStartsOn: 0 }` for consistency |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A1 | Epic 1 is complete: IndexedDB stores exist, useTimeTrackingHotkeys hook works | Verify time entries can be created via Epic 1 flow |
| A2 | `formatDurationSummary()` utility exists from Epic 1 | Verify function in `timeFormatters.ts` or `timeTrackingDb.ts` |
| A3 | Users have < 1000 time entries typically | Based on PRD scope; can optimize later if needed |
| A4 | Week = Sunday to Saturday for aggregation | Standard US week; configurable later if needed |

### Open Questions

| ID | Question | Owner | Resolution Target |
|----|----------|-------|-------------------|
| Q1 | Should "AVG / DAY" include today (incomplete day) in calculation? | Dev | **Resolved**: Include today if entries exist; more intuitive for user |
| Q2 | What if user has entries but none for today specifically? | Dev | **Resolved**: Show "0h 0m" for TODAY, show data for BREAKDOWN/ENTRIES based on available entries |
| Q3 | Should breakdown section default to today or include all time? | UX | **Resolved**: Default to today per UX spec; Epic 3 adds date filtering |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Unit Tests** | `useTimeInsights` calculations, utility functions | Vitest | 90% for aggregation logic |
| **Component Tests** | Modal states, InsightCard, InsightRow | Vitest + Testing Library | Key states and interactions |
| **Integration Tests** | Full insights flow with IndexedDB mock | Vitest + fake-indexeddb | Open → Load → Display |
| **Manual Tests** | Double-tap hotkey, visual styling | Manual checklist | All acceptance criteria |

### Test Scenarios by Story

**Story 2.1: Insights Modal with Double-Tap Hotkey**
- Unit: Double-tap detection with 300ms threshold
- Unit: Single tap (> 300ms) opens tracking modal instead
- Manual: Shortcut works in Chrome, Safari, Firefox
- Manual: Toggle behavior (open → close → open)

**Story 2.2: Time Summary Cards**
- Unit: `useTimeInsights` calculates totalToday correctly
- Unit: `useTimeInsights` calculates avgPerDay correctly (handles 0 days)
- Unit: `formatDurationSummary()` formats milliseconds to "Xh Ym"
- Component: InsightCard renders label, value, sublabel

**Story 2.3: Recent Time Entries List**
- Unit: Entries sorted by start_time descending
- Unit: formatRelativeTimestamp produces correct output
- Unit: Limit to 20 entries enforced
- Component: InsightRow renders timestamp, task name, duration

### Edge Case Tests

| Scenario | Expected Behavior | Test Method |
|----------|-------------------|-------------|
| No time entries at all | Empty state: "Start tracking time..." | Component test |
| Entries exist but none today | TODAY shows "0h 0m"; BREAKDOWN empty; ENTRIES shows older entries | Component test |
| All entries for same task | BREAKDOWN shows single task row | Unit test |
| Very long session (12+ hours) | Duration formats correctly (e.g., "12h 34m") | Unit test |
| Entry with deleted task | Shows snapshotted task_name, not "Unknown" | Integration test |
| Exactly 20 entries | All displayed; no "show more" button | Component test |
| More than 20 entries | Only 20 most recent shown | Unit test |
| Week boundary (entries from previous week) | Not included in AVG/DAY calculation | Unit test |

### Test Infrastructure

- **fake-indexeddb**: Already in devDependencies for IndexedDB mocking
- **vitest**: Test runner with React Testing Library
- **jsdom**: DOM environment for component tests

### Acceptance Criteria Coverage

All 24 acceptance criteria (AC1.1 through AC7.5) have mapped test approaches in the Traceability Mapping table.
