# Story 2.4: Delete Task

Status: done

## Story

As a **user**,
I want **to permanently delete a task I no longer need**,
so that **I can clean up tasks that are no longer relevant**.

## Acceptance Criteria

1. **AC-2.4.1**: Given I hover over a task card on desktop, the actions area becomes visible showing a trash icon after any other action icons

2. **AC-2.4.2**: Given I am on mobile (< 768px), the trash icon is always visible in the task card actions area (no hover required)

3. **AC-2.4.3**: Given I click the trash icon, a confirmation prompt appears asking "Delete this task?"

4. **AC-2.4.4**: Given I confirm the deletion prompt, the task is immediately removed from the list

5. **AC-2.4.5**: Given I cancel the deletion prompt, nothing happens and the task remains in the list

6. **AC-2.4.6**: Given a task is deleted, it is completely removed from state (not marked as deleted, but filtered out of the tasks array entirely)

7. **AC-2.4.7**: Given I delete the last task in the list, the empty state message appears ("Nothing for today.")

## Frontend Test Gate

**Gate ID**: 2-4-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 2.1 complete (TaskCard, TaskList, TodayView components exist)
- [ ] Story 2.2 complete (useTasks hook with ADD_TASK implemented)
- [ ] Story 2.3 complete (COMPLETE_TASK implemented, action icons pattern established)
- [ ] Starting state: Today tab selected, 2-3 tasks visible in the list

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add 3 tasks if none exist | Add task input | Tasks "Task A", "Task B", "Task C" visible |
| 3 | Hover over "Task B" (desktop) | Middle task card | Trash icon appears in actions area |
| 4 | Click trash icon | Task card actions | Confirmation dialog: "Delete this task?" |
| 5 | Click Cancel | Confirmation dialog | Dialog closes, "Task B" still visible |
| 6 | Click trash icon again | Task card actions | Confirmation dialog appears again |
| 7 | Click OK/Confirm | Confirmation dialog | "Task B" removed, only "Task A" and "Task C" remain |
| 8 | Resize browser to mobile width (<768px) | Browser window | Trash icon visible without hover |
| 9 | Delete remaining tasks one by one | Task cards | Each task removed after confirmation |
| 10 | Delete last task | Final task card | Empty state shows "Nothing for today." |

### Success Criteria (What User Sees)
- [ ] Trash icon appears on hover (desktop) or always visible (mobile)
- [ ] Confirmation prompt prevents accidental deletion
- [ ] Canceling confirmation keeps task intact
- [ ] Confirming deletion removes task immediately
- [ ] Deleted task is completely gone (check DevTools state)
- [ ] Empty state appears after deleting all tasks
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Was the trash icon easy to find (hover discovery on desktop)?
2. Did the confirmation prompt feel appropriate (not annoying)?
3. Was the task removal immediate enough after confirmation?
4. Any confusion about which action icons do what?

## Tasks / Subtasks

- [x] **Task 1: Add DELETE_TASK Action to useTasks Hook** (AC: 6)
  - [x] Open `today-app/src/hooks/useTasks.ts`
  - [x] Verify 'DELETE_TASK' is in TaskAction type: `{ type: 'DELETE_TASK'; id: string }`
  - [x] Implement DELETE_TASK case in reducer:
    - Filter out task with matching id
    - Return new array without the deleted task
  - [x] Export `deleteTask` helper function alongside `addTask` and `completeTask`
  - [x] Verify action doesn't mutate state (returns new filtered array)

- [x] **Task 2: Update Task Type Export if Needed** (AC: 6)
  - [x] Verify `today-app/src/types/index.ts` has TaskAction type with DELETE_TASK
  - [x] Ensure DELETE_TASK action type is in the union if not already present

