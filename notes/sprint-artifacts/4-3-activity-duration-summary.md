# Story 4.3: Activity Duration Summary

Status: done

## Story

As a **user**,
I want **to see a summary of time spent per application**,
so that **I can quickly understand where my time went during a tracking session**.

## Acceptance Criteria

1. **AC4.3.1**: Modal displays a summary section above the chronological list
2. **AC4.3.2**: Summary shows time spent per application, sorted by duration (most time first)
3. **AC4.3.3**: Each summary row shows: app name, total duration, percentage of session
4. **AC4.3.4**: A visual progress bar shows relative time percentages
5. **AC4.3.5**: Summary section can be collapsed to show only the detailed list (optional enhancement)
6. **AC4.3.6**: Duration is formatted human-readable: "Xh Ym" or "Ym Zs" as appropriate

## Frontend Test Gate

**Gate ID**: 4-3-TG1

### Prerequisites
- [ ] Story 4.2 complete (ActivityLogModal displaying chronological list)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] Activity data exists in IndexedDB with multiple different apps used
- [ ] Completed time entries visible in Time Insights modal

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with Today app |
| 2 | Track time for 2+ minutes, switching between 3+ apps | Task timer | Activity entries captured for different apps |
| 3 | Stop time tracking | Task timer button | Time entry saved with endTime |
| 4 | Open Time Insights modal | Main view (double-tap T) | Time Insights modal opens |
| 5 | Find completed time entry | Recent Entries section | Entry visible with "View Activity" button |
| 6 | Click "View Activity" button | Time entry row | Activity Log Modal opens |
| 7 | Verify summary section appears | Modal body, top | Summary section visible above chronological list |
| 8 | Verify apps sorted by duration | Summary section | App with most time appears first |
| 9 | Verify each row shows app name, duration, percentage | Summary row | "Visual Studio Code - 5m 32s - 45%" format |
| 10 | Verify progress bars | Summary row | Bar widths match percentages visually |
| 11 | Verify percentages add up to ~100% | Summary section | Sum of percentages is 100% (or close) |
| 12 | Verify duration format | Summary row | "1h 23m", "5m 32s" format (no "1h 0m 0s") |
| 13 | Scroll to verify chronological list still present | Modal body, below summary | Detailed list appears below summary |

### Success Criteria (What User Sees)
- [ ] Summary section appears at top of modal, above chronological list
- [ ] Apps sorted by total time (most used first)
- [ ] Each row shows: app name, formatted duration, percentage, progress bar
- [ ] Progress bars visually represent percentages
- [ ] Percentages calculated correctly (app time / total session time)
- [ ] Chronological list still visible below summary
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the summary section helpful for understanding time distribution?
2. Are the progress bars visually clear and intuitive?
3. Does the duration formatting make sense?
4. Would you want the summary collapsible?

## Tasks / Subtasks

- [x] **Task 1: Extend useActivityLog hook with summary aggregation** (AC: 4.3.2, 4.3.3, 4.3.6)
  - [x] 1.1: Add `ActivitySummaryItem` interface to `useActivityLog.ts`
  - [x] 1.2: Create `aggregateSummary()` function that groups entries by appName
  - [x] 1.3: Calculate totalDurationMs per app (sum of all entry durations for that app)
  - [x] 1.4: Sort summary items by totalDurationMs descending
  - [x] 1.5: Calculate percentage = (appDuration / totalSessionDuration) * 100
  - [x] 1.6: Format duration using existing `formatActivityDuration()` function
  - [x] 1.7: Return `summary: ActivitySummaryItem[]` in hook return type
  - [x] 1.8: Add `totalDurationMs` and `totalDurationFormatted` to hook return type

- [x] **Task 2: Create ActivitySummary component** (AC: 4.3.1, 4.3.3, 4.3.4)
  - [x] 2.1: Create `src/components/time-tracking/ActivitySummary.tsx`
  - [x] 2.2: Accept props: `items: ActivitySummaryItem[]`, `totalDurationFormatted: string`
  - [x] 2.3: Render list of summary items with app name, duration, percentage
  - [x] 2.4: Add progress bar for each item using Tailwind width classes
  - [x] 2.5: Style consistently with existing app design patterns
  - [x] 2.6: Handle empty state (no items = hide section or show "No activity")

