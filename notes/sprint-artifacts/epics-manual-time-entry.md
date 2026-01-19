# Today - Epic Breakdown

**Date:** 2026-01-11
**Project Level:** Quick Flow

---

## Epic 1: Manual Time Entry

**Slug:** manual-time-entry

### Goal

Enable users to retroactively log time spent on tasks when they forget to start the tracker, ensuring complete and accurate time insights.

### Scope

**In Scope:**
- Add `+` button to Time Tracking Modal idle state
- Manual entry form with task selector, duration input, date picker
- Toggle to include completed tasks in selector
- Success feedback and state transitions
- Unit tests for new components

**Out of Scope:**
- Editing existing time entries
- Deleting time entries
- Bulk entry import
- Start/end time inputs (duration only)

### Success Criteria

1. Users can add time entries without starting/stopping the tracker
2. Manual entries appear correctly in Time Insights
3. Manual entries sync to Supabase like tracked entries
4. Form validates input before allowing submission

### Dependencies

- Existing `useTimeEntries().addEntry()` function
- Existing `TaskSelector` component
- Existing `DatePicker` component
- Existing modal patterns in `TimeTrackingModal.tsx`

---

## Stories - Epic 1

### Story 1.1: Manual Time Entry Form

As a user,
I want to manually add a time entry when I forget to track,
So that my time insights remain accurate and complete.

**Acceptance Criteria:**

- AC #1: `+` button visible in idle state, hidden during tracking
- AC #2: Clicking `+` shows manual entry form
- AC #3: Form includes task selector, duration (h/m), date picker
- AC #4: Date defaults to today, cannot select future dates
- AC #5: Toggle enables including completed tasks
- AC #6: Add button disabled until valid input
- AC #7: Success feedback shows for 1.5s then returns to idle
- AC #8: Entry appears in Time Insights with correct data

**Prerequisites:** None

**Technical Notes:** Reuse existing infrastructure - addEntry() handles save+sync, TaskSelector handles task selection, DatePicker handles dates. Create new DurationInput component for hours/minutes.

**Estimated Effort:** 3 points

---

## Implementation Timeline - Epic 1

**Total Story Points:** 3

**Story File:** `sprint-artifacts/story-manual-time-entry-1.md`
