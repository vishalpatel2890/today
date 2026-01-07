# Today - Technical Specification: Task Notes

**Author:** Vishal
**Date:** 2025-01-07
**Project Level:** Quick-Flow
**Change Type:** Feature Addition
**Development Context:** Brownfield

---

## Context

### Available Documents

- No product brief or research documents found
- Working directly from codebase analysis
- Supabase database schema analyzed via MCP

### Project Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Language |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 4.1.18 | Styling |
| @radix-ui/react-dialog | 1.1.15 | Modal components |
| @radix-ui/react-popover | 1.1.15 | Popover components |
| @supabase/supabase-js | 2.89.0 | Backend/Database |
| date-fns | 4.1.0 | Date utilities |
| lucide-react | 0.562.0 | Icons |
| ESLint | 9.39.1 | Linting |

### Existing Codebase Structure

```
today-app/src/
├── components/
│   ├── TaskCard.tsx          # Task display with complete/delete/update
│   ├── DeferModal.tsx        # UpdateModal using Radix Dialog
│   ├── DatePicker.tsx        # Calendar picker
│   ├── CategoryDropdown.tsx  # Category selection
│   ├── Toast.tsx             # Toast notifications
│   └── ...
├── hooks/
│   ├── useTasks.ts           # Task state + Supabase sync
│   ├── useAuth.ts            # Authentication
│   └── useAutoSurface.ts     # Date-based task filtering
├── views/
│   ├── TodayView.tsx
│   ├── TomorrowView.tsx
│   └── DeferredView.tsx
├── types/
│   ├── index.ts              # Task, AppState interfaces
│   └── database.ts           # Supabase row types
├── contexts/
│   └── ToastContext.tsx      # Toast state management
├── lib/
│   └── supabase.ts           # Supabase client
└── utils/
    └── storage.ts            # localStorage helpers
```

**Database Schema (Current):**
- `tasks`: id, user_id, text, created_at, deferred_to, category, completed_at, updated_at
- `categories`: id, user_id, name, created_at
- **No `notes` field exists - migration required**

---

## The Change

### Problem Statement

Users need a way to add detailed notes to tasks. Currently, tasks only have a single `text` field which limits the ability to capture:
- Additional context or research
- Step-by-step instructions
- Related links
- Sub-tasks or checklists within a task

### Proposed Solution

Add a notes feature accessible via double-click on any task card:

1. **Double-click trigger** - Opens a notes modal for the selected task
2. **Rich notes editor** - Supports:
   - Plain text
   - Bullet lists
   - Checklists (with independent checked state)
   - Links (auto-formatted as chips showing website name)
3. **JSON storage** - Notes stored as structured JSON in Supabase
4. **No visual indicator** - Notes discovered on double-click interaction

### Scope

**In Scope:**
- Database migration to add `notes` JSONB column to tasks table
- NotesModal component with Radix Dialog
- Double-click event handler on TaskCard
- Notes editor with bullet/checklist/link support
- Link chip component showing website name
- Supabase sync for notes
- TypeScript types for notes structure

**Out of Scope:**
- Rich text formatting (bold, italic, headers)
- Image attachments
- File uploads
- Note templates
- Search within notes
- Visual indicator on task card for notes presence

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add `Note`, `NoteItem` types to Task interface |
| `src/types/database.ts` | MODIFY | Add `notes` field to TaskRow |
| `src/components/NotesModal.tsx` | CREATE | Notes editor modal component |
| `src/components/NotesEditor.tsx` | CREATE | Editor with bullet/checklist/link support |
| `src/components/LinkChip.tsx` | CREATE | Chip component for displaying links |
| `src/components/TaskCard.tsx` | MODIFY | Add onDoubleClick handler |
| `src/hooks/useTasks.ts` | MODIFY | Add updateNotes function, update reducer |
| `src/views/TodayView.tsx` | MODIFY | Pass notes handlers to TaskCard |
| `src/views/TomorrowView.tsx` | MODIFY | Pass notes handlers to TaskCard |
| `src/views/DeferredView.tsx` | MODIFY | Pass notes handlers to TaskCard |
| Supabase Migration | CREATE | Add `notes` JSONB column to tasks table |

### Technical Approach

**Notes Data Structure (JSON):**
```typescript
interface NoteItem {
  id: string                                    // Unique ID for each item
  type: 'text' | 'bullet' | 'checklist' | 'link'
  value: string                                 // Text content or URL
  checked?: boolean                             // For checklist items only
  label?: string                                // For links - extracted website name
}

interface TaskNotes {
  items: NoteItem[]
  updatedAt: string                             // ISO timestamp
}
```

