# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-11
**Project Level:** Quick-Flow Brownfield
**Change Type:** Feature Enhancement
**Development Context:** Time Insights Task Filtering

---

## Context

### Available Documents

- UX Design Spec: `notes/ux-design-time-tracking.md` - Comprehensive time tracking UX including filter components
- Existing filtering implementation: `notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md`
- Architecture: `notes/architecture-time-tracking.md`

### Project Stack

| Component | Version | Usage |
|-----------|---------|-------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Language |
| Vite | 7.2.4 | Build tool |
| Vitest | 3.2.4 | Testing framework |
| Testing Library | 16.3.1 | Component testing |
| Radix UI | Various | Dialog, Select, Popover components |
| TailwindCSS | 4.1.18 | Styling |
| Dexie | 4.2.1 | IndexedDB wrapper |
| date-fns | 4.1.0 | Date utilities |
| lucide-react | 0.562.0 | Icons |

### Existing Codebase Structure

**Time Tracking Components (`src/components/time-tracking/`):**
- `TimeInsightsModal.tsx` - Main insights modal (420px width)
- `FilterDropdown.tsx` - Single-select task/category filter using Radix Select
- `TaskSelector.tsx` - Task picker with search (used in tracking modal, has as-you-type filtering)
- `QuickFilterBar.tsx` - Date preset filters
- `FilterChip.tsx` - Removable active filter indicator
- `DateRangePicker.tsx` - Custom date range selection
- `InsightCard.tsx` - Summary metric cards
- `InsightRow.tsx` - Time entry list item

**Hooks (`src/hooks/`):**
- `useTimeInsights.ts` - Aggregates time entries with date/task/category filtering
- `useTimeTracking.ts` - Timer and session management
- `useTimeEntries.ts` - CRUD operations for time entries

**Current Task Filtering:**
- Single-select dropdown using Radix Select
- No search capability in FilterDropdown
- Task options derived from entries that have tracked time
- Single FilterChip displays selected task name

---

## The Change

### Problem Statement

Users tracking time across many tasks cannot efficiently filter insights to view aggregated data for multiple related tasks. The current single-select task filter requires viewing one task at a time, making it tedious to:

1. **Find specific tasks** - No search in the task filter dropdown; users must scroll through all tasks
2. **Compare related tasks** - Cannot select multiple tasks to see combined time
3. **Bulk select filtered results** - No way to quickly select all tasks matching a search pattern

### Proposed Solution

Enhance the Time Insights task filter with three connected capabilities:

1. **Task Search** - Add as-you-type search filtering to the task dropdown (matching TaskSelector UX)
2. **Multi-Select** - Convert from single-select to multi-select checkboxes
3. **Select All in View** - Add "Select All" option that selects only tasks matching the current search filter

**User Experience:**
- User opens task filter dropdown
- Types "Client" to filter tasks containing "Client"
- Clicks "Select All" to select all matching tasks (not all tasks)
- Insights show combined aggregations + individual task breakdown
- Single chip displays "3 tasks" (not individual chips per task)
- Clearing the chip removes all task selections

### Scope

**In Scope:**

- Search input with as-you-type filtering in task dropdown
- Multi-select checkboxes replacing single-select radio behavior
- "Select All" checkbox at top of task list (respects search filter)
- Combined summary metrics for multiple selected tasks
- Individual task breakdown in insights (shows each selected task)
- Single summary chip ("X tasks") for multi-select display
- Search preserves existing selections when filtering
- Keyboard navigation for multi-select

**Out of Scope:**

- Category multi-select (remains single-select)
- Saving/persisting filter selections across sessions
- Export filtered data
- Task grouping/folders
- Drag-and-drop task ordering

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/components/time-tracking/MultiSelectTaskFilter.tsx` | CREATE | New component replacing FilterDropdown for tasks |
| `src/components/time-tracking/MultiSelectTaskFilter.test.tsx` | CREATE | Test suite for new component |
| `src/components/time-tracking/TimeInsightsModal.tsx` | MODIFY | Replace FilterDropdown with MultiSelectTaskFilter, update state to string[] |
| `src/hooks/useTimeInsights.ts` | MODIFY | Update taskId filter to support array of task IDs |
| `src/types/timeTracking.ts` | MODIFY | Add MultiSelectTaskFilterProps interface |

### Technical Approach

**Component Architecture:**

Replace `FilterDropdown` (Radix Select - single-select only) with new `MultiSelectTaskFilter` component using Radix Popover (supports custom multi-select UI). This follows the pattern established by `TaskSelector.tsx` which already uses Popover for searchable selection.

**Why Radix Popover over Radix Select:**
- Radix Select is inherently single-select by design
- Popover allows custom content including checkboxes and search
- TaskSelector already proves this pattern works in the codebase

**State Management:**

```typescript
// TimeInsightsModal.tsx - Change from single to array
const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

