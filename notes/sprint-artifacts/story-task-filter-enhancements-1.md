# Story 1.1: Task Search in Filter Dropdown

**Status:** Done

---

## User Story

As a **user viewing Time Insights**,
I want **to search tasks by name in the filter dropdown**,
So that **I can quickly find specific tasks without scrolling through a long list**.

---

## Acceptance Criteria

**AC-1.1.1:** Given the Time Insights modal is open, when I click the Tasks filter dropdown, then a search input appears at the top of the dropdown.

**AC-1.1.2:** Given the dropdown is open, when I type in the search input, then the task list filters to show only tasks matching my search (case-insensitive, substring match).

**AC-1.1.3:** Given I'm searching, when no tasks match my search, then I see a "No tasks match [query]" message.

**AC-1.1.4:** Given the dropdown was open with a search, when I close and reopen the dropdown, then the search input is cleared.

**AC-1.1.5:** Given I click to open the dropdown, when the dropdown opens, then the search input is automatically focused.

**AC-1.1.6:** Given I'm using keyboard navigation, when I press Escape, then the dropdown closes and search is cleared.

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1:** Create `MultiSelectTaskFilter.tsx` component shell
  - [x] Set up Radix Popover structure (following TaskSelector pattern)
  - [x] Add trigger button with label and chevron icon
  - [x] Add popover content container

- [x] **Task 2:** Implement search input
  - [x] Add search input with Search icon at top of popover
  - [x] Add state: `const [searchQuery, setSearchQuery] = useState('')`
  - [x] Auto-focus search input when popover opens (`useEffect`)
  - [x] Clear search when popover closes

- [x] **Task 3:** Implement task filtering
  - [x] Filter options array based on searchQuery (case-insensitive)
  - [x] Display filtered tasks as list items
  - [x] Show "No tasks match" message when filter returns empty

- [x] **Task 4:** Maintain single-select behavior (temporary)
  - [x] Keep current single-select behavior using onClick
  - [x] Pass through selectedValue and onSelect props
  - [x] (Will convert to multi-select in Story 1.2)

- [x] **Task 5:** Wire up in TimeInsightsModal
  - [x] Replace FilterDropdown import with MultiSelectTaskFilter
  - [x] Keep existing state management (will change in Story 1.2)

- [x] **Task 6:** Write tests
  - [x] Test search filtering behavior
  - [x] Test empty results message
  - [x] Test auto-focus on open
  - [x] Test search clear on close
  - [x] Test keyboard Escape to close

### Technical Summary

Create a new `MultiSelectTaskFilter` component using Radix Popover (not Radix Select, which is single-select only). This follows the established pattern in `TaskSelector.tsx` which already implements searchable selection with Popover.

**Key Pattern Reference:**
```typescript
// From TaskSelector.tsx:44-47 - Search filtering
const filteredTasks = tasks.filter(task =>
  task.text.toLowerCase().includes(searchQuery.toLowerCase())
)
```

**Component Structure:**
```
MultiSelectTaskFilter
├── Popover.Root
│   ├── Popover.Trigger (button with label + chevron)
│   └── Popover.Content
│       ├── Search Input (with Search icon)
│       └── Task List (filtered)
│           ├── Task Item 1
│           ├── Task Item 2
│           └── ... or "No tasks match" message
```

### Project Structure Notes

- **Files to create:**
  - `src/components/time-tracking/MultiSelectTaskFilter.tsx`
  - `src/components/time-tracking/MultiSelectTaskFilter.test.tsx`
- **Files to modify:**
  - `src/components/time-tracking/TimeInsightsModal.tsx` (import change)
- **Expected test locations:** Colocated as `MultiSelectTaskFilter.test.tsx`
- **Prerequisites:** None

### Key Code References

**TaskSelector.tsx - Search Pattern (lines 44-47):**
```typescript
const filteredTasks = tasks.filter(task =>
  task.text.toLowerCase().includes(searchQuery.toLowerCase())
)
```

**TaskSelector.tsx - Auto-focus (lines 66-70):**
```typescript
useEffect(() => {
  if (isOpen && searchInputRef.current) {
    searchInputRef.current.focus()
  }
}, [isOpen])
```

**TaskSelector.tsx - Keyboard handling (lines 119-123):**
```typescript
case 'Escape':
  e.preventDefault()
  setIsOpen(false)
  setSearchQuery('')
  triggerRef.current?.focus()
  break
```

**FilterDropdown.tsx - Styling (lines 72-91):**
- Border: `border-slate-300` / `border-slate-400` on selection
- Focus: `focus:ring-2 focus:ring-slate-400 focus:ring-offset-2`
- Min-width: `min-w-[140px]`

---

## Context References

**Tech-Spec:** [tech-spec-task-filter-enhancements.md](./tech-spec-task-filter-enhancements.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow (TaskSelector, FilterDropdown)
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** `notes/architecture-time-tracking.md`

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Implementation Plan:**
1. Created MultiSelectTaskFilter.tsx using Radix Popover (not Select) to allow custom search UI
2. Followed TaskSelector.tsx patterns for search filtering and auto-focus
3. Matched FilterDropdown.tsx styling for visual consistency
4. Maintained single-select behavior for Story 1 (multi-select in Story 2)
5. Wired up in TimeInsightsModal replacing FilterDropdown for Tasks

### Completion Notes

**Story 1.1 Implementation Complete (2026-01-11)**

Created `MultiSelectTaskFilter` component with:
- Search input with as-you-type filtering (AC-1.1.1, AC-1.1.2)
- "No tasks match [query]" message for empty results (AC-1.1.3)
- Search clears when dropdown closes (AC-1.1.4)
- Auto-focus search input on open (AC-1.1.5)
- Escape key closes dropdown and clears search (AC-1.1.6)

All 6 Acceptance Criteria satisfied. Component uses Radix Popover for flexibility in Story 2 (multi-select).

✅ Test Gate PASSED by Vishal (2026-01-11)

### Files Modified

**Created:**
- `src/components/time-tracking/MultiSelectTaskFilter.tsx` - New searchable task filter component
- `src/components/time-tracking/MultiSelectTaskFilter.test.tsx` - 19 tests covering all ACs

**Modified:**
- `src/components/time-tracking/TimeInsightsModal.tsx` - Replaced FilterDropdown with MultiSelectTaskFilter for Tasks

### Test Results

```
 Test Files  22 passed (22)
      Tests  439 passed (439)
```

All tests pass including 19 new tests for MultiSelectTaskFilter:
- Rendering (4 tests)
- Dropdown Opening AC-1.1.1 (2 tests)
- Search Filtering AC-1.1.2 (2 tests)
- No Results Message AC-1.1.3 (2 tests)
- Search Clear on Close AC-1.1.4 (1 test)
- Auto-focus Search AC-1.1.5 (1 test)
- Keyboard Escape AC-1.1.6 (1 test)
- Selection Behavior (4 tests)
- Selection from Filtered Results (1 test)
- Empty Options (1 test)

---

## Review Notes

<!-- Will be populated during code review -->
