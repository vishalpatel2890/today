# Story 1.2: Multi-Select Tasks

**Status:** Done

---

## User Story

As a **user analyzing time across related tasks**,
I want **to select multiple tasks in the filter**,
So that **I can see combined time insights for a group of tasks**.

---

## Acceptance Criteria

**AC-1.2.1:** Given the task filter dropdown is open, when I view the task list, then each task has a checkbox (not radio button).

**AC-1.2.2:** Given I check multiple task checkboxes, when I close the dropdown, then all checked tasks remain selected.

**AC-1.2.3:** Given multiple tasks are selected, when I view summary cards, then they show combined totals for all selected tasks.

**AC-1.2.4:** Given multiple tasks are selected, when I view the breakdown section, then each selected task is shown individually with its time.

**AC-1.2.5:** Given multiple tasks are selected (e.g., 3), when I view the filter chip, then it displays "3 tasks".

**AC-1.2.6:** Given exactly one task is selected, when I view the filter chip, then it displays the task name (not "1 tasks").

**AC-1.2.7:** Given tasks are selected, when I click the × on the filter chip, then all task selections are cleared.

**AC-1.2.8:** Given I have tasks selected, when I search and some selections are hidden by search, then my selections persist (not cleared).

**AC-1.2.9:** Given no tasks are selected, when I view the dropdown trigger, then it shows "All tasks" placeholder.

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1:** Convert MultiSelectTaskFilter to multi-select
  - [x] Change internal state from single value to `Set<string>`
  - [x] Replace list items with checkbox + label
  - [x] Implement toggle logic for checkbox clicks
  - [x] Update trigger display to show count or task name

- [x] **Task 2:** Update component props interface
  - [x] Change `selectedValue: string | null` to `selectedValues: string[]`
  - [x] Change `onSelect: (value: string | null) => void` to `onSelectionChange: (values: string[]) => void`
  - [x] Add interface to `types/timeTracking.ts`

- [x] **Task 3:** Update TimeInsightsModal state
  - [x] Change `const [taskId, setTaskId] = useState<string | null>(null)` to `const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])`
  - [x] Update handler: `handleTaskSelect` → `handleTaskSelectionChange`
  - [x] Pass new props to MultiSelectTaskFilter

- [x] **Task 4:** Update useTimeInsights hook
  - [x] Change `InsightFilters.taskId` to `InsightFilters.taskIds: string[] | null`
  - [x] Update filter logic from `=== taskId` to `taskIds.includes(task_id)`
  - [x] Use Set for efficient lookup: `new Set(taskIds).has(task_id)`

- [x] **Task 5:** Update FilterChip display
  - [x] Show "X tasks" when `selectedTaskIds.length > 1`
  - [x] Show task name when `selectedTaskIds.length === 1`
  - [x] Clear all selections on chip removal

- [x] **Task 6:** Write tests
  - [x] Test multiple selection behavior
  - [x] Test selection persistence across search
  - [x] Test chip display ("3 tasks" vs task name)
  - [x] Test chip removal clears all
  - [x] Test aggregation with multiple tasks

### Technical Summary

**State Change in TimeInsightsModal.tsx:**
```typescript
// Before (line 54-56)
const [taskId, setTaskId] = useState<string | null>(null)

// After
const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
```

**Filter Logic Change in useTimeInsights.ts:**
```typescript
// Before (lines 136-139)
if (filters?.taskId) {
  baseEntries = baseEntries.filter((e) => e.task_id === filters.taskId)
}

// After
if (filters?.taskIds && filters.taskIds.length > 0) {
  const taskIdSet = new Set(filters.taskIds)
  baseEntries = baseEntries.filter((e) => e.task_id && taskIdSet.has(e.task_id))
}
```

**Checkbox Component Pattern:**
```typescript
<div
  role="option"
  aria-selected={isSelected}
  onClick={() => toggleSelection(task.value)}
  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-muted"
>
  <div className={`
    w-4 h-4 border rounded flex items-center justify-center
    ${isSelected ? 'bg-slate-600 border-slate-600' : 'border-slate-300'}
  `}>
    {isSelected && <Check className="w-3 h-3 text-white" />}
  </div>
  <span className="text-sm">{task.label}</span>
</div>
```

