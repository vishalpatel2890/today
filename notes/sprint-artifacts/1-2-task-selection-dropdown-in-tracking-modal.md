# Story 1.2: Task Selection Dropdown in Tracking Modal

Status: done

## Story

As a power user,
I want to see my today's tasks in a dropdown when I open the tracking modal,
so that I can quickly select which task to track time for.

## Acceptance Criteria

1. Modal displays a dropdown labeled "Select a task..." that auto-focuses when modal opens in idle state
2. Clicking the dropdown or pressing Enter shows a list of all tasks scheduled for today (from existing task data)
3. Tasks are displayed with their title text and can be navigated with arrow keys, selected with Enter
4. Type-ahead filtering works: user can type to filter/search tasks in the dropdown
5. When no tasks exist for today, the message "No tasks for today. Add a task first." displays, and the Track button is disabled
6. The dropdown uses existing Radix Select/Combobox patterns consistent with the app's design system
7. The modal matches the "Compact Command Palette" design (320px width, centered on desktop, bottom sheet on mobile)
8. When a task is selected, the dropdown shows the selected task name and enables the Track button

## Frontend Test Gate

**Gate ID**: 1-2-TG1

### Prerequisites
- [ ] App running locally at http://localhost:5173
- [ ] At least 2-3 tasks created for today's date
- [ ] Starting state: Main task list view visible

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Press `Cmd+Shift+T` | Anywhere in app | Time Tracking modal opens with dropdown auto-focused |
| 2 | Press Enter or click dropdown | Task dropdown | Dropdown opens showing today's tasks |
| 3 | Press Arrow Down twice | Dropdown list | Second task is highlighted |
| 4 | Press Enter | Dropdown list | Task is selected, dropdown closes, task name shown |
| 5 | Type "review" while dropdown is open | Dropdown search | Only tasks containing "review" are shown |
| 6 | Clear all tasks for today, reopen modal | Task dropdown | Empty state message displayed, Track button disabled |
| 7 | Add a task for today, reopen modal | Task dropdown | Task appears in dropdown, can be selected |

### Success Criteria (What User Sees)
- [ ] Dropdown auto-focuses when modal opens
- [ ] All today's tasks appear in dropdown list
- [ ] Arrow key navigation works smoothly
- [ ] Type-ahead filtering narrows results
- [ ] Selected task name displays clearly
- [ ] Empty state shows friendly message
- [ ] Track button disabled when no task selected
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you find and select a task without confusion?
2. Did the dropdown respond within acceptable time (<100ms)?
3. Was keyboard navigation intuitive (arrows + Enter)?
4. Did type-ahead filtering work as expected?

## Tasks / Subtasks

- [x] Task 1: Create TaskSelector component (AC: 1, 2, 3, 4, 6)
  - [x] Create `src/components/time-tracking/TaskSelector.tsx`
  - [x] Use Radix UI Combobox/Popover pattern for accessible dropdown
  - [x] Implement trigger button showing placeholder or selected task name
  - [x] Implement dropdown list with task items
  - [x] Add keyboard navigation: Arrow Up/Down, Enter to select, Escape to close
  - [x] Implement type-ahead filtering with search input
  - [x] Style using Tailwind consistent with existing modal patterns

- [x] Task 2: Integrate TaskSelector with useTasks hook (AC: 2, 5)
  - [x] Import and use existing `useTasks` hook to get all tasks
  - [x] Filter tasks by today's date using `date-fns`: `format(new Date(), 'yyyy-MM-dd')`
  - [x] Pass filtered tasks to TaskSelector component
  - [x] Handle loading state while tasks are fetching

- [x] Task 3: Implement empty state handling (AC: 5)
  - [x] Show "No tasks for today. Add a task first." message when task list is empty
  - [x] Disable Track button when no tasks available
  - [x] Disable Track button when no task is selected

- [x] Task 4: Update TimeTrackingModal with TaskSelector integration (AC: 1, 7, 8)
  - [x] Replace placeholder content with TaskSelector component
  - [x] Add state for selected task: `useState<{ id: string, name: string } | null>(null)`
  - [x] Auto-focus TaskSelector when modal opens in idle state
  - [x] Update modal width to 320px for compact command palette style
  - [x] Add Track button that enables when task is selected
  - [x] Pass `onSelect` callback to TaskSelector to capture selection

- [x] Task 5: Ensure modal responsiveness (AC: 7)
  - [x] Verify bottom sheet behavior on mobile (< 768px)
  - [x] Verify centered modal on desktop (>= 768px)
  - [x] Test touch interactions on mobile if possible

