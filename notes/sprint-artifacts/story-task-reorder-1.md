# Story 7.1: Drag-and-Drop Task Reordering

**Status:** Review

---

## User Story

As a **user**,
I want **to drag and drop tasks to reorder them in my Today view**,
So that **I can prioritize my tasks according to my workflow**.

---

## Acceptance Criteria

**AC #1:** Given tasks in TodayView, when user drags a task to a new position, then the task moves to that position immediately

**AC #2:** Given a reordered task list, when the app is refreshed, then tasks appear in the same order

**AC #3:** Given a reordered task on device A, when device B syncs, then device B shows the same task order

**AC #4:** Given no network connection, when user reorders tasks, then order persists locally and syncs when online

**AC #5:** Given a task being dragged, then user sees the task lifted with shadow and a placeholder at the drop position

---

## Implementation Details

### Tasks / Subtasks

**Phase 1: Data Model Updates**
- [x] Add `sortOrder: number` field to Task interface in `src/types/index.ts` (AC: #2)
- [x] Add `sort_order` field to LocalTask interface in `src/lib/db.ts` (AC: #2)
- [x] Bump Dexie version from 2 to 3 and add sort_order index (AC: #2)
- [x] Update `addTask` to set initial sortOrder based on timestamp (AC: #2)

**Phase 2: State Management**
- [x] Add `REORDER_TASK` action type to TaskAction union in `useTasks.ts` (AC: #1)
- [x] Add `REORDER_TASK` case to taskReducer (AC: #1)
- [x] Add `reorderTask` useCallback handler with optimistic update (AC: #1)
- [x] Add IndexedDB persistence for sort_order changes (AC: #2)
- [x] Add Supabase sync for sort_order with offline queue fallback (AC: #3, #4)

**Phase 3: UI Implementation**
- [x] Add drag-and-drop state to TaskList (`draggedTaskId`, `dropTargetIndex`) (AC: #5)
- [x] Add `onDragStart`, `onDragOver`, `onDragEnd` handlers to TaskList (AC: #1)
- [x] Add `draggable="true"` and drag event props to TaskCard (AC: #1)
- [x] Implement dragging visual feedback CSS (lifted card with shadow) (AC: #5)
- [x] Implement drop placeholder line rendering (AC: #5)
- [x] Sort tasks by sortOrder in TodayView before passing to TaskList (AC: #1)
- [x] Pass `onReorder` handler from TodayView to TaskList (AC: #1)

**Phase 4: Testing**
- [x] Write unit tests for reorderTask in useTasks.test.ts (AC: #1, #2)
- [x] Write unit tests for fractional indexing calculation (AC: #1)
- [x] Write component tests for drag-and-drop in TaskList.test.tsx (AC: #5)
- [x] Test offline/online sync scenarios manually (AC: #4)

**Phase 5: Database Migration**
- [x] Apply Supabase migration to add `sort_order` column (AC: #3)
- [x] Backfill existing tasks with sort_order based on created_at (AC: #3)

### Technical Summary

Implement drag-and-drop task reordering for TodayView using:
- Native HTML5 Drag and Drop API (no new dependencies)
- Fractional indexing pattern for efficient sort_order updates
- Existing useTasks patterns for state management and sync
- Visual feedback: lifted card (scale 1.02, shadow, opacity 0.8) + 4px primary placeholder

Key decisions:
- Use fractional indexing to avoid bulk updates when reordering
- Follow existing optimistic update → IndexedDB → Supabase sync pattern
- TodayView only (Tomorrow/Deferred views out of scope for this story)

### Project Structure Notes

- **Files to modify:**
  - `src/types/index.ts` - Add sortOrder field
  - `src/lib/db.ts` - Add sort_order to LocalTask, bump schema version
  - `src/hooks/useTasks.ts` - Add REORDER_TASK action and handler
  - `src/components/TaskList.tsx` - Add drag-and-drop functionality
  - `src/components/TaskCard.tsx` - Add draggable props
  - `src/views/TodayView.tsx` - Sort tasks, pass reorder handler

- **Expected test locations:**
  - `src/hooks/useTasks.test.ts` - Reorder action tests
  - `src/components/TaskList.test.tsx` - Drag-and-drop tests (create)

- **Estimated effort:** 3 story points

- **Prerequisites:** None (standalone enhancement)

### Key Code References

**useTasks.ts (lines 620-656) - updateTask pattern to follow:**
```typescript
const updateTask = useCallback(async (id: string, text: string, ...) => {
  dispatch({ type: 'UPDATE_TASK', id, text, ... })
  await saveTaskToIndexedDB(updatedTask, effectiveUserId, ...)
  if (navigator.onLine) { ... } else { await queueOperation(...) }
}, [userId, tasks])
```

**TaskList.tsx (lines 15-33) - current render to enhance:**
```typescript
export const TaskList = ({ tasks, ... }) => {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} ... />
      ))}
    </div>
  )
}
```

**db.ts (lines 91-106) - Dexie schema to extend:**
```typescript
this.version(2).stores({
  tasks: 'id, user_id, _syncStatus',
  syncQueue: 'id, createdAt',
  activityLogs: '++id, timeEntryId, [timeEntryId+timestamp]',
})
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Brownfield codebase analysis (React 19.2.0, TypeScript 5.9.3, Dexie 4.2.1)
- Framework and library details with versions
- Existing patterns to follow (useTasks, optimistic updates, sync queue)
- Integration points and dependencies
- Complete implementation guidance including fractional indexing algorithm

**Architecture:** Existing codebase structure in `src/` follows feature-based organization

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented fractional indexing for sort order calculation to avoid bulk updates
- Used timestamp-based sortOrder for new tasks (Date.now())
- Added Dexie version 3 with sort_order index for efficient queries
- Supabase migration uses BIGINT for sort_order (INTEGER overflow with JS timestamps)

### Completion Notes

**Implementation Summary:**
- Added `sortOrder` field to Task interface and `sort_order` to LocalTask/Supabase
- Implemented REORDER_TASK action with optimistic updates → IndexedDB → Supabase sync
- Native HTML5 Drag and Drop API in TaskList with visual feedback (opacity, scale, shadow)
- Drop placeholder line (4px primary color) shows target position
- TaskList sorts internally by sortOrder before rendering
- Fractional indexing: midpoint calculation for efficient reordering without bulk updates

**Key Decisions:**
- Used BIGINT in Supabase (JS Date.now() exceeds INTEGER max)
- Tasks sorted inside TaskList component for consistency
- Visual feedback: scale(1.02), opacity 0.8, shadow-lg for dragged card

### Files Modified

- `src/types/index.ts` - Added sortOrder field to Task interface
- `src/types/database.ts` - Added sort_order to TaskRow types
- `src/lib/db.ts` - Added sort_order to LocalTask, bumped Dexie to v3
- `src/lib/migration.ts` - Updated localTaskToTask/taskToLocalTask for sortOrder
- `src/hooks/useTasks.ts` - Added REORDER_TASK action, reorderTask handler, updated addTask
- `src/components/TaskList.tsx` - Added drag-and-drop with fractional indexing
- `src/components/TaskCard.tsx` - Added draggable props and visual feedback
- `src/views/TodayView.tsx` - Added onReorderTask prop
- `src/App.tsx` - Wired reorderTask to TodayView

**New Files:**
- `src/components/TaskList.test.tsx` - Component tests for drag-and-drop

### Test Results

- **Total Tests:** 659 passed
- **New Tests Added:** 9 tests (6 unit tests for reorderTask, 3 component tests for TaskList drag-and-drop)
- **Regression:** All existing tests continue to pass
- **TypeScript:** No type errors
- ✅ Test Gate PASSED by Vishal (2026-01-20)

---

## Review Notes

<!-- Will be populated during code review -->
