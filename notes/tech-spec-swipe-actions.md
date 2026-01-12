# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-11
**Project Level:** Quick Flow
**Change Type:** Feature Enhancement
**Development Context:** Brownfield - existing React/TypeScript application

---

## Context

### Available Documents

- No product briefs found
- No research documents found
- Brownfield project - existing time tracking implementation analyzed

### Project Stack

| Component | Version | Notes |
|-----------|---------|-------|
| React | 19.2.0 | Functional components, hooks |
| TypeScript | 5.9.3 | Strict mode |
| Vite | 7.2.4 | Build tool with HMR |
| TailwindCSS | 4.1.18 | Utility-first CSS |
| Radix UI | Dialog 1.1.15, Popover 1.1.15, Select 2.2.6 | Accessible primitives |
| Supabase | 2.89.0 | Backend sync |
| Dexie | 4.2.1 | IndexedDB wrapper |
| Vitest | 3.2.4 | Test framework |
| Testing Library React | 16.3.1 | Component testing |
| date-fns | 4.1.0 | Date utilities |
| Lucide React | 0.562.0 | Icons |

### Existing Codebase Structure

**Time Tracking Components:** `src/components/time-tracking/`
- `InsightRow.tsx` - Individual time entry row (target for swipe actions)
- `TimeInsightsModal.tsx` - Parent modal with Recent Entries list
- `TimeTrackingModal.tsx` - Modal for starting/stopping tracking + manual entry
- `TaskSelector.tsx` - Dropdown for task selection
- `DurationInput.tsx` - Duration input component

**Hooks:** `src/hooks/`
- `useTimeEntries.ts` - CRUD operations for time entries (has `deleteEntry`, needs `updateEntry`)
- `useTimeTracking.ts` - Active session management
- `useTimeInsights.ts` - Aggregated insights data

**Types:** `src/types/timeTracking.ts`
- `TimeEntry` - Core time entry interface
- `CachedTimeEntry` - Entry with sync metadata

**Patterns:**
- Functional components with arrow functions
- No semicolons
- Single quotes for strings
- Tailwind CSS for styling
- Radix UI for accessible modals/dialogs
- Co-located test files (`.test.tsx`)

---

## The Change

### Problem Statement

Users cannot edit or delete individual time entries from the Insights modal. Once a time entry is created (via tracking or manual entry), there's no way to:
- Fix incorrect durations
- Reassign time to a different task
- Correct the date
- Remove erroneous entries

This creates friction when users make mistakes or need to adjust their tracked time retroactively.

### Proposed Solution

Add swipe-to-reveal actions on time entry rows in the Recent Entries section of the Time Insights modal:

1. **Swipe Gesture:** Two-finger trackpad swipe left on an `InsightRow` slides the row content left, revealing Edit and Delete action buttons (iOS Mail-style pattern)
2. **Edit Action:** Opens a modal to edit all fields (duration, date, task assignment, task name snapshot)
3. **Delete Action:** Shows confirmation dialog, then removes the time entry from IndexedDB and queues deletion for Supabase sync

Key constraint: Actions affect **only the time entry**, not the underlying task.

### Scope

**In Scope:**
- Swipe gesture detection on `InsightRow` components (two-finger horizontal scroll/swipe)
- Slide-to-reveal animation showing Edit and Delete buttons
- Edit modal with fields: duration, date, task selector, task name
- Delete confirmation dialog
- `updateEntry` function in `useTimeEntries` hook
- Supabase sync for updates and deletes
- Unit tests for new components and functionality
- Keyboard accessibility (focus management, escape to cancel)