- [x] Task 6: Write unit tests for TaskSelector (AC: 1, 2, 3, 4, 5)
  - [x] Test dropdown renders with provided tasks
  - [x] Test keyboard navigation (arrow keys, Enter)
  - [x] Test type-ahead filtering reduces displayed tasks
  - [x] Test empty state renders correct message
  - [x] Test selection callback fires with correct task data

- [x] Task 7: Manual browser testing (AC: 1-8)
  - [x] Test in Chrome
  - [x] Test in Safari
  - [x] Verify accessibility with keyboard-only navigation
  - [x] Run through Frontend Test Gate checklist

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Component Pattern (from Architecture):**
- Use functional components with TypeScript and arrow function syntax
- Export as named export (not default): `export const TaskSelector = ...`
- Destructure props in function signature
- Use Tailwind for styling, follow existing modal patterns

**TaskSelector Implementation:**
- Use Radix UI primitives (Combobox or Popover + Command pattern)
- The app already uses `@radix-ui/react-select` (v2.2.6) and related Radix primitives
- Consider using a Combobox pattern for type-ahead search functionality
- Follow accessibility patterns: `role="combobox"`, `aria-expanded`, `aria-activedescendant`

**Task Filtering:**
- Use existing `useTasks` hook to get task data
- Filter by today's date: `tasks.filter(t => t.date === format(new Date(), 'yyyy-MM-dd'))`
- Store task_name snapshot when selected (for deleted task handling per FR11)

**State Management:**
- Selected task stored in TimeTrackingModal component state
- Track button disabled state derived from: `!selectedTask || tasks.length === 0`

### Project Structure Notes

Files to create/modify:
```
src/
├── components/
│   └── time-tracking/
│       ├── TimeTrackingModal.tsx  # MODIFY: Replace placeholder, add TaskSelector
│       └── TaskSelector.tsx       # NEW: Dropdown component
```

Existing files to reference for patterns:
- `src/components/DeferModal.tsx` - Modal styling patterns
- `src/hooks/useTasks.ts` - Task data access

### Learnings from Previous Story

**From Story 1-1-global-keyboard-shortcut-registration (Status: review)**

- **New Files Created**:
  - `today-app/src/types/timeTracking.ts` - ActiveSession and TimeEntry interfaces already available
  - `today-app/src/hooks/useTimeTrackingHotkeys.ts` - Keyboard shortcuts ready
  - `today-app/src/components/time-tracking/TimeTrackingModal.tsx` - Placeholder modal shell ready for full UI
- **Placeholder Modal**: Current modal has placeholder content "(Full UI coming in Story 1.2)" - this story replaces that placeholder
- **Radix Dialog Pattern**: Modal already uses Radix Dialog with consistent styling
- **App.tsx Integration**: Modal state management already in place with `isTimeTrackingOpen` state

[Source: notes/sprint-artifacts/1-1-global-keyboard-shortcut-registration.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC2] - Authoritative acceptance criteria AC2.1-AC2.6
- [Source: notes/architecture-time-tracking.md#Implementation Patterns] - Component and hook patterns
- [Source: notes/architecture-time-tracking.md#Data Architecture] - TypeScript interfaces for ActiveSession
- [Source: notes/epics-time-tracking.md#Story 1.2] - Original story requirements and technical notes
- [Source: notes/ux-design-time-tracking.md#4.1 Design Direction] - Compact Command Palette approach (320px width)
- [Source: notes/ux-design-time-tracking.md#6.1 TaskSelector Component] - Component specification
- [Source: notes/PRD-time-tracking.md#FR2-FR3] - Functional requirements for task dropdown

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/1-2-task-selection-dropdown-in-tracking-modal.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

Implementation plan:
1. Created TaskSelector component using Radix Popover for accessible dropdown
2. Integrated with TimeTrackingModal, passing tasks from App.tsx
3. Added type-ahead filtering, keyboard navigation (Arrow keys, Enter, Escape)
4. Implemented empty state handling with disabled Track button
5. Added 21 unit tests covering all acceptance criteria

### Completion Notes List

- Created TaskSelector component with Radix Popover pattern
- Implemented type-ahead search filtering (case-insensitive)
- Added keyboard navigation: ArrowUp/Down, Enter to select, Escape to close
- Integrated with TimeTrackingModal, filtering tasks by today's date
- Empty state shows "No tasks for today. Add a task first."
- Track button disabled when no tasks or no selection
- Modal uses 320px width on desktop, bottom sheet on mobile
- All 77 tests pass (21 new tests for TaskSelector)

### File List

**New files:**
- today-app/src/components/time-tracking/TaskSelector.tsx
- today-app/src/components/time-tracking/TaskSelector.test.tsx

**Modified files:**
- today-app/src/components/time-tracking/TimeTrackingModal.tsx
- today-app/src/App.tsx

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-10 | SM Agent | Initial story creation from sprint-status backlog |
