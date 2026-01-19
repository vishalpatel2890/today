# Story 3.4: Active Filter Chips with Remove

Status: ready-for-dev

## Story

As a power user,
I want to see my active filters as removable chips,
so that I can easily understand what filters are applied and remove them individually.

## Acceptance Criteria

1. **AC-3.4.1**: Active filters are displayed as chips below the filter controls (FR24)
2. **AC-3.4.2**: Each chip shows the filter value (e.g., "This Week", "Client Work", task name)
3. **AC-3.4.3**: Each chip has a x (remove) button
4. **AC-3.4.4**: Clicking the x removes that specific filter (FR25)
5. **AC-3.4.5**: Removing a filter updates all insights data (FR26-28)
6. **AC-3.4.6**: Multiple filter chips can be displayed simultaneously (e.g., date + category)
7. **AC-3.4.7**: Chips use primary background with white text per UX spec
8. **AC-3.4.8**: Custom date range chip shows formatted range (e.g., "Dec 1 - Dec 15")

## Frontend Test Gate

**Gate ID**: 3-4-TG1

### Prerequisites
- [ ] App running locally at http://localhost:5173
- [ ] User is logged in (any user)
- [ ] Time entries exist for multiple tasks across different categories and date ranges
- [ ] Browser DevTools open for console verification

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open Insights modal with `Cmd+Shift+T T` | Anywhere in app | Insights modal opens |
| 2 | Click "This Week" date filter | QuickFilterBar | Pill highlights, chip appears below filters |
| 3 | Verify chip displays correctly | Below filter controls | Chip shows "This Week" with x button, primary bg/white text |
| 4 | Click a specific task in Tasks dropdown | Tasks dropdown | Task filter applied, chip appears |
| 5 | Verify both chips visible | Below filter controls | Two chips: "This Week" and task name |
| 6 | Click "Category" dropdown and select category | Category dropdown | Third chip appears |
| 7 | Verify three chips visible simultaneously | Below filter controls | Three chips in a row that wraps if needed |
| 8 | Click x on task chip | Task filter chip | Task chip disappears, task filter removed |
| 9 | Verify insights update | Summary, breakdown, entries | Data now filtered only by date + category |
| 10 | Click x on category chip | Category filter chip | Category chip disappears, category filter removed |
| 11 | Click "Custom" date filter | QuickFilterBar | Date picker opens |
| 12 | Select Dec 1 - Dec 15 range | Date picker | Custom chip shows "Dec 1 - Dec 15" |
| 13 | Click x on date chip | Date filter chip | All filters cleared, full data shown |
| 14 | Verify no chips visible | Below filter controls | No filter chips displayed |

### Success Criteria (What User Sees)
- [ ] Filter chips appear below filter controls when filters are active
- [ ] Each chip shows the correct filter value text
- [ ] Each chip has a visible x (remove) button
- [ ] Clicking x removes only that specific filter
- [ ] Insights data updates immediately when filter is removed
- [ ] Multiple chips can be displayed simultaneously
- [ ] Chips use primary background with white text
- [ ] Custom date range shows formatted date range (e.g., "Dec 1 - Dec 15")
- [ ] Chips wrap to next line if too many to fit
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is it clear which filters are currently active?
2. Is the x button easy to click/tap?
3. Does removing a filter feel responsive?
4. Any confusion about what each chip represents?

## Tasks / Subtasks

- [x] Task 1: Verify FilterChip component exists and works (AC: 3, 7)
  - [x] Confirm `src/components/time-tracking/FilterChip.tsx` exists from Story 3.2
  - [x] Verify component has x button with onRemove callback
  - [x] Verify styling: primary background, white text per UX spec
  - [x] Confirm accessibility: keyboard accessible, proper aria labels

- [x] Task 2: Extend FilterChip to handle all filter types (AC: 2, 8)
  - [x] Verify chip displays date preset labels correctly ("Today", "Yesterday", "This Week", "This Month")
  - [x] Verify chip displays custom date range as "MMM d - MMM d" format
  - [x] Verify chip displays task name for task filters
  - [x] Verify chip displays category name for category filters

