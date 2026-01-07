# Story 1.2: Notes Modal & Editor UI

**Status:** Done

---

## User Story

As a user,
I want to double-click a task to open a notes editor,
So that I can add detailed notes with bullets and checklists.

---

## Acceptance Criteria

**AC #1:** Double-click opens NotesModal
- Given a task card in any view
- When I double-click on the card body
- Then the NotesModal opens for that task

**AC #2:** Single-click still completes task
- Given a task card
- When I single-click the circle/checkbox
- Then the task is marked complete (existing behavior preserved)

**AC #3:** Button clicks don't trigger modal
- Given a task card
- When I click the edit or delete buttons
- Then the notes modal does NOT open

**AC #4:** Bullets are supported
- Given the notes editor
- When I type `- item` or `• item` on a new line
- Then it renders as a bullet point

**AC #5:** Checklists are supported
- Given the notes editor
- When I type `[ ] todo` or `[x] done`
- Then it renders as a checkbox (unchecked/checked)

**AC #6:** Save persists notes
- Given notes in the editor
- When I click the Save button
- Then notes are saved to database and modal closes

**AC #7:** Existing notes display on open
- Given a task with saved notes
- When I double-click to open the modal
- Then the existing notes are displayed in the editor

---

## Implementation Details

### Tasks / Subtasks

- [x] Create `NotesModal.tsx` component following DeferModal pattern (AC: #1, #6, #7)
- [x] Create `NotesEditor.tsx` component with textarea (AC: #4, #5)
- [x] Implement `parseNoteInput()` for bullet/checklist detection (AC: #4, #5)
- [x] Implement `renderNotes()` to display formatted notes (AC: #4, #5, #7)
- [x] Add `onDoubleClick` handler to TaskCard div (AC: #1)
- [x] Prevent double-click when `showCheck` or `isCompleting` (AC: #2)
- [x] Prevent double-click when clicking buttons (AC: #3)
- [x] Add `onNotesOpen` prop to TaskCard interface (AC: #1)
- [x] Add `isNotesModalOpen` state to TaskCard (AC: #1)
- [x] Update TodayView to pass notes handlers (AC: #1)
- [x] Update TomorrowView to pass notes handlers (AC: #1)
- [x] Update DeferredView to pass notes handlers (AC: #1)
- [x] Wire Save button to `updateNotes` function (AC: #6)
- [x] Load existing notes when modal opens (AC: #7)

### Technical Summary

This story creates the user interface for task notes:

1. **NotesModal:** Radix Dialog following existing UpdateModal pattern
   - Bottom sheet on mobile, centered on desktop
   - Close button, Save/Cancel buttons
   - Contains NotesEditor component

2. **NotesEditor:** Textarea with parsing and rendering
   - Input mode: Plain textarea with markdown-like syntax
   - Display mode: Rendered bullets/checklists
   - Toggle between edit and preview (or live preview)

3. **Double-click Handler:** Add to TaskCard.tsx
   - Check `showCheck` and `isCompleting` to prevent conflicts
   - Check if clicking on a button element
   - Call `onNotesOpen(task)` when valid

### Project Structure Notes

- **Files to modify:**
  - `src/components/NotesModal.tsx` (CREATE)
  - `src/components/NotesEditor.tsx` (CREATE)
  - `src/components/TaskCard.tsx` (MODIFY)
  - `src/views/TodayView.tsx` (MODIFY)
  - `src/views/TomorrowView.tsx` (MODIFY)
  - `src/views/DeferredView.tsx` (MODIFY)
- **Expected test locations:** Manual testing in browser
- **Estimated effort:** 3 story points
- **Prerequisites:** Story 1.1 complete

### Key Code References

| Reference | Location | Purpose |
|-----------|----------|---------|
| UpdateModal | `src/components/DeferModal.tsx:20-256` | Copy modal structure |
| Dialog usage | `src/components/DeferModal.tsx:116-255` | Radix Dialog pattern |
| TaskCard | `src/components/TaskCard.tsx:22-116` | Add double-click here |
| handleComplete | `src/components/TaskCard.tsx:28-44` | Check showCheck pattern |
| TodayView | `src/views/TodayView.tsx` | Pass handlers to TaskCard |

---

## Context References

**Tech-Spec:** [tech-spec-task-notes.md](../tech-spec-task-notes.md) - Primary context document containing:
- Editor input parsing algorithm
- Double-click handling logic
- Existing modal patterns

**Architecture:** See tech-spec for component structure

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation followed DeferModal pattern for NotesModal
- Added double-click handler with button and completion state guards
- parseNoteInput() handles bullets (- or •), checklists ([ ] and [x]), links, and plain text
- Auto-continuation for lists implemented in NotesEditor (Enter key continues list format)

### Completion Notes

✅ All acceptance criteria implemented:
- AC #1: Double-click opens NotesModal - implemented via onDoubleClick handler on TaskCard div
- AC #2: Single-click still completes task - click on button preserved, modal only opens on card body
- AC #3: Button clicks don't trigger modal - check for closest('button') prevents this
- AC #4: Bullets supported - parseNoteInput() detects `- ` and `• ` prefixes
- AC #5: Checklists supported - parseNoteInput() detects `[ ]` and `[x]` prefixes
- AC #6: Save persists notes - wired to updateNotes from useTasks hook
- AC #7: Existing notes display on open - useEffect loads notes on modal open

Build passed successfully (tsc && vite build).

✅ Test Gate PASSED by Vishal (2026-01-07)

### Files Modified

**Created:**
- `src/components/NotesModal.tsx` - Notes editor modal with parseNoteInput() and extractWebsiteName()
- `src/components/NotesEditor.tsx` - Textarea with auto-continuation for lists

**Modified:**
- `src/components/TaskCard.tsx` - Added onDoubleClick, isNotesModalOpen, NotesModal
- `src/components/TaskList.tsx` - Added onNotesUpdate prop
- `src/components/CategorySection.tsx` - Added onNotesUpdate prop
- `src/views/TodayView.tsx` - Added onNotesUpdate prop
- `src/views/TomorrowView.tsx` - Added onNotesUpdate prop
- `src/views/DeferredView.tsx` - Added onNotesUpdate prop
- `src/App.tsx` - Added updateNotes from useTasks, passed to views

### Test Results

- TypeScript compilation: ✅ PASSED (npx tsc --noEmit)
- Production build: ✅ PASSED (npm run build)

---

## Review Notes

<!-- Will be populated during code review -->
