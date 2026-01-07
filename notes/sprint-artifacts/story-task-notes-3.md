# Story 1.3: Link Chips & Polish

**Status:** Done

---

## User Story

As a user,
I want links to display as clickable chips showing the website name,
So that I can quickly see and access referenced URLs.

---

## Acceptance Criteria

**AC #1:** URLs render as chips
- Given a note containing a URL (https://...)
- When the note is displayed
- Then the URL appears as a pill-shaped chip

**AC #2:** Chips show website name
- Given a URL like `https://github.com/user/repo`
- When displayed as a chip
- Then it shows "GitHub" (not the full URL)

**AC #3:** Chips are clickable
- Given a link chip
- When I click on it
- Then the URL opens in a new browser tab

**AC #4:** Checklist checkboxes toggle
- Given a checklist item in notes view
- When I click the checkbox
- Then it toggles between checked and unchecked

**AC #5:** Checklist state persists
- Given I toggle a checkbox
- When I close and reopen the modal
- Then the checkbox state is preserved

**AC #6:** All note types render correctly
- Given notes with text, bullets, checklists, and links
- When displayed in the modal
- Then each type renders with appropriate formatting

**AC #7:** Empty notes don't create bad data
- Given an empty editor
- When I click Save
- Then no notes object is created (or null is saved)

---

## Implementation Details

### Tasks / Subtasks

- [x] Create `LinkChip.tsx` component (AC: #1, #2, #3)
- [x] Implement `extractWebsiteName(url)` function (AC: #2)
- [x] Style chip with design tokens: `bg-surface-muted`, `rounded-full` (AC: #1)
- [x] Add external link icon to chip (lucide ExternalLink) (AC: #1)
- [x] Make chip clickable with `target="_blank"` (AC: #3)
- [x] Add checkbox rendering for checklist items (AC: #4)
- [x] Implement checkbox toggle handler (AC: #4)
- [x] Update notes state on checkbox toggle (AC: #5)
- [x] Call updateNotes after checkbox toggle (AC: #5)
- [x] Test all note types in NotesEditor (AC: #6)
- [x] Add empty check before save (AC: #7)
- [x] Style bullets with proper indentation (AC: #6)
- [x] Add hover states to interactive elements (AC: #1, #4)

### Technical Summary

This story completes the notes feature with:

1. **LinkChip Component:**
   - Pill-shaped clickable element
   - Shows website name extracted from URL
   - External link icon (lucide-react)
   - Opens in new tab on click

2. **Link Parsing:**
   ```typescript
   function extractWebsiteName(url: string): string {
     const hostname = new URL(url).hostname.replace(/^www\./, '')
     const name = hostname.split('.')[0]
     return name.charAt(0).toUpperCase() + name.slice(1)
   }
   ```

3. **Checklist Toggle:**
   - Render checkbox input for checklist items
   - Toggle checked state on click
   - Immediately save to persist toggle

4. **Polish:**
   - Consistent styling with design system
   - Hover states for interactivity feedback
   - Empty state handling

### Project Structure Notes

- **Files to modify:**
  - `src/components/LinkChip.tsx` (CREATE)
  - `src/components/NotesEditor.tsx` (MODIFY - add checkbox toggle, link rendering)
  - `src/components/NotesModal.tsx` (MODIFY - empty check on save)
- **Expected test locations:** Manual testing in browser
- **Estimated effort:** 2 story points
- **Prerequisites:** Story 1.2 complete

### Key Code References

| Reference | Location | Purpose |
|-----------|----------|---------|
| Design tokens | `src/index.css:9-59` | Use existing color tokens |
| Icon usage | `src/components/TaskCard.tsx:2` | Import pattern for lucide |
| Button styling | `src/components/DeferModal.tsx:112-114` | Tailwind class patterns |
| updateNotes | `src/hooks/useTasks.ts` | Call on checkbox toggle |

---

## Context References

**Tech-Spec:** [tech-spec-task-notes.md](../tech-spec-task-notes.md) - Primary context document containing:
- Link parsing algorithm with examples
- Chip styling specifications
- UX interaction patterns

**Architecture:** See tech-spec for styling conventions

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation approach: Created view/edit mode pattern for NotesModal
- LinkChip component uses button with window.open for accessibility
- NotesDisplay component renders all note types with interactive checkboxes
- Checkbox toggle immediately persists to Supabase via onSave callback

### Completion Notes

**Implementation Summary:**
1. Created `LinkChip.tsx` - Pill-shaped button component with ExternalLink icon, styled with design tokens
2. Created `NotesDisplay.tsx` - Read-only notes renderer with:
   - Interactive checkbox toggles (Square/CheckSquare icons from lucide)
   - LinkChip integration for URL items
   - Bullet points with proper indentation
   - Text items with standard formatting
3. Updated `NotesModal.tsx` with dual-mode functionality:
   - View mode (default when notes exist): Shows formatted NotesDisplay with interactive checkboxes
   - Edit mode (default when empty): Shows NotesEditor textarea
   - Edit button in header and footer for mode switching
   - Checkbox toggles immediately save to database (AC #5)
   - Empty check before save returns null (AC #7)

**Key Design Decisions:**
- View mode is default for better UX - users can quickly check items without entering edit mode
- Checkbox state persists immediately on toggle (no save button required)
- Link chips use `window.open` with noopener,noreferrer for security

### Files Modified

- `src/components/LinkChip.tsx` (CREATED) - Pill-shaped link chip component
- `src/components/NotesDisplay.tsx` (CREATED) - Read-only notes renderer
- `src/components/NotesModal.tsx` (MODIFIED) - Added view/edit modes, checkbox toggle handling

### Test Results

- TypeScript compilation: PASSED (npx tsc --noEmit)
- Production build: PASSED (npm run build)
- Manual browser testing: PASSED (Test Gate 2026-01-07)
- ✅ Test Gate PASSED by Vishal (2026-01-07)

---

## Review Notes

<!-- Will be populated during code review -->
