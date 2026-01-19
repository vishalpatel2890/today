# Epic Technical Specification: Insights Filtering

Date: 2026-01-10
Author: Vishal
Epic ID: 3-insights-filtering
Status: Draft

---

## Overview

Epic 3 adds comprehensive filtering capabilities to the Time Insights Dashboard, enabling users to drill down into their time data by date range, specific tasks, and categories. Building on Epic 2's insights foundation (summary cards, task breakdown, recent entries), this epic empowers users to answer targeted questions like "How much time did I spend on client work this week?" or "What was my productivity pattern last month?"

This filtering system directly supports the PRD's goal of helping users "discover patterns invisible to conscious perception" by enabling temporal and categorical analysis. Quick date presets (Today, Yesterday, This Week, This Month) cover 80% of use cases, while custom date range selection and task/category dropdowns provide the flexibility power users demand. Active filter chips with remove functionality ensure users always know what filters are applied and can easily clear them.

## Objectives and Scope

### In Scope (Epic 3)

- **FR20**: Quick date filter presets (Today, Yesterday, This Week, This Month)
- **FR21**: Custom date range picker for arbitrary time periods
- **FR22**: Task filter dropdown to show only specific tasks
- **FR23**: Category filter dropdown to filter by task category
- **FR24**: Active filters displayed as removable chips
- **FR25**: Remove individual filters via chip × button
- **FR26**: All summary metrics recalculate when filters change
- **FR27**: Task breakdown list updates based on active filters
- **FR28**: Recent entries list updates based on active filters
- **FR29**: Filter state persists within modal session, resets on close

### Out of Scope (Epic 3)

- Supabase sync and cross-device access (Epic 4)
- Export/backup functionality (Epic 4)
- Trend charts and visualizations (Growth phase)
- Billable/non-billable filtering (Growth phase)
- Saved filter presets (Growth phase)
- Filter by client/project (Growth phase - FR40)

## System Architecture Alignment

### Architecture Reference

This epic aligns with the decisions documented in `notes/architecture-time-tracking.md`:

| Decision | Epic 3 Implementation |
|----------|----------------------|
| ADR-TT-004: Client-Side Insights Aggregation | Extends `useTimeInsights.ts` to accept filter parameters; all filtering computed client-side with `useMemo` |
| FR Category Mapping | QuickFilterBar, FilterDropdown, FilterChip components per Architecture spec |
| Date Handling Consistency | Uses date-fns (`startOfDay`, `startOfWeek`, `startOfMonth`) for range calculations |

### Components Introduced

| Component | Purpose | Location |
|-----------|---------|----------|
| `QuickFilterBar.tsx` | Date preset pill buttons (Today, Yesterday, etc.) | `src/components/time-tracking/` |
| `DateRangePicker.tsx` | Custom date range selection popover | `src/components/time-tracking/` |
| `FilterDropdown.tsx` | Task and category filter dropdowns | `src/components/time-tracking/` |
| `FilterChip.tsx` | Removable active filter indicator | `src/components/time-tracking/` |

### Integration Points

- **TimeInsightsModal**: Hosts all filter components, manages filter state
- **useTimeInsights**: Extended to accept `InsightFilters` parameter and return filtered results
- **useTasks hook**: Provides task metadata (categories) for filter dropdown population
- **Existing Radix patterns**: Popover for date picker, Select for dropdowns

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **QuickFilterBar** | Renders date preset pills, handles selection | Active date preset, onSelect callback | User selection events |
| **DateRangePicker** | Custom date range selection with calendar UI | onSelect callback, min/max dates | `{ start: string, end: string }` |
| **FilterDropdown** | Generic dropdown for task/category filters | Options array, selected value, onSelect | Selected option |
| **FilterChip** | Displays active filter with remove button | Filter label, onRemove callback | Remove click event |
| **useTimeInsights (extended)** | Applies filters to time entries before aggregation | `TimeEntry[]`, `InsightFilters` | Filtered `TimeInsights` object |

**Module Interactions:**

