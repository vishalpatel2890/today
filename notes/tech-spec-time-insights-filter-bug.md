# Today - Technical Specification: Time Insights Filter Calculation Bug

**Author:** Vishal
**Date:** 2026-01-18
**Project Level:** Quick Flow (Single Story)
**Change Type:** Bug Fix
**Development Context:** Brownfield (existing React/TypeScript PWA)

---

## Context

### Available Documents

- **Brownfield codebase:** Existing Today app with time tracking features
- **Tech specs:** notes/sprint-artifacts/tech-spec-epic-2.md (Time Insights), tech-spec-epic-3-insights-filtering.md (Filtering)
- **UX Design:** notes/ux-design-time-tracking.md

### Project Stack

| Component | Version | Notes |
|-----------|---------|-------|
| Runtime | Vite 7.2.4 | Dev server |
| Framework | React 19.2.0 | With hooks |
| Language | TypeScript 5.9.3 | Strict mode |
| Testing | Vitest 3.2.4 | With Testing Library |
| Date handling | date-fns 4.1.0 | Date manipulation |
| Database | Dexie + Supabase | IndexedDB with cloud sync |

### Existing Codebase Structure

- **Time tracking components:** `src/components/time-tracking/`
- **Hooks:** `src/hooks/useTimeInsights.ts`, `useTimeEntries.ts`, `useTimeTracking.ts`
- **Database layer:** `src/lib/timeTrackingDb.ts`, `src/lib/supabaseTimeEntries.ts`
- **Test pattern:** Co-located `.test.ts` files using Vitest + Testing Library
- **Code style:** No semicolons, single quotes, 2-space indent

---

## The Change

### Problem Statement

The Time Insights modal displays incorrect totals in the summary cards (TOTAL, TODAY, AVG/DAY) when date and category filters are applied. The breakdown section shows correct per-task aggregations, but the summary cards ignore the active filters and always calculate based on hardcoded "today" and "this week" date ranges.

**Evidence from user screenshot (Jan 18, 2026):**
- **Filters Applied:** Jan 1 - Jan 18 (custom date range), Category: Clarivoy
- **TOTAL shows:** 15m (incorrect - should be ~8h 3m)
- **TODAY shows:** 15m (incorrect context)
- **AVG/DAY shows:** 15m (incorrect)
- **Breakdown shows:** 4 tasks totaling ~8h 3m (correct!)

**Verified from Supabase data:**
| Task | Duration | Date |
|------|----------|------|
| Clarivoy - Tracker & Alert PRD | 3h 10m | Jan 12 |
| Clarivoy - Tracker & Alert PRD | 1h 4m | Jan 11 |
| Clarivoy - Tracker & Alert PRD | 1h 40m | Jan 11 |
| Clarivoy Proposals | 25m | Jan 12 |
| Clarivoy Proposals | 30m | Jan 9 |
| Clarivoy Proposals | 30m | Jan 8 |
| Clarivoy Proposal Meeting | 30m | Jan 16 |
| Clarivoy Proposal Meeting | ~5s | Jan 17 |
| Responding to Matt Dailey | 15m | Jan 18 |
| **Total** | **~8h 4m** | |

**Root Cause Analysis:**

In `useTimeInsights.ts` lines 216-230, after applying date/category filters to create `baseEntries`, the code re-filters for `todayEntries` and `weekEntries` using hardcoded date comparisons:

```typescript
// BUG: Re-filters to today/week, ignoring the user's date filter
const todayEntries = baseEntries.filter((e) => e.date === today)
const weekEntries = baseEntries.filter((e) => e.date >= weekStart && e.date <= today)
const totalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0)
const totalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)
```

When user selects "Jan 1 - Jan 18":
1. `baseEntries` correctly has all 9 Clarivoy entries from Jan 1-18 ✓
2. But `totalToday` only counts entries where `date === '2026-01-18'` (just 15m) ✗
3. And `totalWeek` only counts entries from current week (Jan 12-18), missing Jan 1-11 entries ✗

The **Breakdown** section works correctly because it uses `entriesForTaskBreakdown = baseEntries` when a date filter is active (line 234).

### Proposed Solution

Modify the insights calculation logic to use the filtered `baseEntries` for all summary calculations when a date filter is active:

1. **Detect active date filter:** Check if `dateRange !== null`
2. **When date filter active:**
   - **TOTAL** = sum of all `baseEntries` durations
   - **TODAY** = same as TOTAL (represents "Total in selected range")
   - **AVG/DAY** = TOTAL / distinct days with entries in `baseEntries`
