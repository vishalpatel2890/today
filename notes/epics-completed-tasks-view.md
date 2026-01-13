# Today - Epic Breakdown

**Date:** 2026-01-13
**Project Level:** Quick Flow

---

## Epic 1: Completed Tasks View

**Slug:** completed-tasks-view

### Goal

Enable users to view and manage completed tasks via a keyboard-accessible modal, allowing them to review recent accomplishments and restore tasks marked complete by mistake.

### Scope

- Global keyboard shortcut (Cmd+Opt+D / Ctrl+Alt+D)
- Modal displaying completed tasks from last 14 days
- Date-based grouping (Today, Yesterday, This Week, Last Week, Older)
- Mark incomplete action (restores to Today view)
- View notes action (opens existing NotesModal)

### Success Criteria

1. Users can open Completed Tasks modal with keyboard shortcut
2. Completed tasks display grouped by date
3. Users can mark tasks incomplete to restore them
4. Users can view notes on completed tasks
5. All acceptance criteria pass
6. Unit tests cover hotkey and modal components

### Dependencies

- None (uses existing task infrastructure)

---

## Story Map - Epic 1

```
Epic: Completed Tasks View
└── Story 1.1: Completed Tasks Modal with Hotkey
    ├── Task: Create useCompletedTasksHotkey hook
    ├── Task: Add uncompleteTask to useTasks
    ├── Task: Create CompletedTasksModal component
    ├── Task: Create CompletedTaskRow component
    ├── Task: Integrate in App.tsx
    └── Task: Write unit tests
```

---

## Stories - Epic 1

### Story 1.1: Completed Tasks Modal with Hotkey

As a **user**,
I want **to press Cmd+Opt+D to view my completed tasks from the last 14 days**,
So that **I can review what I've accomplished and restore tasks I completed by mistake**.

**Acceptance Criteria:**

**Given** I am on any view in the app
**When** I press Cmd+Opt+D (Mac) or Ctrl+Alt+D (Windows)
**Then** the Completed Tasks modal opens

**And** the modal shows tasks completed in the last 14 days only
**And** tasks are grouped by: Today, Yesterday, This Week, Last Week, Older
**And** each task shows its text and relative completion time
**And** each task has an "Undo" button to mark it incomplete
**And** clicking "Undo" restores the task to Today view with a toast confirmation
**And** tasks with notes show a "Notes" button that opens NotesModal
**And** the hotkey is ignored when focused on input/textarea/contenteditable
**And** the modal can be closed via X button or Escape key
**And** an empty state is shown when no completed tasks exist in range

**Prerequisites:** None

**Technical Notes:** See tech-spec-completed-tasks-view.md for full implementation details

---

## Implementation Timeline - Epic 1

**Total Stories:** 1

**Deliverables:**
- `src/hooks/useCompletedTasksHotkey.ts` + tests
- `src/components/CompletedTasksModal.tsx` + tests
- `src/components/CompletedTaskRow.tsx`
- Modified `src/hooks/useTasks.ts` (uncompleteTask)
- Modified `src/App.tsx` (integration)
