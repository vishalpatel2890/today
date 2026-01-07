# Story 1.1: Core Notes Infrastructure

**Status:** Complete

---

## User Story

As a developer,
I want the database and state management ready for notes,
So that the UI can save and load notes reliably.

---

## Acceptance Criteria

**AC #1:** `notes` JSONB column exists in tasks table
- Given the Supabase database
- When I query the tasks table schema
- Then there is a `notes` column of type JSONB, nullable

**AC #2:** TypeScript types are defined
- Given the types/index.ts file
- When I check for NoteItem and TaskNotes types
- Then both interfaces exist with correct properties

**AC #3:** Reducer handles UPDATE_NOTES
- Given the taskReducer in useTasks.ts
- When UPDATE_NOTES action is dispatched
- Then the task's notes field is updated in local state

**AC #4:** updateNotes syncs to Supabase
- Given a task with notes
- When updateNotes(id, notes) is called
- Then the notes are persisted to the tasks table

**AC #5:** Real-time sync includes notes
- Given notes updated on another device
- When real-time event fires
- Then local state includes the updated notes

---

## Implementation Details

### Tasks / Subtasks

- [ ] Apply Supabase migration to add `notes` JSONB column (AC: #1)
- [ ] Add `NoteItem` type to types/index.ts (AC: #2)
- [ ] Add `TaskNotes` type to types/index.ts (AC: #2)
- [ ] Update `Task` interface to include `notes: TaskNotes | null` (AC: #2)
- [ ] Update `TaskRow` in types/database.ts to include `notes` (AC: #2)
- [ ] Add `UPDATE_NOTES` action type to TaskAction union (AC: #3)
- [ ] Add `UPDATE_NOTES` case to taskReducer (AC: #3)
- [ ] Add `updateNotes` function to useTasks hook (AC: #4)
- [ ] Update `rowToTask` to map notes field (AC: #5)
- [ ] Verify real-time subscription handles notes in SYNC_TASK (AC: #5)

### Technical Summary

This story establishes the foundation for task notes:

1. **Database Migration:** Add `notes` JSONB column to tasks table via Supabase MCP
2. **Type System:** Define NoteItem (id, type, value, checked?, label?) and TaskNotes (items[], updatedAt)
3. **State Management:** Extend reducer with UPDATE_NOTES action
4. **Supabase Sync:** Add updateNotes function following existing pattern from updateTask

### Project Structure Notes

- **Files to modify:**
  - `src/types/index.ts`
  - `src/types/database.ts`
  - `src/hooks/useTasks.ts`
- **Expected test locations:** Manual testing (no test framework)
- **Estimated effort:** 3 story points
- **Prerequisites:** None

### Key Code References

| Reference | Location | Purpose |
|-----------|----------|---------|
| Task interface | `src/types/index.ts:5-12` | Add notes field here |
| TaskRow type | `src/types/database.ts:17-36` | Add notes field here |
| taskReducer | `src/hooks/useTasks.ts:23-69` | Add UPDATE_NOTES case |
| updateTask pattern | `src/hooks/useTasks.ts:314-327` | Follow this pattern for updateNotes |
| rowToTask | `src/hooks/useTasks.ts:75-82` | Map notes from row |

---

## Context References

**Tech-Spec:** [tech-spec-task-notes.md](../tech-spec-task-notes.md) - Primary context document containing:
- Notes JSON schema with NoteItem and TaskNotes types
- Full implementation guidance
- Existing patterns to follow

**Architecture:** See tech-spec for codebase structure

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation

### Completion Notes

All infrastructure for task notes implemented:
- Supabase migration applied (notes JSONB column)
- TypeScript types defined (NoteItem, TaskNotes)
- Reducer updated with UPDATE_NOTES action
- updateNotes function with Supabase sync
- rowToTask maps notes field
- Build passes with no errors

### Files Modified

- `src/types/index.ts` - Added NoteItemType, NoteItem, TaskNotes types; updated Task interface
- `src/types/database.ts` - Added notes field to TaskRow types
- `src/hooks/useTasks.ts` - Added UPDATE_NOTES action, updateNotes function, updated rowToTask

### Test Results

- TypeScript build: PASSED
- Supabase migration: APPLIED

---

## Review Notes

<!-- Will be populated during code review -->