// useTimeInsights.ts - Update filter interface
interface InsightFilters {
  taskIds?: string[] | null  // Changed from taskId: string | null
  // ... other filters
}
```

**Search + Selection Logic:**

```typescript
// MultiSelectTaskFilter internal state
const [searchQuery, setSearchQuery] = useState('')
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

// Filter visible tasks (search)
const visibleTasks = tasks.filter(t =>
  t.label.toLowerCase().includes(searchQuery.toLowerCase())
)

// Select All only affects visible (filtered) tasks
const handleSelectAll = () => {
  const visibleIds = visibleTasks.map(t => t.value)
  setSelectedIds(new Set([...selectedIds, ...visibleIds]))
}
```

### Existing Patterns to Follow

**From TaskSelector.tsx (lines 44-47, 91-125):**
- As-you-type search with `useState` for searchQuery
- Keyboard navigation with Arrow Up/Down, Enter, Escape
- `useRef` for search input auto-focus when dropdown opens
- Filtered results based on `.toLowerCase().includes()`

**From FilterDropdown.tsx:**
- Label above dropdown trigger
- Chevron icon indicating dropdown
- Slate color scheme for borders and text
- Focus ring styling: `focus:ring-2 focus:ring-slate-400`

**From FilterChip.tsx:**
- Chip display pattern for active filters
- X button for removal
- Primary background with white text

### Integration Points

**TimeInsightsModal.tsx (lines 54-56, 147-149):**
- Current: `const [taskId, setTaskId] = useState<string | null>(null)`
- Change to: `const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])`
- Update `handleTaskSelect` to manage array

**useTimeInsights.ts (lines 136-139):**
- Current: Single taskId filter with `===` comparison
- Change to: Array filter with `.includes()` check
- Update InsightFilters interface

**FilterChip display (TimeInsightsModal.tsx lines 293-298):**
- Current: Shows `selectedTaskName` for single task
- Change to: Show `${selectedTaskIds.length} tasks` when multiple selected
- Show task name when only 1 selected

---

## Development Context

### Relevant Existing Code

| Reference | Location | Relevance |
|-----------|----------|-----------|
| TaskSelector search pattern | `src/components/time-tracking/TaskSelector.tsx:44-47` | Reuse search filtering logic |
| Keyboard navigation | `src/components/time-tracking/TaskSelector.tsx:91-125` | Adapt for multi-select |
| FilterDropdown styling | `src/components/time-tracking/FilterDropdown.tsx:72-91` | Match visual appearance |
| Task filter state | `src/components/time-tracking/TimeInsightsModal.tsx:54-56` | Modify to array |
| Insights filtering | `src/hooks/useTimeInsights.ts:136-149` | Update for multi-task filter |

### Dependencies

**Framework/Libraries (from package.json):**
- `@radix-ui/react-popover: ^1.1.15` - Dropdown container
- `lucide-react: ^0.562.0` - Check, ChevronDown, Search icons
- `react: ^19.2.0` - useState, useRef, useCallback, useMemo

**Internal Modules:**
- `src/types/timeTracking.ts` - FilterOption interface
- `src/lib/timeFormatters.ts` - Duration formatting

### Configuration Changes

None required - no new dependencies or environment variables.

### Existing Conventions (Brownfield)

**Code Style:**
- Functional components with arrow functions
- Named exports (not default)
- TypeScript interfaces above components
- JSDoc comments referencing source documents

**File Naming:**
- Components: PascalCase.tsx
- Tests: ComponentName.test.tsx (colocated)
- Hooks: useHookName.ts

**Styling:**
- TailwindCSS utility classes
- Slate color palette for neutral UI
- 4px/8px spacing units
- `rounded-md` for borders (6px)

### Test Framework & Standards

**Framework:** Vitest 3.2.4 + Testing Library

**Test Patterns (from FilterDropdown.test.tsx):**
- `describe` blocks grouped by feature/AC
- `vi.fn()` for mock callbacks
- `userEvent.setup()` for interactions
- `screen.getByRole()` for accessible queries
- AC references in describe block names: `describe('Selection (AC-3.3.3)')`

**Test Setup (src/test/setup.ts):**
- `fake-indexeddb/auto` for IndexedDB mocking
- ResizeObserver mock for Radix components
- `beforeEach` clears test databases

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build | Vite | 7.2.4 |
| Testing | Vitest + Testing Library | 3.2.4 / 16.3.1 |
| UI Components | Radix UI Popover | 1.1.15 |
| Styling | TailwindCSS | 4.1.18 |
| Icons | lucide-react | 0.562.0 |

---

## Technical Details

### MultiSelectTaskFilter Component API

```typescript
interface MultiSelectTaskFilterProps {
  /** Display label above the dropdown */
  label: string
  /** Placeholder when no tasks selected */
  placeholder: string
  /** Available task options (derived from time entries) */
  options: FilterOption[]
  /** Currently selected task IDs */
  selectedValues: string[]
  /** Callback when selection changes */
  onSelectionChange: (values: string[]) => void
}
```

### State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│ CLOSED STATE                                                 │
│ Trigger shows: "All tasks" | "Task Name" | "3 tasks"        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Click trigger or Enter
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ OPEN STATE                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search tasks...                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Select All (3 visible)                               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ☑ Client Project A                                     │ │
│ │ ☐ Client Project B                                     │ │
│ │ ☑ Client Meetings                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Click outside / Escape
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ CLOSED STATE (selections preserved)                          │
│ Chip appears: [3 tasks ×]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Search + Selection Behavior Matrix

| Action | Result |
|--------|--------|
| Type in search | Filter visible tasks, preserve selections |
| Check task | Add to selectedIds |
| Uncheck task | Remove from selectedIds |
| Click "Select All" | Add all visible tasks to selectedIds |
| Click "Select All" (all visible selected) | Remove all visible from selectedIds (toggle) |
| Clear search | Show all tasks, selections unchanged |
| Click chip × | Clear all selections |

### Aggregation Logic Updates

**useTimeInsights.ts changes:**

```typescript
// Current (single task):
if (filters?.taskId) {
  baseEntries = baseEntries.filter((e) => e.task_id === filters.taskId)
}