3. **When no date filter:** Preserve existing today/week logic

### Scope

**In Scope:**

- Fix `useTimeInsights.ts` calculation logic to respect active date filters
- Update summary card values (TOTAL, TODAY, AVG/DAY) to use filtered data when filter active
- Ensure all three summary cards show consistent, filter-aware totals
- Add new test cases for filtered calculation scenarios

**Out of Scope:**

- UI/UX changes to the summary card labels (follow-up enhancement)
- Changes to the breakdown or recent entries sections (already working correctly)
- Performance optimizations
- New filter types

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTimeInsights.ts` | MODIFY | Fix calculation logic for summary values when filters active (lines 216-230) |
| `src/hooks/useTimeInsights.test.ts` | MODIFY | Add test cases for filtered calculations |

### Technical Approach

**Current buggy logic (lines 216-230):**
```typescript
// Filter entries for today (from filtered base if filter active)
const todayEntries = baseEntries.filter((e) => e.date === today)

// Filter entries for this week (from Sunday to today) (from filtered base if filter active)
const weekEntries = baseEntries.filter((e) => e.date >= weekStart && e.date <= today)

// Calculate totalToday
const totalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0)

// Calculate totalWeek
const totalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)

// Calculate avgPerDay: totalWeek / distinct days with entries
const daysWithEntries = new Set(weekEntries.map((e) => e.date))
const numDays = daysWithEntries.size
const avgPerDay = numDays > 0 ? Math.floor(totalWeek / numDays) : 0
```

**Fixed logic:**
```typescript
// Determine if a date filter is active
const hasDateFilter = dateRange !== null

// When filter active, use all filtered entries; otherwise use today/week logic
let summaryEntries: TimeEntry[]
let displayTotalToday: number
let displayTotalWeek: number

if (hasDateFilter) {
  // Date filter active: all summary values use the filtered baseEntries
  summaryEntries = baseEntries
  displayTotalToday = baseEntries.reduce((sum, e) => sum + e.duration, 0)
  displayTotalWeek = displayTotalToday // Same value when filter active
} else {
  // No date filter: use original today/week logic
  const todayEntries = baseEntries.filter((e) => e.date === today)
  const weekEntries = baseEntries.filter((e) => e.date >= weekStart && e.date <= today)
  summaryEntries = weekEntries
  displayTotalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0)
  displayTotalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)
}

// avgPerDay: use summaryEntries for day count
const daysWithEntries = new Set(summaryEntries.map((e) => e.date))
const numDays = daysWithEntries.size
const avgPerDay = numDays > 0 ? Math.floor(displayTotalWeek / numDays) : 0