```
TimeInsightsModal
  ├── Filter State (local useState)
  │     ├── datePreset: 'today' | 'yesterday' | 'week' | 'month' | null
  │     ├── customRange: { start: string, end: string } | null
  │     ├── taskId: string | null
  │     └── category: string | null
  │
  ├── QuickFilterBar
  │     ├── Pills: [Today] [Yesterday] [This Week] [This Month] [Custom]
  │     └── onSelect → updates datePreset or opens DateRangePicker
  │
  ├── DateRangePicker (shown when "Custom" selected)
  │     └── onSelect → updates customRange, clears datePreset
  │
  ├── FilterDropdown × 2
  │     ├── Tasks dropdown → updates taskId
  │     └── Category dropdown → updates category
  │
  ├── FilterChip × N (for each active filter)
  │     └── onRemove → clears specific filter
  │
  └── useTimeInsights(timeEntries, filters)
        └── Returns filtered summaries, breakdown, entries
```

### Data Models and Contracts

**TypeScript Interfaces (extending Epic 2 types):**

```typescript
// src/types/timeTracking.ts (additions for Epic 3)

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | null;

export interface DateRange {
  start: string;  // YYYY-MM-DD
  end: string;    // YYYY-MM-DD
}

export interface InsightFilters {
  datePreset: DatePreset;
  customRange: DateRange | null;
  taskId: string | null;
  category: string | null;
}

export interface FilterOption {
  value: string;
  label: string;
}

// Filter chip display model
export interface ActiveFilter {
  type: 'date' | 'task' | 'category';
  label: string;
  value: string;
}
```

**Default Filter State:**

```typescript
const DEFAULT_FILTERS: InsightFilters = {
  datePreset: null,     // No date filter = show all recent
  customRange: null,
  taskId: null,         // All tasks
  category: null,       // All categories
};
```

### APIs and Interfaces

**QuickFilterBar Props:**

```typescript
interface QuickFilterBarProps {
  activePreset: DatePreset;
  hasCustomRange: boolean;
  customRangeLabel: string | null;  // "Dec 1 - Dec 15"
  onPresetSelect: (preset: DatePreset) => void;
  onCustomClick: () => void;
}
```

**DateRangePicker Props:**

```typescript
interface DateRangePickerProps {
  isOpen: boolean;
  selectedRange: DateRange | null;
  onSelect: (range: DateRange) => void;
  onClose: () => void;
  maxDate?: Date;  // Default: today (no future dates)
}
```

**FilterDropdown Props:**

```typescript
interface FilterDropdownProps {
  label: string;                    // "Tasks" or "Category"
  placeholder: string;              // "All tasks" or "All"
  options: FilterOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}
```

**FilterChip Props:**

```typescript
interface FilterChipProps {
  label: string;      // Display text (e.g., "This Week", "Client Work")
  onRemove: () => void;
}
```

**useTimeInsights Extended Signature:**

```typescript
function useTimeInsights(
  timeEntries: TimeEntry[],
  filters: InsightFilters
): TimeInsights {
  // Filter entries based on InsightFilters
  // Recalculate all aggregations using useMemo
  // Return filtered TimeInsights object
}
```

### Workflows and Sequencing

**Flow 1: Apply Date Preset Filter**

1. User opens Insights modal (via `Cmd+Shift+T T`)
2. User sees QuickFilterBar with pills: [Today] [Yesterday] [This Week] [This Month] [Custom]
3. User clicks "This Week" pill
4. `onPresetSelect('week')` called → updates `datePreset` state to `'week'`
5. Pill becomes highlighted (filled primary background)
6. `useTimeInsights` recalculates with filtered entries
7. Summary cards, breakdown, and recent entries all update
8. FilterChip appears below filter bar: "This Week ×"

**Flow 2: Apply Custom Date Range**

1. User clicks "Custom" pill in QuickFilterBar
2. DateRangePicker popover opens
3. User selects start date (e.g., Dec 1)
4. User selects end date (e.g., Dec 15)
5. User confirms selection (click outside or confirm button)
6. `customRange` state updates to `{ start: '2025-12-01', end: '2025-12-15' }`
7. `datePreset` cleared (custom takes precedence)
8. "Custom" pill shows range: "Dec 1 - Dec 15"
9. FilterChip appears: "Dec 1 - Dec 15 ×"
10. All insights data filters to that range

**Flow 3: Apply Task/Category Filter**

1. User clicks "Tasks" dropdown
2. Dropdown shows: "All tasks" (default) + list of tasks with time entries
3. User selects "Review client proposal"
4. `taskId` state updates to selected task ID
5. FilterDropdown shows selected task name
6. FilterChip appears: "Review client proposal ×"
7. All insights filter to show only that task
8. (Similar flow for Category dropdown with `category` state)

**Flow 4: Combine Multiple Filters**

