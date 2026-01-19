# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-11
**Project Level:** Quick Flow
**Change Type:** Feature Enhancement
**Development Context:** Brownfield

---

## Context

### Available Documents

- No product briefs loaded (standalone tech-spec)
- Existing time tracking architecture documented in `notes/architecture-time-tracking.md`
- Existing sprint artifacts for time tracking epics 1-4

### Project Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Language |
| Vite | 7.2.4 | Build tool (PWA + Electron) |
| Tailwind CSS | 4.1.18 | Styling |
| Radix UI | 1.1.15 | Dialog, Select, Popover components |
| Dexie | 4.2.1 | IndexedDB wrapper |
| Supabase | 2.89.0 | Cloud sync & auth |
| Vitest | 3.2.4 | Testing framework |
| date-fns | 4.1.0 | Date utilities |

### Existing Codebase Structure

**Time Tracking Components:**
- `src/components/time-tracking/TimeTrackingModal.tsx` - Main tracking modal (idle/active states)
- `src/components/time-tracking/TaskSelector.tsx` - Task dropdown with type-ahead
- `src/components/time-tracking/TimeInsightsModal.tsx` - Insights view

**Hooks:**
- `src/hooks/useTimeTracking.ts` - Active session management
- `src/hooks/useTimeEntries.ts` - CRUD with sync (has `addEntry()` function)
- `src/hooks/useTimeInsights.ts` - Aggregated insights

**Data Layer:**
- `src/lib/timeTrackingDb.ts` - IndexedDB operations
- `src/types/timeTracking.ts` - TimeEntry, ActiveSession types

**Key Existing Infrastructure:**
- `useTimeEntries().addEntry()` already accepts manual entry data
- `TaskSelector` component exists for task selection
- `DatePicker` component exists in `src/components/DatePicker.tsx`

---

## The Change

### Problem Statement

Users sometimes forget to start time tracking before working on a task. When this happens, there's currently no way to retroactively log that time. Users lose visibility into their actual time spent, making the insights data incomplete and less useful for understanding work patterns.

### Proposed Solution

Add a manual time entry capability to the existing Time Tracking Modal (Cmd+Opt+T). A small `+` button in the idle state opens a minimal form to log time after the fact. The form captures duration, date, and task - then uses the existing `addEntry()` infrastructure to save.

**User Flow:**
1. User opens Time Tracking Modal (Cmd+Opt+T)
2. Sees small `+` button in corner (idle state only)
3. Clicks `+` → Modal transitions to "Add Manual Entry" state
4. Fills in: Task, Duration, Date (defaults to today)
5. Clicks "Add" → Success confirmation → Returns to idle state

### Scope

**In Scope:**
- Add `+` button to TimeTrackingModal idle state
- New "manual entry" state in TimeTrackingModal
- Duration input (hours and minutes)
- Date picker defaulting to today
- Task selector with toggle to include completed tasks
- Success feedback matching existing patterns
- Unit tests for new functionality