- [x] **Task 3: Add Delete Button to TaskCard** (AC: 1, 2)
  - [x] Open `today-app/src/components/TaskCard.tsx`
  - [x] Import Trash2 icon from lucide-react
  - [x] Update TaskCardProps: add `onDelete: (id: string) => void`
  - [x] Add delete button in task-actions area (after any existing icons like defer placeholder)
  - [x] Button shows Trash2 icon with appropriate styling:
    - `text-muted-foreground` default
    - `hover:text-error` (#ef4444) on hover
    - Size: 18px or similar to match other action icons
  - [x] Apply hover-only visibility on desktop:
    - `opacity-0 group-hover:opacity-100` for desktop
    - Or use CSS `visibility` pattern from existing actions
  - [x] Apply always-visible on mobile using Tailwind responsive:
    - `md:opacity-0 md:group-hover:opacity-100` (hidden on desktop unless hover)
    - `opacity-100` on mobile (always visible)

- [x] **Task 4: Add Delete Confirmation Handler** (AC: 3, 4, 5)
  - [x] In TaskCard.tsx, create `handleDelete` function:
    ```typescript
    const handleDelete = () => {
      if (window.confirm('Delete this task?')) {
        onDelete(task.id);
      }
    };
    ```
  - [x] Attach handleDelete to delete button onClick
  - [x] Ensure button has accessible aria-label: "Delete task"

- [x] **Task 5: Update TaskList Props** (AC: 4)
  - [x] Open `today-app/src/components/TaskList.tsx`
  - [x] Verify TaskListProps includes `onDelete: (id: string) => void`
  - [x] Pass `onDelete` prop to each TaskCard

- [x] **Task 6: Update TodayView Props** (AC: 4)
  - [x] Open `today-app/src/views/TodayView.tsx`
  - [x] Verify TodayViewProps includes `onDeleteTask: (id: string) => void`
  - [x] Pass `onDelete` prop to TaskList

- [x] **Task 7: Wire Up Delete in App.tsx** (AC: 4, 7)
  - [x] Open `today-app/src/App.tsx`
  - [x] Get `deleteTask` from useTasks hook
  - [x] Pass `deleteTask` to TodayView as `onDeleteTask`
  - [x] Verify deletion causes list re-render and potentially shows empty state

- [x] **Task 8: Build Verification and Testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Test deleting a task with confirmation
  - [x] Test canceling deletion confirmation
  - [x] Test on mobile viewport - verify trash icon always visible
  - [x] Test deleting last task - verify empty state appears
  - [x] Verify no console warnings
  - [x] Verify deletion is permanent (task gone from state)

## Dev Notes

### Architecture Alignment

Per architecture.md, this story extends:
- **useTasks.ts**: Add DELETE_TASK action to existing reducer
- **TaskCard.tsx**: Add delete button with confirmation

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const TaskCard = () => { ... }`
- Destructure props in function signature
- Immutable state updates only (filter to create new array)

### State Management Pattern (from architecture.md)

```typescript
// Addition to src/hooks/useTasks.ts
case 'DELETE_TASK':
  return state.filter(task => task.id !== action.id);
```

### Delete Confirmation Pattern

Per UX spec Section 7.1 (Consistency Rules):
- Delete requires confirmation (prevents accidents on destructive action)
- Use `window.confirm()` for MVP (can upgrade to custom modal later)

Per tech-spec-epic-2.md:
- Task actions appear in task-actions div on hover
- Mobile: use media query to always show actions

### TaskCard Actions Styling Pattern

Per UX spec Section 6.1 (Task Card):
- Actions menu revealed on hover
- Delete icon (trash) appears in actions area

Existing pattern from Story 2.3:
- Icons use `text-muted-foreground` (#64748b)
- Hover states can change icon color
- Mobile shows actions without hover

### Learnings from Previous Story

**From Story 2-3-complete-task (Status: review)**

- **useTasks Hook**: Already has ADD_TASK and COMPLETE_TASK - add DELETE_TASK following same pattern
- **TaskCardProps**: Already has `onComplete` - add `onDelete` prop
- **TaskList/TodayView**: Already thread `onComplete` - add parallel `onDelete` threading
- **Action Icons**: CheckCircle2 used for complete - use Trash2 for delete
- **CSS Animation**: taskComplete animation exists - delete doesn't need animation (immediate removal after confirm)
- **Build Size**: 218.59KB JS, 15.23KB CSS - delete adds minimal code

**Implementation Notes from 2-3:**
- Animation timing: 300ms pause then 300ms animation (complete)
- Delete: immediate removal after confirmation (no animation needed per spec)
- Actions visibility: group-hover pattern established

[Source: notes/sprint-artifacts/2-3-complete-task.md#Dev-Agent-Record]

### Project Structure Notes

Files modified in this story:
```
today-app/src/
├── hooks/
│   └── useTasks.ts         # MODIFIED: Add DELETE_TASK action
├── components/
│   └── TaskCard.tsx        # MODIFIED: Add delete button with confirmation
│   └── TaskList.tsx        # MODIFIED: Pass onDelete prop (may already exist)
├── views/
│   └── TodayView.tsx       # MODIFIED: Pass onDeleteTask prop (may already exist)
├── types/
│   └── index.ts            # MODIFIED: Add DELETE_TASK to TaskAction union (if not present)
└── App.tsx                 # MODIFIED: Get deleteTask from hook, pass to TodayView
```

### Dependencies

No new dependencies required. Uses existing:
- React (for component state)
- Tailwind CSS (styling via design tokens)
- Lucide React (Trash2 icon)

### Mobile Responsive Pattern

Per UX spec Section 8.1:
- Desktop: actions revealed on hover
- Mobile (< 768px): actions always visible

Tailwind implementation:
```tsx
// Delete button visibility
<button className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
  <Trash2 className="w-[18px] h-[18px]" />
</button>
```

Or using the task-actions container:
```tsx
// Container that shows on hover (desktop) or always (mobile)
<div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
```

### References

- [Source: notes/epics.md#Story-2.4] - Story definition and acceptance criteria
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Story-2.4-Delete-Task] - Technical specifications
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Acceptance-Criteria] - AC-2.4.1 through AC-2.4.6
- [Source: notes/architecture.md#Data-Architecture] - Task interface, TaskAction types
- [Source: notes/architecture.md#Implementation-Patterns] - State update patterns
- [Source: notes/ux-design-specification.md#6.1-Component-Strategy] - Task Card actions
- [Source: notes/ux-design-specification.md#7.1-Consistency-Rules] - Delete confirmation pattern
- [Source: notes/prd.md#Functional-Requirements] - FR3: Delete task

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/2-4-delete-task.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented DELETE_TASK action in useTasks reducer using filter pattern (immutable)
- Added Trash2 icon to TaskCard with responsive visibility (mobile always visible, desktop on hover)
- Used window.confirm() for deletion confirmation per UX spec
- Threaded onDelete prop through TaskList → TodayView → App
- Build passes: 219.43KB JS (68.44KB gzipped), 15.67KB CSS

### Completion Notes List

- Added DELETE_TASK action type to TaskAction union
- Implemented reducer case: `state.filter(task => task.id !== action.id)`
- Added deleteTask callback using useCallback pattern
- TaskCard now has group class for hover detection, Trash2 icon with responsive opacity
- Delete button: `opacity-100 md:opacity-0 md:group-hover:opacity-100` for mobile-first visibility
- handleDelete uses window.confirm('Delete this task?') before calling onDelete
- All prop threading complete: TaskCard → TaskList → TodayView → App
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Status | Description |
|------|--------|-------------|
| today-app/src/hooks/useTasks.ts | Modified | Added DELETE_TASK action and deleteTask helper |
| today-app/src/components/TaskCard.tsx | Modified | Added Trash2 icon, onDelete prop, handleDelete with confirm |
| today-app/src/components/TaskList.tsx | Modified | Added onDelete prop, pass to TaskCard |
| today-app/src/views/TodayView.tsx | Modified | Added onDeleteTask prop, pass to TaskList |
| today-app/src/App.tsx | Modified | Get deleteTask from useTasks, pass to TodayView |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (2-4-delete-task) | SM Agent |
| 2026-01-06 | Implemented all 8 tasks: DELETE_TASK action, Trash2 icon with confirmation, prop threading | Dev Agent |
| 2026-01-06 | Test Gate PASSED, story marked for review | Vishal |