**Link Chip Extraction:**
- Parse URL with `new URL(urlString)`
- Extract hostname: `github.com` → display as "GitHub"
- Capitalize first letter, remove common prefixes (www.)
- Fallback to full domain if parsing fails

**Editor Approach:**
- Contenteditable div with custom parsing
- Detect patterns on input:
  - `- ` at line start → bullet
  - `[ ] ` or `[x] ` at line start → checklist
  - URL pattern → auto-convert to link chip
- Real-time rendering of formatted content

### Existing Patterns to Follow

Follow patterns established in the codebase:

**Modal Pattern (from DeferModal.tsx):**
```typescript
import * as Dialog from '@radix-ui/react-dialog'

// Bottom sheet on mobile, centered on desktop
// Use existing animation classes: animate-fade-in, animate-slide-up
// Close button with X icon from lucide-react
// Action buttons: Cancel (secondary) + Save (primary)
```

**Component Structure:**
- Functional components with TypeScript
- Props interface defined above component
- JSDoc comments for component purpose
- Destructured props in function signature

**State Management:**
- Local state with useState for UI state
- useReducer in useTasks for task mutations
- Optimistic updates with Supabase sync

**Styling:**
- Tailwind CSS utility classes
- Use existing color tokens: `bg-surface`, `text-foreground`, `border-border`
- Responsive: mobile-first with `md:` breakpoints

### Integration Points

**TaskCard.tsx:**
- Add `onDoubleClick` event to task card div
- Prevent double-click when completing task (existing `showCheck` state)
- Pass task to NotesModal

**useTasks.ts:**
- Add `UPDATE_NOTES` action to reducer
- Add `updateNotes(id: string, notes: TaskNotes)` function
- Sync to Supabase `tasks.notes` column

**Supabase:**
- Real-time subscription already handles task updates
- Notes changes will sync automatically via existing `SYNC_TASK` action

---

## Development Context

### Relevant Existing Code

| Reference | Location | Purpose |
|-----------|----------|---------|
| UpdateModal | `src/components/DeferModal.tsx:20-256` | Modal pattern with Radix Dialog |
| Task interface | `src/types/index.ts:5-12` | Current task structure |
| TaskRow type | `src/types/database.ts:17-36` | Supabase row mapping |
| taskReducer | `src/hooks/useTasks.ts:23-69` | State management pattern |
| handleComplete | `src/components/TaskCard.tsx:28-44` | Double-click prevention pattern |

### Dependencies

**Framework/Libraries (already installed):**
- @radix-ui/react-dialog 1.1.15 - Modal infrastructure
- lucide-react 0.562.0 - Icons (X, Link, List, CheckSquare)
- React 19.2.0 - Hooks, events

**Internal Modules:**
- `@/types` - Task, NoteItem types
- `@/contexts/ToastContext` - Success/error feedback
- `@/lib/supabase` - Database client

### Configuration Changes

**No configuration changes required.**
- Supabase client already configured
- Tailwind already set up with design tokens
- ESLint/TypeScript config sufficient

### Existing Conventions

**Code Style:**
- No semicolons
- Single quotes for strings
- 2-space indentation
- Functional components only
- Props interface above component

**Naming:**
- Components: PascalCase (`NotesModal.tsx`)
- Hooks: camelCase with `use` prefix (`useNotes.ts`)
- Types: PascalCase (`NoteItem`)
- Files: PascalCase for components, camelCase for utilities

**Imports:**
- React imports first
- External libraries second
- Internal imports last (relative paths)
- Type imports with `type` keyword

### Test Framework & Standards

**Current State:**
- No test framework configured in package.json
- No test files in codebase

**Recommendation:**
- Manual testing for this feature
- Future: Add Vitest for unit tests

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Vite Dev Server | 7.2.4 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.1.18 |
| Components | Radix UI | 1.1.15 |
| Backend | Supabase | 2.89.0 |
| Icons | lucide-react | 0.562.0 |

---

## Technical Details

### Notes JSON Schema

```typescript
// src/types/index.ts additions

export type NoteItemType = 'text' | 'bullet' | 'checklist' | 'link'

export interface NoteItem {
  id: string
  type: NoteItemType
  value: string
  checked?: boolean  // Only for checklist type
  label?: string     // Only for link type (website name)
}

export interface TaskNotes {
  items: NoteItem[]
  updatedAt: string
}

// Updated Task interface
export interface Task {
  id: string
  text: string
  createdAt: string
  deferredTo: string | null
  category: string | null
  completedAt: string | null
  notes: TaskNotes | null  // NEW
}
```