// Assign to return object
const totalToday = displayTotalToday
const totalWeek = displayTotalWeek
```

### Existing Patterns to Follow

- Use `useMemo` for derived calculations (already in place)
- Keep filter logic in the hook, not the component
- Use date-fns for date operations (`format`, `startOfWeek`, `parseISO`, `startOfDay`, `endOfDay`)
- Follow existing variable naming (`baseEntries`, `dateRange`, etc.)
- Follow existing test patterns with `describe/it` blocks

### Integration Points

- `TimeInsightsModal.tsx` consumes `useTimeInsights` hook - no changes needed
- `InsightCard.tsx` displays values - no changes needed
- Supabase data fetching unchanged
- IndexedDB caching unchanged

---

## Development Context

### Relevant Existing Code

**useTimeInsights.ts key sections:**
- Lines 168-277: The `useMemo` calculation block
- Lines 174-188: Date range filter determination (working correctly)
- Lines 191-213: Entry filtering by date/task/category (working correctly)
- Lines 216-230: **BUG LOCATION** - Summary calculations
- Line 234: `entriesForTaskBreakdown` logic (correct pattern to follow)

**Pattern to follow (line 234):**
```typescript
// When filter is active, use all filtered entries; otherwise use today's entries
const entriesForTaskBreakdown = dateRange ? baseEntries : todayEntries
```

This is the exact pattern we need to apply to the summary calculations.

### Dependencies

**Framework/Libraries:**
- date-fns 4.1.0 (format, startOfWeek, parseISO, isWithinInterval, startOfDay, endOfDay)
- React 19.2.0 (useState, useEffect, useMemo, useCallback)

**Internal Modules:**
- `../types/timeTracking` (TimeEntry, TimeInsights, DatePreset, DateRange)
- `../lib/timeFormatters` (getDateRangeForPreset)
- `../lib/timeTrackingDb` (getTimeEntriesByUserId, bulkUpsertTimeEntries)
- `../lib/supabaseTimeEntries` (fetchTimeEntries)

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

**Code Style:**
- No semicolons
- Single quotes for strings
- 2-space indentation
- Functional components with hooks

**Test Patterns:**
- Test files: `*.test.ts` alongside source files
- Use `describe/it` blocks
- Mock database functions with `vi.mock()`

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **Testing Utils:** @testing-library/react (renderHook)
- **File Pattern:** `hookName.test.ts`
- **Mock Pattern:** `vi.mock('../lib/timeTrackingDb')`

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Vite | 7.2.4 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Date handling | date-fns | 4.1.0 |
| Testing | Vitest | 3.2.4 |

---

## Technical Details

**Bug Root Cause:**

The `useMemo` in `useTimeInsights.ts` correctly builds `baseEntries` by applying all active filters. However, summary calculations then re-filter to today/week, ignoring the user's selected date range.

**Fix Strategy:**

1. Add `hasDateFilter = dateRange !== null` check
2. When `hasDateFilter === true`:
   - Use `baseEntries` for all summary calculations
   - `totalToday` and `totalWeek` both equal the sum of all filtered entries
   - `avgPerDay` = total / distinct days in filtered range
3. When `hasDateFilter === false`:
   - Preserve existing behavior (today/week calculations)

**Edge Cases:**

| Scenario | Expected Behavior |
|----------|-------------------|
| No filter active | Original today/week logic |
| Only category filter (no date) | Original today/week logic (only filter task-level) |
| Only task filter (no date) | Original today/week logic |
| Date preset filter | Use filtered entries for all summaries |
| Custom date range filter | Use filtered entries for all summaries |
| Date + category filter | Use filtered entries (already filtered by category) |
| Empty result after filtering | Show 0m for all values |

---

## Development Setup

```bash
# Navigate to app directory
cd /Users/vishalpatel/Documents/apps/to-do/today-app

# Start development server
npm run dev

# Run all tests
npm test

# Run specific test file in watch mode
npm test -- useTimeInsights