**Out of Scope:**
- Editing existing time entries (future feature)
- Deleting time entries from this modal
- Bulk manual entry
- Import from external sources

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/components/time-tracking/TimeTrackingModal.tsx` | MODIFY | Add `+` button, new "manual" state, manual entry form |
| `src/components/time-tracking/DurationInput.tsx` | CREATE | New component for hours/minutes input |
| `src/components/time-tracking/DurationInput.test.tsx` | CREATE | Tests for duration input |
| `src/components/time-tracking/TimeTrackingModal.test.tsx` | CREATE | Tests for manual entry flow |

### Technical Approach

**State Management:**

Add new state to TimeTrackingModal:
```typescript
type ModalState = 'idle' | 'tracking' | 'feedback' | 'manual'
```

Current implementation uses derived state (`isTracking`, `showFeedback`). Refactor to explicit state machine for clarity with the new manual state.

**Duration Input Component:**

Create `DurationInput.tsx` - a controlled component with two number inputs:
- Hours (0-23)
- Minutes (0-59)
- Returns total milliseconds via `onChange`
- Validates non-zero duration

**Task Selector Enhancement:**

The existing `TaskSelector` receives filtered tasks. Pass a different task list when in manual mode:
- Default: Today's tasks (existing `todayTasks` filter)
- With toggle: Include completed tasks (`task.completedAt !== null`)

**Manual Entry Form Fields:**
1. **Task** - TaskSelector (required)
2. **Duration** - DurationInput (required, must be > 0)
3. **Date** - DatePicker (required, defaults to today, max = today)

**Save Logic:**

Use existing `useTimeEntries().addEntry()`:
```typescript
const entry = await addEntry({
  user_id: userId ?? 'local',
  task_id: selectedTask.id,
  task_name: selectedTask.name,
  start_time: computedStartTime, // date + 00:00:00
  end_time: computedEndTime,     // start_time + duration
  duration: durationMs,
  date: selectedDate,            // YYYY-MM-DD
})
```

For manual entries, `start_time` and `end_time` are computed:
- `start_time`: Selected date at midnight (beginning of day)
- `end_time`: start_time + duration
- This ensures entries appear correctly in date-based queries

### Existing Patterns to Follow

**Modal State Transitions:**
Follow existing pattern in TimeTrackingModal where state changes trigger different UI renders:
```typescript
{showFeedback && lastEntry ? (
  // Feedback state
) : isTracking && activeSession ? (
  // Active tracking state
) : (
  // Idle state
)}
```

Extend to include manual state:
```typescript
{modalState === 'feedback' ? (
  // Feedback
) : modalState === 'tracking' ? (
  // Active tracking
) : modalState === 'manual' ? (
  // Manual entry form
) : (
  // Idle with + button
)}
```

**Form Styling:**
- Labels: `text-sm font-medium text-foreground mb-2`
- Inputs: Use existing Radix components with Tailwind styling
- Buttons: Follow existing Track/Stop button patterns

**Success Feedback:**
Reuse existing feedback pattern with checkmark icon and auto-dismiss after 1.5s.

### Integration Points

**Internal Dependencies:**
- `useTimeEntries().addEntry()` - Entry creation with sync
- `TaskSelector` - Task selection dropdown
- `DatePicker` - Date selection (from `src/components/DatePicker.tsx`)
- `formatDurationSummary()` - Display saved duration in feedback

**Data Flow:**
1. User fills form → local component state
2. Submit → validate → call `addEntry()`
3. `addEntry()` saves to IndexedDB + queues for Supabase sync
4. Show feedback → transition to idle

---

## Development Context

### Relevant Existing Code

**TimeTrackingModal.tsx (lines 83-331):**
- Current modal structure with idle/active/feedback states
- `handleTrack()` and `handleStop()` patterns to follow
- Success feedback with `showFeedback` state and `lastEntry`

**useTimeEntries.ts (lines 114-164):**
- `addEntry()` function - takes entry data, generates ID, saves with sync
- Already handles all the complex sync logic

**TaskSelector.tsx:**
- Receives `tasks` prop - just pass different filtered list for manual mode
- `onSelect` callback with `SelectedTask` type

**DatePicker.tsx:**
- Existing date picker component for task defer dates
- Reusable for manual entry date selection

### Dependencies

**Framework/Libraries (from package.json):**
- `@radix-ui/react-dialog` 1.1.15 - Modal
- `@radix-ui/react-select` 2.2.6 - Dropdowns
- `date-fns` 4.1.0 - Date formatting (`format`, `parseISO`)
- `lucide-react` 0.562.0 - Icons (Plus, Check, X)

**Internal Modules:**
- `@/hooks/useTimeEntries` - Entry CRUD
- `@/components/time-tracking/TaskSelector` - Task selection
- `@/components/DatePicker` - Date picker
- `@/lib/timeFormatters` - Duration formatting

### Configuration Changes

None required - no new environment variables, no schema changes.

### Existing Conventions (Brownfield)

**Code Style:**
- Functional components with hooks
- TypeScript strict mode
- Tailwind utility classes
- JSDoc comments for complex functions

**Naming:**
- Components: PascalCase (`DurationInput.tsx`)
- Hooks: camelCase with `use` prefix
- Test files: `*.test.tsx` co-located

**Imports:**
- Relative paths within feature folders
- Type imports with `type` keyword

### Test Framework & Standards

**Framework:** Vitest 3.2.4 + React Testing Library

**Patterns (from useTimeTracking.test.ts):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    // Arrange
    // Act
    // Assert
  })
})
```

**Mocking:** `vi.mock()` for module mocking

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Vite dev server / Electron | 7.2.4 / 39.2.7 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.1.18 |
| UI Components | Radix UI | 1.1.15 |
| Storage | Dexie (IndexedDB) | 4.2.1 |
| Sync | Supabase | 2.89.0 |
| Testing | Vitest + RTL | 3.2.4 |
| Icons | Lucide React | 0.562.0 |

