# Story 2.2: Add Task

Status: in-progress

## Story

As a **user**,
I want **to quickly add a new task by typing and pressing Enter**,
so that **I can capture tasks with minimal friction (<5 seconds)**.

## Acceptance Criteria

1. **AC-2.2.1**: Given I am on the Today tab, I see an "Add a task..." input field below the task list (or in the empty state area)

2. **AC-2.2.2**: Given the add task input is focused, the dashed border becomes solid (focus state indicator)

3. **AC-2.2.3**: Given I type text and press Enter, a new task appears at the bottom of the list:
   - Task has unique ID generated via `crypto.randomUUID()`
   - Task has `createdAt` set to current ISO timestamp
   - Task has `deferredTo: null`, `category: null`, `completedAt: null`
   - Task appears in the Today view immediately

4. **AC-2.2.4**: Given I successfully add a task, the input clears and is ready for the next task

5. **AC-2.2.5**: Given the new task appears, it has a subtle slide-in animation (from below or fade-in)

6. **AC-2.2.6**: Given I press Enter with an empty input (or whitespace only), nothing happens - no empty task is created, no error shown

7. **AC-2.2.7**: The add task input is responsive:
   - Full-width on mobile (< 768px) with appropriate padding
   - Matches task card width on desktop (within 600px container)

## Frontend Test Gate

**Gate ID**: 2-2-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 2.1 complete (TodayView, TaskList, TaskCard components exist)
- [ ] Starting state: Today tab selected, can have 0 or more existing tasks

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Look for add task input | Below task list or in empty state | "Add a task..." placeholder visible |
| 3 | Click on add task input | Input field | Input focuses, border becomes solid |
| 4 | Type "Buy groceries" | Add task input | Text appears in input |
| 5 | Press Enter | Keyboard | New task "Buy groceries" appears in list, input clears |
| 6 | Observe new task | Task list | Subtle slide-in/fade animation visible |
| 7 | Clear input and press Enter | Empty input field | Nothing happens, no empty task created |
| 8 | Type "   " (spaces only) and Enter | Input field | Nothing happens, no whitespace-only task |
| 9 | Add 3 more tasks quickly | Input field | All tasks appear, each with animation |
| 10 | Resize to mobile (< 768px) | Browser viewport | Input remains full-width and usable |

### Success Criteria (What User Sees)
- [ ] "Add a task..." input is visible and accessible
- [ ] Input focus state is clearly indicated (solid border)
- [ ] New tasks appear at bottom of list immediately
- [ ] Input clears after successful task addition
- [ ] Slide-in animation is subtle and smooth
- [ ] Empty/whitespace submits are ignored gracefully
- [ ] Input is responsive across viewports
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you complete adding a task in under 5 seconds?
2. Did the input feel responsive and frictionless?
3. Was the animation satisfying but not distracting?
4. Any confusion about where to type or how to submit?

## Tasks / Subtasks

- [x] **Task 1: Create useTasks Hook** (AC: 3, 4)
  - [x] Create `today-app/src/hooks/useTasks.ts`
  - [x] Define TaskAction type with ADD_TASK action (expand later for COMPLETE, DELETE, DEFER)
  - [x] Implement useReducer with initial empty tasks array
  - [x] ADD_TASK handler:
    - Generate `id` using `crypto.randomUUID()`
    - Set `text` from action payload (trimmed)
    - Set `createdAt` to `new Date().toISOString()`
    - Set `deferredTo: null`, `category: null`, `completedAt: null`
    - Add new task to end of tasks array
  - [x] Return `{ tasks, dispatch }` or `{ tasks, addTask }` helper
  - [x] Use named export pattern

