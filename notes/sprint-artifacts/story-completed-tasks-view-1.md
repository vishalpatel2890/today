# Story 1.1: Completed Tasks Modal with Hotkey

**Status:** Review

---

## User Story

As a **user**,
I want **to press Cmd+Opt+D to view my completed tasks from the last 14 days**,
So that **I can review what I've accomplished and restore tasks I completed by mistake**.

---

## Acceptance Criteria

**AC1:** Given I am on any view, when I press Cmd+Opt+D (Mac) or Ctrl+Alt+D (Windows), then the Completed Tasks modal opens

**AC2:** Given the modal is open, then it shows only tasks completed in the last 14 days

**AC3:** Given completed tasks exist, then they are grouped by: Today, Yesterday, This Week, Last Week, Older

**AC4:** Given a completed task is displayed, then it shows the task text and relative completion time

**AC5:** Given a completed task is displayed, then it has an "Undo" button

**AC6:** Given I click "Undo" on a task, then the task is marked incomplete, moved to Today view, and a toast shows "Task restored to Today"

**AC7:** Given a completed task has notes, then a "Notes" button is shown that opens NotesModal

**AC8:** Given I am focused on an input/textarea/contenteditable, when I press the hotkey, then nothing happens

**AC9:** Given the modal is open, when I click X or press Escape, then the modal closes

**AC10:** Given no tasks were completed in the last 14 days, then an empty state message is shown

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1: Create `useCompletedTasksHotkey` hook**
  - [x] Copy pattern from `useDeferredViewHotkeys.ts`
  - [x] Change key detection to `KeyD`
  - [x] Single callback (no double-tap)
  - [x] Include `isInputElement` helper

- [x] **Task 2: Create `useCompletedTasksHotkey.test.ts`**
  - [x] Test Cmd+Opt+D triggers callback (Mac)
  - [x] Test Ctrl+Alt+D triggers callback (Windows)
  - [x] Test input field exclusion
  - [x] Test preventDefault/stopPropagation
  - [x] Test cleanup on unmount

- [x] **Task 3: Add `uncompleteTask` to `useTasks.ts`**
  - [x] Add `UNCOMPLETE_TASK` action type
  - [x] Add reducer case (set completedAt=null, deferredTo=today)
  - [x] Add `uncompleteTask` function with IndexedDB + Supabase sync
  - [x] Export from hook return

- [x] **Task 4: Create `CompletedTaskRow.tsx`**
  - [x] Display task text
  - [x] Display relative completion time (e.g., "2h ago", "Yesterday")
  - [x] "Undo" button with RotateCcw icon
  - [x] "Notes" button with FileText icon (only if task.notes exists)

- [x] **Task 5: Create `CompletedTasksModal.tsx`**
  - [x] Radix UI Dialog structure (follow TimeInsightsModal pattern)
  - [x] Filter tasks: `completedAt` exists AND within 14 days
  - [x] Group tasks by date using date-fns
  - [x] Render sections with headers (Today, Yesterday, etc.)
  - [x] Handle NotesModal state for viewing notes
  - [x] Empty state when no completed tasks
  - [x] 450px max-width, 80vh max-height

- [x] **Task 6: Create `CompletedTasksModal.test.tsx`**
  - [x] Test renders when isOpen=true
  - [x] Test 14-day filtering
  - [x] Test date grouping logic
  - [x] Test onUncomplete callback
  - [x] Test NotesModal opens for tasks with notes
  - [x] Test empty state

- [x] **Task 7: Integrate in `App.tsx`**
  - [x] Add `isCompletedModalOpen` state
  - [x] Add `handleOpenCompleted` callback
  - [x] Call `useCompletedTasksHotkey(handleOpenCompleted)`
  - [x] Destructure `uncompleteTask` from `useTasks`
  - [x] Render `CompletedTasksModal` with props

- [ ] **Task 8: Manual testing**
  - [ ] Verify hotkey works on Mac
  - [ ] Verify hotkey works on Windows (if available)
  - [ ] Verify grouping displays correctly
  - [ ] Verify Undo restores task to Today
  - [ ] Verify Notes button opens NotesModal
  - [ ] Verify toast appears on uncomplete

### Technical Summary

