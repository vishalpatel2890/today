# Today - Epic Breakdown

**Date:** 2026-01-11
**Project Level:** Quick-Flow Brownfield

---

## Epic 1: Task Filter Enhancements

**Slug:** task-filter-enhancements

### Goal

Enable users to search, multi-select, and bulk-select tasks in the Time Insights filter, providing efficient filtering for users tracking many tasks.

### Scope

- Add search input to task filter dropdown with as-you-type filtering
- Convert single-select task filter to multi-select with checkboxes
- Add "Select All in View" that respects current search filter
- Update insights aggregation to support multiple task selection
- Display summary chip ("X tasks") for multi-select

### Success Criteria

- Users can search tasks by name in the filter dropdown
- Users can select multiple tasks and see combined + individual insights
- "Select All" only selects tasks matching the current search
- Selections persist when search filter changes
- Filter chip displays appropriate summary

### Dependencies

- Existing Time Insights modal implementation (completed)
- Existing FilterDropdown and TaskSelector components (reference patterns)

---

## Story Map - Epic 1

```
Epic: Task Filter Enhancements
│
├── Story 1: Task Search in Filter Dropdown (Foundation)
│   └── Search input + as-you-type filtering
│
├── Story 2: Multi-Select Tasks (Core Feature)
│   └── Checkboxes + array state + aggregation updates
│   └── Depends on: Story 1
│
└── Story 3: Select All in View (Enhancement)
    └── Select All checkbox + filter-aware logic
    └── Depends on: Story 2
```

---

## Stories - Epic 1

### Story 1.1: Task Search in Filter Dropdown

As a **user viewing Time Insights**,
I want **to search tasks by name in the filter dropdown**,
So that **I can quickly find specific tasks without scrolling through a long list**.

**Acceptance Criteria:**

**Given** the Time Insights modal is open
**When** I click the Tasks filter dropdown
**Then** a search input appears at the top of the dropdown

**And** when I type in the search input
**Then** the task list filters to show only tasks matching my search (case-insensitive)

**And** when no tasks match my search
**Then** I see a "No tasks match" message

**And** when I close and reopen the dropdown
**Then** the search input is cleared

**And** when the dropdown opens
**Then** the search input is automatically focused

**Prerequisites:** None (foundation story)

**Technical Notes:**
- Create new `MultiSelectTaskFilter.tsx` component using Radix Popover
- Follow search pattern from `TaskSelector.tsx:44-47`
- Initially keep single-select behavior (checkboxes added in Story 2)

---

### Story 1.2: Multi-Select Tasks

As a **user analyzing time across related tasks**,
I want **to select multiple tasks in the filter**,
So that **I can see combined time insights for a group of tasks**.

**Acceptance Criteria:**

**Given** the task filter dropdown is open
**When** I view the task list
**Then** each task has a checkbox instead of radio button

**And** when I check multiple task checkboxes
**Then** all checked tasks are selected simultaneously

**And** when multiple tasks are selected
**Then** summary cards show combined totals for all selected tasks

**And** when multiple tasks are selected
**Then** the breakdown section shows each selected task individually with its time

**And** when multiple tasks are selected
**Then** the filter chip displays "X tasks" (e.g., "3 tasks")

**And** when only one task is selected
**Then** the filter chip displays the task name

**And** when I click the × on the filter chip
**Then** all task selections are cleared

**And** when I search and have existing selections
**Then** my selections persist even if selected tasks are hidden by search

**Prerequisites:** Story 1.1 (Task Search)

**Technical Notes:**
- Update state in `TimeInsightsModal.tsx` from `taskId: string | null` to `selectedTaskIds: string[]`
- Update `useTimeInsights.ts` filter logic to use `taskIds.includes()`
- Update FilterChip display logic for multi-select summary

---

### Story 1.3: Select All in View

As a **user filtering tasks by search**,
I want **a "Select All" option that selects only visible tasks**,
So that **I can quickly select all tasks matching my search without selecting everything**.

**Acceptance Criteria:**

**Given** the task filter dropdown is open with tasks visible
**When** I view the task list
**Then** a "Select All" checkbox appears at the top of the list

**And** the Select All label shows the count: "Select All (X visible)"

**And** when I click Select All
**Then** only tasks currently visible (matching search) are selected

**And** when all visible tasks are already selected
**Then** clicking Select All deselects all visible tasks (toggle behavior)

**And** when I have tasks selected outside the current search
**Then** those selections are preserved when I click Select All

**And** when no tasks are visible (search has no matches)
**Then** Select All is disabled

**Prerequisites:** Story 1.2 (Multi-Select Tasks)

**Technical Notes:**
- Add "Select All" checkbox row at top of task list
- Implement toggle logic: if all visible selected, deselect all visible; otherwise select all visible
- Use Set operations to merge/remove visible task IDs with existing selections

---

## Implementation Timeline - Epic 1

**Total Stories:** 3

**Story Breakdown:**
- Story 1.1: Task Search - Foundation component
- Story 1.2: Multi-Select - Core feature + state changes
- Story 1.3: Select All - Enhancement + edge cases

**Recommended Order:** Sequential (1.1 → 1.2 → 1.3)