---

## Technical Details

### Duration Input Behavior

**Input Constraints:**
- Hours: 0-23 (number input, min=0, max=23)
- Minutes: 0-59 (number input, min=0, max=59)
- At least one must be > 0 for valid entry

**Calculation:**
```typescript
const durationMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
```

**Display Format:**
- Show placeholder "0h 0m" initially
- On blur, format nicely (e.g., "2h 30m")

### Start/End Time Computation

For manual entries, we need `start_time` and `end_time` even though user only enters duration:

```typescript
// Use start of selected day as base
const startOfSelectedDay = startOfDay(parseISO(selectedDate))
const startTime = startOfSelectedDay.toISOString()
const endTime = new Date(startOfSelectedDay.getTime() + durationMs).toISOString()
```

This ensures:
- Entries appear on correct date in queries
- Duration calculation is accurate
- No overlap concerns (manual entries stack at day start)

### Task Filter Toggle

**Default (Today's Tasks):**
```typescript
const todayTasks = tasks.filter(task => {
  if (task.completedAt) return false
  // ... existing date logic
})
```

**With Completed Toggle:**
```typescript
const manualEntryTasks = tasks.filter(task => {
  if (!includeCompleted && task.completedAt) return false
  // Include today's tasks + completed tasks when toggled
  if (task.completedAt) return true // Show all completed
  // ... existing date logic for incomplete tasks
})
```

### Edge Cases

1. **Zero duration** - Disable Add button, show validation message
2. **Future date** - Prevent selection (max date = today)
3. **No tasks available** - Show empty state, disable Add button
4. **Network offline** - Works fine (IndexedDB first, syncs later)
5. **Rapid submissions** - Disable button while saving

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/manual-time-entry`
2. Verify dev environment: `npm run dev`
3. Review existing code:
   - `src/components/time-tracking/TimeTrackingModal.tsx`
   - `src/hooks/useTimeEntries.ts`
   - `src/components/time-tracking/TaskSelector.tsx`

### Implementation Steps

**Step 1: Create DurationInput Component**
- Create `src/components/time-tracking/DurationInput.tsx`
- Two number inputs (hours, minutes)
- Controlled component with `value` (ms) and `onChange`
- Create `DurationInput.test.tsx` with basic tests

**Step 2: Add Manual State to TimeTrackingModal**
- Add `modalState` state variable
- Refactor existing boolean states to use modalState
- Add `+` button to idle state UI (top-right corner)
- Wire up button to transition to 'manual' state

**Step 3: Build Manual Entry Form**
- Add form UI in 'manual' state branch
- Include: TaskSelector, DurationInput, DatePicker
- Add "Include completed tasks" toggle
- Add Cancel and Add buttons

**Step 4: Implement Save Logic**
- Create `handleManualSave()` function
- Validate inputs (task selected, duration > 0)
- Compute start_time/end_time from date + duration
- Call `addEntry()` with computed values
- Transition to feedback state on success

**Step 5: Add Tests**
- Test `+` button appears in idle state
- Test transition to manual state
- Test form validation
- Test successful save flow
- Test cancel returns to idle

### Testing Strategy

**Unit Tests:**
- `DurationInput.test.tsx` - Input behavior, validation, callbacks
- `TimeTrackingModal.test.tsx` - Manual entry flow, state transitions

**Integration Tests:**
- Manual entry saves correctly to IndexedDB
- Entry appears in TimeInsightsModal after save

**Manual Testing Checklist:**
- [ ] Open modal with Cmd+Opt+T, see + button
- [ ] Click +, form appears
- [ ] Select task, enter duration, change date
- [ ] Toggle "Include completed" shows completed tasks
- [ ] Submit shows success feedback
- [ ] Entry appears in Time Insights
- [ ] Works offline (airplane mode)

### Acceptance Criteria

1. **AC1:** When Time Tracking Modal is in idle state, a `+` button is visible
2. **AC2:** Clicking `+` transitions to manual entry form
3. **AC3:** Form includes task selector, duration input (h/m), and date picker
4. **AC4:** Date defaults to today, cannot select future dates
5. **AC5:** Task selector shows today's tasks by default
6. **AC6:** Toggle enables viewing/selecting completed tasks
7. **AC7:** Add button is disabled until task selected and duration > 0
8. **AC8:** Successful save shows confirmation feedback for 1.5s
9. **AC9:** After feedback, modal returns to idle state
10. **AC10:** Manual entries appear in Time Insights with correct data

---

## Developer Resources

### File Paths Reference

| File | Purpose |
|------|---------|
| `src/components/time-tracking/TimeTrackingModal.tsx` | Main modal (modify) |
| `src/components/time-tracking/DurationInput.tsx` | Duration input (create) |
| `src/components/time-tracking/DurationInput.test.tsx` | Duration tests (create) |
| `src/components/time-tracking/TimeTrackingModal.test.tsx` | Modal tests (create) |
| `src/components/time-tracking/TaskSelector.tsx` | Task dropdown (reference) |
| `src/components/DatePicker.tsx` | Date picker (reference) |
| `src/hooks/useTimeEntries.ts` | Entry CRUD (reference) |
| `src/types/timeTracking.ts` | Types (reference) |

### Key Code Locations

| What | Where |
|------|-------|
| Modal structure | `TimeTrackingModal.tsx:235-331` |
| Idle state UI | `TimeTrackingModal.tsx:286-324` |
| Success feedback | `TimeTrackingModal.tsx:258-267` |
| addEntry function | `useTimeEntries.ts:114-164` |
| TimeEntry type | `timeTracking.ts:44-55` |
| TaskSelector component | `TaskSelector.tsx` |
| DatePicker component | `DatePicker.tsx` |

### Testing Locations

| Type | Location |
|------|----------|
| Unit tests | `src/components/time-tracking/*.test.tsx` |
| Hook tests | `src/hooks/*.test.ts` |
| Test setup | `src/test/setup.ts` |

### Documentation to Update

- None required for this feature (internal enhancement)

---

## UX/UI Considerations

### UI Components Affected

**TimeTrackingModal - Idle State:**
- Add small `+` button (Plus icon from lucide-react)
- Position: Top-right area, next to close button or in header
- Size: Small, unobtrusive (e.g., 24x24px hit area)
- Style: `text-muted-foreground hover:text-foreground`

**TimeTrackingModal - Manual State:**
- Title changes to "Add Time Entry"
- Form layout: Vertical stack
- Task selector (full width)
- Duration inputs (hours + minutes, inline)
- Date picker (full width)
- Toggle for completed tasks (small, below task selector)
- Action buttons: Cancel (secondary) + Add (primary)

### Interaction Patterns

**+ Button:**
- Single click → transition to manual state
- Keyboard: Tab-focusable, Enter/Space activates

**Form Navigation:**
- Tab order: Task → Hours → Minutes → Date → Toggle → Cancel → Add
- Enter in form → Submit (if valid)
- Escape → Cancel (return to idle)

**Visual Feedback:**
- Invalid states: Red border on duration if 0
- Loading: Disable Add button while saving
- Success: Checkmark icon + "Saved: Xh Ym on 'Task Name'"

### Accessibility

- All inputs have associated labels
- `+` button has `aria-label="Add manual time entry"`
- Form inputs use native HTML5 validation attributes
- Focus management: Focus task selector when entering manual state
- Screen reader: Announce state transitions

---

## Testing Approach

**Test Framework:** Vitest 3.2.4 + React Testing Library

**Conform to Existing Standards:**
- File naming: `*.test.tsx`
- Co-located with source files
- Use `describe/it/expect` pattern
- Mock external dependencies with `vi.mock()`

**Test Coverage:**

1. **DurationInput Component:**
   - Renders hours and minutes inputs
   - Calls onChange with correct milliseconds
   - Validates min/max constraints
   - Handles edge cases (0h 0m, 23h 59m)

2. **TimeTrackingModal Manual Flow:**
   - + button visible in idle state only
   - + button hidden in tracking/feedback states
   - Click + transitions to manual state
   - Cancel returns to idle
   - Form validation prevents empty submit
   - Successful submit calls addEntry with correct data
   - Success feedback displays and auto-dismisses

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main
2. CI runs tests automatically
3. Build PWA: `npm run build`
4. Deploy to hosting (Vercel/Netlify)
5. Build Electron: `npm run build:electron` (if distributing desktop app)

### Rollback Plan

1. Revert merge commit: `git revert <commit>`
2. Redeploy previous version
3. No database migrations to roll back

### Monitoring

- Check browser console for errors after deployment
- Monitor Supabase dashboard for sync issues
- User feedback on time entry accuracy
