# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-13
**Project Level:** Quick Flow
**Change Type:** New Feature
**Development Context:** Brownfield (existing React/TypeScript/Electron codebase)

---

## Context

### Available Documents

- No product brief or research documents found
- Brownfield project with established patterns

### Project Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Language |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 4.1.18 | Styling |
| Radix UI | 1.1.15 | Dialog/Modal components |
| Vitest | 3.2.4 | Testing framework |
| Electron | 39.2.7 | Desktop app wrapper |
| Supabase | 2.89.0 | Backend/sync |
| Dexie | 4.2.1 | IndexedDB wrapper |
| date-fns | 4.1.0 | Date utilities |
| Lucide React | 0.562.0 | Icons |

### Existing Codebase Structure

**Hotkey Pattern:**
- `src/hooks/useTimeTrackingHotkeys.ts` - Cmd+Opt+T for time tracking modal
- `src/hooks/useDeferredViewHotkeys.ts` - Cmd+Opt+A for toggle all categories
- Pattern: Native `document.addEventListener`, `useCallback` with refs, input field exclusion

**Modal Pattern:**
- `src/components/time-tracking/TimeInsightsModal.tsx` - 550px width, Radix UI Dialog
- Pattern: `Dialog.Root`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`

**Task Management:**
- `src/types/index.ts` - Task interface with `completedAt: string | null`
- `src/hooks/useTasks.ts` - CRUD operations including `updateTask()`, `completeTask()`
- `src/hooks/useAutoSurface.ts` - Filters out completed tasks (line 34)

**Notes Modal:**
- `src/components/NotesModal.tsx` - Existing modal for viewing/editing task notes

---

## The Change

### Problem Statement

Users currently have no way to view or manage completed tasks. Once a task is marked complete, it disappears from all views with no way to:
1. See what was accomplished recently
2. Reopen a task that was completed by mistake
3. Review notes on completed tasks

### Proposed Solution

Add a global keyboard shortcut **Cmd+Opt+D** (Mac) / **Ctrl+Alt+D** (Windows) that opens a "Completed Tasks" modal showing:
- Tasks completed in the last 14 days
- Grouped by completion date (Today, Yesterday, This Week, Last Week, Older)
- Ability to mark tasks as incomplete (returns to Today view)
- Ability to view task notes (opens NotesModal)

### Scope

**In Scope:**
- New `useCompletedTasksHotkey` hook for Cmd+Opt+D detection
- New `CompletedTasksModal` component displaying completed tasks
- Date grouping logic for completed tasks
- "Mark Incomplete" action per task
- "View Notes" action per task (opens existing NotesModal)
- Unit tests for hotkey hook
- Unit tests for modal component

**Out of Scope:**
- Editing task text/date/category from this modal
- Bulk actions (mark all incomplete, delete completed)
- Search/filter within completed tasks
- Pagination or infinite scroll (14-day limit keeps list manageable)
- Syncing completed tasks separately (uses existing task sync)

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCompletedTasksHotkey.ts` | CREATE | Hotkey hook for Cmd+Opt+D |
| `src/hooks/useCompletedTasksHotkey.test.ts` | CREATE | Unit tests for hotkey |
| `src/components/CompletedTasksModal.tsx` | CREATE | Modal component |
| `src/components/CompletedTasksModal.test.tsx` | CREATE | Unit tests for modal |
| `src/components/CompletedTaskRow.tsx` | CREATE | Individual completed task row |
| `src/App.tsx` | MODIFY | Add modal state, hotkey hook, render modal |

### Technical Approach

**Hotkey Implementation:**
Follow exact pattern from `useDeferredViewHotkeys.ts`:
- Use `e.code === 'KeyD'` (not `e.key`) to handle Option key character mapping
- Check `(e.metaKey && !e.ctrlKey) || (e.ctrlKey && !e.metaKey)` for Mac/Windows
- Require `e.altKey` for Option/Alt modifier
- Exclude input/textarea/contenteditable elements
- Call `e.preventDefault()` and `e.stopPropagation()`

**Modal Implementation:**
Follow exact pattern from `TimeInsightsModal.tsx`:
- Use Radix UI Dialog components
- 450px max-width (narrower than TimeInsightsModal since simpler content)
- Max-height 80vh with overflow-y-auto
- Animate with existing `animate-slide-up` and `animate-fade-in`

