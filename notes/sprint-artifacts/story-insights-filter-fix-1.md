# Story 1.1: Fix Time Insights Summary Card Calculations with Date Filters

**Status:** Draft

---

## User Story

As a **user viewing Time Insights**,
I want **the summary cards (TOTAL, TODAY, AVG/DAY) to correctly reflect my active date and category filters**,
So that **I can see accurate totals for the time period and category I've selected**.

---

## Acceptance Criteria

**AC #1:** Given a custom date range filter is active (e.g., Jan 1 - Jan 18), When the Time Insights modal calculates totals, Then the TOTAL card shows the sum of all entries within the selected date range.

**AC #2:** Given a date preset filter is active (e.g., "This Month"), When the Time Insights modal calculates totals, Then the TODAY card shows the same total as the TOTAL card (representing "Total in selected range").

**AC #3:** Given a date filter is active, When the Time Insights modal calculates AVG/DAY, Then it equals the total duration divided by the count of distinct days with entries in the filtered result set.

**AC #4:** Given no date filter is active (only category or task filter, or no filter at all), When the Time Insights modal calculates totals, Then the original behavior is preserved (TODAY = today's entries, TOTAL = this week's entries, AVG/DAY = week total / week days).

**AC #5:** Given date and category filters are both active, When the Time Insights modal calculates totals, Then the summary cards reflect the combined filter (entries matching both date range AND category).

**AC #6:** Given filters result in an empty entry set, When the Time Insights modal displays, Then all summary cards show "0m".

**AC #7:** Given the fix is implemented, When all existing tests are run, Then they continue to pass (no regressions).

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1:** Add `hasDateFilter` detection variable in `useTimeInsights.ts` useMemo block (AC: #1, #4)
  - Add `const hasDateFilter = dateRange !== null` after line 213

- [ ] **Task 2:** Replace lines 216-230 with conditional calculation logic (AC: #1, #2, #3, #4, #5, #6)
  - When `hasDateFilter === true`: Use `baseEntries` for all summary calculations
  - When `hasDateFilter === false`: Preserve existing today/week logic
  - Update `avgPerDay` to use the appropriate entries based on filter state

- [ ] **Task 3:** Run existing tests to verify no regressions (AC: #7)
  - Execute `npm test -- useTimeInsights`
  - All existing tests must pass

- [ ] **Task 4:** Add new test case for custom date range filter scenario (AC: #1)
  - Mock entries spanning multiple weeks
  - Apply custom date range filter
  - Assert `totalWeek` equals sum of ALL filtered entries

- [ ] **Task 5:** Add new test case for date preset filter scenario (AC: #2)
  - Mock entries from multiple days
  - Apply date preset filter (e.g., 'month')
  - Assert `totalToday` equals `totalWeek`

- [ ] **Task 6:** Add new test case for category-only filter scenario (AC: #4)
  - Mock entries with different categories, some outside current week
  - Apply category filter only (no date filter)
  - Assert `totalWeek` only counts current week entries (original behavior)

- [ ] **Task 7:** Add new test case for avgPerDay with date filter (AC: #3)
  - Mock entries across 5 distinct days
  - Apply custom date range covering those days
  - Assert `avgPerDay = totalWeek / 5`

- [ ] **Task 8:** Manual verification with screenshot scenario (AC: #1, #5)
  - Open Time Insights modal
  - Apply "Jan 1 - Jan 18" date range + "Clarivoy" category
  - Verify TOTAL shows ~8h 3m (matches breakdown total)
  - Remove filters, verify original behavior restored

### Technical Summary

The bug is in `useTimeInsights.ts` lines 216-230 where summary calculations re-filter to today/week regardless of the user's active date filter. The fix adds a `hasDateFilter` check and conditionally uses `baseEntries` (already filtered by user selections) for summary calculations when a date filter is active.

**Key insight:** The `entriesForTaskBreakdown` logic on line 234 already follows the correct pattern:
```typescript
const entriesForTaskBreakdown = dateRange ? baseEntries : todayEntries
```

We apply this same pattern to the summary calculations.

### Project Structure Notes

- **Files to modify:**
  - `src/hooks/useTimeInsights.ts` (main fix)
  - `src/hooks/useTimeInsights.test.ts` (new tests)
- **Expected test locations:** `src/hooks/useTimeInsights.test.ts`
- **Estimated effort:** 2 story points
- **Prerequisites:** None - standalone bug fix

### Key Code References

| Location | Description |
|----------|-------------|
| `useTimeInsights.ts:168-277` | Main `useMemo` calculation block |
| `useTimeInsights.ts:174-188` | Date range filter determination (working correctly) |
| `useTimeInsights.ts:191-213` | Entry filtering by date/task/category (working correctly) |
| `useTimeInsights.ts:216-230` | **BUG LOCATION** - Summary calculations to fix |
| `useTimeInsights.ts:234` | `entriesForTaskBreakdown` - correct pattern to follow |

---

## Context References

**Tech-Spec:** [tech-spec-time-insights-filter-bug.md](../tech-spec-time-insights-filter-bug.md) - Primary context document containing:

- Root cause analysis with Supabase data verification
- Brownfield codebase analysis
- Framework and library details with versions (date-fns 4.1.0, React 19.2.0)
- Existing patterns to follow
- Complete implementation guidance with code examples

**Related Specs:**
- `notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md` - Original filtering implementation
- `notes/sprint-artifacts/tech-spec-epic-2.md` - Time Insights modal design

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
