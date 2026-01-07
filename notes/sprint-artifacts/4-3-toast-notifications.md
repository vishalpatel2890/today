# Story 4.3: Toast Notifications

Status: done

## Story

As a **user**,
I want **subtle feedback when actions complete**,
so that **I know my actions were successful without being interrupted**.

## Acceptance Criteria

1. **AC-4.3.1**: Given I defer a task, a toast appears: "Deferred to [Tomorrow/Jan 15/Someday] / [Category]"

2. **AC-4.3.2**: Given I delete a task, a toast appears: "Task deleted"

3. **AC-4.3.3**: Given localStorage is full and a save fails, a toast appears: "Storage full. Some data may not save."

4. **AC-4.3.4**: Toasts appear at the bottom-center of the screen

5. **AC-4.3.5**: Toasts auto-dismiss after 3 seconds

6. **AC-4.3.6**: Toasts slide in from below and slide out to below (animated)

7. **AC-4.3.7**: Multiple toasts stack vertically (most recent at bottom)

## Frontend Test Gate

**Gate ID**: 4-3-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 4.1 and 4.2 complete (persistence and auto-surfacing working)
- [ ] Test user: Any (no auth required)
- [ ] Starting state: App loaded with some tasks in Today view

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Add a task, then click defer button | Task card → clock icon | Defer modal opens |
| 2 | Select "Tomorrow" and a category, click "Defer" | Defer modal | Modal closes, toast slides in from bottom |
| 3 | Read toast message | Bottom-center of screen | Shows "Deferred to Tomorrow / [Category]" |
| 4 | Wait 3 seconds | Toast area | Toast slides out and disappears |
| 5 | Add another task, defer to "Pick date" → Jan 20 | Defer modal | Toast shows "Deferred to Jan 20 / [Category]" |
| 6 | Add another task, defer with "No date" | Defer modal | Toast shows "Deferred to Someday / [Category]" |
| 7 | Hover over a task, click trash icon | Task card → trash icon | Confirmation prompt appears |
| 8 | Confirm deletion | Confirmation dialog | Toast shows "Task deleted" |
| 9 | Rapidly defer 3 tasks in quick succession | Multiple defer actions | Toasts stack vertically, most recent at bottom |
| 10 | Watch stacked toasts | Toast area | Each toast dismisses after 3s independently |
| 11 | Fill localStorage (DevTools trick), try adding task | Browser DevTools + app | Toast shows "Storage full. Some data may not save." |

### Success Criteria (What User Sees)
- [ ] Defer action triggers toast with date/category info
- [ ] Delete action triggers "Task deleted" toast
- [ ] Toasts appear at bottom-center, not blocking main content
- [ ] Toasts slide in smoothly from below
- [ ] Toasts auto-dismiss after ~3 seconds
- [ ] Toasts slide out smoothly when dismissing
- [ ] Multiple rapid actions create stacked toasts
- [ ] Stacked toasts don't overlap or break layout
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Did toasts provide useful feedback without being intrusive?
2. Was the 3-second duration appropriate (not too fast, not too slow)?
3. Were the slide animations smooth and polished?
4. Any UX friction with multiple stacked toasts?

## Tasks / Subtasks

- [x] **Task 1: Create Toast context and provider** (AC: 4, 5, 7)
  - [x] Create `today-app/src/contexts/ToastContext.tsx`
  - [x] Define ToastMessage interface
  - [x] Create ToastContext with `addToast` and `removeToast` methods
  - [x] Create ToastProvider wrapping children
  - [x] Manage toast queue state with useState
  - [x] Auto-dismiss logic: setTimeout for each toast, call removeToast on expiry
  - [x] Export useToast hook for consuming context

