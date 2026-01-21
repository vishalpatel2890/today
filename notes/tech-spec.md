# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-20
**Project Level:** Quick Flow
**Change Type:** Feature Enhancement
**Development Context:** Brownfield - Existing React/Electron productivity app

---

## Context

### Available Documents

- No product brief or research documents found
- Sprint artifacts folder exists at `notes/sprint-artifacts/`
- Active sprint work on Electron migration in progress

### Project Stack

**Runtime & Framework:**
- React 19.2.0 (functional components with hooks)
- Electron 39.2.7 (desktop app)
- Vite 7.2.4 (build tool)
- TypeScript 5.9.3 (strict mode)

**State Management:**
- React useReducer + Context API
- Optimistic updates with server sync

**Database Layer:**
- Dexie 4.2.1 (IndexedDB wrapper)
- Supabase 2.89.0 (backend sync + realtime)
- Offline-first architecture with sync queue

**UI Framework:**
- Tailwind CSS 4.1.18
- Radix UI primitives (@radix-ui/react-dialog, @radix-ui/react-popover, etc.)
- Lucide React 0.562.0 (icons)

**Testing:**
- Vitest 3.2.4 (test runner)
- Testing Library React 16.3.1
- fake-indexeddb 6.2.5 (IndexedDB mocking)
- JSDOM 27.0.1 (DOM simulation)

### Existing Codebase Structure

**Directory Organization:**
```
today-app/src/
├── views/           # View components (TodayView, TomorrowView, DeferredView)
├── components/      # Reusable UI components (TaskList, TaskCard, etc.)
├── hooks/           # Custom React hooks (useTasks, useTimeTracking, etc.)
├── lib/             # Utilities and database (db.ts, supabase.ts)
├── types/           # TypeScript type definitions
├── contexts/        # React Context providers
└── test/            # Test setup and utilities
```

**Key Files for This Feature:**
- `src/views/TodayView.tsx` - Today view container
- `src/components/TaskList.tsx` - Renders list of TaskCard components
- `src/components/TaskCard.tsx` - Individual task rendering
- `src/hooks/useTasks.ts` - Task state management with IndexedDB + Supabase sync
- `src/lib/db.ts` - Dexie database schema
- `src/types/index.ts` - Task type definition

**Existing Patterns:**
- Functional components with TypeScript interfaces
- useCallback/useMemo for performance optimization
- Optimistic UI updates with background sync
- IndexedDB-first storage with Supabase sync queue

---

## The Change

### Problem Statement

Users cannot manually order tasks in the Today view. Tasks are currently displayed in the order they were created (`created_at`), which doesn't allow users to prioritize their daily tasks according to their own workflow. Users need the ability to drag and drop tasks to arrange them in their preferred order, with that order persisting across sessions and syncing to other devices.

### Proposed Solution

Implement drag-and-drop task reordering for the TodayView:

1. Add a `sort_order` field to the Task data model
2. Implement drag-and-drop interaction using native HTML5 drag events or a lightweight library
3. Persist order to IndexedDB and sync to Supabase
4. Display tasks sorted by `sort_order` in TodayView

### Scope

**In Scope:**

- Drag-and-drop reordering of tasks in TodayView only
- Visual feedback: lifted card with shadow + placeholder at drop position
- Persist order to IndexedDB with `sort_order` field
- Sync order to Supabase (new column in tasks table)
- Realtime sync of order changes across devices
- Mouse and touch support for drag interactions

**Out of Scope:**

- Reordering in TomorrowView or DeferredView (future enhancement)
- Keyboard-only reordering (future accessibility enhancement)
- Reordering across categories/groups
- Undo/redo for reorder operations
- Batch reordering or multi-select drag

---

## Implementation Details

### Source Tree Changes

| File Path | Action | Description |
|-----------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add `sortOrder: number` field to Task interface |
| `src/lib/db.ts` | MODIFY | Add `sort_order` field to LocalTask interface and index |
| `src/hooks/useTasks.ts` | MODIFY | Add `reorderTask` action and handler with optimistic update |
| `src/components/TaskList.tsx` | MODIFY | Add drag-and-drop handlers and visual feedback |
| `src/components/TaskCard.tsx` | MODIFY | Add drag handle and draggable props |
| `src/views/TodayView.tsx` | MODIFY | Pass reorder handler to TaskList, sort tasks by sortOrder |
| `src/components/TaskList.test.tsx` | CREATE | Unit tests for drag-and-drop reordering |
| Supabase Migration | CREATE | Add `sort_order` column to tasks table |

