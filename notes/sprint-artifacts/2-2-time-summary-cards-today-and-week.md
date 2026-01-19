# Story 2.2: Time Summary Cards (Today and Week)

Status: done

## Story

As a power user,
I want to see my total time tracked today and this week at a glance,
so that I can quickly understand my productivity level.

## Acceptance Criteria

1. When I open the Insights modal, I see two summary cards at the top: "TODAY" card showing total time tracked today (format: "Xh Ym") and "AVG / DAY" card showing average daily time this week (format: "Xh Ym")
2. When I have tracked 3h 42m today, the TODAY card displays "3h 42m" with "tracked" label below
3. When I have no time tracked today, the TODAY card displays "0h 0m" with "tracked" label
4. When I have tracked time on 3 days this week totaling 12h 36m, the AVG / DAY card displays "4h 12m" (12h 36m / 3 days) with "this week" label
5. Below the cards, I see a "BREAKDOWN" section showing time per task for today
6. Each task row in breakdown shows: task name (left) + duration (right, format "Xh Ym")
7. Tasks in breakdown are sorted by duration descending (most time first)
8. The BREAKDOWN section header shows task count: "BREAKDOWN (X tasks)"

## Frontend Test Gate

**Gate ID**: 2-2-TG1

### Prerequisites
- [ ] App running locally at http://localhost:5173
- [ ] User is logged in (any user)
- [ ] At least 3-5 time entries exist in IndexedDB spanning today and earlier this week
- [ ] Browser DevTools open for console verification

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open Insights modal with `Cmd+Shift+T T` double-tap | Anywhere in app | Insights modal opens |
| 2 | Verify TODAY card | Top-left card | Shows total time tracked today in "Xh Ym" format with "tracked" sublabel |
| 3 | Verify AVG / DAY card | Top-right card | Shows average daily time this week in "Xh Ym" format with "this week" sublabel |
| 4 | Scroll to BREAKDOWN section | Below summary cards | Section header shows "BREAKDOWN (X tasks)" with task count |
| 5 | Verify task rows in breakdown | BREAKDOWN section | Each row has task name (left) and duration (right) |
| 6 | Verify sorting | BREAKDOWN section | Tasks sorted by duration descending (most time first) |
| 7 | Track more time on a task, reopen insights | Insights modal | Totals and breakdown update to reflect new entry |
| 8 | Verify AVG calculation | AVG / DAY card | Average = total week time / days with tracked time this week |

### Success Criteria (What User Sees)
- [ ] TODAY card shows total time tracked today in "Xh Ym" format
- [ ] TODAY card shows "0h 0m" when no time tracked today
- [ ] TODAY card has "tracked" sublabel
- [ ] AVG / DAY card shows weekly average in "Xh Ym" format
- [ ] AVG / DAY card has "this week" sublabel
- [ ] BREAKDOWN section header shows "(X tasks)" count
- [ ] Task breakdown rows show task name and duration
- [ ] Tasks sorted by duration (highest first)
- [ ] Long task names truncate with ellipsis
- [ ] Data updates correctly after new time entries
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the summary card layout clear and scannable?
2. Does the AVG / DAY calculation feel intuitive?
3. Is the task breakdown sorted in a helpful way?
4. Any UX friction or unexpected behavior?

## Tasks / Subtasks

- [x] Task 1: Create useTimeInsights hook for data aggregation (AC: 1-4)
  - [x] Create `src/hooks/useTimeInsights.ts` with TypeScript interfaces
  - [x] Implement `getTimeEntries()` call from `timeTrackingDb.ts`
  - [x] Calculate `totalToday`: sum durations where `entry.date === today`
  - [x] Calculate `totalWeek`: sum durations where `entry.date >= startOfWeek && entry.date <= today`
  - [x] Calculate `avgPerDay`: `totalWeek / distinctDaysWithEntriesThisWeek`
  - [x] Handle edge case: avgPerDay = 0 when no entries this week
  - [x] Use `useMemo` for calculations to prevent recalculation on every render
  - [x] Export `TimeInsights` interface: `{ totalToday, totalWeek, avgPerDay, byTask, byDate, recentEntries }`
  - [x] Write unit tests with fake-indexeddb

- [x] Task 2: Implement byTask aggregation for breakdown (AC: 5-8)
  - [x] Group today's entries by `task_id`
  - [x] Aggregate duration per task (sum milliseconds)
  - [x] Sort by duration descending (most time first)
  - [x] Store result as `byTask: Array<{ taskId, taskName, duration }>`
  - [x] Handle null task_id (deleted tasks) using snapshotted `task_name`
  - [x] Write unit tests for grouping and sorting

