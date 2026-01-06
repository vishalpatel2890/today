# Story 3.4: Defer Action & Tomorrow View

Status: review

## Story

As a **user**,
I want **to confirm deferment and see the task move to the appropriate view**,
so that **I know my deferment was successful**.

## Acceptance Criteria

1. **AC-3.4.1**: Given I have selected a date and category in the defer modal, when I click "Defer", then the modal closes

2. **AC-3.4.2**: Given I click "Defer" with valid selections, the task slides out of the current view with a 300ms animation (opacity fade + translateX left)

3. **AC-3.4.3**: Given I defer a task, a toast notification appears at bottom-center showing: "Deferred to [Tomorrow/Jan 15/Someday] / [Category]"

4. **AC-3.4.4**: Given a toast appears, it auto-dismisses after 3 seconds with a slide-down animation

5. **AC-3.4.5**: Given I navigate to the Tomorrow tab, I see tasks that have been deferred to tomorrow (deferredTo equals tomorrow's date)

6. **AC-3.4.6**: Given I view tasks in the Tomorrow tab, they display in the same card format as Today view (checkbox, text, action icons)

## Frontend Test Gate

**Gate ID**: 3-4-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 3.3 complete (DeferModal with date + category selection working)
- [ ] Starting state: Today tab selected, at least 2 tasks visible
- [ ] Test user: Any (no auth required)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add 2 tasks if none exist | Add task input | Two tasks visible in Today view |
| 3 | Click clock icon on first task | Task card actions | DeferModal opens |
| 4 | Select "Tomorrow" date option | Date selection buttons | Tomorrow button selected (dark bg) |
| 5 | Select/create a category (e.g., "Work") | Category dropdown | Category selected |
| 6 | Click "Defer" button | Modal footer | Modal closes |
| 7 | Observe task animation | Task list | Task slides out left with fade (300ms) |
| 8 | Observe toast notification | Bottom-center screen | Toast shows "Deferred to Tomorrow / Work" |
| 9 | Wait 3 seconds | Toast | Toast auto-dismisses with slide-down |
| 10 | Click "Tomorrow" tab | Tab bar | Tomorrow view loads |
| 11 | Verify deferred task appears | Tomorrow task list | Task visible with same card format |
| 12 | Verify task has checkbox & actions | Task card | Checkbox left, action icons on hover |
| 13 | Return to Today tab | Tab bar | Original task is gone from Today |
| 14 | Defer another task with "Pick date" | DeferModal calendar | Select a date > tomorrow |
| 15 | Verify toast shows date | Toast notification | "Deferred to Jan 15 / [Category]" |
| 16 | Defer a task with "No date" | DeferModal | Select category, click Defer |
| 17 | Verify toast shows "Someday" | Toast notification | "Deferred to Someday / [Category]" |

### Success Criteria (What User Sees)
- [ ] Clicking "Defer" closes modal immediately
- [ ] Task slides out with smooth 300ms animation (fade + slide left)
- [ ] Toast appears at bottom-center with correct message format
- [ ] Toast message includes date destination AND category
- [ ] Toast auto-dismisses after ~3 seconds
- [ ] Tomorrow tab shows tasks deferred to tomorrow
- [ ] Task cards in Tomorrow view match Today view format
- [ ] Tasks deferred to specific dates or "no date" do NOT appear in Tomorrow
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the defer action confirmation clear and satisfying?
2. Is the animation timing (300ms) appropriate - not too fast or slow?
3. Is the toast message format informative without being verbose?
4. Does the Tomorrow view feel consistent with Today view?

## Tasks / Subtasks

- [x] **Task 1: Implement DEFER_TASK action in useTasks** (AC: 1, 2)
  - [x] Open `today-app/src/hooks/useTasks.ts`
  - [x] Add DEFER_TASK case to reducer:
    ```typescript
    case 'DEFER_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.id
            ? { ...task, deferredTo: action.deferredTo, category: action.category }
            : task
        )
      };
    ```
  - [x] Add `deferTask` function to returned hook interface:
    ```typescript
    const deferTask = (id: string, deferredTo: string | null, category: string) => {
      dispatch({ type: 'DEFER_TASK', id, deferredTo, category });
    };
    ```
  - [x] Export deferTask from useTasks

- [x] **Task 2: Wire DeferModal to execute defer action** (AC: 1)
  - [x] Open `today-app/src/components/DeferModal.tsx`
  - [x] Add `onDefer` prop to DeferModalProps:
    ```typescript
    onDefer: (deferredTo: string | null, category: string) => void;
    ```
  - [x] Implement handleDefer function that:
    - Calls `onDefer(selectedDate, selectedCategory)`
    - Calls `onClose()` to close modal
  - [x] Connect "Defer" button onClick to handleDefer (only when canDefer is true)

- [x] **Task 3: Implement task slide-out animation** (AC: 2)
  - [x] Open `today-app/src/components/TaskCard.tsx`
  - [x] Add state for animation: `const [isSliding, setIsSliding] = useState(false)`
  - [x] Add CSS classes for sliding animation:
    ```css
    .sliding-out {
      animation: slideOut 300ms ease-out forwards;
    }
    @keyframes slideOut {
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }
    ```
  - [x] Modify defer flow to:
    1. Set `isSliding = true`
    2. Wait 300ms (setTimeout)
    3. Execute actual defer action
  - [x] Apply `sliding-out` class conditionally

- [x] **Task 4: Create Toast component** (AC: 3, 4)
  - [x] Create `today-app/src/components/Toast.tsx`
  - [x] Define ToastProps interface:
    ```typescript
    interface ToastProps {
      message: string;
      isVisible: boolean;
      onDismiss: () => void;
    }
    ```
  - [x] Implement Toast with:
    - Fixed position: bottom-center (bottom-6, left-1/2, -translate-x-1/2)
    - Background: `bg-foreground text-surface` (dark background, light text)
    - Border radius: `rounded-lg`
    - Padding: `px-4 py-3`
    - Shadow: `shadow-lg`
    - Entry animation: slide up from below
    - Exit animation: slide down
  - [x] Use useEffect to auto-dismiss after 3000ms
  - [x] Export as named export

- [x] **Task 5: Add toast state management to App** (AC: 3, 4)
  - [x] Open `today-app/src/App.tsx`
  - [x] Add toast state:
    ```typescript
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    ```
  - [x] Create `showToast` function:
    ```typescript
    const showToast = (message: string) => {
      setToast({ message, visible: true });
    };
    ```
  - [x] Create `hideToast` function:
    ```typescript
    const hideToast = () => {
      setToast(prev => ({ ...prev, visible: false }));
    };
    ```
  - [x] Render Toast component at App level (outside view containers)
  - [x] Pass showToast down through props to DeferModal

- [x] **Task 6: Format toast message** (AC: 3)
  - [x] In DeferModal or App, format message based on deferredTo:
    - If deferredTo is tomorrow's date: "Deferred to Tomorrow / [Category]"
    - If deferredTo is a specific date: "Deferred to [Month Day] / [Category]"
    - If deferredTo is null: "Deferred to Someday / [Category]"
  - [x] Use date-fns `format(date, 'MMM d')` for date formatting
  - [x] Use date-fns `isTomorrow()` to check if date is tomorrow

- [x] **Task 7: Create TomorrowView component** (AC: 5, 6)
  - [x] Create `today-app/src/views/TomorrowView.tsx`
  - [x] Define TomorrowViewProps:
    ```typescript
    interface TomorrowViewProps {
      tasks: Task[];
      categories: string[];
      onComplete: (id: string) => void;
      onDelete: (id: string) => void;
      onDefer: (id: string, deferredTo: string | null, category: string) => void;
      onCreateCategory: (name: string) => void;
      onShowToast: (message: string) => void;
    }
    ```
  - [x] Filter tasks: `tasks.filter(task => task.deferredTo && isTomorrow(parseISO(task.deferredTo)) && !task.completedAt)`
  - [x] Reuse TaskList component for rendering (same as TodayView)
  - [x] Add empty state: "Nothing planned for tomorrow."

- [x] **Task 8: Integrate TomorrowView into App** (AC: 5, 6)
  - [x] Open `today-app/src/App.tsx`
  - [x] Import TomorrowView
  - [x] Add TomorrowView rendering when activeTab === 'tomorrow'
  - [x] Pass required props (tasks, handlers, categories)

- [x] **Task 9: Update TodayView filtering** (AC: 2)
  - [x] Open `today-app/src/views/TodayView.tsx`
  - [x] Ensure TodayView filters OUT deferred tasks:
    ```typescript
    const todayTasks = tasks.filter(task =>
      !task.completedAt &&
      (!task.deferredTo || isToday(parseISO(task.deferredTo)))
    );
    ```
  - [x] This ensures deferred tasks disappear from Today view

- [x] **Task 10: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Run `npm run dev` and test:
    - [x] Defer task to Tomorrow - verify toast and animation
    - [x] Check Tomorrow tab - verify task appears
    - [x] Defer task to specific date - verify toast format
    - [x] Defer task to No date - verify "Someday" in toast
    - [x] Verify Today view no longer shows deferred tasks
    - [x] Verify toast auto-dismisses after 3 seconds
  - [x] Verify no console errors

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-3.md, this story:
- **Creates:** Toast.tsx, TomorrowView.tsx
- **Modifies:** useTasks.ts (DEFER_TASK action), DeferModal.tsx (wire up defer), TaskCard.tsx (animation), App.tsx (toast state, view routing), TodayView.tsx (filtering)

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const Toast = () => { ... }`
- Destructure props in function signature

### DEFER_TASK Action Model

Per architecture.md "Data Architecture":
```typescript
| { type: 'DEFER_TASK'; id: string; deferredTo: string | null; category: string }
```

Task fields updated on defer:
- `deferredTo`: ISO date string (tomorrow, future date) or null (someday)
- `category`: Required string category name

### View Filtering Logic

Per tech-spec-epic-3.md "Workflows and Sequencing":
- **Today:** `(!task.deferredTo || isToday(parseISO(task.deferredTo))) && !task.completedAt`
- **Tomorrow:** `task.deferredTo && isTomorrow(parseISO(task.deferredTo)) && !task.completedAt`
- **Deferred:** Future (handled in Story 3.5)

### Toast Design

Per ux-design-specification.md Section 6.1:
```
Toast Notification

Anatomy:
+-------------------------------------+
| Deferred to Tomorrow / Work         |
+-------------------------------------+

Behavior:
- Appears bottom-center
- Auto-dismisses after 3 seconds
- No manual dismiss needed
- Stacks if multiple (rare)
```

Styling (UX spec tokens):
- Background: `--foreground` (#0f172a)
- Text: `--surface` (#ffffff)
- Border-radius: `--radius-lg` (8px)
- Shadow: `--shadow-lg`

### Animation Timing

Per tech-spec-epic-3.md "Non-Functional Requirements":
- Defer action: < 100ms (synchronous state update)
- Animation smoothness: 60fps (CSS transitions only)

Task slide-out animation (AC-3.4.2):
```css
@keyframes slideOut {
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
Duration: 300ms, easing: ease-out

### Date Formatting

Per tech-spec-epic-3.md dependencies:
- date-fns ^4.1.0 for: `isTomorrow`, `parseISO`, `format`, `addDays`

Toast date format examples:
- Tomorrow: "Deferred to Tomorrow / Work"
- Jan 15: "Deferred to Jan 15 / Personal"
- No date: "Deferred to Someday / Ideas"

### Learnings from Previous Story

**From Story 3-3-defer-modal-category-selection-and-creation (Status: done)**

- **CategoryDropdown Created**: Component at `src/components/CategoryDropdown.tsx` - handles category selection and creation
- **DeferModal State**: Has `dateOption`, `selectedDate`, `selectedCategory` state
- **canDefer Logic**: Defer button enabled when `dateOption !== null && selectedCategory !== null`
- **Props Threading**: categories + onCreateCategory flow through App → TodayView → TaskList → TaskCard → DeferModal
- **AppState Updated**: Now includes `categories: string[]` array
- **useTasks Extended**: Exposes `categories` and `addCategory` function

**Key files to reference:**
- `src/components/DeferModal.tsx` - extend with onDefer callback execution
- `src/components/CategoryDropdown.tsx` - already complete, no changes needed
- `src/hooks/useTasks.ts` - add DEFER_TASK action
- `src/App.tsx` - add toast state and TomorrowView

[Source: notes/sprint-artifacts/3-3-defer-modal-category-selection-and-creation.md#Dev-Agent-Record]

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── components/
│   ├── Toast.tsx               # NEW: Toast notification component
│   ├── DeferModal.tsx          # MODIFIED: Add onDefer prop, execute defer
│   └── TaskCard.tsx            # MODIFIED: Add slide-out animation state
├── views/
│   ├── TodayView.tsx           # MODIFIED: Filter out deferred tasks
│   └── TomorrowView.tsx        # NEW: Tomorrow view component
├── hooks/
│   └── useTasks.ts             # MODIFIED: Add DEFER_TASK action, deferTask function
└── App.tsx                     # MODIFIED: Toast state, TomorrowView routing
```

### Styling Guide

Per UX spec design tokens:

Toast styling:
- Container: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
- Background: `bg-slate-900 text-white` (or `bg-foreground text-surface` with CSS vars)
- Padding: `px-4 py-3`
- Border radius: `rounded-lg`
- Shadow: `shadow-lg`
- Animation: `transition-all duration-300 ease-out`

Slide-out animation:
- Use CSS animation or Tailwind: `animate-slideOut`
- Define keyframes in index.css or inline
- Duration: 300ms
- Transform: `translateX(-20px)` + `opacity: 0`

### Edge Cases

Per tech-spec-epic-3.md:
- **Defer action fails**: Should not happen (synchronous, local), but if it does, don't show success toast
- **Multiple rapid defers**: Toast should stack or replace (rare scenario)
- **Tab switch during animation**: Animation should complete, task should be in correct view
- **Empty Tomorrow view**: Show friendly empty state message

### References

- [Source: notes/epics.md#Story-3.4] - Story definition with AC
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story-3.4] - AC-3.4.1 through AC-3.4.6
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Workflows-and-Sequencing] - Defer task flow
- [Source: notes/ux-design-specification.md#Toast-Notification] - Toast design spec
- [Source: notes/architecture.md#Data-Architecture] - TaskAction types

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/3-4-defer-action-and-tomorrow-view.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Implemented DEFER_TASK action in useTasks reducer with dev logging
- Added deferTask function to useTasks hook return
- Wired DeferModal with onDefer prop and handleDefer function
- Implemented slide-out animation (300ms, translateX(-20px), opacity fade) in TaskCard
- Created Toast component with auto-dismiss after 3 seconds
- Added toast state management to App with showToast/hideToast callbacks
- Implemented formatToastMessage in TaskCard for "Tomorrow / Someday / MMM d" format
- Created TomorrowView with isTomorrow filtering from date-fns
- Updated TodayView to filter out deferred tasks
- Updated TaskList and TaskCard props for new defer signature
- Added CSS animations for defer slide-out and toast in/out
- Build passes with no TypeScript errors

### File List

**NEW:**
- `today-app/src/components/Toast.tsx` - Toast notification component
- `today-app/src/views/TomorrowView.tsx` - Tomorrow view component

**MODIFIED:**
- `today-app/src/hooks/useTasks.ts` - Added DEFER_TASK action, deferTask function
- `today-app/src/components/DeferModal.tsx` - Added onDefer prop, handleDefer function
- `today-app/src/components/TaskCard.tsx` - Added slide-out animation, formatToastMessage, onShowToast prop
- `today-app/src/components/TaskList.tsx` - Updated onDefer signature, added onShowToast prop
- `today-app/src/views/TodayView.tsx` - Added filtering, onShowToast prop
- `today-app/src/App.tsx` - Added toast state, TomorrowView integration
- `today-app/src/index.css` - Added defer slide-out and toast animations

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (3-4-defer-action-and-tomorrow-view) | SM Agent |
| 2026-01-06 | Implementation complete - all 10 tasks done, build passes | Dev Agent |
| 2026-01-06 | Frontend Test Gate PASSED - status updated to review | Dev Agent |