**Date Grouping Logic:**
Using date-fns utilities:
```typescript
type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'older'

const getDateGroup = (completedAt: string): DateGroup => {
  const date = parseISO(completedAt)
  if (isToday(date)) return 'today'
  if (isYesterday(date)) return 'yesterday'
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'thisWeek'
  // Check if in previous week
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  if (date >= lastWeekStart && date <= lastWeekEnd) return 'lastWeek'
  return 'older'
}
```

**Mark Incomplete Logic:**
```typescript
const handleMarkIncomplete = (taskId: string) => {
  // Set deferredTo to today, clear completedAt
  const today = startOfDay(new Date()).toISOString()
  onUpdateTask(taskId, task.text, today, task.category)
  // Note: updateTask in useTasks doesn't clear completedAt
  // Need to add uncompleteTask action or modify updateTask
}
```

**14-Day Filter:**
```typescript
const fourteenDaysAgo = subDays(startOfDay(new Date()), 14)
const completedTasks = tasks.filter(task =>
  task.completedAt &&
  parseISO(task.completedAt) >= fourteenDaysAgo
)
```

### Existing Patterns to Follow

**From `useDeferredViewHotkeys.ts`:**
- `isInputElement()` helper function for input exclusion
- `useRef` for callback to avoid re-registering listener
- Capture phase listener: `addEventListener('keydown', handler, true)`
- Cleanup on unmount

**From `TimeInsightsModal.tsx`:**
- Dialog structure with Portal, Overlay, Content
- Header with title and X close button
- Section headers with counts
- Empty state messaging
- Tailwind classes for consistent styling

**From `TaskCard.tsx`:**
- NotesModal integration pattern
- Toast notifications via `useToast()`

### Integration Points

1. **App.tsx** - Add state and render modal
2. **useTasks hook** - Need `uncompleteTask` function (or modify existing)
3. **NotesModal** - Reuse existing component for viewing notes
4. **ToastContext** - Show feedback on "Marked as incomplete"

---

## Development Context

### Relevant Existing Code

| File | Lines | Reference |
|------|-------|-----------|
| `src/hooks/useDeferredViewHotkeys.ts` | 1-73 | Hotkey pattern to follow |
| `src/hooks/useTimeTrackingHotkeys.ts` | 1-116 | Alternative hotkey pattern |
| `src/components/time-tracking/TimeInsightsModal.tsx` | 1-529 | Modal pattern to follow |
| `src/components/TaskCard.tsx` | 74-91 | NotesModal integration |
| `src/hooks/useTasks.ts` | 469-506 | completeTask function |
| `src/types/index.ts` | 29-37 | Task interface |

### Dependencies

**Framework/Libraries:**
- `@radix-ui/react-dialog` 1.1.15 - Modal component
- `date-fns` 4.1.0 - Date utilities (isToday, isYesterday, isThisWeek, subDays, subWeeks, startOfWeek, endOfWeek, parseISO, startOfDay)
- `lucide-react` 0.562.0 - Icons (X, RotateCcw, FileText)

**Internal Modules:**
- `src/components/NotesModal` - Existing notes viewer
- `src/contexts/ToastContext` - Toast notifications
- `src/types` - Task interface

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode
- Functional components with hooks
- Named exports (not default)
- Single quotes, no semicolons (per ESLint config)
- Tailwind for styling

**Test Patterns:**
- Vitest with `describe`/`it`/`expect`
- `@testing-library/react` for component tests
- `renderHook` for hook tests
- `vi.fn()` for mocks
- Co-located test files (`.test.ts` / `.test.tsx`)

**File Organization:**
- Hooks in `src/hooks/`
- Components in `src/components/`
- Tests alongside source files

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **DOM:** jsdom
- **React Testing:** @testing-library/react 16.3.1
- **File naming:** `*.test.ts` / `*.test.tsx`
- **Pattern:** See `useDeferredViewHotkeys.test.ts` for hotkey testing

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build | Vite | 7.2.4 |
| Styling | Tailwind CSS | 4.1.18 |
| Testing | Vitest | 3.2.4 |
| UI Components | Radix UI | 1.1.15 |

---

## Technical Details

### Component Architecture