### Link Parsing Algorithm

```typescript
function extractWebsiteName(url: string): string {
  try {
    const parsed = new URL(url)
    let hostname = parsed.hostname

    // Remove www. prefix
    hostname = hostname.replace(/^www\./, '')

    // Get first part of domain
    const parts = hostname.split('.')
    const name = parts[0]

    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return url // Fallback to full URL if parsing fails
  }
}

// Examples:
// https://github.com/user/repo → "GitHub"
// https://www.figma.com/file/123 → "Figma"
// https://docs.google.com/doc → "Docs"
```

### Editor Input Parsing

```typescript
function parseNoteInput(text: string): NoteItem[] {
  const lines = text.split('\n')
  return lines.map(line => {
    const id = crypto.randomUUID()

    // Checklist: [ ] or [x]
    if (line.match(/^\[[ x]\] /)) {
      const checked = line.startsWith('[x]')
      return {
        id,
        type: 'checklist',
        value: line.replace(/^\[[ x]\] /, ''),
        checked
      }
    }

    // Bullet: - or •
    if (line.match(/^[-•] /)) {
      return {
        id,
        type: 'bullet',
        value: line.replace(/^[-•] /, '')
      }
    }

    // URL detection
    const urlMatch = line.match(/https?:\/\/[^\s]+/)
    if (urlMatch && line.trim() === urlMatch[0]) {
      return {
        id,
        type: 'link',
        value: urlMatch[0],
        label: extractWebsiteName(urlMatch[0])
      }
    }

    // Plain text
    return { id, type: 'text', value: line }
  }).filter(item => item.value.trim() !== '')
}
```

### Double-Click vs Single-Click Handling

```typescript
// In TaskCard.tsx
const handleDoubleClick = (e: React.MouseEvent) => {
  // Prevent if completing task
  if (showCheck || isCompleting) return

  // Prevent if clicking action buttons
  if ((e.target as HTMLElement).closest('button')) return

  onNotesOpen(task)
}
```

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies (already done)
npm install

# Start development server
npm run dev

# App runs at http://localhost:5173
```

**Environment:**
- `.env.local` with Supabase credentials (already configured)

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/task-notes`
2. Verify dev server running: `npm run dev`
3. Review existing modal pattern in `src/components/DeferModal.tsx`
4. Have Supabase dashboard open for migration

### Implementation Steps

**Story 1: Core Notes Infrastructure**
1. Apply Supabase migration (add `notes` JSONB column)
2. Update TypeScript types (`NoteItem`, `TaskNotes`, `Task`)
3. Update `useTasks.ts` reducer with `UPDATE_NOTES` action
4. Add `updateNotes` function with Supabase sync
5. Verify real-time sync works for notes

**Story 2: Notes Modal & Editor UI**
1. Create `NotesModal.tsx` following DeferModal pattern
2. Create `NotesEditor.tsx` with textarea/contenteditable
3. Implement input parsing (bullets, checklists, links)
4. Add double-click handler to `TaskCard.tsx`
5. Wire up modal open/close state
6. Pass handlers through views

**Story 3: Link Chips & Polish**
1. Create `LinkChip.tsx` component
2. Implement URL parsing and website name extraction
3. Style chips with existing design tokens
4. Add checklist toggle functionality
5. Test all note types render correctly
6. Verify save/load cycle works

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Double-click opens notes modal
- [ ] Single-click still completes task
- [ ] Button clicks don't trigger notes modal
- [ ] Plain text saves and loads
- [ ] Bullets render with bullet points
- [ ] Checklists render with checkboxes
- [ ] Checklist toggle persists
- [ ] Links render as chips with website name
- [ ] Link chips are clickable (open in new tab)
- [ ] Notes sync across devices (Supabase real-time)
- [ ] Empty notes don't save null JSON
- [ ] Modal works on mobile (bottom sheet)
- [ ] Modal works on desktop (centered)

### Acceptance Criteria

**AC-1: Double-click triggers notes modal**
- Given a task card
- When user double-clicks on the card (not on buttons)
- Then the notes modal opens for that task

**AC-2: Notes persist across sessions**
- Given a task with notes
- When user refreshes the page
- Then the notes are loaded from Supabase