1. User applies "This Week" date filter
2. User applies "Client Work" category filter
3. Both filters active (AND logic)
4. Two FilterChips shown: "This Week ×" and "Client Work ×"
5. `useTimeInsights` applies both: entries must be from this week AND in "Client Work" category

**Flow 5: Remove Filter**

1. User sees active filter chips
2. User clicks × on "This Week" chip
3. `datePreset` cleared to null
4. Chip disappears
5. Insights recalculate without date filter
6. Other filters (e.g., category) remain active

**Flow 6: Toggle Date Preset Off**

1. User has "Today" filter active
2. User clicks "Today" pill again
3. `datePreset` toggled to null (deselected)
4. "Today" chip disappears
5. All data shown (no date filter)

**Filter State Reset:**

- Filter state is local to TimeInsightsModal component (useState)
- When modal closes (Escape, X button, click outside), component unmounts
- On next modal open, filter state initializes to `DEFAULT_FILTERS`
- This satisfies FR29: filter state persists within session, resets on close

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| **NFR3**: Insights calculation | < 500ms for 1 year of data | Client-side filtering with `useMemo`; dependencies include filter state |
| Filter state change | < 16ms | State updates trigger `useMemo` recalculation only when filters change |
| Date picker open | < 50ms | Radix Popover with CSS transitions, minimal DOM |
| Dropdown render | < 16ms | Virtualization not needed for expected task/category counts (< 100) |

**Optimization Strategy:**

```typescript
// useMemo dependencies ensure recalculation only when needed
const filteredInsights = useMemo(() => {
  const filtered = filterTimeEntries(timeEntries, filters);
  return calculateInsights(filtered);
}, [timeEntries, filters.datePreset, filters.customRange, filters.taskId, filters.category]);
```

### Security

- No additional security considerations beyond Epic 1-2
- Filter state is ephemeral (local component state, not persisted)
- Date range validation: start <= end, end <= today (no future filtering)
- Task/category IDs validated against existing time entries
- No user input passed to database queries (client-side filtering only)

### Reliability/Availability

- All filter operations are synchronous and immediate
- Invalid filter combinations gracefully handled:
  - Task ID not found → returns empty results, no error
  - Empty date range → treated as invalid, rejected
  - Both datePreset and customRange set → customRange takes precedence
- Filter state persists within modal session (React state)
- Modal dismissal clears filters (intentional per FR29)
- No network calls for filtering (all client-side)

### Observability

- Console logging in dev mode for filter changes:
  ```
  [Today] TimeInsights filter: { datePreset: 'week', taskId: 'abc-123', category: null }
  ```
- Empty state messages inform users of filter results:
  - "No time entries match your filters."
- Visual feedback via filter chips confirms active filters

## Dependencies and Integrations

### Runtime Dependencies (Existing)

| Package | Version | Purpose in Epic 3 |
|---------|---------|-------------------|
| `@radix-ui/react-popover` | ^1.1.15 | DateRangePicker calendar popover |
| `@radix-ui/react-select` | ^2.2.6 | FilterDropdown task/category select |
| `date-fns` | ^4.1.0 | Date calculations (startOfWeek, startOfMonth, format, parseISO, isWithinInterval) |
| `lucide-react` | ^0.562.0 | Icons (Calendar, ChevronDown, X) |
| `react` | ^19.2.0 | UI framework |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.1.18 | Component styling |
| `typescript` | ~5.9.3 | Type safety |
| `vitest` | ^3.2.4 | Unit and component testing |
| `@testing-library/react` | ^16.3.1 | Component testing utilities |

### New Dependencies

**None required.** All filtering functionality implemented using existing dependencies.

### Internal Dependencies

- **Epic 1 artifacts**: `timeTrackingDb.ts`, `TimeEntry` interface, `formatDuration` utilities
- **Epic 2 artifacts**: `TimeInsightsModal.tsx`, `useTimeInsights.ts`, `InsightCard.tsx`, `InsightRow.tsx`
- **Existing hooks**: `useTasks` for category information
- **Architecture patterns**: date-fns date handling conventions, useMemo for calculations

### Key date-fns Functions Used

```typescript
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  isWithinInterval,
} from 'date-fns';

// Date preset calculations
const presetRanges = {
  today: { start: startOfDay(new Date()), end: endOfDay(new Date()) },
  yesterday: { start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) },
  week: { start: startOfWeek(new Date()), end: endOfDay(new Date()) },
  month: { start: startOfMonth(new Date()), end: endOfDay(new Date()) },
};
```

## Acceptance Criteria (Authoritative)

