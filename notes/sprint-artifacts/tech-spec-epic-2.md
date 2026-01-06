# Epic Technical Specification: Today's Tasks

Date: 2026-01-06
Author: Vishal
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 delivers the core value proposition of **Today** - the ability for users to manage their daily tasks. This epic builds upon the foundation established in Epic 1 (design tokens, layout shell, tab navigation) to implement the task list display, task creation, task completion, and task deletion within the Today view.

This epic covers **4 stories** implementing **FR1** (add task), **FR2** (complete task), **FR3** (delete task), **FR14** (Today view default), and **FR28-30** (responsive experience). Upon completion, users will have a fully functional "today-focused" task management experience, though without deferment (Epic 3) or persistence (Epic 4).

The implementation follows the React + TypeScript + Tailwind architecture with the Slate Sophisticated visual design, maintaining the "calm and focused" user experience principle where task interactions feel immediate and satisfying.

## Objectives and Scope

### Objectives

1. **Today View Display** - Render a clean, minimal task list showing only today's tasks with the paper-card aesthetic
2. **Quick Task Addition** - Enable users to add tasks in under 5 seconds with a frictionless text input
3. **Satisfying Completion** - Implement checkbox completion with gentle fade-out animation that feels calm, not celebratory
4. **Clean Deletion** - Provide task deletion with confirmation to prevent accidents
5. **Responsive Experience** - Ensure all interactions work across desktop, tablet, and mobile

### In-Scope

- `TodayView.tsx` component with task list container
- `TaskList.tsx` component for rendering task arrays
- `TaskCard.tsx` component with checkbox, text, and action buttons
- `AddTaskInput.tsx` component for quick task creation
- `useTasks.ts` hook with reducer pattern for ADD_TASK, COMPLETE_TASK, DELETE_TASK actions
- Task state management (in-memory for now, persistence in Epic 4)
- Empty state display when no tasks exist
- Completion animation (checkbox fill, fade-out, slide)
- Delete confirmation dialog
- Mobile-responsive action buttons (always visible vs hover)

### Out-of-Scope

- Defer button and modal (Epic 3)
- Tomorrow view content (Epic 3)
- Deferred view content (Epic 3)
- Category management (Epic 3)
- localStorage persistence (Epic 4)
- Auto-surfacing logic (Epic 4)
- Toast notifications (Epic 4)
- Task editing (Growth feature - FR4)
- Drag-to-reorder (Growth feature - FR18)

## System Architecture Alignment

### Technology Decisions Followed

| Category | Decision | Source |
|----------|----------|--------|
| Component Pattern | Functional components with TypeScript, arrow functions, named exports | architecture.md - Implementation Patterns |
| State Management | useReducer pattern via `useTasks` hook | architecture.md - ADR-005 |
| ID Generation | `crypto.randomUUID()` | architecture.md - Consistency Rules |
| Date Storage | ISO 8601 strings | architecture.md - Date Handling Patterns |
| Styling | Tailwind CSS utilities matching design tokens | architecture.md - ADR-003 |

### Component Structure (per architecture.md)

```
src/
├── components/
│   ├── TaskList.tsx        # List container
│   ├── TaskCard.tsx        # Individual task with actions
│   └── AddTaskInput.tsx    # Quick add input
├── views/
│   └── TodayView.tsx       # Today's tasks container
├── hooks/
│   └── useTasks.ts         # Task CRUD operations
└── types/
    └── index.ts            # Task, AppState types
```

### Design Token Usage