**Chip Display Logic:**
```typescript
// In TimeInsightsModal.tsx FilterChip section
{selectedTaskIds.length > 0 && (
  <FilterChip
    label={
      selectedTaskIds.length === 1
        ? taskOptions.find(t => t.value === selectedTaskIds[0])?.label ?? 'Task'
        : `${selectedTaskIds.length} tasks`
    }
    onRemove={() => setSelectedTaskIds([])}
  />
)}
```

### Project Structure Notes

- **Files to modify:**
  - `src/components/time-tracking/MultiSelectTaskFilter.tsx` (multi-select logic)
  - `src/components/time-tracking/MultiSelectTaskFilter.test.tsx` (new tests)
  - `src/components/time-tracking/TimeInsightsModal.tsx` (state + chip display)
  - `src/hooks/useTimeInsights.ts` (filter logic)
  - `src/types/timeTracking.ts` (interface update)
- **Expected test locations:** Colocated test files
- **Prerequisites:** Story 1.1 (Task Search)

### Key Code References

**TimeInsightsModal.tsx - Current task state (lines 54-56):**
```typescript
const [taskId, setTaskId] = useState<string | null>(null)
```

**TimeInsightsModal.tsx - Current chip display (lines 293-298):**
```typescript
{taskId && selectedTaskName && (
  <FilterChip
    label={selectedTaskName}
    onRemove={handleRemoveTaskFilter}
  />
)}
```

**useTimeInsights.ts - Current filter (lines 136-139):**
```typescript
if (filters?.taskId) {
  baseEntries = baseEntries.filter((e) => e.task_id === filters.taskId)
}
```

**useTimeInsights.ts - InsightFilters interface (lines 11-23):**
```typescript
export interface InsightFilters {
  datePreset?: DatePreset
  customRange?: DateRange | null
  taskId?: string | null        // Change to taskIds?: string[] | null
  category?: string | null
  taskCategories?: Map<string, string | null>
}
```

---

## Context References

**Tech-Spec:** [tech-spec-task-filter-enhancements.md](./tech-spec-task-filter-enhancements.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** `notes/architecture-time-tracking.md`

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-11: Implemented multi-select task filter
  - Converted MultiSelectTaskFilter from single-select to multi-select with checkboxes
  - Updated props: `selectedValue: string | null` → `selectedValues: string[]`
  - Updated callback: `onSelect` → `onSelectionChange`
  - Dropdown now stays open after selecting tasks (unlike single-select)
  - "All tasks" option clears all selections and closes dropdown
  - Trigger displays: "All tasks" (none), task name (one), "X tasks" (multiple)

### Completion Notes

- **Multi-select checkbox UI**: Each task now has a visual checkbox instead of check mark
- **Selection persistence**: Selections persist when searching/filtering tasks (AC-1.2.8)
- **Combined aggregation**: When multiple tasks selected, summary cards show combined totals
- **Chip display**: Shows "X tasks" for multiple selections, single task name for one selection
- **Clear all**: Clicking chip × or "All tasks" option clears all selections (AC-1.2.7)
- **useTimeInsights update**: Now uses `taskIds: string[] | null` with Set-based lookup for efficient filtering
- **All 448 tests pass**, including new multi-select tests
- ✅ Test Gate PASSED by Vishal (2026-01-11)

### Files Modified

- `src/components/time-tracking/MultiSelectTaskFilter.tsx` - Multi-select logic with checkboxes
- `src/components/time-tracking/MultiSelectTaskFilter.test.tsx` - Updated tests for multi-select
- `src/components/time-tracking/TimeInsightsModal.tsx` - State and chip display updates
- `src/hooks/useTimeInsights.ts` - Filter interface and logic for array of task IDs
- `src/hooks/useTimeInsights.test.ts` - Updated tests to use taskIds array

### Test Results

```
Test Files  22 passed (22)
     Tests  448 passed (448)
  Duration  3.97s
```

TypeScript type check: PASS (no errors)

---

## Review Notes

<!-- Will be populated during code review -->