### Story 3.1: Quick Date Filter Bar

1. **AC-3.1.1**: Opening the Insights modal displays a row of quick filter pills: "Today", "Yesterday", "This Week", "This Month", "Custom"
2. **AC-3.1.2**: Clicking a date preset pill highlights it (filled primary background, white text)
3. **AC-3.1.3**: Clicking a highlighted preset pill deselects it (returns to default styling)
4. **AC-3.1.4**: Selecting a preset updates all summary metrics to show only data from that period (FR26)
5. **AC-3.1.5**: Selecting a preset updates the task breakdown list to show only filtered results (FR27)
6. **AC-3.1.6**: Selecting a preset updates the recent entries list to show only filtered entries (FR28)
7. **AC-3.1.7**: Date filters use correct date ranges:
   - "Today" = entries where `date === today`
   - "Yesterday" = entries where `date === yesterday`
   - "This Week" = entries from start of week to today
   - "This Month" = entries from start of month to today
8. **AC-3.1.8**: Only one date filter can be active at a time (presets are mutually exclusive)
9. **AC-3.1.9**: Filter state persists while modal is open, resets on modal close (FR29)

### Story 3.2: Custom Date Range Picker

10. **AC-3.2.1**: Clicking "Custom" pill opens a date range picker popover/inline UI
11. **AC-3.2.2**: Date picker allows selecting a start date and end date
12. **AC-3.2.3**: Date picker only allows selecting past dates (no future dates)
13. **AC-3.2.4**: Start date cannot be after end date
14. **AC-3.2.5**: Confirming a custom range displays the range on the "Custom" pill (e.g., "Dec 1 - Dec 15")
15. **AC-3.2.6**: Custom range filters all insights data to show only entries within that range
16. **AC-3.2.7**: Selecting a preset after custom range replaces the custom filter
17. **AC-3.2.8**: Date picker is keyboard accessible (Tab, Arrow keys, Enter)

### Story 3.3: Task and Category Filter Dropdowns

18. **AC-3.3.1**: Insights modal shows two filter dropdowns below the date filter bar: "Tasks" and "Category"
19. **AC-3.3.2**: Tasks dropdown shows "All tasks" option plus list of tasks that have time entries
20. **AC-3.3.3**: Selecting a specific task filters all insights to show only that task's entries (FR22)
21. **AC-3.3.4**: Category dropdown shows "All" option plus categories from tasks that have time entries
22. **AC-3.3.5**: Selecting a category filters insights to show only entries for tasks in that category (FR23)
23. **AC-3.3.6**: Task and category filters can be combined with date filters (AND logic)
24. **AC-3.3.7**: Selecting "All tasks" or "All" clears the respective filter
25. **AC-3.3.8**: Dropdown selections are reflected in the dropdown display text

### Story 3.4: Active Filter Chips with Remove

26. **AC-3.4.1**: Active filters are displayed as chips below the filter controls (FR24)
27. **AC-3.4.2**: Each chip shows the filter value (e.g., "This Week", "Client Work", task name)
28. **AC-3.4.3**: Each chip has a × (remove) button
29. **AC-3.4.4**: Clicking the × removes that specific filter (FR25)
30. **AC-3.4.5**: Removing a filter updates all insights data (FR26-28)
31. **AC-3.4.6**: Multiple filter chips can be displayed simultaneously (e.g., date + category)
32. **AC-3.4.7**: Chips use primary background with white text per UX spec
33. **AC-3.4.8**: Custom date range chip shows formatted range (e.g., "Dec 1 - Dec 15")

### Cross-Story: Empty States

34. **AC-3.X.1**: When filters result in no matching entries, display "No time entries match your filters."
35. **AC-3.X.2**: Summary cards show "0h 0m" when no matching entries

## Traceability Mapping