- [x] Task 3: Create InsightCard component (AC: 1-4)
  - [x] Create `src/components/time-tracking/InsightCard.tsx`
  - [x] Props: `label: string`, `value: string`, `sublabel: string`
  - [x] Styling per UX spec: 8px border-radius, --shadow-sm, --surface-muted background
  - [x] Typography: label 14px weight 500, value 32px weight 600, sublabel 13px weight 400
  - [x] Use existing `formatDurationSummary(ms)` from `timeFormatters.ts`
  - [x] Write component tests

- [x] Task 4: Integrate summary cards into TimeInsightsModal (AC: 1-4)
  - [x] Replace placeholder TODAY card with InsightCard using real data
  - [x] Replace placeholder AVG / DAY card with InsightCard using real data
  - [x] Wire up `useTimeInsights` hook to get aggregated data
  - [x] Handle loading state (skeleton placeholder)
  - [x] Handle error state (show error message)
  - [x] Handle empty state: "No time tracked today" for TODAY, "No data this week" for AVG

- [x] Task 5: Create breakdown section UI (AC: 5-8)
  - [x] Add BREAKDOWN section below summary cards
  - [x] Section header: "BREAKDOWN (X tasks)" with task count
  - [x] Render list of task rows from `insights.byTask`
  - [x] Each row: task name (left, truncate with ellipsis) + duration (right, "Xh Ym")
  - [x] Use Tailwind for layout: `flex justify-between` for rows
  - [x] Style per UX spec section 2.3

- [x] Task 6: Handle edge cases and empty states (AC: 2, 3)
  - [x] TODAY = 0 when no entries today
  - [x] AVG / DAY = 0 when no entries this week
  - [x] Empty BREAKDOWN section: "No tasks tracked today"
  - [x] Entries with deleted tasks (task_id = null) still show in breakdown with task_name snapshot

- [x] Task 7: Write unit tests for useTimeInsights hook (AC: 1-8)
  - [x] Test totalToday calculation with sample entries
  - [x] Test totalWeek calculation across multiple days
  - [x] Test avgPerDay calculation (totalWeek / days with entries)
  - [x] Test avgPerDay when 0 days with entries (should be 0, not NaN)
  - [x] Test byTask grouping and sorting
  - [x] Test with entries spanning week boundary
  - [x] Test with deleted tasks (null task_id)
  - [x] Use fake-indexeddb for mocking

- [x] Task 8: Write component tests for InsightCard (AC: 1-4)
  - [x] Test renders label, value, sublabel correctly
  - [x] Test accessibility (ARIA labels)
  - [x] Test with long values (no overflow issues)

- [x] Task 9: Manual browser testing (AC: 1-8)
  - [x] Run through Frontend Test Gate checklist
  - [x] Test with various time entry combinations
  - [x] Verify calculations match expected values
  - [x] Check responsive layout on mobile

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From Architecture (ADR-TT-004 - Client-Side Insights Aggregation):**
- Fetch entries once, aggregate in JavaScript with useMemo
- Expected data volume is small (< 1000 entries/year)
- Client-side enables offline access
- useMemo prevents unnecessary recalculation

