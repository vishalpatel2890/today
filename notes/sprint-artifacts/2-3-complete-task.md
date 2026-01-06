# Story 2.3: Complete Task

Status: drafted

## Story

As a **user**,
I want **to mark a task as done and see it disappear with satisfaction**,
so that **I feel progress and closure when completing tasks**.

## Acceptance Criteria

1. **AC-2.3.1**: Given I see a task in the Today list and click the circle checkbox, it immediately fills with a green checkmark (#22c55e / text-success)

2. **AC-2.3.2**: Given I completed a task and saw the checkmark, after 300ms the task gently fades out (opacity 0) and slides left (translateX -20px) over 300ms

3. **AC-2.3.3**: Given the completion animation finishes, the task is removed from the Today list view

4. **AC-2.3.4**: Given a task is completed, its `completedAt` field is set to the current ISO timestamp

5. **AC-2.3.5**: The completion animation feels calm and satisfying (no confetti, no sounds, no celebratory effects)

6. **AC-2.3.6**: Given multiple tasks exist, completing one task does not affect the others in the list

7. **AC-2.3.7**: Given I complete multiple tasks in quick succession, each completes independently with proper animation

## Frontend Test Gate

**Gate ID**: 2-3-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 2.1 complete (TaskCard, TaskList, TodayView components exist)
- [ ] Story 2.2 complete (useTasks hook with ADD_TASK implemented, AddTaskInput working)
- [ ] Starting state: Today tab selected, 2-3 tasks visible in the list

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add 3 tasks if none exist | Add task input | Tasks "Task A", "Task B", "Task C" visible |
| 3 | Click circle checkbox on "Task B" | Middle task card | Checkbox immediately fills with green checkmark |
| 4 | Wait and observe animation | "Task B" card | After ~300ms, task fades out and slides left over ~300ms |
| 5 | Verify task removed | Task list | "Task B" gone, only "Task A" and "Task C" remain |
| 6 | Open DevTools, check state | React DevTools or console | Task B has completedAt timestamp set |
| 7 | Click checkbox on "Task A" | First task card | Same animation sequence occurs |
| 8 | Quickly click checkboxes on remaining tasks | Task cards | Each animates independently, all complete |
| 9 | Add a new task after completing all | Add task input | New task appears correctly in empty list |
| 10 | Complete the new task | Task card | Animation plays, empty state shows after removal |

### Success Criteria (What User Sees)
- [ ] Checkbox click gives immediate visual feedback (green checkmark)
- [ ] Brief pause (~300ms) after checkmark before fade starts
- [ ] Fade-out animation is smooth and subtle (not jarring)
- [ ] Slide-left animation accompanies the fade
- [ ] Total animation feels calm and satisfying
- [ ] Task is fully removed after animation completes
- [ ] Completing one task doesn't affect others
- [ ] Rapid completions don't break the animation or state
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Did clicking the checkbox feel responsive (immediate green checkmark)?
2. Was the 300ms pause before fade-out noticeable but not too long?
3. Did the fade+slide animation feel satisfying without being celebratory?
4. Any visual glitches when completing tasks quickly in succession?

## Tasks / Subtasks

- [ ] **Task 1: Add COMPLETE_TASK Action to useTasks Hook** (AC: 4)
  - [ ] Open `today-app/src/hooks/useTasks.ts`
  - [ ] Add 'COMPLETE_TASK' to TaskAction type: `{ type: 'COMPLETE_TASK'; id: string }`
  - [ ] Implement COMPLETE_TASK case in reducer:
    - Find task by id
    - Set `completedAt` to `new Date().toISOString()`
    - Return new state with updated task
  - [ ] Export `completeTask` helper function alongside `addTask`
  - [ ] Verify action doesn't mutate state (immutable update)

- [ ] **Task 2: Update Task Type Export if Needed** (AC: 4)
  - [ ] Verify `today-app/src/types/index.ts` has TaskAction type exported
  - [ ] Ensure COMPLETE_TASK action type is added to union

- [ ] **Task 3: Add Completion Animation CSS** (AC: 2, 5)
  - [ ] Open `today-app/src/index.css`
  - [ ] Add keyframe animation for fade-out + slide-left:
    ```css
    @keyframes task-complete {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }
    ```
  - [ ] Create utility class `.animate-task-complete`:
    - animation: task-complete 300ms ease-out forwards
  - [ ] Duration: 300ms as per UX spec

- [ ] **Task 4: Make TaskCard Checkbox Interactive** (AC: 1, 2, 3)
  - [ ] Open `today-app/src/components/TaskCard.tsx`
  - [ ] Update TaskCardProps: add `onComplete: (id: string) => void`
  - [ ] Add local state for completion: `const [isCompleting, setIsCompleting] = useState(false)`
  - [ ] Add local state for showing check: `const [showCheck, setShowCheck] = useState(false)`
  - [ ] Replace Circle icon with button wrapper for accessibility
  - [ ] On checkbox click:
    1. Set `showCheck = true` (immediate green checkmark)
    2. Set `isCompleting = true` after 300ms timeout (starts fade animation)
    3. Call `onComplete(task.id)` after animation completes (another 300ms)
  - [ ] Render CheckCircle2 icon when `showCheck` is true (from lucide-react, green color)
  - [ ] Render Circle icon when `showCheck` is false
  - [ ] Apply `.animate-task-complete` class when `isCompleting` is true

- [ ] **Task 5: Update TaskList Props** (AC: 3, 6)
  - [ ] Open `today-app/src/components/TaskList.tsx`
  - [ ] Update TaskListProps: add `onComplete: (id: string) => void`
  - [ ] Pass `onComplete` prop to each TaskCard

- [ ] **Task 6: Update TodayView Props** (AC: 3)
  - [ ] Open `today-app/src/views/TodayView.tsx`
  - [ ] Update TodayViewProps: add `onCompleteTask: (id: string) => void`
  - [ ] Pass `onComplete` prop to TaskList

- [ ] **Task 7: Filter Completed Tasks in App** (AC: 3, 4)
  - [ ] Open `today-app/src/App.tsx`
  - [ ] Get `completeTask` from useTasks hook
  - [ ] Filter tasks before passing to TodayView: `tasks.filter(t => t.completedAt === null)`
  - [ ] Pass `completeTask` to TodayView as `onCompleteTask`

- [ ] **Task 8: Build Verification and Testing** (AC: all)
  - [ ] Run `npm run build` to verify no TypeScript errors
  - [ ] Test completing single task - verify animation sequence
  - [ ] Test completing multiple tasks in succession
  - [ ] Test completing last task - verify empty state appears
  - [ ] Verify no console warnings about state updates on unmounted components
  - [ ] Test animation timing feels right (adjust if needed)

## Dev Notes

### Architecture Alignment

Per architecture.md, this story extends:
- **useTasks.ts**: Add COMPLETE_TASK action to existing reducer
- **TaskCard.tsx**: Make checkbox interactive with animation states

Animation pattern should use CSS transitions/animations (GPU-accelerated) per Performance section.

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const TaskCard = () => { ... }`
- Destructure props in function signature
- Immutable state updates only (spread operator)

### State Management Pattern (from architecture.md)

```typescript
// Addition to src/hooks/useTasks.ts
case 'COMPLETE_TASK':
  return state.map(task =>
    task.id === action.id
      ? { ...task, completedAt: new Date().toISOString() }
      : task
  );
```

### Animation Implementation Pattern

Per UX spec Section 5.1 (Journey 2: Complete a Task):
1. Click checkbox -> immediate green checkmark (instant)
2. After 300ms -> task fades out + slides left (300ms animation)
3. Total time: ~600ms from click to removal

```typescript
// In TaskCard.tsx
const handleComplete = () => {
  setShowCheck(true);  // Immediate feedback

  setTimeout(() => {
    setIsCompleting(true);  // Start fade animation

    setTimeout(() => {
      onComplete(task.id);  // Remove from state
    }, 300);  // Wait for animation
  }, 300);  // Pause with checkmark visible
};
```

### TaskCard Styling Updates

Per ux-design-specification.md:
- Completed checkbox: `text-success` (#22c55e)
- Use CheckCircle2 icon from lucide-react (filled style)
- Animation: fade-out (opacity 0) + slide-left (translateX -20px)

### Learnings from Previous Story

**From Story 2-1-today-view-with-task-list (Status: done)**

- **Task Interface**: Already defined in `types/index.ts` with `completedAt: string | null` field
- **TaskCard Structure**: Uses Lucide Circle icon (20px, strokeWidth 2) - will swap to CheckCircle2 for completed
- **TaskList**: Uses flex column with gap-3 - animation removal should work seamlessly
- **TodayView**: Already handles empty state - will show after last task completed
- **SHOW_MOCK_DATA**: Toggle in App.tsx - will need to replace with filtered useTasks data
- **Build Size**: 217KB JS (68KB gzipped), 14KB CSS - animation CSS minimal addition

**From Story 2-2-add-task (Status: ready-for-dev)**

- **useTasks Hook**: Will be created in 2-2 with ADD_TASK action - extend with COMPLETE_TASK
- **TaskAction Type**: ADD_TASK defined - add COMPLETE_TASK to union
- **Animation Pattern**: slideIn keyframe established - use similar pattern for task-complete

[Source: notes/sprint-artifacts/2-1-today-view-with-task-list.md#Dev-Agent-Record]
[Source: notes/sprint-artifacts/2-2-add-task.md#Dev-Notes]

### Project Structure Notes

Files modified in this story:
```
today-app/src/
├── hooks/
│   └── useTasks.ts         # MODIFIED: Add COMPLETE_TASK action
├── components/
│   └── TaskCard.tsx        # MODIFIED: Interactive checkbox with animation
│   └── TaskList.tsx        # MODIFIED: Pass onComplete prop
├── views/
│   └── TodayView.tsx       # MODIFIED: Pass onCompleteTask prop
├── types/
│   └── index.ts            # MODIFIED: Add COMPLETE_TASK to TaskAction union
├── App.tsx                 # MODIFIED: Filter completed tasks, pass completeTask
└── index.css               # MODIFIED: Add task-complete animation
```

### Dependencies

No new dependencies required. Uses existing:
- React (useState for local animation state)
- Tailwind CSS (styling via design tokens)
- Lucide React (Circle, CheckCircle2 icons)

### References

- [Source: notes/epics.md#Story-2.3] - Story definition and acceptance criteria
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Workflows-and-Sequencing] - Complete Task Flow
- [Source: notes/sprint-artifacts/tech-spec-epic-2.md#Acceptance-Criteria] - AC-2.3.1 through AC-2.3.5
- [Source: notes/architecture.md#Data-Architecture] - Task interface, TaskAction types
- [Source: notes/architecture.md#Implementation-Patterns] - State update patterns
- [Source: notes/ux-design-specification.md#5.1-Critical-User-Paths] - Journey 2: Complete a Task
- [Source: notes/ux-design-specification.md#6.1-Component-Strategy] - Task Card states
- [Source: notes/prd.md#Functional-Requirements] - FR2: Complete task

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

| File | Status | Description |
|------|--------|-------------|
| | | |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (2-3-complete-task) | SM Agent |