| AC | FR | Spec Section | Component(s) | Test Idea |
|----|-----|--------------|--------------|-----------|
| AC-3.1.1 | FR20 | Detailed Design - QuickFilterBar | QuickFilterBar.tsx | Open insights, verify 5 pills visible |
| AC-3.1.2 | FR20 | Workflows - Flow 1 | QuickFilterBar.tsx | Click pill, verify highlighted state |
| AC-3.1.3 | FR20 | Workflows - Flow 6 | QuickFilterBar.tsx | Click active pill, verify deselected |
| AC-3.1.4 | FR26 | Workflows - Flow 1 | TimeInsightsModal, useTimeInsights | Apply filter, verify metrics recalculate |
| AC-3.1.5 | FR27 | Workflows - Flow 1 | TimeInsightsModal | Apply filter, verify breakdown updates |
| AC-3.1.6 | FR28 | Workflows - Flow 1 | TimeInsightsModal | Apply filter, verify entries list updates |
| AC-3.1.7 | FR20 | Dependencies - date-fns | useTimeInsights | Unit test date range calculations |
| AC-3.1.8 | FR20 | Data Models - InsightFilters | QuickFilterBar.tsx | Select one preset, verify others deselected |
| AC-3.1.9 | FR29 | Workflows - Filter State Reset | TimeInsightsModal | Close modal, reopen, verify filters reset |
| AC-3.2.1 | FR21 | APIs - DateRangePickerProps | DateRangePicker.tsx | Click Custom, verify picker opens |
| AC-3.2.2 | FR21 | APIs - DateRangePickerProps | DateRangePicker.tsx | Select start/end dates |
| AC-3.2.3 | FR21 | NFR - Reliability | DateRangePicker.tsx | Try to select future date, verify disabled |
| AC-3.2.4 | FR21 | NFR - Reliability | DateRangePicker.tsx | Select end before start, verify error |
| AC-3.2.5 | FR21 | Workflows - Flow 2 | QuickFilterBar.tsx | Complete custom range, verify pill label |
| AC-3.2.6 | FR21 | Workflows - Flow 2 | useTimeInsights | Apply custom range, verify data filters |
| AC-3.2.7 | FR21 | Workflows - Flow 2 | QuickFilterBar.tsx | Apply custom, select preset, verify replaces |
| AC-3.2.8 | FR21 | NFR - Accessibility | DateRangePicker.tsx | Navigate picker with keyboard only |
| AC-3.3.1 | FR22,23 | APIs - FilterDropdownProps | TimeInsightsModal | Open insights, verify two dropdowns visible |
| AC-3.3.2 | FR22 | Workflows - Flow 3 | FilterDropdown.tsx | Open Tasks dropdown, verify options |
| AC-3.3.3 | FR22 | Workflows - Flow 3 | useTimeInsights | Select task, verify only that task shown |
| AC-3.3.4 | FR23 | Workflows - Flow 3 | FilterDropdown.tsx | Open Category dropdown, verify options |
| AC-3.3.5 | FR23 | Workflows - Flow 3 | useTimeInsights | Select category, verify tasks filter |
| AC-3.3.6 | FR26 | Workflows - Flow 4 | useTimeInsights | Apply date + category, verify AND logic |
| AC-3.3.7 | FR22,23 | Workflows - Flow 3 | FilterDropdown.tsx | Select "All", verify filter cleared |
| AC-3.3.8 | FR22,23 | APIs - FilterDropdownProps | FilterDropdown.tsx | Select option, verify dropdown text updates |
| AC-3.4.1 | FR24 | APIs - FilterChipProps | TimeInsightsModal | Apply filter, verify chip appears |
| AC-3.4.2 | FR24 | Detailed Design - FilterChip | FilterChip.tsx | Verify chip shows correct label |
| AC-3.4.3 | FR24 | APIs - FilterChipProps | FilterChip.tsx | Verify × button present |
| AC-3.4.4 | FR25 | Workflows - Flow 5 | FilterChip.tsx | Click ×, verify filter removed |
| AC-3.4.5 | FR26-28 | Workflows - Flow 5 | useTimeInsights | Remove filter, verify data updates |
| AC-3.4.6 | FR24 | Workflows - Flow 4 | TimeInsightsModal | Apply 2 filters, verify 2 chips |
| AC-3.4.7 | FR24 | UX Design - FilterChip | FilterChip.tsx | Verify styling matches spec |
| AC-3.4.8 | FR21 | Workflows - Flow 2 | FilterChip.tsx | Apply custom range, verify chip format |
| AC-3.X.1 | FR26-28 | NFR - Empty States | TimeInsightsModal | Apply filter with no matches, verify message |
| AC-3.X.2 | FR26 | NFR - Empty States | InsightCard | Apply filter with no matches, verify 0h 0m |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **R1** | Date range picker complexity | Medium | Medium | Use Radix Popover with simple two-calendar layout; if too complex, simplify to start/end text inputs with calendar icon |
| **R2** | Performance with large datasets | Low | Low | useMemo already implemented; benchmark with 1000+ entries to validate NFR3 target |
| **R3** | Category filtering when categories change | Low | Low | Category filter uses category name strings; if task's category changes, entries still filtered correctly by current category |