```
App.tsx
├── useCompletedTasksHotkey(handleOpenCompleted)
├── [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false)
└── <CompletedTasksModal
      isOpen={isCompletedModalOpen}
      onClose={() => setIsCompletedModalOpen(false)}
      tasks={tasks}
      categories={categories}
      onUncomplete={uncompleteTask}
      onUpdateNotes={updateNotes}
    />

CompletedTasksModal.tsx
├── Filter tasks: completedAt exists && within 14 days
├── Group by date: today, yesterday, thisWeek, lastWeek, older
├── Render grouped sections with CompletedTaskRow
└── Handle notes modal state

CompletedTaskRow.tsx
├── Task text display
├── Completion date/time display
├── "Undo" button (mark incomplete)
└── "Notes" button (if task has notes)
```

### State Flow

1. User presses Cmd+Opt+D
2. `useCompletedTasksHotkey` fires callback
3. `App.tsx` sets `isCompletedModalOpen = true`
4. `CompletedTasksModal` renders with filtered/grouped tasks
5. User clicks "Undo" on a task
6. `uncompleteTask(id)` called → updates task in useTasks
7. Task disappears from modal, appears in Today view
8. Toast shows "Task restored to Today"

### uncompleteTask Implementation

Add to `useTasks.ts`:

```typescript
type TaskAction =
  | // ... existing actions
  | { type: 'UNCOMPLETE_TASK'; id: string; deferredTo: string }

// In reducer:
case 'UNCOMPLETE_TASK':
  return state.map(task =>
    task.id === action.id
      ? { ...task, completedAt: null, deferredTo: action.deferredTo }
      : task
  )

// New function:
const uncompleteTask = useCallback(async (id: string) => {
  const today = startOfDay(new Date()).toISOString()
  dispatch({ type: 'UNCOMPLETE_TASK', id, deferredTo: today })

  // Update IndexedDB
  const task = tasks.find(t => t.id === id)
  if (task) {
    const updatedTask = { ...task, completedAt: null, deferredTo: today }
    await saveTaskToIndexedDB(updatedTask, effectiveUserId, userId ? 'pending' : 'synced')
  }

  // Sync to Supabase
  if (userId) {
    const payload = { completed_at: null, deferred_to: today }
    if (navigator.onLine) {
      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
      if (error) {
        await queueOperation('UPDATE', 'tasks', id, payload)
      }
    } else {
      await queueOperation('UPDATE', 'tasks', id, payload)
    }
  }
}, [userId, tasks])
```

---

## Development Setup

```bash
# Already set up - just run:
cd today-app
npm run dev          # Start Vite dev server
npm run test         # Run Vitest
npm run test:run     # Run tests once
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/completed-tasks-modal`
2. Verify dev environment: `npm run dev`
3. Review existing patterns:
   - `src/hooks/useDeferredViewHotkeys.ts`
   - `src/components/time-tracking/TimeInsightsModal.tsx`

### Implementation Steps

1. **Create `useCompletedTasksHotkey` hook**
   - Copy pattern from `useDeferredViewHotkeys.ts`
   - Change `KeyA` to `KeyD`
   - Single callback (no double-tap logic needed)

2. **Create `useCompletedTasksHotkey.test.ts`**
   - Copy test structure from `useDeferredViewHotkeys.test.ts`
   - Update key code and descriptions

3. **Add `uncompleteTask` to `useTasks.ts`**
   - Add action type to `TaskAction` union
   - Add case to reducer
   - Add function with IndexedDB + Supabase sync

4. **Create `CompletedTaskRow.tsx`**
   - Simple row with task text, date, undo button, notes button
   - Use Lucide icons: `RotateCcw`, `FileText`

5. **Create `CompletedTasksModal.tsx`**
   - Filter completed tasks to last 14 days
   - Group by date using date-fns
   - Render sections with headers
   - Integrate NotesModal for viewing notes

6. **Create `CompletedTasksModal.test.tsx`**
   - Test filtering logic
   - Test grouping logic
   - Test uncomplete action
   - Test notes modal opening

7. **Integrate in `App.tsx`**
   - Add `isCompletedModalOpen` state
   - Add `handleOpenCompleted` callback
   - Add `useCompletedTasksHotkey` hook
   - Add `uncompleteTask` to useTasks destructure
   - Render `CompletedTasksModal`

### Testing Strategy

**Unit Tests:**
- `useCompletedTasksHotkey.test.ts` - Hotkey detection, input exclusion, cleanup
- `CompletedTasksModal.test.tsx` - Filtering, grouping, rendering, interactions