# Run tests once (CI mode)
npm run test:run
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b fix/time-insights-filter-calculations`
2. Open `src/hooks/useTimeInsights.ts` in editor
3. Review existing tests: `src/hooks/useTimeInsights.test.ts`

### Implementation Steps

1. **Locate the bug** in `useTimeInsights.ts` (lines 216-230)

2. **Add date filter detection** before line 216:
   ```typescript
   // Determine if a date filter is active
   const hasDateFilter = dateRange !== null
   ```

3. **Replace lines 216-230** with conditional logic:
   ```typescript
   // Summary calculations - use filtered entries when date filter active
   let totalToday: number
   let totalWeek: number
   let entriesForAvg: TimeEntry[]

   if (hasDateFilter) {
     // Date filter active: all summaries use filtered baseEntries
     const filteredTotal = baseEntries.reduce((sum, e) => sum + e.duration, 0)
     totalToday = filteredTotal
     totalWeek = filteredTotal
     entriesForAvg = baseEntries
   } else {
     // No date filter: use original today/week logic
     const todayEntries = baseEntries.filter((e) => e.date === today)
     const weekEntries = baseEntries.filter((e) => e.date >= weekStart && e.date <= today)
     totalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0)
     totalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)
     entriesForAvg = weekEntries
   }

   // Calculate avgPerDay using appropriate entries
   const daysWithEntries = new Set(entriesForAvg.map((e) => e.date))
   const numDays = daysWithEntries.size
   const avgPerDay = numDays > 0 ? Math.floor(totalWeek / numDays) : 0
   ```

4. **Run existing tests** to ensure no regressions:
   ```bash
   npm test -- useTimeInsights
   ```

5. **Add new test cases** for filtered scenarios (see Testing Strategy)

6. **Manual verification:**
   - Open Time Insights modal
   - Apply "Jan 1 - Jan 18" + "Clarivoy" filters
   - Verify TOTAL shows ~8h 3m

### Testing Strategy

**New Test Cases to Add (useTimeInsights.test.ts):**

```typescript
describe('useTimeInsights with date filters', () => {
  it('calculates totalWeek from all filtered entries when custom date range active', async () => {
    // Setup: mock entries spanning Jan 1-18 with varying dates
    // Apply: customRange Jan 1-18
    // Assert: totalWeek equals sum of ALL entries (not just current week)
  })

  it('calculates totalToday from all filtered entries when date preset active', async () => {
    // Setup: mock entries from multiple days
    // Apply: datePreset 'month'
    // Assert: totalToday equals sum of all filtered entries
  })

  it('preserves original today/week logic when only category filter active', async () => {
    // Setup: mock entries with different categories, some outside current week
    // Apply: category filter only (no date filter)
    // Assert: totalWeek only counts current week entries
  })

  it('calculates avgPerDay correctly with date filter', async () => {
    // Setup: mock entries across 5 distinct days
    // Apply: customRange covering those 5 days
    // Assert: avgPerDay = totalWeek / 5
  })
})
```

**Manual Testing Checklist:**
- [ ] No filter: TOTAL shows current week, TODAY shows today only
- [ ] Date preset "Today": All cards show today's total
- [ ] Date preset "This Week": All cards show week's total
- [ ] Custom range "Jan 1-18": All cards show full range total
- [ ] Custom range + Category: All cards show filtered total
- [ ] Empty filter result: All cards show 0m

### Acceptance Criteria

| AC | Description | Verification |
|----|-------------|--------------|
| AC1 | When a date filter is active, TOTAL card shows sum of all filtered entries | Manual test with Jan 1-18 range |
| AC2 | When a date filter is active, TODAY card shows sum of all filtered entries | Compare to TOTAL value |
| AC3 | When a date filter is active, AVG/DAY shows total / distinct days in range | Calculate expected value manually |
| AC4 | When no date filter is active, original today/week calculations preserved | Remove filters, verify behavior |
| AC5 | Breakdown section continues to show correct per-task totals | No changes expected |
| AC6 | All existing tests pass | `npm run test:run` |
| AC7 | New tests cover filtered calculation scenarios | New tests added and passing |

---

## Developer Resources

### File Paths Reference

- `/Users/vishalpatel/Documents/apps/to-do/today-app/src/hooks/useTimeInsights.ts`
- `/Users/vishalpatel/Documents/apps/to-do/today-app/src/hooks/useTimeInsights.test.ts`
- `/Users/vishalpatel/Documents/apps/to-do/today-app/src/components/time-tracking/TimeInsightsModal.tsx`

### Key Code Locations

| Location | Description |
|----------|-------------|
| `useTimeInsights.ts:168` | Start of useMemo calculation block |
| `useTimeInsights.ts:174-188` | Date range filter determination |
| `useTimeInsights.ts:191-213` | Entry filtering logic (date/task/category) |
| `useTimeInsights.ts:216-230` | **BUG LOCATION** - Summary calculations |
| `useTimeInsights.ts:234` | entriesForTaskBreakdown (correct pattern) |

### Testing Locations

- Hook unit tests: `src/hooks/useTimeInsights.test.ts`

### Documentation to Update

None required for this bug fix.

---

## UX/UI Considerations

No UI changes required. The fix is purely in the calculation logic. The existing UI components will display the corrected values automatically.

**Future Enhancement (out of scope):**
Consider updating card sublabels to reflect filter context:
- "this week" → "in range" when date filter active
- "tracked" → "filtered" when filter active

---

## Testing Approach

**Test Framework:** Vitest 3.2.4

**Existing Test Setup:**
- Mock `getTimeEntriesByUserId` from `../lib/timeTrackingDb`
- Mock `fetchTimeEntries` from `../lib/supabaseTimeEntries`
- Use `renderHook` from `@testing-library/react`
- Use `waitFor` for async operations

**Test Data Setup Pattern:**
```typescript
const mockEntries: TimeEntry[] = [
  { id: '1', date: '2026-01-05', duration: 3600000, ... }, // Outside current week
  { id: '2', date: '2026-01-12', duration: 1800000, ... }, // This week
  { id: '3', date: '2026-01-18', duration: 900000, ... },  // Today
]
```

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main branch
2. Vite build completes via CI
3. Deploy to Vercel (automatic)
4. Verify fix in production

### Rollback Plan

1. Revert commit via `git revert <commit-hash>`
2. Push to main
3. Automatic redeploy

### Monitoring

- Check browser console for any errors
- Verify Time Insights calculations match Supabase data
- Monitor for user reports of incorrect totals