### Technical Approach

**Drag-and-Drop Implementation:**
Use native HTML5 Drag and Drop API for simplicity and zero additional dependencies:
- `draggable="true"` on TaskCard
- `onDragStart`, `onDragOver`, `onDragEnd` handlers on TaskList
- CSS transitions for smooth visual feedback

**Sort Order Strategy:**
Use fractional indexing pattern for efficient reordering:
- Initial tasks get integer sort_order (1000, 2000, 3000...)
- Reordering calculates midpoint: placing between 1000 and 2000 = 1500
- Handles edge cases: placing at start (newOrder = firstOrder - 1000), at end (newOrder = lastOrder + 1000)
- No need to update all tasks on every reorder operation

**Data Flow:**
1. User drags task to new position
2. Calculate new `sort_order` based on surrounding tasks
3. Optimistic update: immediately reorder in UI
4. Update IndexedDB with new sort_order
5. Queue/execute Supabase update
6. Realtime subscription propagates to other devices

### Existing Patterns to Follow

Follow the service pattern established in `useTasks.ts`:

- Use `useCallback` for all handler functions
- Optimistic UI updates followed by async persistence
- IndexedDB update with `saveTaskToIndexedDB()` helper
- Supabase sync via `queueOperation()` for offline support
- Use existing `dispatch` pattern with new action type

Error handling pattern from existing update functions:
```typescript
if (navigator.onLine) {
  const { error } = await supabase.from('tasks').update(payload)...
  if (error) {
    console.error('[Today] Failed to sync:', error)
    await queueOperation('UPDATE', 'tasks', id, payload)
  }
} else {
  await queueOperation('UPDATE', 'tasks', id, payload)
}
```

### Integration Points

**Internal Dependencies:**
- `useTasks` hook - add reorderTask action
- `taskReducer` - add REORDER_TASK action type
- `db.tasks` - IndexedDB table with sort_order field
- `syncQueue` - for offline sync support
- Supabase realtime subscription - already subscribes to task updates

**External Dependencies:**
- Supabase tasks table - requires schema migration to add sort_order column

**State Management:**
- New action: `{ type: 'REORDER_TASK'; id: string; sortOrder: number }`
- Tasks array sorted by sortOrder before rendering

---

## Development Context

### Relevant Existing Code

**useTasks.ts (lines 620-656) - updateTask pattern:**
```typescript
const updateTask = useCallback(async (id: string, text: string, ...) => {
  dispatch({ type: 'UPDATE_TASK', id, text, ... })
  // IndexedDB update
  await saveTaskToIndexedDB(updatedTask, effectiveUserId, ...)
  // Supabase sync with offline queue fallback
  if (navigator.onLine) { ... } else { await queueOperation(...) }
}, [userId, tasks])
```

**TaskList.tsx (lines 15-33) - current render pattern:**
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

**db.ts (lines 82-106) - Dexie schema pattern:**
```typescript
this.version(2).stores({
  tasks: 'id, user_id, _syncStatus',
  ...
})
```

### Dependencies

**Framework/Libraries:**

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.0 | UI framework |
| dexie | 4.2.1 | IndexedDB wrapper |
| @supabase/supabase-js | 2.89.0 | Backend sync |
| vitest | 3.2.4 | Testing |
| @testing-library/react | 16.3.1 | Component testing |

**Internal Modules:**

- `@/hooks/useTasks` - Task state management
- `@/lib/db` - IndexedDB database
- `@/lib/syncQueue` - Offline sync queue
- `@/components/TaskCard` - Task display component

### Configuration Changes

**Supabase Migration Required:**
```sql
-- Add sort_order column to tasks table
ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_tasks_sort_order ON tasks(user_id, sort_order);

-- Backfill existing tasks with sort_order based on created_at
UPDATE tasks SET sort_order =
  (EXTRACT(EPOCH FROM created_at) * 1000)::INTEGER
WHERE sort_order = 0;
```

**IndexedDB Schema Version Bump:**
Increment Dexie version from 2 to 3 to add sort_order index.

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript with strict mode
- Functional components, no class components
- No semicolons
- Single quotes for strings
- 2-space indentation
- Tailwind CSS for all styling
- lucide-react for icons

