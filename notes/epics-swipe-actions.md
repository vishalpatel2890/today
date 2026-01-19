# Today - Epic Breakdown

**Date:** 2026-01-11
**Project Level:** Quick Flow (Single Story)

---

## Epic 1: Swipe Actions for Time Entries

**Slug:** swipe-actions

### Goal

Enable users to edit and delete individual time entries directly from the Insights modal using an intuitive swipe-to-reveal gesture pattern.

### Scope

- Swipe gesture detection on InsightRow components
- Slide-to-reveal animation for Edit/Delete action buttons
- Edit modal for modifying time entry fields
- Delete confirmation dialog
- Hook updates for entry modification
- Supabase sync for updates and deletes

### Success Criteria

1. Users can swipe left on time entries to reveal action buttons
2. Edit allows modification of duration, date, task, and task name
3. Delete shows confirmation before removing entries
4. Changes sync to Supabase correctly
5. All acceptance criteria from tech-spec pass

### Dependencies

- Existing time tracking infrastructure (InsightRow, useTimeEntries, TimeInsightsModal)
- Radix UI AlertDialog (needs installation)

---

## Story Map - Epic 1

```
Epic: Swipe Actions for Time Entries
│
└── Story 1.1: Swipe-to-Edit/Delete Time Entries
    ├── Task 1: Add updateEntry to useTimeEntries hook
    ├── Task 2: Implement swipe gesture on InsightRow
    ├── Task 3: Create EditTimeEntryModal component
    ├── Task 4: Create DeleteConfirmDialog component
    ├── Task 5: Integrate with TimeInsightsModal
    └── Task 6: Write tests for all components
```

---

## Stories - Epic 1

### Story 1.1: Swipe-to-Edit/Delete Time Entries

As a **user tracking time on tasks**,
I want **to swipe left on a time entry to reveal edit and delete options**,
So that **I can correct mistakes or remove erroneous entries without leaving the Insights view**.

**Acceptance Criteria:**

**Given** I am viewing the Recent Entries list in Time Insights modal
**When** I two-finger swipe left on a time entry row
**Then** the row slides left revealing Edit and Delete buttons

**And** swiping right or tapping outside closes the revealed actions
**And** only one row can have actions revealed at a time
**And** clicking Edit opens a modal with entry data pre-filled
**And** the edit modal allows changing duration, date, task, and task name
**And** saving edit updates the entry and syncs to Supabase
**And** clicking Delete shows a confirmation dialog
**And** confirming delete removes the entry and syncs to Supabase
**And** the entry list updates immediately after edit/delete

**Prerequisites:** None (first story in epic)

**Technical Notes:** See tech-spec-swipe-actions.md for detailed implementation guidance including swipe gesture detection, component structure, and database operations.

---

## Implementation Timeline - Epic 1

**Total Stories:** 1

**Story File:** `sprint-artifacts/story-swipe-actions-1.md`

---
