# Story 1.3: Select All in View

**Status:** Done

---

## User Story

As a **user filtering tasks by search**,
I want **a "Select All" option that selects only visible tasks**,
So that **I can quickly select all tasks matching my search without selecting everything**.

---

## Acceptance Criteria

**AC-1.3.1:** Given the task filter dropdown is open with tasks visible, when I view the task list, then a "Select All" checkbox appears at the top of the list (above individual tasks).

**AC-1.3.2:** Given the Select All checkbox is visible, when I view its label, then it shows the count: "Select All (X visible)" where X is the number of visible tasks.

**AC-1.3.3:** Given some or no visible tasks are selected, when I click Select All, then all currently visible tasks (matching search) are added to the selection.

**AC-1.3.4:** Given all visible tasks are already selected, when I click Select All, then all visible tasks are deselected (toggle behavior).

**AC-1.3.5:** Given I have tasks selected that are hidden by search, when I click Select All, then those hidden selections are preserved (not cleared).

**AC-1.3.6:** Given my search returns no matching tasks, when I view Select All, then it is disabled and shows "Select All (0 visible)".

**AC-1.3.7:** Given I click Select All with a search active, when I clear the search, then I see the tasks I selected plus any that were already selected before.

**AC-1.3.8:** Given the Select All checkbox state, when all visible tasks are selected, then the checkbox shows as checked. When some visible are selected, it shows as indeterminate. When none are selected, it shows as unchecked.

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1:** Add Select All UI row
  - [x] Add checkbox row at top of task list (after search, before tasks)
  - [x] Style with separator line below
  - [x] Display label: "Select All (X visible)"

- [x] **Task 2:** Implement Select All logic
  - [x] Calculate visible task IDs from filtered list
  - [x] Check if all visible are selected (for toggle behavior)
  - [x] On click: add all visible to selection OR remove all visible from selection

- [x] **Task 3:** Implement checkbox states
  - [x] Checked: All visible tasks are selected
  - [x] Indeterminate: Some visible tasks are selected
  - [x] Unchecked: No visible tasks are selected
  - [x] Use `aria-checked="mixed"` for indeterminate state

- [x] **Task 4:** Handle edge cases
  - [x] Disable when visible count is 0 (no search matches)
  - [x] Preserve selections outside current view
  - [x] Update count label dynamically as search changes

- [x] **Task 5:** Write tests
  - [x] Test Select All only selects visible tasks
  - [x] Test toggle behavior (all selected → deselect all)
  - [x] Test preservation of hidden selections
  - [x] Test disabled state with no matches
  - [x] Test checkbox states (checked/indeterminate/unchecked)

### Technical Summary

**Select All Logic:**
```typescript
const visibleTaskIds = filteredTasks.map(t => t.value)
const visibleSet = new Set(visibleTaskIds)

// Check states
const selectedVisibleCount = selectedIds.filter(id => visibleSet.has(id)).length
const allVisibleSelected = selectedVisibleCount === visibleTaskIds.length && visibleTaskIds.length > 0
const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

// Checkbox state for aria-checked
const checkboxState = allVisibleSelected ? 'true' : someVisibleSelected ? 'mixed' : 'false'

// Toggle handler
const handleSelectAllClick = () => {
  if (allVisibleSelected) {
    // Remove all visible from selection
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      visibleTaskIds.forEach(id => newSet.delete(id))
      return newSet
    })
  } else {
    // Add all visible to selection
    setSelectedIds(prev => new Set([...prev, ...visibleTaskIds]))
  }
}
```

**Select All Row UI:**
```typescript
<div className="px-3 py-2 border-b border-slate-200">
  <label
    className={`flex items-center gap-2 cursor-pointer ${
      visibleTaskIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    <div
      role="checkbox"
      aria-checked={checkboxState}
      aria-disabled={visibleTaskIds.length === 0}
      onClick={visibleTaskIds.length > 0 ? handleSelectAllClick : undefined}
      className={`
        w-4 h-4 border rounded flex items-center justify-center
        ${allVisibleSelected ? 'bg-slate-600 border-slate-600' : 'border-slate-300'}
        ${someVisibleSelected ? 'bg-slate-400 border-slate-400' : ''}
      `}
    >
      {allVisibleSelected && <Check className="w-3 h-3 text-white" />}
      {someVisibleSelected && <Minus className="w-3 h-3 text-white" />}
    </div>
    <span className="text-sm text-slate-600">
      Select All ({visibleTaskIds.length} visible)
    </span>
  </label>
</div>
```

**Indeterminate Checkbox Visual:**
- Use `Minus` icon from lucide-react for indeterminate state
- Background: `bg-slate-400` (lighter than fully checked)

### Project Structure Notes

- **Files to modify:**
  - `src/components/time-tracking/MultiSelectTaskFilter.tsx` (Select All row + logic)
  - `src/components/time-tracking/MultiSelectTaskFilter.test.tsx` (new tests)
- **Expected test locations:** Colocated test files
- **Prerequisites:** Story 1.2 (Multi-Select Tasks)

### Key Code References

**lucide-react icons to import:**
```typescript
import { ChevronDown, Check, Search, Minus } from 'lucide-react'
```

**Set operations for selection management:**
```typescript
// Add items to Set
const newSet = new Set([...existingSet, ...newItems])

// Remove items from Set
const newSet = new Set(existingSet)
itemsToRemove.forEach(id => newSet.delete(id))

// Check if all items in array are in Set
const allInSet = array.every(item => set.has(item))
```

**aria-checked for tri-state checkbox:**
- `"true"` - All visible selected
- `"false"` - None visible selected
- `"mixed"` - Some visible selected (indeterminate)

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

- Added Select All functionality to MultiSelectTaskFilter component
- Implemented tri-state checkbox (checked/indeterminate/unchecked) using Minus icon for indeterminate
- Added visibleTaskIds, selectedVisibleCount, and checkbox state calculations using useMemo
- Created handleSelectAllClick with toggle behavior (select all / deselect all visible)
- Preserved hidden selections by only modifying visible task IDs

### Completion Notes

✅ Implemented Story 1.3: Select All in View

**Implementation approach:**
1. Added `Minus` icon import from lucide-react for indeterminate checkbox state
2. Added state calculations: `visibleTaskIds`, `selectedVisibleCount`, `allVisibleSelected`, `someVisibleSelected`
3. Created `selectAllAriaChecked` for tri-state aria support ('true'/'false'/'mixed')
4. Implemented `handleSelectAllClick` with toggle behavior that preserves hidden selections
5. Added Select All UI row with:
   - Tri-state checkbox visual (Check icon for all, Minus icon for some)
   - Label showing "Select All (X visible)" count
   - Disabled styling when visibleCount === 0
   - Border separator below for visual hierarchy

**Key design decisions:**
- Select All row only shows when options.length > 0
- Toggle behavior: if all visible selected → deselect all visible; else → select all visible
- Hidden selections preserved using array filter operations on selectedValues

### Files Modified

- `src/components/time-tracking/MultiSelectTaskFilter.tsx` - Added Select All functionality
- `src/components/time-tracking/MultiSelectTaskFilter.test.tsx` - Added 16 new tests for Story 1.3

### Test Results

All 464 tests pass (44 tests in MultiSelectTaskFilter.test.tsx including 16 new Story 1.3 tests)

✅ Test Gate PASSED by Vishal (2026-01-11)

---

## Review Notes

<!-- Will be populated during code review -->