- [x] Task 3: Integrate filter chips into TimeInsightsModal (AC: 1, 6)
  - [x] Verify FilterChips container exists below filter controls
  - [x] Render date filter chip when datePreset OR customRange is set
  - [x] Render task filter chip when taskId is set
  - [x] Render category filter chip when category is set
  - [x] Use flex-wrap layout for multiple chips

- [x] Task 4: Implement chip removal handlers (AC: 4, 5)
  - [x] Date chip x clears datePreset and customRange
  - [x] Task chip x clears taskId filter
  - [x] Category chip x clears category filter
  - [x] Removing filter triggers useTimeInsights recalculation
  - [x] Verify summary cards, breakdown, and entries all update

- [x] Task 5: Format custom date range for chip display (AC: 8)
  - [x] Create/use date formatting function for "MMM d - MMM d" format
  - [x] Use date-fns `format` function with 'MMM d' pattern
  - [x] Handle same-day ranges (show single date)
  - [x] Handle cross-year ranges (include year if different)

- [x] Task 6: Write/verify FilterChip component tests (AC: 3, 7)
  - [x] Test chip renders with correct label
  - [x] Test x button is visible and clickable
  - [x] Test onRemove callback is called when x clicked
  - [x] Test proper styling (primary bg, white text)
  - [x] Test keyboard accessibility (Tab to chip, Enter/Space on x)

- [x] Task 7: Write integration tests for filter chip behavior (AC: 1, 4, 5, 6)
  - [x] Test date chip appears when date filter applied
  - [x] Test task chip appears when task filter applied
  - [x] Test category chip appears when category filter applied
  - [x] Test multiple chips display simultaneously
  - [x] Test removing date chip clears date filter
  - [x] Test removing task chip clears task filter
  - [x] Test removing category chip clears category filter
  - [x] Test insights data updates on chip removal
  - [x] Test custom date range chip shows formatted range

- [ ] Task 8: Manual browser testing (AC: 1-8)
  - [x] All automated tests pass
  - [ ] Complete Frontend Test Gate checklist above
  - [ ] Verify visual styling matches UX spec
  - [ ] Verify keyboard accessibility
  - [ ] Verify chips wrap correctly on narrow screens

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From Architecture (ADR-TT-004 - Client-Side Insights Aggregation):**
- All filtering computed client-side with `useMemo`
- Filter parameters include datePreset, customRange, taskId, category
- Filters combined with AND logic

**From Tech Spec (Epic 3 - FilterChip Props):**
```typescript
interface FilterChipProps {
  label: string;      // Display text (e.g., "This Week", "Client Work")
  onRemove: () => void;
}
```

**From Tech Spec (Epic 3 - Active Filter Model):**
```typescript
export interface ActiveFilter {
  type: 'date' | 'task' | 'category';
  label: string;
  value: string;
}
```

**From UX Design (Section 6.1 - FilterChip):**
```
- Filter name text
- Remove (x) button
- Active state: Primary background, white text
- Click x to remove filter
- Removing updates insights data
```

### Project Structure Notes

**Files to Verify/Modify:**
```
src/components/time-tracking/FilterChip.tsx         # EXISTS from Story 3.2 - verify
src/components/time-tracking/FilterChip.test.tsx    # EXISTS from Story 3.2 - verify
src/components/time-tracking/TimeInsightsModal.tsx  # VERIFY chip integration
```

**Note:** FilterChip component was created in Story 3.2. This story primarily focuses on:
1. Verifying the existing implementation meets all AC requirements
2. Ensuring all filter types render chips correctly
3. Ensuring chip removal updates insights data correctly
4. Comprehensive testing of the chip behavior

### Learnings from Previous Story

**From Story 3-3-task-and-category-filter-dropdowns (Status: done)**

- **New Files Created**:
  - `src/components/time-tracking/FilterDropdown.tsx` - Filter dropdown component using Radix Select
  - `src/components/time-tracking/FilterDropdown.test.tsx` - 12 component tests

- **Modified Files**:
  - `src/hooks/useTimeInsights.ts` - Extended InsightFilters, added taskId/category filtering with AND logic
  - `src/hooks/useTimeInsights.test.ts` - Added 8 tests for task, category, and combined filtering
  - `src/components/time-tracking/TimeInsightsModal.tsx` - Integrated FilterDropdowns and task/category filter chips
  - `src/App.tsx` - Pass tasks prop to TimeInsightsModal for category lookup
  - `src/types/timeTracking.ts` - Added FilterOption interface
  - `src/test/setup.ts` - Added jsdom mocks for Radix Select

