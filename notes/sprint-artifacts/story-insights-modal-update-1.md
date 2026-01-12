# Story 6.1: Widen Time Insights Modal and Add Total Time Card

**Status:** Done

---

## User Story

As a **user**,
I want **the Time Insights modal to be wider with a Total time card**,
So that **I can see my total weekly time alongside daily metrics with better visual spacing**.

---

## Acceptance Criteria

**AC #1:** Modal width is at least 30% wider on desktop (550px vs 420px = 31%)

**AC #2:** "Total" card displays as first card in the 3-card row

**AC #3:** "Total" card shows total time tracked this week (uses `insights.totalWeek`)

**AC #4:** All 3 cards (Total, Today, Avg/Day) have equal width in grid layout

**AC #5:** Mobile layout remains unchanged (full-width bottom sheet)

**AC #6:** Loading state shows skeleton placeholder for all 3 cards

**AC #7:** Existing tests continue to pass

---

## Implementation Details

### Tasks / Subtasks

- [x] **Update modal width** (AC: #1)
  - Change `md:max-w-[420px]` to `md:max-w-[550px]` in Dialog.Content className (line 298)

- [x] **Update card grid layout** (AC: #4)
  - Change `grid-cols-2` to `grid-cols-3` (line 399)
  - Change `gap-4` to `gap-3` for better spacing with 3 cards

- [x] **Add Total InsightCard** (AC: #2, #3, #6)
  - Insert new InsightCard before "Today" card
  - Use label="Total"
  - Use value from `insights?.totalWeek ?? 0` with `formatDisplay()`
  - Use sublabel="this week"
  - Pass `isLoading` prop for skeleton state

- [x] **Verify mobile responsiveness** (AC: #5)
  - Test on mobile viewport - should remain full-width bottom sheet
  - No changes to mobile-specific classes

- [x] **Add test for Total card** (AC: #7)
  - Add test verifying "Total" text appears in rendered modal
  - Verify existing tests still pass

- [x] **Run test suite** (AC: #7)
  - Execute `npm test` and ensure all tests pass

### Technical Summary

This is a straightforward UI enhancement to the TimeInsightsModal component:

1. **Width increase:** Single className change from 420px to 550px
2. **Grid layout:** Change from 2-column to 3-column with tighter gap
3. **New card:** Reuse existing InsightCard component with totalWeek data

No backend or hook changes required - `totalWeek` is already calculated by `useTimeInsights` hook.

### Project Structure Notes

- **Files to modify:**
  - `today-app/src/components/time-tracking/TimeInsightsModal.tsx`
  - `today-app/src/components/time-tracking/TimeInsightsModal.test.tsx`

- **Expected test locations:**
  - `today-app/src/components/time-tracking/TimeInsightsModal.test.tsx`

- **Estimated effort:** 1 story point

- **Prerequisites:** None

### Key Code References

**TimeInsightsModal.tsx line 298** - Modal width class:
```tsx
className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[420px] md:rounded-lg max-h-[80vh] overflow-y-auto"
```

**TimeInsightsModal.tsx lines 399-414** - Card grid section:
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* TODAY card */}
  <InsightCard
    label="Today"
    value={isLoading ? '--' : formatDisplay(insights?.totalToday ?? 0)}
    sublabel="tracked"
    isLoading={isLoading}
  />
  {/* AVG / DAY card */}
  <InsightCard
    label="Avg / Day"
    value={isLoading ? '--' : formatDisplay(insights?.avgPerDay ?? 0)}
    sublabel="this week"
    isLoading={isLoading}
  />
</div>
```

**useTimeInsights.ts line 225** - totalWeek already available:
```tsx
const totalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:
- Brownfield codebase analysis
- Framework and library details with versions (React 19.2.0, Tailwind 4.1.18)
- Existing patterns to follow (InsightCard usage)
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** N/A - No architectural changes needed

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered

### Completion Notes

Implementation completed successfully:

1. **Modal width:** Changed from 420px to 550px (31% wider)
2. **Card layout:** Changed from 2-column to 3-column grid with gap-3
3. **Total card:** Added InsightCard using existing `totalWeek` from useTimeInsights hook
4. **JSDoc:** Updated component documentation to reflect new width and 3-card layout
5. **Tests:** Added test for Total card, updated width test from 420px to 550px, fixed "this week" test to expect 2 occurrences

All acceptance criteria met.

### Files Modified

- `today-app/src/components/time-tracking/TimeInsightsModal.tsx`
  - Line 298: Changed `md:max-w-[420px]` to `md:max-w-[550px]`
  - Lines 399-421: Changed grid to 3-column, added Total InsightCard
  - Lines 28-40: Updated JSDoc comments
- `today-app/src/components/time-tracking/TimeInsightsModal.test.tsx`
  - Line 32-37: Updated width test to check for 550px
  - Lines 48-56: Added test for Total card
  - Lines 66-72: Updated Avg/Day test to expect multiple "this week" texts

### Test Results

- **TimeInsightsModal tests:** 24/24 passed
- **Full test suite:** 503/503 passed

---

## Review Notes

<!-- Will be populated during code review -->