- [x] **Task 3: Integrate summary into ActivityLogModal** (AC: 4.3.1)
  - [x] 3.1: Import ActivitySummary component in ActivityLogModal
  - [x] 3.2: Update useActivityLog call to destructure summary data
  - [x] 3.3: Render ActivitySummary above ActivityLogList
  - [x] 3.4: Add visual separator between summary and list sections
  - [x] 3.5: Ensure scrolling works correctly with both sections

- [x] **Task 4: Write tests** (AC: all)
  - [x] 4.1: Unit test: `aggregateSummary()` groups entries by appName correctly
  - [x] 4.2: Unit test: `aggregateSummary()` sums durations per app correctly
  - [x] 4.3: Unit test: `aggregateSummary()` sorts by duration descending
  - [x] 4.4: Unit test: `aggregateSummary()` calculates percentages correctly
  - [x] 4.5: Unit test: `aggregateSummary()` handles empty entries array
  - [x] 4.6: Component test: `ActivitySummary` renders items with progress bars
  - [x] 4.7: Component test: `ActivitySummary` handles empty items array
  - [x] 4.8: Ensure all existing tests pass (baseline: 627 tests) - now 650 tests passing

## Dev Notes

### Architecture Alignment

This story implements FR23 (Shows duration spent per app) from the PRD and completes AC3.1-AC3.6 from the tech spec.

**From Tech Spec `notes/sprint-artifacts/tech-spec-epic-4-electron.md`:**

```typescript
// Data structures
interface ActivitySummaryItem {
  appName: string;               // e.g., "Visual Studio Code"
  totalDurationMs: number;       // Sum of all entries for this app
  totalDurationFormatted: string;// e.g., "45m 12s"
  percentage: number;            // (totalDuration / sessionDuration) * 100
}

// Summary calculation flow:
// 1. Group entries by appName
// 2. Sum durations per app
// 3. Sort by total duration descending
// 4. Calculate percentage = (appDuration / totalDuration) * 100
```

**Expected Modal Layout:**

```
┌─────────────────────────────────────┐
│ TaskName                         X  │
│ Jan 18, 2026 • 9:00 AM - 11:00 AM  │
├─────────────────────────────────────┤
│ Summary                             │
│ ─────────────────────────────────── │
│ Visual Studio Code  1h 1m  45%     │
│ [===============================   ]│
│ Chrome              40m    30%     │
│ [====================             ]│
│ Slack               20m    15%     │
│ [===========                      ]│
│ Other               13m    10%     │
│ [=======                          ]│
├─────────────────────────────────────┤
│ Activity Log                        │
│ 9:00:15 AM • VS Code • App.tsx     │
│ 9:15:20 AM • Chrome • GitHub       │
│ ...                                 │
└─────────────────────────────────────┘
```

### Project Structure Notes

**Files to Create:**
- `src/components/time-tracking/ActivitySummary.tsx` - Summary visualization component

**Files to Modify:**
- `src/hooks/useActivityLog.ts` - Add summary aggregation logic
- `src/components/time-tracking/ActivityLogModal.tsx` - Integrate summary section

**Files to Use (unchanged):**
- `src/components/time-tracking/ActivityLogList.tsx` - Existing chronological list (Story 4.2)
- `src/components/time-tracking/ViewActivityButton.tsx` - Opens modal (Story 4.2)
- `src/lib/electronBridge.ts` - Activity data retrieval (Story 4.1)

### Learnings from Previous Story

**From Story 4-2-activity-log-modal-ui (Status: done)**