**Out of Scope:**
- Bulk edit/delete of multiple entries
- Undo functionality (using confirmation dialog instead)
- Touch gestures for mobile (trackpad two-finger swipe only for now)
- Swipe actions on the Breakdown section (aggregated view)
- Changes to the underlying Task entity

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/components/time-tracking/InsightRow.tsx` | MODIFY | Add swipe gesture detection, slide animation, action buttons |
| `src/components/time-tracking/InsightRow.test.tsx` | MODIFY | Add tests for swipe behavior, action buttons |
| `src/components/time-tracking/EditTimeEntryModal.tsx` | CREATE | Modal for editing time entry fields |
| `src/components/time-tracking/EditTimeEntryModal.test.tsx` | CREATE | Tests for edit modal |
| `src/components/time-tracking/DeleteConfirmDialog.tsx` | CREATE | Confirmation dialog for delete action |
| `src/components/time-tracking/DeleteConfirmDialog.test.tsx` | CREATE | Tests for delete dialog |
| `src/components/time-tracking/TimeInsightsModal.tsx` | MODIFY | Pass callbacks for edit/delete, manage modal states |
| `src/components/time-tracking/TimeInsightsModal.test.tsx` | MODIFY | Add tests for edit/delete flows |
| `src/hooks/useTimeEntries.ts` | MODIFY | Add `updateEntry` function |
| `src/lib/timeTrackingDb.ts` | MODIFY | Add `updateTimeEntry` database function |
| `src/lib/supabaseTimeEntries.ts` | MODIFY | Ensure `upsertTimeEntry` handles updates (likely already works) |

### Technical Approach

**1. Swipe Gesture Detection**

Use native wheel events to detect two-finger horizontal scroll:

```typescript
// Detect horizontal scroll (two-finger swipe on trackpad)
const handleWheel = (e: WheelEvent) => {
  // deltaX indicates horizontal scroll
  // Negative = swipe left (reveal actions)
  // Positive = swipe right (hide actions)
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    e.preventDefault()
    // Update swipe offset state
  }
}
```

**2. Slide Animation**

Use CSS transforms with Tailwind classes + inline styles for dynamic offset:

```typescript
// Row content slides left, revealing buttons anchored on right
<div style={{ transform: `translateX(${-swipeOffset}px)` }}>
  {/* Row content */}
</div>
<div className="absolute right-0 top-0 bottom-0 flex">
  {/* Edit and Delete buttons */}
</div>
```

**3. State Management**

Each `InsightRow` manages its own swipe state:
- `swipeOffset: number` - Current horizontal offset (0 to max)
- `isRevealed: boolean` - Whether actions are fully revealed
- Snap behavior: If released past threshold, snap to revealed; otherwise snap back

**4. Edit Modal**

Reuse patterns from `TimeTrackingModal.tsx` manual entry state:
- `TaskSelector` for task selection
- `DurationInput` for duration
- Native date input for date
- Text input for task name override

**5. Delete Flow**

Use Radix `AlertDialog` for confirmation (consistent with app patterns):
- "Delete Time Entry?" title
- "This will permanently remove X duration from [task name]. This cannot be undone."
- Cancel / Delete buttons

### Existing Patterns to Follow

From `TimeTrackingModal.tsx`:
- Modal structure with Radix Dialog
- TaskSelector usage for task dropdown
- DurationInput component for duration
- Date input with max constraint
- Button styling: `bg-slate-600 text-white hover:bg-slate-700` for primary actions
- Cancel button: `border border-border bg-surface text-foreground hover:bg-surface-muted`

From `InsightRow.tsx`:
- Flex layout with justify-between
- Text styles: `text-sm text-foreground`, `text-xs text-muted-foreground`
- Hover state: `hover:bg-slate-50 transition-colors`
- Padding: `px-4 py-2.5`

From `useTimeEntries.ts`:
- Pattern for CRUD operations with IndexedDB + sync queue
- Error handling with try/catch and state updates
- Dev logging with `import.meta.env.DEV`

### Integration Points

1. **InsightRow ↔ TimeInsightsModal**
   - `onEdit: (entry: TimeEntry) => void` - Callback when edit clicked
   - `onDelete: (entry: TimeEntry) => void` - Callback when delete clicked

2. **TimeInsightsModal ↔ useTimeEntries**
   - `updateEntry(id, updates)` - Update entry in IndexedDB + queue sync
   - `deleteEntry(id)` - Delete entry (already exists)

3. **useTimeEntries ↔ timeTrackingDb**
   - `updateTimeEntry(id, updates)` - Database update function

4. **useTimeEntries ↔ syncQueue**
   - Queue UPDATE operation for Supabase sync

---

## Development Context

### Relevant Existing Code

| Reference | Location | Purpose |
|-----------|----------|---------|
| InsightRow component | `src/components/time-tracking/InsightRow.tsx:25-51` | Base component to modify |
| TimeInsightsModal Recent Entries | `src/components/time-tracking/TimeInsightsModal.tsx:399-408` | Where InsightRow is rendered |
| Manual entry form pattern | `src/components/time-tracking/TimeTrackingModal.tsx:443-525` | Reference for edit form |
| deleteEntry hook | `src/hooks/useTimeEntries.ts:175-195` | Pattern for delete operation |
| addEntry hook | `src/hooks/useTimeEntries.ts:114-164` | Pattern for entry operations with sync |
| TimeEntry type | `src/types/timeTracking.ts:44-55` | Entry interface |

### Dependencies

**Framework/Libraries:**
- React 19.2.0 (hooks, functional components)
- Radix UI Dialog 1.1.15 (edit modal)
- Radix UI AlertDialog (delete confirmation - may need to add)
- TailwindCSS 4.1.18 (styling)
- date-fns 4.1.0 (date formatting)

**Internal Modules:**
- `@/components/time-tracking/TaskSelector`
- `@/components/time-tracking/DurationInput`
- `@/hooks/useTimeEntries`
- `@/lib/timeTrackingDb`
- `@/lib/syncQueue`
- `@/types/timeTracking`

### Configuration Changes

Check if `@radix-ui/react-alert-dialog` is already installed. If not:
```bash
npm install @radix-ui/react-alert-dialog
```

### Existing Conventions (Brownfield)

| Convention | Pattern |
|------------|---------|
| Semicolons | No semicolons |
| Quotes | Single quotes |
| Indentation | 2 spaces |
| Component style | Arrow functions with explicit return types |
| State management | React hooks (useState, useCallback, useMemo) |
| Async patterns | async/await with try/catch |
| Logging | `console.log/error` wrapped in `import.meta.env.DEV` |
| CSS | Tailwind utility classes |
| Tests | Vitest + Testing Library, co-located `.test.tsx` files |

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **Rendering:** @testing-library/react 16.3.1
- **User Events:** @testing-library/user-event 14.6.1
- **Assertions:** Vitest expect + @testing-library/jest-dom matchers
- **Mocking:** `vi.fn()`, `vi.useFakeTimers()`
- **File naming:** `ComponentName.test.tsx`
- **Structure:** `describe` blocks for component, nested `describe` for features

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build | Vite | 7.2.4 |
| Styling | TailwindCSS | 4.1.18 |
| UI Primitives | Radix UI | Dialog 1.1.15 |
| Database | Dexie (IndexedDB) | 4.2.1 |
| Sync | Supabase | 2.89.0 |
| Testing | Vitest | 3.2.4 |
| Test Utils | Testing Library React | 16.3.1 |

---

## Technical Details

### Swipe Gesture Implementation

**Event Handling:**
```typescript
interface SwipeState {
  offset: number        // Current translateX offset (0 to ACTION_WIDTH)
  isDragging: boolean   // Whether user is actively swiping
  startX: number        // Initial clientX for drag calculation
}