**Manual Testing:**
- [ ] Cmd+Opt+D opens modal (Mac)
- [ ] Ctrl+Alt+D opens modal (Windows)
- [ ] Hotkey doesn't fire in input fields
- [ ] Tasks grouped correctly by date
- [ ] Only last 14 days shown
- [ ] "Undo" restores task to Today view
- [ ] Toast shows on uncomplete
- [ ] Notes button opens NotesModal
- [ ] Empty state when no completed tasks
- [ ] Modal closes on X or Escape

### Acceptance Criteria

1. **AC1:** Pressing Cmd+Opt+D (Mac) or Ctrl+Alt+D (Windows) opens Completed Tasks modal
2. **AC2:** Modal shows tasks completed in the last 14 days only
3. **AC3:** Tasks are grouped by: Today, Yesterday, This Week, Last Week, Older
4. **AC4:** Each task shows text and relative completion time
5. **AC5:** "Undo" button marks task incomplete and moves to Today view
6. **AC6:** Toast notification confirms "Task restored to Today"
7. **AC7:** Notes button opens NotesModal for tasks with notes
8. **AC8:** Hotkey is ignored when focused on input/textarea/contenteditable
9. **AC9:** Modal can be closed via X button or Escape key
10. **AC10:** Empty state shown when no completed tasks in range

---

## Developer Resources

### File Paths Reference

| Purpose | Path |
|---------|------|
| New hotkey hook | `src/hooks/useCompletedTasksHotkey.ts` |
| New hotkey tests | `src/hooks/useCompletedTasksHotkey.test.ts` |
| New modal | `src/components/CompletedTasksModal.tsx` |
| New modal tests | `src/components/CompletedTasksModal.test.tsx` |
| New row component | `src/components/CompletedTaskRow.tsx` |
| Modify tasks hook | `src/hooks/useTasks.ts` |
| Modify app entry | `src/App.tsx` |

### Key Code Locations

| Reference | Location |
|-----------|----------|
| Hotkey pattern | `src/hooks/useDeferredViewHotkeys.ts:32-73` |
| Modal pattern | `src/components/time-tracking/TimeInsightsModal.tsx:293-526` |
| Task type | `src/types/index.ts:29-37` |
| NotesModal usage | `src/components/TaskCard.tsx:144-151` |
| completeTask | `src/hooks/useTasks.ts:469-506` |
| Toast usage | `src/components/TaskCard.tsx:29,53,65,89` |

### Testing Locations

- Unit tests: `src/hooks/*.test.ts`, `src/components/*.test.tsx`
- Test setup: `src/test/setup.ts`
- Run tests: `npm run test` or `npm run test:run`

### Documentation to Update

- None required (internal feature, no public API changes)

---

## UX/UI Considerations

**UI Components Affected:**
- New modal component (CompletedTasksModal)
- New row component (CompletedTaskRow)

**Visual Design:**
- Follow TimeInsightsModal styling
- 450px max-width (narrower - simpler content)
- Grouped sections with date headers
- Subtle background for sections (`bg-surface-muted`)
- Dividers between rows (`divide-y divide-border/50`)

**Interaction Patterns:**
- Undo button: `RotateCcw` icon, hover state
- Notes button: `FileText` icon, only shown if task has notes
- Row hover state for discoverability

**Empty State:**
- Message: "No completed tasks in the last 14 days"
- Centered, muted text

**Accessibility:**
- Modal has proper `aria-label`
- Buttons have `aria-label` for screen readers
- Keyboard navigation works (Tab, Escape)
- Focus trapped in modal when open

---

## Testing Approach

**Unit Tests (Vitest + Testing Library):**

`useCompletedTasksHotkey.test.ts`:
- Triggers callback on Cmd+Opt+D (Mac)
- Triggers callback on Ctrl+Alt+D (Windows)
- Does not trigger without modifiers
- Does not trigger for wrong key
- Does not trigger in input fields
- Calls preventDefault/stopPropagation
- Cleans up listener on unmount

`CompletedTasksModal.test.tsx`:
- Renders when isOpen=true
- Filters to last 14 days
- Groups tasks correctly
- Calls onUncomplete when Undo clicked
- Opens NotesModal when Notes clicked
- Shows empty state when no tasks
- Closes on X button click

**Coverage Target:**
- Hotkey hook: 100%
- Modal component: 90%+

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main
2. CI runs tests and build
3. Deploy web app via existing pipeline
4. Package Electron app if needed

### Rollback Plan

1. Revert merge commit
2. Redeploy previous version
3. No database changes - no migration needed

### Monitoring

- No special monitoring needed
- Feature is local-only UI
- Existing Supabase sync handles data