// New (multiple tasks):
if (filters?.taskIds && filters.taskIds.length > 0) {
  const taskIdSet = new Set(filters.taskIds)
  baseEntries = baseEntries.filter((e) => e.task_id && taskIdSet.has(e.task_id))
}
```

**Summary cards behavior:**
- `totalToday` and `avgPerDay` aggregate ALL selected tasks (combined)
- `byTask` array shows individual breakdown per selected task

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Arrow keys move focus, Space toggles checkbox, Enter confirms |
| Screen reader | `role="listbox"` with `aria-multiselectable="true"` |
| Focus management | Auto-focus search input on open, return focus to trigger on close |
| Checkbox states | `aria-checked="true/false/mixed"` for Select All |
| Live regions | Announce selection count changes |

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies (already installed)
npm install

# Run development server
npm run dev

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Type checking
npx tsc --noEmit
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/multi-select-task-filter`
2. Verify dev environment: `npm run dev`
3. Review existing code:
   - `src/components/time-tracking/TaskSelector.tsx` (search pattern)
   - `src/components/time-tracking/FilterDropdown.tsx` (styling)
   - `src/hooks/useTimeInsights.ts` (filter logic)

### Implementation Steps

**Story 1: Task Search in Filter Dropdown**
1. Create `MultiSelectTaskFilter.tsx` with Radix Popover
2. Add search input with as-you-type filtering
3. Display filtered task list with checkboxes (single-select initially)
4. Write tests for search behavior

**Story 2: Multi-Select Functionality**
1. Convert checkbox state to support multiple selections
2. Update `useTimeInsights.ts` to accept `taskIds: string[]`
3. Update `TimeInsightsModal.tsx` state management
4. Update FilterChip to show "X tasks" summary
5. Write tests for multi-select behavior

**Story 3: Select All in View**
1. Add "Select All" checkbox row at top of task list
2. Implement toggle logic (select all visible / deselect all visible)
3. Show count in label: "Select All (X visible)"
4. Handle edge cases (no visible tasks, all already selected)
5. Write tests for Select All behavior

### Testing Strategy

**Unit Tests (per component):**
- MultiSelectTaskFilter: Search filtering, checkbox toggling, Select All logic
- useTimeInsights: Multi-task filtering aggregation

**Integration Tests:**
- TimeInsightsModal with MultiSelectTaskFilter interaction
- Filter chip display updates with selection changes

**Manual Testing Checklist:**
- [ ] Search filters tasks as-you-type
- [ ] Checkbox selections persist across searches
- [ ] Select All only selects visible tasks
- [ ] Summary cards show combined totals
- [ ] Breakdown shows individual tasks
- [ ] Chip shows "X tasks" format
- [ ] Chip removal clears all selections
- [ ] Keyboard navigation works (Tab, Arrow, Space, Enter, Escape)

### Acceptance Criteria

**Story 1 - Task Search:**
- [ ] AC-1.1: Search input appears at top of dropdown
- [ ] AC-1.2: Tasks filter as user types (case-insensitive)
- [ ] AC-1.3: "No tasks match" message when no results
- [ ] AC-1.4: Search clears when dropdown closes
- [ ] AC-1.5: Search input auto-focuses on dropdown open