const ACTION_WIDTH = 120 // Width of action buttons area (Edit + Delete)
const SNAP_THRESHOLD = 60 // If offset > threshold, snap open; else snap closed
```

**Wheel Event (Trackpad):**
- Listen for `wheel` event with `{ passive: false }` to allow preventDefault
- Check `Math.abs(deltaX) > Math.abs(deltaY)` to filter horizontal scrolls
- Accumulate deltaX to swipeOffset, clamped between 0 and ACTION_WIDTH
- On scroll end (debounced), snap to 0 or ACTION_WIDTH based on threshold

**Touch Fallback (Future):**
- Could add `touchstart`, `touchmove`, `touchend` for mobile
- Out of scope for this iteration

### Edit Modal Fields

| Field | Component | Validation |
|-------|-----------|------------|
| Task | TaskSelector | Required - must select a task |
| Duration | DurationInput | Required - must be > 0 |
| Date | `<input type="date">` | Required - max = today |
| Task Name | `<input type="text">` | Optional - defaults to selected task's name |

**Data Flow:**
1. User clicks Edit → `onEdit(entry)` called
2. Modal opens with entry data pre-filled
3. User modifies fields
4. User clicks Save → `updateEntry(entry.id, updates)` called
5. Modal closes, entry list refreshes

### Update Entry Logic

```typescript
// In useTimeEntries.ts
const updateEntry = async (
  id: string,
  updates: Partial<Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>>
): Promise<TimeEntry> => {
  const now = new Date().toISOString()

  // 1. Get existing entry
  const existing = entries.find(e => e.id === id)
  if (!existing) throw new Error('Entry not found')

  // 2. Merge updates
  const updated: TimeEntry = {
    ...existing,
    ...updates,
    updated_at: now,
  }

  // 3. Recalculate date field if start_time changed
  if (updates.start_time) {
    updated.date = updates.start_time.split('T')[0]
  }

  // 4. Save to IndexedDB
  await updateTimeEntryDb(id, updated)

  // 5. Queue for sync
  await queueOperation('UPDATE', 'time_entries', id, updated)

  // 6. Update React state
  setEntries(prev => prev.map(e => e.id === id ? { ...updated, _syncStatus: 'pending' } : e))

  return updated
}
```

### Delete Confirmation Dialog

Using Radix AlertDialog for accessibility:

```typescript
<AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
    <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg p-6 max-w-sm">
      <AlertDialog.Title>Delete Time Entry?</AlertDialog.Title>
      <AlertDialog.Description>
        This will permanently remove {formatDuration(entry.duration)} from "{entry.task_name}".
        This cannot be undone.
      </AlertDialog.Description>
      <div className="flex gap-3 mt-4">
        <AlertDialog.Cancel asChild>
          <button className="...">Cancel</button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <button className="bg-red-600 ..." onClick={onConfirm}>Delete</button>
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