**Test Standards:**
- Vitest with globals enabled
- Testing Library React for component tests
- `describe/it/expect` syntax
- Mock Supabase to prevent network calls
- Tests co-located: `Component.test.tsx` next to `Component.tsx`
- fake-indexeddb for IndexedDB mocking
- Clear database in beforeEach

**Naming Conventions:**
- PascalCase for components: `TaskList`, `TaskCard`
- camelCase for functions/variables: `handleDragStart`, `sortOrder`
- snake_case for database columns: `sort_order`, `created_at`
- Prefix local-only DB fields with underscore: `_syncStatus`

### Test Framework & Standards

**Test Framework:** Vitest 3.2.4 with jsdom environment

**Test File Pattern:** `*.test.ts` / `*.test.tsx` co-located with source

**Test Setup:** `src/test/setup.ts` provides:
- fake-indexeddb auto-initialization
- @testing-library/jest-dom matchers
- ResizeObserver and pointer capture mocks
- Database clearing in beforeEach

**Mocking Pattern:**
```typescript
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ ... }),
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  },
}))
```

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x (Electron) |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build | Vite | 7.2.4 |
| CSS | Tailwind CSS | 4.1.18 |
| Database | Dexie (IndexedDB) | 4.2.1 |
| Backend | Supabase | 2.89.0 |
| Testing | Vitest | 3.2.4 |
| Test Utils | Testing Library | 16.3.1 |

---

## Technical Details

**Fractional Indexing Algorithm:**

When reordering task A to position between tasks B and C:
```typescript
const newSortOrder = (B.sortOrder + C.sortOrder) / 2
```

Edge cases:
- Moving to start: `newSortOrder = firstTask.sortOrder - 1000`
- Moving to end: `newSortOrder = lastTask.sortOrder + 1000`
- No tasks: `newSortOrder = 1000`
- Single task: N/A (nothing to reorder)

**Drag State Management:**

Track in component state:
```typescript
const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
```

**Visual Feedback CSS:**

```css
/* Dragged task - lifted appearance */
.dragging {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  z-index: 50;
}

/* Drop placeholder */
.drop-placeholder {
  height: 4px;
  background: var(--primary);
  border-radius: 2px;
  margin: 4px 0;
}
```

**Performance Considerations:**

- Use `React.memo` on TaskCard to prevent unnecessary re-renders
- Debounce Supabase updates if user drags rapidly
- Only update the single task's sort_order (fractional indexing avoids bulk updates)

**Offline Handling:**

- Reorder works offline using IndexedDB
- Changes queued via existing `syncQueue` mechanism
- When back online, sync queue processes updates in order
- Conflict resolution: last-write-wins (same as other updates)

---

## Development Setup

```bash
# Clone and install (if not already)
cd today-app
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint
npm run lint
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/task-reorder`
2. Verify dev environment: `npm run dev` starts successfully
3. Review existing code:
   - `src/hooks/useTasks.ts` - understand update pattern
   - `src/components/TaskList.tsx` - current rendering
   - `src/lib/db.ts` - Dexie schema

### Implementation Steps

**Phase 1: Data Model Updates**

1. Add `sortOrder` to Task type in `src/types/index.ts`
2. Add `sort_order` to LocalTask in `src/lib/db.ts`
3. Bump Dexie version and add index
4. Update task creation to set initial sortOrder

**Phase 2: State Management**

5. Add `REORDER_TASK` action to taskReducer in `useTasks.ts`
6. Add `reorderTask` handler with optimistic update
7. Add IndexedDB and Supabase sync for sort_order

**Phase 3: UI Implementation**

8. Add drag-and-drop handlers to TaskList
9. Add draggable props to TaskCard
10. Implement visual feedback (dragging state, placeholder)
11. Sort tasks by sortOrder in TodayView

**Phase 4: Testing**

12. Write unit tests for reorder logic
13. Write component tests for drag-and-drop behavior
14. Test offline/online sync scenarios

### Testing Strategy

**Unit Tests (useTasks.ts):**
- Test reorderTask updates sortOrder correctly
- Test fractional indexing calculation
- Test edge cases (move to start, move to end)

**Component Tests (TaskList.tsx):**
- Test drag events fire correctly
- Test visual feedback states
- Test final order after drop

**Integration Tests:**
- Test IndexedDB persistence of sort_order
- Test optimistic update followed by sync

### Acceptance Criteria