- **Test Baseline**: 627 tests passing - maintain this baseline
- **Duration Format**: `formatActivityDuration()` already handles "1h 15m", "5m 32s" formats
- **Hook Structure**: `useActivityLog` returns `{ entries, isLoading, error }` - extend with `summary`
- **Modal Layout**: Radix Dialog with flex column layout, scrollable content area
- **Styling Pattern**: Uses Tailwind classes, consistent with app design system
- **Files Created**:
  - `src/hooks/useActivityLog.ts` - Contains duration calculation logic to reuse
  - `src/components/time-tracking/ActivityLogModal.tsx` - Will integrate summary here
  - `src/components/time-tracking/ActivityLogList.tsx` - Already renders entries

**Reusable Code from Story 4.2:**
- `formatActivityDuration()` in useActivityLog.ts - use for summary durations
- `ActivityEntryWithDuration` interface - entries already have durationMs

[Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Dev-Agent-Record]

### Implementation Approach

1. **Extend hook first** - Add aggregation logic to `useActivityLog.ts`
2. **Create summary component** - Standalone `ActivitySummary.tsx` with props
3. **Integrate into modal** - Render summary above existing list
4. **Add tests** - Unit tests for aggregation, component tests for rendering

**Summary Aggregation Pattern:**

```typescript
function aggregateSummary(
  entriesWithDuration: ActivityEntryWithDuration[]
): ActivitySummaryItem[] {
  if (entriesWithDuration.length === 0) {
    return [];
  }

  // Group by appName and sum durations
  const byApp = new Map<string, number>();
  let totalMs = 0;

  for (const entry of entriesWithDuration) {
    const current = byApp.get(entry.appName) || 0;
    byApp.set(entry.appName, current + entry.durationMs);
    totalMs += entry.durationMs;
  }

  // Convert to array, calculate percentages, sort
  const items: ActivitySummaryItem[] = [];
  for (const [appName, totalDurationMs] of byApp.entries()) {
    items.push({
      appName,
      totalDurationMs,
      totalDurationFormatted: formatActivityDuration(totalDurationMs),
      percentage: Math.round((totalDurationMs / totalMs) * 100),
    });
  }

  // Sort by duration descending
  items.sort((a, b) => b.totalDurationMs - a.totalDurationMs);

  return items;
}
```

**Progress Bar Pattern:**

```tsx
// Use Tailwind's width percentage with inline style for exact percentages
<div className="h-2 bg-surface-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-blue-500 rounded-full"
    style={{ width: `${item.percentage}%` }}
  />
</div>
```

### References

- [Source: notes/architecture-electron-migration.md#Activity-Viewing]
- [Source: notes/epics-electron-migration.md#Story-4.3]
- [Source: notes/sprint-artifacts/tech-spec-epic-4-electron.md#AC3]
- [Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- [notes/sprint-artifacts/4-3-activity-duration-summary.context.xml](./4-3-activity-duration-summary.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-20: Implementation plan - extend hook with aggregation, create summary component, integrate into modal, add tests
- All tasks completed with 650 tests passing (23 new tests added)

### Completion Notes List

- ✅ Test Gate PASSED by Vishal (2026-01-20)
- Extended `useActivityLog` hook with `ActivitySummaryItem` interface and `aggregateSummary()` function
- Created `ActivitySummary` component with progress bars and accessibility attributes
- Integrated summary section above chronological activity list in modal
- Added comprehensive unit tests for aggregation logic (grouping, sorting, percentages)
- Added component tests for ActivitySummary rendering and empty state
- Test count increased from 627 to 650 (23 new tests)
- TypeScript type check passes with no errors

### File List

**Created:**
- `src/components/time-tracking/ActivitySummary.tsx` - Summary visualization component
- `src/components/time-tracking/ActivitySummary.test.tsx` - Component tests

**Modified:**
- `src/hooks/useActivityLog.ts` - Added `ActivitySummaryItem` interface, `aggregateSummary()` function, extended hook return type
- `src/hooks/useActivityLog.test.ts` - Added unit tests for aggregation and formatting
- `src/components/time-tracking/ActivityLogModal.tsx` - Integrated ActivitySummary component

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story drafted from epics, tech spec, and architecture | SM Agent |
| 2026-01-20 | All tasks implemented - hook extended, component created, integrated, 650 tests passing | Dev Agent |
| 2026-01-20 | Story marked DONE - Definition of Done complete | Dev Agent |