### Edge Cases

1. **Concurrent swipes:** Only one row can be swiped open at a time. Opening a new row should close any previously opened row.
2. **Scroll container:** Swipe gestures should not interfere with vertical scrolling of the modal content.
3. **Entry deleted elsewhere:** If entry is deleted while edit modal is open, close modal gracefully.
4. **Sync conflicts:** Updates use `updated_at` timestamp for conflict resolution (existing pattern).
5. **Task deleted:** If the associated task is deleted, entry still shows task_name snapshot.

---

## Development Setup

```bash
# 1. Navigate to project
cd /Users/vishalpatel/Documents/apps/to-do/today-app

# 2. Install dependencies (if @radix-ui/react-alert-dialog needed)
npm install @radix-ui/react-alert-dialog

# 3. Start development server
npm run dev

# 4. Run tests in watch mode
npm test

# 5. Run single test file
npm test -- InsightRow.test.tsx
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/swipe-actions-time-entries`
2. Verify dev environment: `npm run dev`
3. Review existing code: `InsightRow.tsx`, `useTimeEntries.ts`, `TimeTrackingModal.tsx`
4. Check if AlertDialog is installed: `npm ls @radix-ui/react-alert-dialog`

### Implementation Steps

**Phase 1: Core Infrastructure**
1. Add `updateEntry` function to `useTimeEntries.ts`
2. Add `updateTimeEntry` function to `timeTrackingDb.ts`
3. Write tests for update functionality

**Phase 2: Swipe Gesture**
4. Add swipe state and wheel event handler to `InsightRow.tsx`
5. Implement slide animation with CSS transform
6. Add Edit and Delete action buttons (hidden by default)
7. Add snap behavior on swipe end
8. Write tests for swipe interaction

**Phase 3: Edit Modal**
9. Create `EditTimeEntryModal.tsx` component
10. Implement form with TaskSelector, DurationInput, date input, task name input
11. Wire up to `updateEntry` hook
12. Write tests for edit modal

**Phase 4: Delete Confirmation**
13. Create `DeleteConfirmDialog.tsx` component
14. Wire up to existing `deleteEntry` hook
15. Write tests for delete dialog

**Phase 5: Integration**
16. Update `TimeInsightsModal.tsx` to manage edit/delete modal states
17. Pass callbacks to InsightRow components
18. Handle closing swipe actions when clicking elsewhere
19. Integration tests for full flow

### Testing Strategy

| Test Type | Coverage |
|-----------|----------|
| Unit | `updateEntry` hook function |
| Unit | Swipe gesture detection and state |
| Unit | Edit modal form validation |
| Unit | Delete dialog behavior |
| Integration | Swipe → Edit → Save flow |
| Integration | Swipe → Delete → Confirm flow |
| Accessibility | Keyboard navigation, focus management |

### Acceptance Criteria

1. **AC1:** User can two-finger swipe left on a time entry row to reveal Edit and Delete buttons
2. **AC2:** Swiping right (or tapping outside) closes the revealed actions
3. **AC3:** Only one row can have actions revealed at a time
4. **AC4:** Clicking Edit opens modal pre-filled with entry data
5. **AC5:** Edit modal allows changing: duration, date, task, task name
6. **AC6:** Saving edit updates entry in IndexedDB and queues for Supabase sync
7. **AC7:** Clicking Delete shows confirmation dialog with entry details
8. **AC8:** Confirming delete removes entry from IndexedDB and queues for Supabase sync
9. **AC9:** Entry list updates immediately after edit/delete
10. **AC10:** Swipe gesture does not interfere with vertical scrolling

---

## Developer Resources

### File Paths Reference

**Modify:**
- `/today-app/src/components/time-tracking/InsightRow.tsx`
- `/today-app/src/components/time-tracking/InsightRow.test.tsx`
- `/today-app/src/components/time-tracking/TimeInsightsModal.tsx`
- `/today-app/src/components/time-tracking/TimeInsightsModal.test.tsx`
- `/today-app/src/hooks/useTimeEntries.ts`
- `/today-app/src/lib/timeTrackingDb.ts`

