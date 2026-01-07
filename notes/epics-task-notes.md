# Today - Epic Breakdown: Task Notes

**Date:** 2025-01-07
**Project Level:** Quick-Flow

---

## Epic 1: Task Notes

**Slug:** task-notes

### Goal

Enable users to add rich notes to any task, supporting bullets, checklists, and clickable link chips - providing a way to capture detailed context without cluttering the task title.

### Scope

**In Scope:**
- Database migration (notes JSONB column)
- Double-click to open notes modal
- Notes editor with bullet/checklist/link parsing
- Link chips showing website names
- Checklist toggle persistence
- Supabase sync

**Out of Scope:**
- Rich text (bold, italic, headers)
- Image/file attachments
- Visual indicator on task card
- Note templates
- Search within notes

### Success Criteria

1. Double-click on task opens notes modal
2. Notes with bullets, checklists, links save and load correctly
3. Checklist items toggle independently and persist
4. Links display as chips with website name
5. Notes sync across devices via Supabase real-time

### Dependencies

- Supabase database access (existing)
- Radix UI Dialog (already installed)
- lucide-react icons (already installed)

---

## Story Map - Epic 1

```
Epic: Task Notes (8 points)
│
├── Story 1.1: Core Notes Infrastructure (3 points)
│   └── Database + Types + State Management
│   └── Dependencies: None
│
├── Story 1.2: Notes Modal & Editor UI (3 points)
│   └── Modal + Editor + Double-click handler
│   └── Dependencies: Story 1.1
│
└── Story 1.3: Link Chips & Polish (2 points)
    └── Link extraction + Chip component + Checklist toggle
    └── Dependencies: Story 1.2
```

---

## Stories - Epic 1

### Story 1.1: Core Notes Infrastructure

As a developer,
I want the database and state management ready for notes,
So that the UI can save and load notes reliably.

**Acceptance Criteria:**

- AC #1: `notes` JSONB column exists in tasks table
- AC #2: TypeScript types `NoteItem` and `TaskNotes` are defined
- AC #3: `UPDATE_NOTES` reducer action updates local state
- AC #4: `updateNotes()` function syncs to Supabase
- AC #5: Real-time sync loads notes from remote changes

**Prerequisites:** None

**Technical Notes:** Migration via Supabase MCP, update types/index.ts, types/database.ts, hooks/useTasks.ts

**Estimated Effort:** 3 points

---

### Story 1.2: Notes Modal & Editor UI

As a user,
I want to double-click a task to open a notes editor,
So that I can add detailed notes with bullets and checklists.

**Acceptance Criteria:**

- AC #1: Double-click on task card opens NotesModal
- AC #2: Single-click still completes task (no interference)
- AC #3: Button clicks don't trigger notes modal
- AC #4: Editor supports `- ` for bullets
- AC #5: Editor supports `[ ]` and `[x]` for checklists
- AC #6: Save button persists notes to database
- AC #7: Modal displays existing notes on open

**Prerequisites:** Story 1.1 complete

**Technical Notes:** Create NotesModal.tsx, NotesEditor.tsx, add onDoubleClick to TaskCard.tsx, wire through views

**Estimated Effort:** 3 points

---

### Story 1.3: Link Chips & Polish

As a user,
I want links to display as clickable chips showing the website name,
So that I can quickly see and access referenced URLs.

**Acceptance Criteria:**

- AC #1: URLs pasted in notes render as chips
- AC #2: Chips display website name (e.g., "GitHub" not full URL)
- AC #3: Clicking chip opens URL in new tab
- AC #4: Checklist checkboxes are toggleable
- AC #5: Checklist toggle state persists after save
- AC #6: All note types (text, bullet, checklist, link) render correctly
- AC #7: Empty notes don't create null JSON

**Prerequisites:** Story 1.2 complete

**Technical Notes:** Create LinkChip.tsx, implement extractWebsiteName(), add checkbox toggle with state update

**Estimated Effort:** 2 points

---

## Implementation Timeline - Epic 1

**Total Story Points:** 8

**Recommended Sequence:**
1. Story 1.1 (infrastructure) - Foundation
2. Story 1.2 (modal/editor) - Core UI
3. Story 1.3 (chips/polish) - Enhancement