### Assumptions

| ID | Assumption | Rationale |
|----|------------|-----------|
| **A1** | Users have < 100 distinct tasks with time entries | No dropdown virtualization needed; revisit if usage patterns differ |
| **A2** | Users have < 20 categories | Category dropdown renders without virtualization |
| **A3** | Week starts on Sunday | Using date-fns default `startOfWeek`; can be made configurable later |
| **A4** | "This Month" means start of current calendar month to today | Not last 30 days; matches user mental model for monthly billing |
| **A5** | Category information comes from task data | Time entries reference task_id; category looked up from task at display time |

### Open Questions

**None** - All design decisions resolved through PRD, UX spec, and architecture documents.

## Test Strategy Summary

### Test Levels

| Level | Framework | Scope |
|-------|-----------|-------|
| **Unit** | Vitest | Date calculation functions, filter logic in useTimeInsights |
| **Component** | Vitest + Testing Library | Individual filter components in isolation |
| **Integration** | Vitest + Testing Library | TimeInsightsModal with all filter components |
| **Manual** | Browser | Full filtering workflows, visual verification |

### Coverage by Story

**Story 3.1 (Quick Date Filter Bar):**
- Unit: Date range calculations for each preset (startOfWeek, startOfMonth, etc.)
- Component: QuickFilterBar pill selection, highlight states
- Integration: Select preset → verify useTimeInsights receives correct filter → verify UI updates

**Story 3.2 (Custom Date Range):**
- Unit: Date validation (start <= end, end <= today)
- Component: DateRangePicker open/close, date selection, range formatting
- Integration: Select custom range → verify filter applied → verify chip shows formatted range

**Story 3.3 (Task/Category Dropdowns):**
- Unit: Filter logic combining multiple filter types (AND logic)
- Component: FilterDropdown option rendering, selection handling
- Integration: Select task/category → verify insights filter correctly

**Story 3.4 (Filter Chips):**
- Component: FilterChip rendering, × button click handling
- Integration: Remove chip → verify filter cleared → verify insights update

### Critical Test Cases

```typescript
// useTimeInsights.test.ts - Filter logic tests

describe('useTimeInsights filtering', () => {
  const mockEntries: TimeEntry[] = [
    { id: '1', date: '2026-01-10', taskId: 'task-a', taskName: 'Task A', ... },
    { id: '2', date: '2026-01-09', taskId: 'task-b', taskName: 'Task B', ... },
    { id: '3', date: '2026-01-05', taskId: 'task-a', taskName: 'Task A', ... },
  ];

  it('filters by today preset', () => {
    const filters = { datePreset: 'today', ... };
    // Verify only today's entries returned
  });

  it('filters by custom date range', () => {
    const filters = { customRange: { start: '2026-01-05', end: '2026-01-09' }, ... };
    // Verify entries within range returned
  });

  it('combines date and task filters (AND logic)', () => {
    const filters = { datePreset: 'week', taskId: 'task-a', ... };
    // Verify only task-a entries from this week returned
  });

  it('returns empty results for no matches', () => {
    const filters = { datePreset: 'today', taskId: 'nonexistent', ... };
    // Verify empty insights with 0 totals
  });
});
```

### Edge Cases

| Case | Expected Behavior | Test Approach |
|------|-------------------|---------------|
| No time entries | Empty state message, 0h 0m in cards | Component test with empty data |
| Filter returns no results | "No time entries match your filters" | Integration test with restrictive filter |
| Custom range: same start/end date | Single day filtered | Unit test date logic |
| Task deleted after time tracked | Entry still shows with task_name snapshot | Integration test with missing task |
| Modal close during filter selection | Filter state discarded, no side effects | Manual test |
| Very long task/category names | Truncate in dropdown and chips with ellipsis | Component test with long strings |

### Manual Testing Checklist

- [ ] Open insights modal, verify all 5 date pills visible
- [ ] Click each preset, verify data updates correctly
- [ ] Click same preset again, verify deselected
- [ ] Click Custom, verify date picker opens
- [ ] Select invalid range (end before start), verify error
- [ ] Apply custom range, verify chip shows formatted dates
- [ ] Select task from dropdown, verify filter applied
- [ ] Select category from dropdown, verify filter applied
- [ ] Apply multiple filters, verify all chips appear
- [ ] Remove each chip, verify filter cleared
- [ ] Close modal, reopen, verify filters reset
- [ ] Apply filter with no matches, verify empty state