**Create:**
- `/today-app/src/components/time-tracking/EditTimeEntryModal.tsx`
- `/today-app/src/components/time-tracking/EditTimeEntryModal.test.tsx`
- `/today-app/src/components/time-tracking/DeleteConfirmDialog.tsx`
- `/today-app/src/components/time-tracking/DeleteConfirmDialog.test.tsx`

### Key Code Locations

| Reference | File:Line |
|-----------|-----------|
| InsightRow component | `InsightRow.tsx:25` |
| InsightRow render in modal | `TimeInsightsModal.tsx:405-407` |
| deleteEntry function | `useTimeEntries.ts:175` |
| addEntry pattern | `useTimeEntries.ts:114` |
| Manual entry form | `TimeTrackingModal.tsx:443` |
| TaskSelector usage | `TimeTrackingModal.tsx:451-456` |
| DurationInput usage | `TimeTrackingModal.tsx:477-481` |
| TimeEntry type | `timeTracking.ts:44` |

### Testing Locations

- Unit tests: `src/components/time-tracking/*.test.tsx`
- Hook tests: `src/hooks/*.test.ts` (create if needed)
- Test utilities: Use existing patterns from `InsightRow.test.tsx`

### Documentation to Update

- None required for this feature (internal UX enhancement)

---

## UX/UI Considerations

### UI Components Affected

| Component | Change |
|-----------|--------|
| InsightRow | Add swipe state, action buttons, transform animation |
| TimeInsightsModal | Add edit/delete modal state management |
| EditTimeEntryModal | New modal component |
| DeleteConfirmDialog | New dialog component |

### UX Flow Changes

**Current Flow:**
User views Recent Entries → Read-only display

**New Flow:**
User views Recent Entries → Swipe left on entry → Edit/Delete buttons revealed →
- Edit path: Click Edit → Modal opens → Modify fields → Save → Entry updated
- Delete path: Click Delete → Confirmation dialog → Confirm → Entry removed

### Visual/Interaction Patterns

- **Swipe Animation:** 200ms ease-out transition for smooth sliding
- **Action Buttons:** 60px each (Edit blue/slate, Delete red), icons with text
- **Snap Behavior:** If > 50% revealed, snap open; otherwise snap closed
- **Edit Modal:** Same styling as TimeTrackingModal (320px width, rounded corners)
- **Delete Dialog:** Centered, max-w-sm, red delete button for danger action

### Accessibility

- **Keyboard:** Tab to row → Enter to open context menu with Edit/Delete options
- **Screen Reader:** Action buttons have aria-labels ("Edit time entry", "Delete time entry")
- **Focus Management:** Focus moves to first action button when revealed; returns to row when closed
- **Delete Dialog:** Focus trapped in dialog, Escape to cancel

### User Feedback

- **Swipe:** Visual slide animation provides immediate feedback
- **Edit Save:** Modal closes immediately, entry updates in list
- **Delete Confirm:** Dialog shows specific entry details being deleted
- **Error States:** Toast notification if save/delete fails (use existing toast system)

---

## Testing Approach

### Test Strategy

**Unit Tests:**
- `InsightRow`: Swipe gesture detection, offset calculation, button visibility
- `EditTimeEntryModal`: Form rendering, validation, submit handler
- `DeleteConfirmDialog`: Render, cancel, confirm handlers
- `useTimeEntries.updateEntry`: Update logic, sync queue, state update

**Integration Tests:**
- Full swipe → edit → save flow
- Full swipe → delete → confirm flow
- Multiple rows - only one revealed at a time

**Accessibility Tests:**
- Keyboard navigation through revealed actions
- Focus management in modals
- Screen reader announcements

### Coverage Targets

- Unit test coverage: 90%+ for new code
- All acceptance criteria have corresponding tests
- Edge cases covered (concurrent swipes, deleted task, etc.)

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main
2. CI/CD runs tests automatically
3. Build passes → Deploy to staging
4. Manual QA on staging (test swipe on trackpad)
5. Deploy to production
6. Monitor error logs for sync issues

### Rollback Plan

1. If critical issues: Revert merge commit
2. Redeploy previous version
3. Time entries remain intact (no data migration)

### Monitoring

- Check Supabase logs for UPDATE/DELETE sync errors
- Monitor browser console for JavaScript errors
- Watch for user feedback on swipe gesture reliability