- [x] **Task 2: Create AddTaskInput Component** (AC: 1, 2, 4, 6, 7)
  - [x] Create `today-app/src/components/AddTaskInput.tsx`
  - [x] Define AddTaskInputProps: `{ onAddTask: (text: string) => void }`
  - [x] Render input element with:
    - Placeholder: "Add a task..."
    - Controlled value with useState
    - Styling: dashed border default, solid border on focus
    - Same width/padding as TaskCard for visual alignment
  - [x] Handle onKeyDown for Enter key:
    - Trim input value
    - If empty after trim, do nothing (return early)
    - Call `onAddTask(trimmedValue)`
    - Clear input value
  - [x] Responsive: full-width on mobile
  - [x] Use named export pattern

- [x] **Task 3: Add Slide-In Animation** (AC: 5)
  - [x] Add CSS animation for new tasks in index.css or as Tailwind utility
  - [x] Animation: slide-in from below (translateY) and fade-in (opacity)
  - [x] Duration: 200-300ms, ease-out timing
  - [x] Apply animation class to TaskCard when newly added
  - [x] Consider using key-based approach or animation state

- [x] **Task 4: Integrate useTasks into App** (AC: 3)
  - [x] Import useTasks hook in App.tsx
  - [x] Replace mock data array with useTasks hook state
  - [x] Remove `SHOW_MOCK_DATA` toggle (real state management now)
  - [x] Pass `tasks` to TodayView component
  - [x] Create addTask handler function from dispatch

- [x] **Task 5: Integrate AddTaskInput into TodayView** (AC: 1, 2)
  - [x] Import AddTaskInput in TodayView.tsx
  - [x] Accept `onAddTask` prop in TodayView
  - [x] Render AddTaskInput below TaskList (when tasks exist)
  - [x] Render AddTaskInput below empty state message (when no tasks)
  - [x] Pass `onAddTask` prop to AddTaskInput component

- [x] **Task 6: Style Input States** (AC: 2, 7)
  - [x] Default state: dashed border (border-dashed border-border)
  - [x] Focus state: solid border (border-solid border-foreground or accent)
  - [x] Hover state: subtle border color change
  - [x] Padding and sizing to match TaskCard appearance
  - [x] Transition for smooth border style change

- [x] **Task 7: Build Verification and Testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Test adding multiple tasks in succession
  - [x] Test empty/whitespace submission handling
  - [x] Test on mobile viewport
  - [x] Verify animation timing feels right

## Dev Notes

### Architecture Alignment

Per architecture.md, this story implements:
- **useTasks.ts**: Custom hook with useReducer for state management (ADR-005)
- **AddTaskInput.tsx**: Presentational component for task creation

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const AddTaskInput = () => { ... }`
- Destructure props in function signature

### State Management Pattern (from architecture.md)

```typescript
// src/hooks/useTasks.ts
import { useReducer } from 'react';
import { Task, TaskAction } from '../types';

const initialState: Task[] = [];

const taskReducer = (state: Task[], action: TaskAction): Task[] => {
  switch (action.type) {
    case 'ADD_TASK':
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          text: action.text,
          createdAt: new Date().toISOString(),
          deferredTo: null,
          category: null,
          completedAt: null,
        },
      ];
    default:
      return state;
  }
};