1. **AC-1:** Given tasks in TodayView, when user drags a task to a new position, then the task moves to that position immediately
2. **AC-2:** Given a reordered task list, when the app is refreshed, then tasks appear in the same order
3. **AC-3:** Given a reordered task on device A, when device B syncs, then device B shows the same task order
4. **AC-4:** Given no network connection, when user reorders tasks, then order persists locally and syncs when online
5. **AC-5:** Given a task being dragged, then user sees the task lifted with shadow and a placeholder at the drop position

---

## Developer Resources

### File Paths Reference

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Task type definition |
| `src/lib/db.ts` | Dexie database schema |
| `src/hooks/useTasks.ts` | Task state management |
| `src/components/TaskList.tsx` | Task list rendering |
| `src/components/TaskCard.tsx` | Individual task component |
| `src/views/TodayView.tsx` | Today view container |
| `src/test/setup.ts` | Test configuration |

### Key Code Locations

| Location | Description |
|----------|-------------|
| `src/types/index.ts:29-37` | Task interface definition |
| `src/lib/db.ts:16-29` | LocalTask interface |
| `src/lib/db.ts:91-106` | Dexie schema versions |
| `src/hooks/useTasks.ts:29-90` | taskReducer actions |
| `src/hooks/useTasks.ts:620-656` | updateTask pattern to follow |
| `src/components/TaskList.tsx:15-33` | Current render implementation |

### Testing Locations

| Type | Location |
|------|----------|
| Unit tests | `src/hooks/useTasks.test.ts` |
| Component tests | `src/components/TaskList.test.tsx` (create) |
| Test setup | `src/test/setup.ts` |

### Documentation to Update

- `CHANGELOG.md` - Add entry for task reordering feature
- This tech-spec serves as the primary documentation

---

## UX/UI Considerations

**UI Components Affected:**
- `TaskList` - Add drag container and placeholder rendering
- `TaskCard` - Add drag handle area (entire card is draggable)

**Visual Feedback:**
- **Idle state:** Normal task appearance
- **Drag start:** Task gains shadow, slight scale increase (1.02x), reduced opacity (0.8)
- **During drag:** 4px primary-colored line appears at drop position
- **Drop:** Task animates to new position with 200ms transition

**Touch Support:**
- Use `onTouchStart`, `onTouchMove`, `onTouchEnd` for mobile
- Minimum drag threshold of 10px to distinguish from tap

**Responsive Design:**
- Works on desktop and mobile
- Touch targets remain standard size
- No change to existing responsive breakpoints

---

## Testing Approach

**Test Framework:** Vitest 3.2.4 with jsdom

**Follow Existing Test Standards:**
- File naming: `TaskList.test.tsx`
- Location: `src/components/TaskList.test.tsx`
- Use `describe/it/expect` syntax
- Mock Supabase to prevent network calls

**Test Strategy:**

**Unit Tests (useTasks):**
```typescript
describe('reorderTask', () => {
  it('should update sortOrder of reordered task')
  it('should calculate midpoint sortOrder when moving between tasks')
  it('should set sortOrder before first task when moving to start')
  it('should set sortOrder after last task when moving to end')
})
```

**Component Tests (TaskList):**
```typescript
describe('TaskList drag and drop', () => {
  it('should render tasks in sortOrder')
  it('should set dragging state on dragStart')
  it('should show placeholder on dragOver')
  it('should call onReorder with correct position on drop')
})
```

**Coverage Target:**
- Unit test coverage: 90%+ for reorder logic
- Component test coverage: Key interaction paths

---

## Deployment Strategy

### Deployment Steps

1. **Database Migration:**
   - Apply Supabase migration to add `sort_order` column
   - Verify backfill completed for existing tasks

2. **Code Deployment:**
   - Merge feature branch to main
   - Vite builds updated frontend
   - Electron-builder creates new app package

3. **Verification:**
   - Test reordering on staging
   - Verify sync between web and Electron apps
   - Check offline functionality

### Rollback Plan

1. **If issues with sort_order:**
   - Feature is additive; existing functionality unaffected
   - Can revert frontend code; database column remains (unused)

2. **If sync issues:**
   - Disable reorder UI via feature flag (if implemented)
   - Tasks continue to work with default ordering

### Monitoring

- Watch Supabase logs for UPDATE errors on tasks table
- Monitor console for `[Today] Failed to sync` errors
- Check IndexedDB sync queue for stuck operations