- **Completion Notes from 3-3**:
  - 309 tests passing (12 new tests for FilterDropdown, 8 new tests for useTimeInsights)
  - FilterDropdown component implements Radix Select with full keyboard accessibility
  - InsightFilters interface extended with taskId, category, and taskCategories props
  - useTimeInsights hook filters entries with AND logic for all filter types
  - TimeInsightsModal integrates FilterDropdowns below QuickFilterBar
  - **FilterChips display for active task/category filters with remove functionality** - ALREADY DONE
  - Tasks dropdown shows only tasks with time entries
  - Category dropdown shows only categories from tasks with time entries

- **Key Insight**: Based on Story 3-3 completion notes, FilterChips for task and category filters are already integrated. This story should:
  1. Verify the existing FilterChip implementation for all filter types
  2. Ensure date filter chips (preset and custom range) work correctly
  3. Add comprehensive tests for all chip scenarios
  4. Verify styling matches UX spec

[Source: notes/sprint-artifacts/3-3-task-and-category-filter-dropdowns.md#Dev-Agent-Record]

### Implementation Notes

Based on reviewing Story 3-3, significant work for filter chips may already be complete:

1. **FilterChip component** - Created in Story 3.2 (DateRangePicker story)
2. **Task/Category filter chips** - Integrated in Story 3.3

This story should focus on:
- Verifying all chip behaviors work correctly
- Ensuring date preset chips work (not just custom range)
- Comprehensive testing coverage
- Visual verification against UX spec
- Edge cases (multiple chips, chip removal, data updates)

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.4] - Acceptance criteria AC-3.4.1 through AC-3.4.8
- [Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#APIs and Interfaces] - FilterChipProps interface
- [Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Workflows - Flow 5] - Remove Filter workflow
- [Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Data Models] - ActiveFilter interface
- [Source: notes/epics-time-tracking.md#Story 3.4] - Story definition and ACs
- [Source: notes/architecture-time-tracking.md#ADR-TT-004] - Client-side aggregation pattern
- [Source: notes/ux-design-time-tracking.md#6.1 FilterChip] - FilterChip component spec
- [Source: notes/sprint-artifacts/3-3-task-and-category-filter-dropdowns.md#Dev-Agent-Record] - Previous story files and patterns
- [Source: notes/sprint-artifacts/3-2-custom-date-range-picker.md] - FilterChip component origin

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/3-4-active-filter-chips-with-remove.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

2026-01-11: Implementation plan:
- Key gap identified: TimeInsightsModal only renders chips for customRange, taskId, category - NOT datePreset
- Added getDatePresetLabel() function to map preset values to display labels
- Added handleRemoveDatePreset handler
- Extended chip rendering condition to include datePreset
- Added FilterChip for datePreset with proper label
- Added 5 new integration tests for Story 3.4 acceptance criteria

### Completion Notes List

- FilterChip component already existed with correct styling and accessibility (verified)
- Added date preset chip rendering to TimeInsightsModal (lines 278-284)
- Added getDatePresetLabel() utility function (lines 179-192)
- Added handleRemoveDatePreset handler (lines 172-177)
- All 314 tests passing (5 new tests added for Story 3.4)
- Tests verify: date preset chip appears, chip removal works, labels correct, styling correct

### File List

**Modified:**
- today-app/src/components/time-tracking/TimeInsightsModal.tsx - Added date preset chip rendering, getDatePresetLabel(), handleRemoveDatePreset
- today-app/src/components/time-tracking/TimeInsightsModal.test.tsx - Added 5 integration tests for filter chips (Story 3.4)

**Verified (no changes needed):**
- today-app/src/components/time-tracking/FilterChip.tsx - Already correct implementation
- today-app/src/components/time-tracking/FilterChip.test.tsx - Already covers AC requirements
- today-app/src/lib/timeFormatters.ts - formatDateRange already exists and works

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-11 | SM Agent | Initial story creation from sprint-status backlog |
| 2026-01-11 | Dev Agent (Claude Opus 4.5) | Implemented date preset chip rendering, added 5 integration tests, 314 tests passing |