export const useTasks = () => {
  const [tasks, dispatch] = useReducer(taskReducer, initialState);

  const addTask = (text: string) => {
    dispatch({ type: 'ADD_TASK', text });
  };

  return { tasks, addTask, dispatch };
};
```

### AddTaskInput Styling (from UX spec)

Per ux-design-specification.md and design tokens:
- Border: `border-2 border-dashed border-border` (default)
- Focus: `focus:border-solid focus:border-foreground`
- Background: `bg-surface` (white)
- Padding: `p-4` (matches TaskCard)
- Rounded: `rounded-lg` (matches TaskCard)
- Placeholder color: `placeholder:text-muted-foreground`

### Animation Pattern

```css
/* in index.css or as keyframes */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideIn 200ms ease-out;
}
```

### Project Structure Notes

Files created/modified in this story:
```
today-app/src/
├── hooks/
│   └── useTasks.ts         # NEW: Task state management hook
├── components/
│   └── AddTaskInput.tsx    # NEW: Quick add input component
├── views/
│   └── TodayView.tsx       # MODIFIED: Add AddTaskInput integration
├── App.tsx                 # MODIFIED: Replace mock data with useTasks
└── index.css               # MODIFIED: Add slide-in animation (optional)
```

### Learnings from Previous Story

**From Story 2-1-today-view-with-task-list (Status: in-progress)**

- **Task Interface**: Already defined in `types/index.ts` with all required fields: id, text, createdAt, deferredTo, category, completedAt
- **Component Structure**: TaskCard, TaskList, TodayView components exist and use named export pattern
- **Mock Data Toggle**: `SHOW_MOCK_DATA` in App.tsx should be removed and replaced with useTasks hook
- **Styling Tokens**: Using Tailwind v4 CSS-first config - use existing token classes (bg-surface, border-border, etc.)
- **Build Size**: Current: 217KB JS (68KB gzipped), 14KB CSS - keep within budget
- **Lucide Icons**: Already installed and working (Circle icon in TaskCard)
- **Gap Spacing**: TaskList uses gap-3 (12px) - AddTaskInput should have similar margin

[Source: notes/sprint-artifacts/2-1-today-view-with-task-list.md#Dev-Agent-Record]

### Dependencies

No new dependencies required. Uses existing:
- React (useState, useReducer)
- Tailwind CSS (styling via design tokens)
- crypto.randomUUID() (browser native)

### References

- [Source: notes/epics.md#Story-2.2] - Story definition and acceptance criteria
- [Source: notes/architecture.md#Data-Architecture] - Task interface, TaskAction types
- [Source: notes/architecture.md#Implementation-Patterns] - useReducer pattern, ID generation
- [Source: notes/architecture.md#ADR-005] - State management with useReducer
- [Source: notes/ux-design-specification.md#6.1-Component-Strategy] - Input styling patterns
- [Source: notes/prd.md#Functional-Requirements] - FR1: Add task functionality

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/2-2-add-task.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- **Implementation Plan**: Created useTasks hook with useReducer pattern per ADR-005, AddTaskInput with Enter key handling, animation via CSS keyframes with state tracking for new task IDs
- **Lint Issue Resolved**: Refactored animation tracking from useEffect (lint error) to callback-based approach in addTask function to avoid setState-in-effect pattern
- **Build Verification**: `npm run build` and `npm run lint` both pass with no errors
- **Build Size**: 217.87KB JS (67.95KB gzipped), 15.02KB CSS - within budget

### Completion Notes List

- Implemented useTasks hook with useReducer for state management, returns { tasks, addTask, newTaskIds, dispatch }
- Created AddTaskInput component with dashed border (default), solid border (focus), hover state
- Added @keyframes slideIn animation in index.css with .animate-slide-in class
- Integrated useTasks hook in App.tsx, removed mock data and SHOW_MOCK_DATA toggle
- Updated TodayView to accept onAddTask and newTaskIds props, renders AddTaskInput below task list and in empty state
- Modified TaskCard and TaskList to support isNew/newTaskIds props for animation
- All acceptance criteria addressed through implementation
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Status | Description |
|------|--------|-------------|
| today-app/src/hooks/useTasks.ts | NEW | Task state management hook with useReducer, addTask helper, animation tracking |
| today-app/src/components/AddTaskInput.tsx | NEW | Quick add input component with Enter key submission |
| today-app/src/App.tsx | MODIFIED | Removed mock data, integrated useTasks hook |
| today-app/src/views/TodayView.tsx | MODIFIED | Added onAddTask prop, integrated AddTaskInput |
| today-app/src/components/TaskCard.tsx | MODIFIED | Added isNew prop for animation support |
| today-app/src/components/TaskList.tsx | MODIFIED | Added newTaskIds prop, passes isNew to TaskCard |
| today-app/src/index.css | MODIFIED | Added @keyframes slideIn animation |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (2-2-add-task) | SM Agent |
| 2026-01-06 | Implemented all 7 tasks - useTasks hook, AddTaskInput, animation, integrations, styling, verification | Dev Agent |