**Story 2 - Multi-Select:**
- [ ] AC-2.1: Checkboxes replace radio buttons for task selection
- [ ] AC-2.2: Multiple tasks can be selected simultaneously
- [ ] AC-2.3: Summary cards aggregate all selected tasks
- [ ] AC-2.4: Breakdown section shows each selected task individually
- [ ] AC-2.5: Filter chip shows "X tasks" when multiple selected
- [ ] AC-2.6: Filter chip shows task name when single selected
- [ ] AC-2.7: Clicking chip × clears all task selections

**Story 3 - Select All:**
- [ ] AC-3.1: "Select All" checkbox at top of task list
- [ ] AC-3.2: Select All only selects tasks matching current search
- [ ] AC-3.3: Select All label shows count: "Select All (X visible)"
- [ ] AC-3.4: Clicking Select All when all visible selected deselects them
- [ ] AC-3.5: Select All disabled when no visible tasks
- [ ] AC-3.6: Existing selections outside search preserved

---

## Developer Resources

### File Paths Reference

**New Files:**
- `src/components/time-tracking/MultiSelectTaskFilter.tsx`
- `src/components/time-tracking/MultiSelectTaskFilter.test.tsx`

**Modified Files:**
- `src/components/time-tracking/TimeInsightsModal.tsx`
- `src/hooks/useTimeInsights.ts`
- `src/types/timeTracking.ts`

### Key Code Locations

| Reference | File:Line | Purpose |
|-----------|-----------|---------|
| Search filtering pattern | `TaskSelector.tsx:44-47` | Reuse for task search |
| Keyboard handler | `TaskSelector.tsx:91-125` | Adapt for multi-select |
| Current task filter state | `TimeInsightsModal.tsx:54-56` | Change to array |
| Current filter logic | `useTimeInsights.ts:136-139` | Update for array |
| FilterChip usage | `TimeInsightsModal.tsx:293-298` | Update display logic |
| Test patterns | `FilterDropdown.test.tsx` | Follow same structure |

### Testing Locations

- Unit tests: Colocated as `*.test.tsx` files
- Test setup: `src/test/setup.ts`
- Run tests: `npm test` (watch) or `npm run test:run` (once)

### Documentation to Update

- `notes/ux-design-time-tracking.md` - Add multi-select filter spec if needed
- No README changes required

---

## UX/UI Considerations

### UI Components Affected

| Component | Change |
|-----------|--------|
| Task filter dropdown | Replace with MultiSelectTaskFilter |
| Filter chip area | Update to show "X tasks" summary |
| Insights breakdown | Already shows multiple tasks (no change) |

### Visual Design

**Dropdown Trigger (closed):**
- Same as current FilterDropdown styling
- Shows: "All tasks" | "Task Name" | "3 tasks"

**Dropdown Content:**
- Search input at top (matches TaskSelector styling)
- "Select All (X visible)" row with checkbox
- Divider line
- Scrollable task list with checkboxes
- Max height: 240px (fits ~6-7 tasks)

**Checkbox Styling:**
- Use existing checkbox pattern from codebase or simple styled checkbox
- Checked: Primary slate fill with white checkmark
- Unchecked: Border only

### Responsive Behavior

- Mobile: Dropdown takes full width minus padding
- Desktop: 200px min-width for dropdown content

---

## Testing Approach

### Test Framework

- **Vitest 3.2.4** with `@testing-library/react`
- **userEvent** for realistic user interactions
- **fake-indexeddb** for data layer testing

### Test Structure

```typescript
describe('MultiSelectTaskFilter', () => {
  describe('Rendering', () => {
    it('should render with label and placeholder')
    it('should show selected count when multiple selected')
  })

  describe('Search (Story 1)', () => {
    it('should filter tasks as user types (AC-1.2)')
    it('should show no results message (AC-1.3)')
    it('should auto-focus search on open (AC-1.5)')
  })

  describe('Multi-Select (Story 2)', () => {
    it('should allow multiple selections (AC-2.2)')
    it('should preserve selections across searches')
  })

  describe('Select All (Story 3)', () => {
    it('should only select visible tasks (AC-3.2)')
    it('should toggle when all visible selected (AC-3.4)')
  })

  describe('Keyboard Navigation', () => {
    it('should open with Enter key')
    it('should toggle checkbox with Space')
    it('should close with Escape')
  })
})
```

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main branch
2. Automated CI runs tests and build
3. Deploy to staging (Vercel preview)
4. QA verification on staging
5. Merge to production branch
6. Monitor for errors

### Rollback Plan

1. Revert PR commit if issues found
2. Redeploy previous version
3. No database migrations - pure frontend change

### Monitoring

- Check browser console for errors
- Verify insights modal loads correctly
- Test filter interactions on production