This story implements a complete feature for viewing and managing completed tasks:

1. **Hotkey Hook** - Native keyboard event listener following established pattern
2. **Modal Component** - Radix UI Dialog with date-grouped task list
3. **Task Restoration** - New `uncompleteTask` action in task reducer
4. **Notes Integration** - Reuses existing NotesModal component

Key implementation details:
- Use `e.code === 'KeyD'` for cross-platform key detection
- Use date-fns for grouping: `isToday`, `isYesterday`, `isThisWeek`, `subWeeks`
- 14-day filter: `subDays(startOfDay(new Date()), 14)`
- Follow existing modal styling from TimeInsightsModal

### Project Structure Notes

- **Files to create:**
  - `src/hooks/useCompletedTasksHotkey.ts`
  - `src/hooks/useCompletedTasksHotkey.test.ts`
  - `src/components/CompletedTasksModal.tsx`
  - `src/components/CompletedTasksModal.test.tsx`
  - `src/components/CompletedTaskRow.tsx`

- **Files to modify:**
  - `src/hooks/useTasks.ts` - Add UNCOMPLETE_TASK action + uncompleteTask function
  - `src/App.tsx` - Add modal state, hook, and render

- **Expected test locations:**
  - `src/hooks/useCompletedTasksHotkey.test.ts`
  - `src/components/CompletedTasksModal.test.tsx`

- **Prerequisites:** None

### Key Code References

| Pattern | File | Lines |
|---------|------|-------|
| Hotkey hook | `src/hooks/useDeferredViewHotkeys.ts` | 1-73 |
| Modal structure | `src/components/time-tracking/TimeInsightsModal.tsx` | 293-526 |
| Task type | `src/types/index.ts` | 29-37 |
| completeTask | `src/hooks/useTasks.ts` | 469-506 |
| NotesModal usage | `src/components/TaskCard.tsx` | 144-151 |
| Toast usage | `src/components/TaskCard.tsx` | 29, 53, 65, 89 |
| Date grouping utils | `src/hooks/useAutoSurface.ts` | 37-62 |

---

## Context References

**Tech-Spec:** [tech-spec-completed-tasks-view.md](../tech-spec-completed-tasks-view.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow (hotkey, modal, toast)
- Integration points and dependencies
- Complete implementation guidance
- uncompleteTask implementation code

**Epic:** [epics-completed-tasks-view.md](../epics-completed-tasks-view.md)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

Implementation followed established patterns from codebase:
- Hotkey hook pattern from `useDeferredViewHotkeys.ts`
- Modal pattern from `TimeInsightsModal.tsx`
- Toast pattern from `TaskCard.tsx`
- Task action pattern from `completeTask` in `useTasks.ts`

### Completion Notes

✅ All code tasks completed (Tasks 1-7)
✅ All unit tests pass (576 tests total)
✅ TypeScript compiles without errors
⏳ Task 8 (Manual testing) pending user verification

Implementation approach:
1. Created `useCompletedTasksHotkey` hook using exact pattern from existing hotkey hooks
2. Added `UNCOMPLETE_TASK` action with IndexedDB + Supabase sync following `completeTask` pattern
3. Created `CompletedTaskRow` component with undo and notes buttons
4. Created `CompletedTasksModal` with 14-day filtering and date grouping using date-fns
5. Integrated in `App.tsx` with toast notification on uncomplete

### Files Modified

**Created:**
- `src/hooks/useCompletedTasksHotkey.ts` - Hotkey hook for Cmd+Opt+D
- `src/hooks/useCompletedTasksHotkey.test.ts` - Unit tests for hotkey hook
- `src/components/CompletedTaskRow.tsx` - Individual completed task row
- `src/components/CompletedTasksModal.tsx` - Main modal component
- `src/components/CompletedTasksModal.test.tsx` - Unit tests for modal

**Modified:**
- `src/hooks/useTasks.ts` - Added UNCOMPLETE_TASK action type, reducer case, and uncompleteTask function
- `src/App.tsx` - Added modal state, hotkey hook, and modal render

### Test Results

```
Test Files  31 passed (31)
     Tests  576 passed (576)
  Duration  5.15s
```

TypeScript: No errors

---

## Review Notes

<!-- Will be populated during code review -->