- [x] **Task 2: Create Toast component with animations** (AC: 4, 5, 6, 7)
  - [x] Enhance `today-app/src/components/Toast.tsx`
  - [x] Style toast container: fixed, bottom-center, z-50
  - [x] Style individual toast: dark background for success, red for error
  - [x] Add slide-in animation: transform translateY(20px) → translateY(0)
  - [x] Add slide-out animation: opacity 1 → 0, translateY(0) → translateY(20px)
  - [x] Use CSS animate-toast-in/out classes
  - [x] Stack toasts with flex-col (newest at bottom)
  - [x] Max 3 visible toasts (dismiss oldest if exceeded)

- [x] **Task 3: Integrate ToastProvider into App** (AC: all)
  - [x] Open `today-app/src/App.tsx`
  - [x] Wrap app content with `<ToastProvider>`
  - [x] Render `<ToastContainer />` inside provider
  - [x] Remove old useState toast management
  - [x] Remove onShowToast prop drilling from views

- [x] **Task 4: Add toast to defer action** (AC: 1)
  - [x] Update `today-app/src/components/TaskCard.tsx`
  - [x] Use useToast hook
  - [x] On successful defer, call addToast with formatted message
  - [x] formatToastMessage handles Tomorrow/Someday/date formatting

- [x] **Task 5: Add toast to delete action** (AC: 2)
  - [x] Update `today-app/src/components/TaskCard.tsx`
  - [x] On successful delete (after confirmation), call addToast('Task deleted')

- [x] **Task 6: Add toast for storage errors** (AC: 3)
  - [x] App.tsx uses useToast and storageError from useTasks
  - [x] On localStorage quota exceeded, addToast with type: 'error'
  - [x] App continues functioning (graceful degradation)

- [x] **Task 7: Style toast for success vs error types** (AC: 3)
  - [x] Success type: dark foreground background, white text, CheckCircle icon
  - [x] Error type: error-bg background, error text, AlertCircle icon
  - [x] Icons from lucide-react

- [x] **Task 8: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors - PASSED
  - [x] Run `npm run dev` and test manually (Test Gate) - PASSED

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-4.md, this story:
- **Creates:** `src/contexts/ToastContext.tsx`
- **Modifies:** `src/components/Toast.tsx` (enhanced), `src/App.tsx` (wrap with provider), `src/components/TaskCard.tsx` (use useToast), views (removed onShowToast prop)

Component patterns required (from architecture.md):
- Use React Context for global toast state
- Functional components with TypeScript
- Named exports (not default)
- Tailwind CSS for styling

### Toast State Management

Per tech-spec-epic-4.md "Data Models and Contracts":

```typescript
interface ToastMessage {
  id: string;                    // Unique ID for stacking
  message: string;               // Display text
  type?: 'success' | 'error';    // Visual style (default: success)
  duration?: number;             // Auto-dismiss time (default: 3000ms)
}

interface ToastState {
  toasts: ToastMessage[];
}
```

### Toast Context API

Per tech-spec-epic-4.md "APIs and Interfaces":

```typescript
interface ToastContextValue {
  addToast: (message: string, options?: { type?: 'success' | 'error'; duration?: number }) => void;
  removeToast: (id: string) => void;
}
```

### Toast Lifecycle

Per tech-spec-epic-4.md "Workflows and Sequencing":
1. Action triggers addToast(message)
2. Toast added to queue with unique ID (crypto.randomUUID)
3. Toast slides in from bottom (transform: translateY)
4. After duration (default 3000ms), toast slides out
5. Toast removed from queue after animation completes

### Animation Details

Per UX spec and tech-spec-epic-4.md:
- Slide-in: `transform: translateY(20px)` → `translateY(0)` over 300ms
- Slide-out: `opacity: 1` → `0` + `translateY(0)` → `translateY(20px)` over 300ms
- Use CSS transitions for 60fps performance
- Transitions are GPU-accelerated (transform, opacity)

### Stacking Behavior

Per tech-spec-epic-4.md:
- Multiple toasts stack vertically (flex-col)
- Most recent toast at bottom
- Limit visible toasts to 3 (older toasts dismissed early if exceeded)
- Each toast has independent 3-second timer