Components use the custom Tailwind classes established in Epic 1:
- Background: `bg-background` (#f8fafc)
- Task cards: `bg-surface` (#ffffff) with `border-border` (#e2e8f0)
- Text: `text-foreground` (#0f172a), `text-muted-foreground` (#64748b)
- Success: `text-success` (#22c55e) for completed checkbox
- Typography: `font-body` (DM Sans) for task text

## Detailed Design

### Services and Modules

| Component | Responsibility | Inputs | Outputs |
|-----------|---------------|--------|---------|
| `TodayView.tsx` | Container for Today tab content; orchestrates task list and add input | `tasks` array from useTasks | Renders TaskList + AddTaskInput + empty state |
| `TaskList.tsx` | Renders array of tasks as TaskCard components | `tasks[]`, `onComplete`, `onDelete` | Mapped TaskCard components |
| `TaskCard.tsx` | Individual task display with checkbox and actions | `task`, `onComplete`, `onDelete` | Card UI with interactive elements |
| `AddTaskInput.tsx` | Text input for creating new tasks | `onAdd` callback | Input field, calls onAdd on Enter |
| `useTasks.ts` | Hook managing task state via reducer pattern | None (initializes empty) | `{ tasks, addTask, completeTask, deleteTask }` |

**Component Hierarchy:**
```
App.tsx
└── TodayView.tsx (when activeTab === 'today')
    ├── TaskList.tsx
    │   └── TaskCard.tsx (mapped for each task)
    └── AddTaskInput.tsx
```

### Data Models and Contracts

**Core Types (src/types/index.ts):**

```typescript
export interface Task {
  id: string;                    // UUID via crypto.randomUUID()
  text: string;                  // Task content (user input)
  createdAt: string;             // ISO 8601 date string
  deferredTo: string | null;     // ISO date or null (null = today)
  category: string | null;       // Only set when deferred (Epic 3)
  completedAt: string | null;    // ISO date when completed, null if active
}

export interface AppState {
  tasks: Task[];
  categories: string[];          // Populated in Epic 3
}

export type TaskAction =
  | { type: 'ADD_TASK'; text: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string };
```

**Task Lifecycle in Epic 2:**
- **Created**: `deferredTo = null`, `category = null`, `completedAt = null`
- **Completed**: `completedAt` set to current ISO timestamp
- **Deleted**: Task removed from array entirely

**Today View Filter Logic:**
```typescript
const todayTasks = tasks.filter(task =>
  task.completedAt === null &&
  (task.deferredTo === null || isToday(parseISO(task.deferredTo)))
);
```

### APIs and Interfaces

No backend APIs. All operations are synchronous in-memory state updates.

**Component Props Interfaces:**

```typescript
// TaskCard.tsx
export interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

// TaskList.tsx
export interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

// AddTaskInput.tsx
export interface AddTaskInputProps {
  onAdd: (text: string) => void;
}

// TodayView.tsx
export interface TodayViewProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}
```

**useTasks Hook Interface:**

```typescript
export const useTasks = (): {
  tasks: Task[];
  addTask: (text: string) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
} => { /* implementation */ };
```

### Workflows and Sequencing

**Add Task Flow:**
```
User types in AddTaskInput
    ↓
User presses Enter
    ↓
AddTaskInput validates (non-empty text)
    ↓
AddTaskInput calls onAdd(text)
    ↓
useTasks dispatches { type: 'ADD_TASK', text }
    ↓
Reducer creates new Task:
  - id: crypto.randomUUID()
  - text: trimmed input
  - createdAt: new Date().toISOString()
  - deferredTo: null
  - category: null
  - completedAt: null
    ↓
Task appended to tasks array
    ↓
TaskList re-renders with new task
    ↓
New task animates in (slide-in from bottom)
    ↓
AddTaskInput clears
```

**Complete Task Flow:**
```
User clicks checkbox on TaskCard
    ↓
TaskCard calls onComplete(task.id)
    ↓
useTasks dispatches { type: 'COMPLETE_TASK', id }
    ↓
Reducer sets completedAt = new Date().toISOString()
    ↓
TaskCard shows immediate visual feedback:
  - Checkbox fills with green checkmark
  - 300ms delay
  - Task fades out (opacity 0) + slides left (translateX -20px)
    ↓
Task filtered out of todayTasks (completedAt !== null)
    ↓
TaskList re-renders without task
```

**Delete Task Flow:**
```
User hovers TaskCard (desktop) or sees actions (mobile)
    ↓
User clicks trash icon
    ↓
window.confirm("Delete this task?") displays
    ↓
If confirmed:
  - TaskCard calls onDelete(task.id)
  - useTasks dispatches { type: 'DELETE_TASK', id }
  - Reducer filters out task from array
  - TaskList re-renders without task
    ↓
If cancelled:
  - No action taken
```

**State Update Pattern (Reducer):**
```typescript
const taskReducer = (state: Task[], action: TaskAction): Task[] => {
  switch (action.type) {
    case 'ADD_TASK':
      return [...state, {
        id: crypto.randomUUID(),
        text: action.text.trim(),
        createdAt: new Date().toISOString(),
        deferredTo: null,
        category: null,
        completedAt: null,
      }];

    case 'COMPLETE_TASK':
      return state.map(task =>
        task.id === action.id
          ? { ...task, completedAt: new Date().toISOString() }
          : task
      );

    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.id);

    default:
      return state;
  }
};
```

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation | Source |
|--------|--------|----------------|--------|
| Interaction Response | < 100ms | All task operations are synchronous in-memory state updates; no network calls | PRD - Performance Targets |
| Add Task Time | < 5 seconds end-to-end | Single input field, Enter to submit, immediate render | PRD - Success Criteria |
| Completion Animation | 300ms total | CSS transition: 300ms fade + slide | UX Spec - Journey 2 |
| Re-render Performance | Imperceptible | React's virtual DOM diffing; small task lists (< 100 items typical) | Architecture - Performance |

**Animation Specifications:**
- **Task appear**: `transition: opacity 200ms ease-out, transform 200ms ease-out` (slide up from below)
- **Task complete**: Checkbox fills immediately, then after 300ms: `opacity: 0, transform: translateX(-20px)` over 300ms
- **Task delete**: Immediate removal (no animation needed after confirm)

**Bundle Impact:**
- This epic adds minimal bundle size (< 5KB gzipped)
- No new heavy dependencies introduced
- Components are lightweight functional components

### Security

| Concern | Assessment | Mitigation |
|---------|------------|------------|
| XSS via task text | Low risk - React auto-escapes | Use `{task.text}` not `dangerouslySetInnerHTML` |
| Input validation | Minimal attack surface | Trim whitespace, reject empty strings |
| State manipulation | Client-only, no server | No security implications for local state |

**Input Sanitization:**
```typescript
// AddTaskInput - before calling onAdd
const trimmedText = inputValue.trim();
if (trimmedText.length === 0) return; // Reject empty
if (trimmedText.length > 500) return; // Optional: limit length
onAdd(trimmedText);
```

**Note:** Per architecture.md, this is a local-only app with no backend, no auth, and no network requests. Security concerns are minimal.

### Reliability/Availability

| Requirement | Implementation | Notes |
|-------------|----------------|-------|
| State consistency | Immutable updates via reducer | No mutation bugs possible |
| Error boundary | Wrap TodayView in React ErrorBoundary | Graceful failure if component crashes |
| Data loss prevention | Not in Epic 2 scope | Epic 4 adds localStorage persistence |

**Error Handling Strategy:**
- Invalid actions are ignored by reducer (default case returns unchanged state)
- Component errors caught by ErrorBoundary display fallback UI
- No network errors possible (no network calls)

**Known Limitation:** Until Epic 4, all data is lost on page refresh. This is acceptable for the development sequence.

### Observability

| Signal | Implementation | When |
|--------|----------------|------|
| Action logging | Console log in development only | On every dispatch |
| Error logging | Console.error for caught errors | On ErrorBoundary trigger |
| Performance logging | None required | N/A for simple operations |

**Development Logging Pattern:**
```typescript
// In useTasks reducer wrapper
if (import.meta.env.DEV) {
  console.log('[Today] Action:', action.type, action);
}
```

**No external observability tools.** Per PRD NFR4-NFR5, no telemetry or analytics are sent externally to maintain user privacy.

## Dependencies and Integrations

### Existing Dependencies (from Epic 1)

All required dependencies are already installed per Epic 1's project initialization.

**Production Dependencies Used in Epic 2:**

| Package | Version | Usage in Epic 2 |
|---------|---------|-----------------|
| `react` | ^19.2.0 | Component framework, useState, useReducer |
| `react-dom` | ^19.2.0 | DOM rendering |
| `lucide-react` | ^0.562.0 | Icons: Circle, CheckCircle2, Trash2 |
| `date-fns` | ^4.1.0 | `isToday()`, `parseISO()` for task filtering |

**Production Dependencies NOT Used in Epic 2:**

| Package | Version | Deferred To |
|---------|---------|-------------|
| `@radix-ui/react-dialog` | ^1.1.15 | Epic 3 (DeferModal) |
| `@radix-ui/react-popover` | ^1.1.15 | Epic 3 (DatePicker) |
| `@radix-ui/react-select` | ^1.1.15 | Epic 3 (CategoryDropdown) |

**Development Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.3 | Type checking |
| `vite` | ^7.2.4 | Build tool |
| `tailwindcss` | ^4.1.18 | Styling |
| `@tailwindcss/vite` | ^4.1.18 | Vite integration |
| `eslint` | ^9.39.1 | Linting |

### New Dependencies

**None required.** Epic 2 uses only packages already installed in Epic 1.

### External Integrations

| Integration | Type | Status |
|-------------|------|--------|
| Google Fonts | CDN | Already configured (Epic 1) |
| localStorage | Browser API | Not used until Epic 4 |

### Icon Usage

| Icon | Component | Purpose |
|------|-----------|---------|
| `Circle` | TaskCard | Unchecked checkbox |
| `CheckCircle2` | TaskCard | Checked checkbox (completed state) |
| `Trash2` | TaskCard | Delete action button |
| `Clock` | TaskCard | Defer button placeholder (Epic 3 functionality) |

## Acceptance Criteria (Authoritative)

### Story 2.1: Today View with Task List

1. **AC-2.1.1**: When on the Today tab with tasks, each task displays as a white card with circle checkbox on the left, task text in DM Sans 16px, and subtle border (#e2e8f0)
2. **AC-2.1.2**: Task cards have 12px vertical gap between them
3. **AC-2.1.3**: When on the Today tab with no tasks, the empty state displays "Nothing for today." with "Add a task to get started." subtitle
4. **AC-2.1.4**: Empty state text uses muted-foreground color (#64748b) and is centered
5. **AC-2.1.5**: Task cards are full-width within the centered 600px container
6. **AC-2.1.6**: On mobile (< 768px), task cards extend to full viewport width with appropriate padding

### Story 2.2: Add Task

7. **AC-2.2.1**: An "Add a task..." input field is visible below the task list with dashed border
8. **AC-2.2.2**: When the input is focused, the border becomes solid
9. **AC-2.2.3**: When user types text and presses Enter, a new task appears at the bottom of the list
10. **AC-2.2.4**: After adding a task, the input clears
11. **AC-2.2.5**: New tasks animate in with a subtle slide-up effect (200ms)
12. **AC-2.2.6**: Pressing Enter with empty input does nothing (no error, no empty task created)
13. **AC-2.2.7**: Task text is trimmed of leading/trailing whitespace before creation

### Story 2.3: Complete Task

14. **AC-2.3.1**: Clicking the circle checkbox immediately fills it with a green checkmark (#22c55e)
15. **AC-2.3.2**: After 300ms delay, the task fades out (opacity 0) and slides left (translateX -20px) over 300ms
16. **AC-2.3.3**: The completed task is removed from the Today list
17. **AC-2.3.4**: The task's completedAt field is set to the current ISO timestamp
18. **AC-2.3.5**: The completion animation feels calm and satisfying (no confetti, no sounds)

### Story 2.4: Delete Task

19. **AC-2.4.1**: On desktop, hovering over a task card reveals the trash icon in the actions area
20. **AC-2.4.2**: On mobile (< 768px), the trash icon is always visible
21. **AC-2.4.3**: Clicking the trash icon displays a confirmation prompt: "Delete this task?"
22. **AC-2.4.4**: If user confirms, the task is immediately removed from the list
23. **AC-2.4.5**: If user cancels, nothing happens and the task remains
24. **AC-2.4.6**: Deleted tasks are completely removed from state (not marked as deleted)

### Cross-Story Acceptance Criteria

25. **AC-2.X.1**: All components render without TypeScript errors
26. **AC-2.X.2**: All components render without React console warnings
27. **AC-2.X.3**: Layout is responsive across desktop (1024px+), tablet (768-1023px), and mobile (< 768px)
28. **AC-2.X.4**: All interactive elements have visible focus states for keyboard navigation
29. **AC-2.X.5**: Task actions (complete, delete) respond in under 100ms

## Traceability Mapping

| AC | FR | Spec Section | Component(s) | Test Approach |
|----|-----|--------------|--------------|---------------|
| AC-2.1.1 | FR14 | UX Spec 6.1 (Task Card) | TaskCard.tsx | Visual: verify card styling matches spec |
| AC-2.1.2 | FR14 | UX Spec 4.1 (Spacing) | TaskList.tsx | Visual: verify 12px gap between cards |
| AC-2.1.3 | FR14 | UX Spec 7.2 (Empty States) | TodayView.tsx | Visual: clear all tasks, verify message |
| AC-2.1.4 | FR14 | UX Spec 7.2 | TodayView.tsx | Visual: verify color and centering |
| AC-2.1.5 | FR28 | UX Spec 4.1 (Layout) | TaskCard.tsx | DevTools: verify max-width 600px container |
| AC-2.1.6 | FR30 | UX Spec 8.1 (Mobile) | TaskCard.tsx | DevTools: resize to mobile, verify full-width |
| AC-2.2.1 | FR1 | UX Spec 6.1 (Add Input) | AddTaskInput.tsx | Visual: verify dashed border style |
| AC-2.2.2 | FR1 | UX Spec 6.1 | AddTaskInput.tsx | Manual: focus input, verify solid border |
| AC-2.2.3 | FR1 | PRD FR1 | AddTaskInput.tsx, useTasks | Manual: type text, press Enter, verify task appears |
| AC-2.2.4 | FR1 | UX Spec 5.1 (Journey 1) | AddTaskInput.tsx | Manual: add task, verify input clears |
| AC-2.2.5 | FR1 | UX Spec 5.1 | TaskCard.tsx | Visual: verify slide-in animation |
| AC-2.2.6 | FR1 | UX Spec 5.1 | AddTaskInput.tsx | Manual: empty input + Enter, verify no action |
| AC-2.2.7 | FR1 | Architecture (Input) | useTasks.ts | Manual: add "  test  ", verify stored as "test" |
| AC-2.3.1 | FR2 | UX Spec 5.1 (Journey 2) | TaskCard.tsx | Visual: click checkbox, verify green fill |
| AC-2.3.2 | FR2 | UX Spec 5.1 | TaskCard.tsx | Visual: verify fade-out + slide animation |
| AC-2.3.3 | FR2 | PRD FR2 | TaskCard.tsx, useTasks | Manual: complete task, verify removed |
| AC-2.3.4 | FR2 | Architecture (Data) | useTasks.ts | DevTools: check state for completedAt |
| AC-2.3.5 | FR2 | UX Spec 2.1 (Principles) | TaskCard.tsx | Visual: verify calm animation |
| AC-2.4.1 | FR3 | UX Spec 6.1 (Actions) | TaskCard.tsx | Manual: hover on desktop, verify trash appears |
| AC-2.4.2 | FR30 | UX Spec 8.1 | TaskCard.tsx | Manual: mobile viewport, verify always visible |
| AC-2.4.3 | FR3 | PRD FR3 | TaskCard.tsx | Manual: click trash, verify confirm dialog |
| AC-2.4.4 | FR3 | PRD FR3 | TaskCard.tsx, useTasks | Manual: confirm delete, verify removal |
| AC-2.4.5 | FR3 | PRD FR3 | TaskCard.tsx | Manual: cancel delete, verify task remains |
| AC-2.4.6 | FR3 | Architecture (Data) | useTasks.ts | DevTools: verify task removed from array |
| AC-2.X.1 | All | Architecture | All | Build: `npm run build` succeeds |
| AC-2.X.2 | All | Architecture | All | DevTools: no console warnings |
| AC-2.X.3 | FR28-30 | UX Spec 8.1 | All | Manual: test at 3 breakpoints |
| AC-2.X.4 | A11y | UX Spec 8.2 | All | Manual: Tab through, verify focus rings |
| AC-2.X.5 | NFR | PRD (Performance) | All | Manual: verify instant response |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | Data loss on refresh until Epic 4 | Medium - User frustration during development | High (expected) | Document limitation clearly; prioritize Epic 4 after Epic 2 if needed |
| R2 | Animation jank on low-end devices | Low - Poor UX on slow hardware | Low | Use CSS transitions (GPU-accelerated), test on throttled CPU |
| R3 | Completion animation timing feels wrong | Low - Subtle UX issue | Medium | Tune timing constants based on user testing; values are adjustable |
| R4 | Mobile touch targets too small | Medium - A11y violation | Low | Ensure 44px minimum per UX spec; test on actual devices |

### Assumptions

| ID | Assumption | Rationale | Validation |
|----|------------|-----------|------------|
| A1 | Epic 1 is complete and stable | Foundation components (Header, TabBar) exist | Verify app runs with `npm run dev` |
| A2 | Design tokens are configured in Tailwind | Custom classes like `bg-surface` available | Test utility class application |
| A3 | Users have < 100 tasks typically | Performance targets based on light usage | PRD scope is personal productivity |
| A4 | window.confirm() acceptable for MVP delete | Can upgrade to custom modal post-MVP | PRD emphasizes simplicity |
| A5 | No need for undo on complete/delete | PRD doesn't require undo | Completion is satisfying, delete has confirm |

### Open Questions

| ID | Question | Impact | Resolution Path |
|----|----------|--------|-----------------|
| Q1 | Should completed tasks be permanently deleted or stored? | Data model | **Resolved**: Store with completedAt timestamp per architecture.md - allows future "completed history" feature |
| Q2 | Should add input be at top or bottom of list? | UX | **Resolved**: Bottom per UX spec layout diagram (section 4.2) |
| Q3 | Maximum task text length? | Validation | **Decision**: 500 characters soft limit (truncate display, store full) - reasonable for task descriptions |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Manual Visual | All 29 ACs | Human in browser | 100% |
| Component Unit | useTasks reducer | Vitest | Core logic paths |
| Integration | Task flows | Vitest + Testing Library | Add → Complete → Delete |

### Test Approach by Story

**Story 2.1 - Today View with Task List:**
```
Test Cases:
1. Render task list with 3 mock tasks → verify 3 TaskCards displayed
2. Render empty task list → verify empty state message
3. Resize viewport to mobile → verify responsive layout
4. Verify card styling matches design tokens
```

**Story 2.2 - Add Task:**
```
Test Cases:
1. Type "Buy milk" + Enter → task appears in list
2. Empty input + Enter → no task created
3. "  spaced text  " + Enter → stored as "spaced text"
4. Add task → input clears
5. New task appears at bottom of list (not top)
```

**Story 2.3 - Complete Task:**
```
Test Cases:
1. Click checkbox → immediate visual feedback (green check)
2. After animation → task removed from list
3. Completed task has completedAt timestamp
4. Multiple completes in sequence work correctly
```

**Story 2.4 - Delete Task:**
```
Test Cases:
1. Hover task → trash icon appears (desktop)
2. Mobile viewport → trash always visible
3. Click trash → confirm dialog appears
4. Confirm → task removed
5. Cancel → task remains
```

### Edge Cases

| Scenario | Expected Behavior | Test Method |
|----------|-------------------|-------------|
| Add task with only whitespace | Rejected (no task created) | Manual |
| Complete task while another animating | Both animations complete | Manual |
| Delete last task in list | Empty state appears | Manual |
| Very long task text (500+ chars) | Truncated display, full in state | Manual |
| Rapid add/complete/delete | All operations succeed | Manual stress test |

### Automated Test Setup

**useTasks.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import { taskReducer } from '../hooks/useTasks';

describe('taskReducer', () => {
  it('ADD_TASK creates task with correct structure', () => {
    const state = [];
    const action = { type: 'ADD_TASK', text: 'Test task' };
    const newState = taskReducer(state, action);

    expect(newState).toHaveLength(1);
    expect(newState[0].text).toBe('Test task');
    expect(newState[0].id).toBeDefined();
    expect(newState[0].completedAt).toBeNull();
  });

  it('COMPLETE_TASK sets completedAt', () => {
    const state = [{ id: '1', text: 'Test', completedAt: null }];
    const action = { type: 'COMPLETE_TASK', id: '1' };
    const newState = taskReducer(state, action);

    expect(newState[0].completedAt).not.toBeNull();
  });

  it('DELETE_TASK removes task', () => {
    const state = [{ id: '1', text: 'Test' }];
    const action = { type: 'DELETE_TASK', id: '1' };
    const newState = taskReducer(state, action);

    expect(newState).toHaveLength(0);
  });
});
```

### Definition of Done for Epic 2

- [ ] All 4 stories implemented
- [ ] All 29 acceptance criteria verified
- [ ] `npm run build` succeeds without errors
- [ ] No console warnings in browser
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested at mobile, tablet, desktop breakpoints
- [ ] Code reviewed
- [ ] useTasks reducer has unit tests passing