**From Architecture (Data Models):**
```typescript
export interface TimeInsights {
  totalToday: number;      // Milliseconds
  totalWeek: number;       // Milliseconds
  avgPerDay: number;       // Milliseconds (totalWeek / days with entries)
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

**From Tech Spec (NFR3):**
- Insights calculations must complete in < 500ms for up to 1 year of data
- Use useMemo caching to prevent recalculation unless entries change

**Week Calculation:**
- Use date-fns `startOfWeek(new Date(), { weekStartsOn: 0 })` for Sunday start
- Calculate distinct days with entries for avgPerDay denominator
- Include today in the week calculation

**Duration Formatting:**
- Use existing `formatDurationSummary(ms)` from `timeFormatters.ts`
- Format: "Xh Ym" or just "Xm" if hours = 0

### Project Structure Notes

**Files to Create:**
```
src/hooks/useTimeInsights.ts           # NEW: Aggregation hook
src/hooks/useTimeInsights.test.ts      # NEW: Unit tests
src/components/time-tracking/InsightCard.tsx     # NEW: Summary card component
src/components/time-tracking/InsightCard.test.tsx # NEW: Component tests
```

**Files to Modify:**
```
src/components/time-tracking/TimeInsightsModal.tsx  # Replace placeholders with real data
```

**Existing Files to REUSE (DO NOT recreate):**
- `src/lib/timeFormatters.ts` - Has `formatDurationSummary(ms)` utility
- `src/lib/timeTrackingDb.ts` - Has `getTimeEntries()` function
- `src/types/timeTracking.ts` - Has `TimeEntry` interface

### Learnings from Previous Story

**From Story 2-1-insights-modal-with-double-tap-hotkey (Status: done)**

- **New Files Created**:
  - `src/components/time-tracking/TimeInsightsModal.tsx` - Modal shell with 420px width, scrollable, placeholder content
  - `src/components/time-tracking/TimeInsightsModal.test.tsx` - 13 component tests

- **Modified Files**:
  - `src/App.tsx` - Has `isInsightsModalOpen` state, `handleOpenInsights` toggle, TimeInsightsModal render
  - `src/hooks/useTimeTrackingHotkeys.ts` - Already has complete double-tap detection

- **Completion Notes from 2.1**:
  - 144 tests passing (13 new tests for TimeInsightsModal)
  - Modal has placeholder content for TODAY, AVG/DAY cards and BREAKDOWN, RECENT ENTRIES sections
  - **This story replaces those placeholders with real data**
  - TimeInsightsModal uses Radix Dialog pattern

- **Integration Points for This Story**:
  - TimeInsightsModal already renders placeholder cards - replace with InsightCard components
  - Wire up new `useTimeInsights` hook to provide real data
  - `getTimeEntries()` from `timeTrackingDb.ts` available for querying

- **For Future Story (2.3 - Recent Entries List)**:
  - `recentEntries` array in TimeInsights will be used
  - InsightRow component will be created in Story 2.3

[Source: notes/sprint-artifacts/2-1-insights-modal-with-double-tap-hotkey.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Detailed Design - Services and Modules] - useTimeInsights hook design
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Data Models and Contracts] - TimeInsights interface
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Acceptance Criteria - AC3] - Summary cards AC
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Acceptance Criteria - AC4] - Task breakdown AC
- [Source: notes/epics-time-tracking.md#Story 2.2] - Story definition and ACs
- [Source: notes/architecture-time-tracking.md#ADR-TT-004] - Client-side aggregation pattern
- [Source: notes/architecture-time-tracking.md#Implementation Patterns] - Timer display pattern
- [Source: notes/ux-design-time-tracking.md#6.1 InsightCard] - InsightCard component spec
- [Source: notes/ux-design-time-tracking.md#2.3 Insights Modal Structure] - Layout and visual spec
- [Source: notes/PRD-time-tracking.md#FR14-FR17] - Summary metrics requirements

## Dev Agent Record

### Context Reference

- [Story Context XML](./2-2-time-summary-cards-today-and-week.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Created `useTimeInsights` hook with useMemo-cached aggregation calculations
- Hook fetches time entries from IndexedDB and calculates: totalToday, totalWeek, avgPerDay, byTask, byDate, recentEntries
- avgPerDay divides by days with entries (not calendar days) to avoid misleading averages
- byTask groups entries by task_id with special handling for deleted tasks (null task_id)
- Created InsightCard component with accessible ARIA labels and loading skeleton state
- Updated TimeInsightsModal to use real data from useTimeInsights hook
- Breakdown section shows task name + duration sorted by duration descending
- Added TimeInsights interface to types/timeTracking.ts
- All 171 tests passing (27 new tests: 18 for useTimeInsights, 9 for InsightCard)

### File List

**Files Created:**
- `src/hooks/useTimeInsights.ts` - Aggregation hook with useMemo optimization
- `src/hooks/useTimeInsights.test.ts` - 18 unit tests for hook calculations
- `src/components/time-tracking/InsightCard.tsx` - Reusable summary card component
- `src/components/time-tracking/InsightCard.test.tsx` - 9 component tests

**Files Modified:**
- `src/types/timeTracking.ts` - Added TimeInsights interface
- `src/components/time-tracking/TimeInsightsModal.tsx` - Integrated InsightCard and real data
- `src/components/time-tracking/TimeInsightsModal.test.tsx` - Updated tests for new content
- `src/test/setup.ts` - Added timeTrackingDb cleanup in beforeEach

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-10 | SM Agent | Initial story creation from sprint-status backlog |
| 2026-01-10 | Dev Agent | Implemented all tasks, 171 tests passing |