### Date Formatting for Toast Messages

```typescript
// Implemented in TaskCard.tsx formatToastMessage()
function formatToastMessage(deferredTo: string | null, category: string): string {
  if (deferredTo === null) return `Deferred to Someday / ${category}`;
  // Compare with tomorrow's date
  if (isTomorrow) return `Deferred to Tomorrow / ${category}`;
  return `Deferred to ${monthName} ${day} / ${category}`; // e.g., "Jan 15"
}
```

### Error Handling Pattern

Per architecture.md "Error Handling":
```typescript
// In App.tsx
useEffect(() => {
  if (storageError) {
    addToast('Storage full. Some data may not save.', { type: 'error' })
  }
}, [storageError, addToast])
```

### Project Structure Notes

Files created/modified in this story:
```
today-app/src/
├── contexts/
│   └── ToastContext.tsx     # NEW: Toast state management
├── components/
│   ├── Toast.tsx            # MODIFIED: ToastContainer + ToastItem
│   ├── TaskCard.tsx         # MODIFIED: useToast, delete toast
│   ├── TaskList.tsx         # MODIFIED: removed onShowToast prop
│   └── CategorySection.tsx  # MODIFIED: removed onShowToast prop
├── views/
│   ├── TodayView.tsx        # MODIFIED: removed onShowToast prop
│   ├── TomorrowView.tsx     # MODIFIED: removed onShowToast prop
│   └── DeferredView.tsx     # MODIFIED: removed onShowToast prop
├── index.css                # MODIFIED: updated toast animations
└── App.tsx                  # MODIFIED: ToastProvider wrapper
```

### Dependency on Stories 4.1 and 4.2

This story builds on:
- **Story 4.1**: localStorage persistence provides the storage error scenario (AC-4.3.3)
- **Story 4.2**: Auto-surfacing is unrelated but maintains Epic 4 continuity

Toast.tsx existed from Epic 3 (Story 3.4). This story enhanced it with:
- Context-based state management (removed prop drilling)
- Full stacking behavior (max 3 toasts)
- Error type styling with icons
- Cleaner architecture

### References

- [Source: notes/epics.md#Story-4.3] - Story definition
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Story-4.3] - AC-4.3.1 through AC-4.3.7
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Data-Models-and-Contracts] - ToastMessage interface
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#APIs-and-Interfaces] - Toast Context API
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Workflows-and-Sequencing] - Toast lifecycle
- [Source: notes/architecture.md#Error-Handling] - Error handling pattern
- [Source: notes/architecture.md#Implementation-Patterns] - Component patterns

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/4-3-toast-notifications.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build passed with no TypeScript errors
- Refactored from prop drilling to Context-based toast management
- Removed legacy Toast component, now using ToastContainer + ToastItem

### Completion Notes List

- Created ToastContext with addToast/removeToast API, max 3 toasts, auto-dismiss after 3s
- Enhanced Toast.tsx with ToastContainer and ToastItem components
- Added error type styling with AlertCircle icon, success with CheckCircle icon
- Integrated ToastProvider in App.tsx, removed old useState toast management
- Updated TaskCard to use useToast directly for defer and delete toasts
- Removed onShowToast prop drilling from all views and components
- Updated CSS animations for stacked toast behavior

### File List

**Created:**
- today-app/src/contexts/ToastContext.tsx

**Modified:**
- today-app/src/components/Toast.tsx
- today-app/src/components/TaskCard.tsx
- today-app/src/components/TaskList.tsx
- today-app/src/components/CategorySection.tsx
- today-app/src/views/TodayView.tsx
- today-app/src/views/TomorrowView.tsx
- today-app/src/views/DeferredView.tsx
- today-app/src/App.tsx
- today-app/src/index.css

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (4-3-toast-notifications) | SM Agent |
| 2026-01-06 | Implementation complete - all tasks done, build passing | Dev Agent (Claude Opus 4.5) |
