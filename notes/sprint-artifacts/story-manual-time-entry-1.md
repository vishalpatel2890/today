# Story 1.1: Manual Time Entry Form

**Status:** Done

---

## User Story

As a **user**,
I want **to manually add a time entry when I forget to start the tracker**,
So that **my time insights remain accurate and complete**.

---

## Acceptance Criteria

**AC #1:** Given the Time Tracking Modal is in idle state, when I look at the modal, then I see a small `+` button

**AC #2:** Given the `+` button is visible, when I click it, then the modal transitions to show a manual entry form

**AC #3:** Given I am viewing the manual entry form, when I inspect the form fields, then I see a task selector, duration input (hours/minutes), and date picker

**AC #4:** Given I am viewing the date picker, when I try to select a date, then today is selected by default and I cannot select future dates

**AC #5:** Given I am viewing the task selector, when I toggle "Include completed tasks", then completed tasks appear in the dropdown

**AC #6:** Given I have not selected a task OR duration is 0, when I look at the Add button, then it is disabled

**AC #7:** Given I have valid input and click Add, when the entry saves successfully, then I see a success message for ~1.5 seconds and the modal returns to idle state

**AC #8:** Given I added a manual entry, when I open Time Insights, then the entry appears with correct task name, duration, and date

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Create DurationInput component** (AC: #3, #6)
  - [ ] Create `src/components/time-tracking/DurationInput.tsx`
  - [ ] Two number inputs: hours (0-23), minutes (0-59)
  - [ ] Return total milliseconds via onChange
  - [ ] Validate non-zero duration

- [ ] **Create DurationInput tests** (AC: #3, #6)
  - [ ] Create `src/components/time-tracking/DurationInput.test.tsx`
  - [ ] Test renders hours/minutes inputs
  - [ ] Test onChange returns correct ms
  - [ ] Test validation constraints

- [ ] **Add modal state management** (AC: #1, #2)
  - [ ] Add `modalState` type: `'idle' | 'tracking' | 'feedback' | 'manual'`
  - [ ] Refactor existing boolean states to modalState
  - [ ] Add state transition logic

- [ ] **Add + button to idle state** (AC: #1)
  - [ ] Add Plus icon button in modal header area
  - [ ] Style: small, muted, hover effect
  - [ ] aria-label for accessibility
  - [ ] Only visible when modalState === 'idle'

- [ ] **Build manual entry form UI** (AC: #2, #3)
  - [ ] Title: "Add Time Entry"
  - [ ] TaskSelector with tasks prop
  - [ ] DurationInput component
  - [ ] DatePicker with max=today
  - [ ] "Include completed tasks" toggle
  - [ ] Cancel and Add buttons

- [ ] **Implement task filtering with toggle** (AC: #5)
  - [ ] Add `includeCompleted` state
  - [ ] Filter tasks based on toggle
  - [ ] Default: today's incomplete tasks
  - [ ] Toggled: add completed tasks

- [ ] **Implement date picker constraints** (AC: #4)
  - [ ] Default value: today
  - [ ] Max date: today (no future)
  - [ ] Wire to form state

- [ ] **Implement form validation** (AC: #6)
  - [ ] Track: selectedTask, duration, date
  - [ ] Disable Add when: !task || duration === 0
  - [ ] Enable Add when valid

- [ ] **Implement save logic** (AC: #7, #8)
  - [ ] Create handleManualSave function
  - [ ] Compute start_time/end_time from date + duration
  - [ ] Call addEntry() with computed values
  - [ ] Transition to feedback state
  - [ ] Auto-dismiss after 1.5s → idle

- [ ] **Add keyboard shortcuts** (AC: #2)
  - [ ] Escape in manual state → return to idle
  - [ ] Enter when valid → submit

- [ ] **Write integration tests** (AC: #1-#8)
  - [ ] Create `TimeTrackingModal.test.tsx` for manual flow
  - [ ] Test + button visibility states
  - [ ] Test form submission flow
  - [ ] Test validation behavior

### Technical Summary

**Approach:**
- Add new `modalState` state machine to TimeTrackingModal
- Create reusable DurationInput component for hours/minutes
- Reuse existing TaskSelector with modified filter for completed tasks
- Reuse existing DatePicker with max constraint
- Use existing `addEntry()` for save - it handles IndexedDB + sync queue

**Key Technical Decisions:**
- Duration-only input (no start/end time) - keeps UI simple
- Compute start_time as midnight of selected date
- end_time = start_time + duration
- Entries stack at day start (no overlap concerns)

**Files Involved:**
- `TimeTrackingModal.tsx` - Main changes
- `DurationInput.tsx` - New component
- `DurationInput.test.tsx` - New tests
- `TimeTrackingModal.test.tsx` - New tests

### Project Structure Notes

- **Files to modify:** `src/components/time-tracking/TimeTrackingModal.tsx`
- **Files to create:**
  - `src/components/time-tracking/DurationInput.tsx`
  - `src/components/time-tracking/DurationInput.test.tsx`
  - `src/components/time-tracking/TimeTrackingModal.test.tsx`
- **Expected test locations:** `src/components/time-tracking/*.test.tsx`
- **Estimated effort:** 3 story points
- **Prerequisites:** None

### Key Code References

| Reference | Location |
|-----------|----------|
| Modal structure | `TimeTrackingModal.tsx:235-331` |
| Idle state UI | `TimeTrackingModal.tsx:286-324` |
| Success feedback pattern | `TimeTrackingModal.tsx:258-267` |
| addEntry function | `useTimeEntries.ts:114-164` |
| TimeEntry type | `timeTracking.ts:44-55` |
| TaskSelector component | `TaskSelector.tsx` |
| DatePicker component | `DatePicker.tsx` |
| Test patterns | `useTimeTracking.test.ts` |

---

## Context References

**Tech-Spec:** [tech-spec-manual-time-entry.md](./tech-spec-manual-time-entry.md) - Primary context document containing:
- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow
- Integration points and dependencies
- Complete implementation guidance

**Architecture:** `notes/architecture-time-tracking.md`

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No significant debugging required

### Completion Notes

Implemented manual time entry feature in TimeTrackingModal:
- Added `+` button visible only in idle state
- Created DurationInput component for hours/minutes input
- Added manual entry form with task selector, duration, date picker
- Implemented "Include completed tasks" toggle
- Added form validation (task required, duration > 0)
- Uses existing addEntry() for save with automatic Supabase sync
- Success feedback with 1.5s auto-dismiss
- Keyboard shortcuts: Escape to cancel, Enter to submit

### Files Modified

**Created:**
- `src/components/time-tracking/DurationInput.tsx` - Duration input component
- `src/components/time-tracking/DurationInput.test.tsx` - 14 tests
- `src/components/time-tracking/TimeTrackingModal.test.tsx` - 16 tests

**Modified:**
- `src/components/time-tracking/TimeTrackingModal.tsx` - Added manual entry state and form

### Test Results

```
Test Files  24 passed (24)
     Tests  494 passed (494)
  Duration  3.89s
```

All acceptance criteria verified:
- AC #1: ✅ + button visible in idle state
- AC #2: ✅ Transitions to manual entry form
- AC #3: ✅ Form has task, duration (h/m), date fields
- AC #4: ✅ Date defaults to today, no future dates
- AC #5: ✅ Toggle to include completed tasks
- AC #6: ✅ Add button disabled until valid input
- AC #7: ✅ Success feedback for 1.5s, returns to idle
- AC #8: ✅ Entry syncs and appears in Time Insights

---

## Review Notes

<!-- Will be populated during code review -->