**AC-3: Bullet formatting works**
- Given the notes editor
- When user types `- item` or `• item`
- Then it renders as a bullet point

**AC-4: Checklist formatting works**
- Given the notes editor
- When user types `[ ] todo` or `[x] done`
- Then it renders as a checkbox (unchecked/checked)

**AC-5: Checklist state persists**
- Given a checklist item in notes
- When user toggles the checkbox
- Then the checked state saves to database

**AC-6: Links become chips**
- Given a URL pasted in notes
- When the note is saved/rendered
- Then the URL displays as a chip with website name

**AC-7: Link chips are clickable**
- Given a link chip in notes
- When user clicks the chip
- Then the URL opens in a new tab

---

## Developer Resources

### File Paths Reference

**New Files:**
- `/today-app/src/components/NotesModal.tsx`
- `/today-app/src/components/NotesEditor.tsx`
- `/today-app/src/components/LinkChip.tsx`

**Modified Files:**
- `/today-app/src/types/index.ts`
- `/today-app/src/types/database.ts`
- `/today-app/src/components/TaskCard.tsx`
- `/today-app/src/hooks/useTasks.ts`
- `/today-app/src/views/TodayView.tsx`
- `/today-app/src/views/TomorrowView.tsx`
- `/today-app/src/views/DeferredView.tsx`

### Key Code Locations

| Code | Location |
|------|----------|
| Task interface | `src/types/index.ts:5` |
| TaskRow type | `src/types/database.ts:17` |
| taskReducer | `src/hooks/useTasks.ts:23` |
| UpdateModal pattern | `src/components/DeferModal.tsx:20` |
| TaskCard component | `src/components/TaskCard.tsx:22` |
| Toast usage | `src/components/TaskCard.tsx:26` |

### Testing Locations

- Manual testing only (no test framework configured)
- Test in browser at `http://localhost:5173`

### Documentation to Update

- None required for this feature

---

## UX/UI Considerations

### UI Components Affected

**New Components:**
- `NotesModal` - Full-screen mobile / centered desktop modal
- `NotesEditor` - Textarea with live formatting preview
- `LinkChip` - Pill-shaped clickable link display

**Modified Components:**
- `TaskCard` - Add double-click handler (no visual change)

### Interaction Patterns

**Double-click to open:**
- Natural desktop pattern
- Mobile: works with double-tap
- Debounce to prevent accidental triggers

**Editor Behavior:**
- Auto-detect formatting on newline
- Immediate visual feedback for bullets/checklists
- Link chips render after URL is complete (on space/enter)

### Accessibility

- Modal has proper focus trap (Radix handles this)
- Close on Escape key (Radix handles this)
- Checkboxes keyboard accessible
- Link chips have proper `aria-label`
- Color contrast meets WCAG AA

### Visual Design

**Notes Modal:**
- Follow existing modal styling from UpdateModal
- Title: "Notes"
- Close button (X) top right
- Editor area with subtle border
- Save/Cancel buttons bottom

**Link Chips:**
- Background: `bg-surface-muted`
- Text: `text-primary`
- Border radius: `rounded-full`
- Padding: `px-3 py-1`
- Icon: External link icon (lucide)
- Hover: Slight background darken

**Bullets/Checklists:**
- Use existing list styling
- Checkboxes: Custom styled to match design system
- Bullet: `•` character or CSS

---

## Testing Approach

**Strategy:** Manual testing (no test framework)

**Test Scenarios:**

1. **Happy Path**
   - Create task → double-click → add notes → save → refresh → notes persist

2. **Formatting**
   - Type `- item` → bullet renders
   - Type `[ ] todo` → unchecked checkbox
   - Type `[x] done` → checked checkbox
   - Paste URL → link chip appears

3. **Edge Cases**
   - Empty notes → no save
   - Only whitespace → no save
   - Invalid URL → render as plain text
   - Very long notes → scrollable modal

4. **Cross-device**
   - Add notes on device A → appears on device B (real-time)

---

## Deployment Strategy

### Deployment Steps

1. Apply database migration first (Supabase dashboard or MCP)
2. Merge feature branch to main
3. Cloudflare Pages auto-deploys on push
4. Verify in production

### Rollback Plan

1. Migration rollback: `ALTER TABLE tasks DROP COLUMN notes;`
2. Code rollback: Revert merge commit
3. Redeploy previous version

### Monitoring

- Check Supabase logs for sync errors
- Browser console for JavaScript errors
- User feedback for UX issues
