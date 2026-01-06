# Epic Technical Specification: Deferment System

Date: 2026-01-06
Author: Vishal
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 implements the unique "defer-and-categorize" workflow that differentiates Today from other to-do apps. This epic delivers the core value proposition of intentional deferment - when users decide something doesn't belong in their today, they consciously push it forward and assign it to a category. This creates a natural review moment and organizes deferred tasks without upfront overhead.

The deferment system enables users to move tasks out of the Today view to Tomorrow, a specific future date, or indefinitely (someday). Each deferred task must be assigned a category, which organizes the Deferred view into collapsible sections. This epic also introduces the Tomorrow view and the full Deferred view with category organization.

## Objectives and Scope

**In-Scope:**
- Defer button appearing on task cards (hover/mobile always visible)
- Defer modal with date selection (Tomorrow, Pick date, No date)
- Defer modal with category selection and creation
- Defer action that updates task state and triggers visual feedback
- Tomorrow view showing tasks deferred to tomorrow
- Deferred view showing all tasks without a date or with future dates beyond tomorrow
- Category headers with collapsible sections and task counts
- Toast notifications for defer actions
- Category persistence (new categories available for future use)

**Out-of-Scope:**
- localStorage persistence (covered in Epic 4)
- Auto-surfacing of tasks by date (covered in Epic 4)
- Drag-and-drop reordering (Growth feature)
- Edit task text (Growth feature)
- PWA support (Growth feature)

## System Architecture Alignment

This epic builds on the foundation established in Epics 1-2:
- **Components:** Uses existing TaskCard.tsx and extends it with defer actions; creates new DeferModal.tsx, CategoryDropdown.tsx, DatePicker.tsx, CategorySection.tsx, Toast.tsx, TomorrowView.tsx, DeferredView.tsx
- **Hooks:** Extends useTasks.ts with DEFER_TASK action; categories managed in AppState
- **UI Primitives:** Leverages Radix Dialog, Select, and Popover per architecture spec
- **Styling:** Follows Slate Sophisticated design tokens from UX spec
- **State Management:** Uses existing reducer pattern with immutable updates

**Architectural Constraints:**
- All state changes flow through useTasks reducer
- Categories stored in AppState.categories array
- Task.deferredTo holds ISO date string or null (someday)
- Task.category holds string category name (required when deferred)
- No backend/API calls - all operations are synchronous

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `DeferModal.tsx` | Defer workflow UI - date selection, category selection | Task to defer, onDefer callback | Selected date, category, defer confirmation |
| `CategoryDropdown.tsx` | Category selection with create option | Existing categories, onSelect, onCreate | Selected category name |
| `DatePicker.tsx` | Date selection with calendar | onSelect callback | Selected date (ISO string or null) |
| `TomorrowView.tsx` | Display tasks deferred to tomorrow | Tasks array from useTasks | Filtered task list |
| `DeferredView.tsx` | Display deferred tasks by category | Tasks array, categories | Grouped tasks with collapsible sections |
| `CategorySection.tsx` | Collapsible category with task count | Category name, tasks, expanded state | Expandable task list |
| `Toast.tsx` | Feedback notifications | Message, auto-dismiss config | Visual toast notification |
| `useTasks.ts` (extension) | DEFER_TASK action handling | Task ID, deferredTo, category | Updated state |

### Data Models and Contracts

**Task interface (existing, relevant fields):**
```typescript
interface Task {
  id: string;                    // UUID
  text: string;                  // Task content
  createdAt: string;             // ISO date string
  deferredTo: string | null;     // ISO date or null for "someday"
  category: string | null;       // Only set when deferred
  completedAt: string | null;    // ISO date when completed
}
```

**AppState interface (existing, relevant fields):**
```typescript
interface AppState {
  tasks: Task[];
  categories: string[];          // List of category names
}
```

**DeferTaskPayload (new):**
```typescript
interface DeferTaskPayload {
  id: string;                    // Task ID to defer
  deferredTo: string | null;     // ISO date or null for "someday"
  category: string;              // Required category name
}
```

**TaskAction extension (DEFER_TASK):**
```typescript
| { type: 'DEFER_TASK'; id: string; deferredTo: string | null; category: string }
```

### APIs and Interfaces

**DeferModal Props:**
```typescript
interface DeferModalProps {
  task: Task;
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
  onDefer: (deferredTo: string | null, category: string) => void;
  onCreateCategory: (name: string) => void;
}
```

**CategoryDropdown Props:**
```typescript
interface CategoryDropdownProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string) => void;
  onCreate: (name: string) => void;
}
```

**DatePicker Props:**
```typescript
interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  minDate?: Date;  // Tomorrow (cannot select today or past)
}
```

**CategorySection Props:**
```typescript
interface CategorySectionProps {
  category: string;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
}
```

**Toast Props:**
```typescript
interface ToastProps {
  message: string;
  duration?: number;  // Default 3000ms
  onDismiss: () => void;
}
```

### Workflows and Sequencing

**Defer Task Flow:**
1. User hovers task card → Defer button (clock icon) appears
2. User clicks Defer button → DeferModal opens
3. Modal displays: date options (Tomorrow/Pick date/No date) + category dropdown
4. User selects date option:
   - "Tomorrow" → Sets deferredTo to tomorrow's ISO date
   - "Pick date" → Opens DatePicker, user selects future date
   - "No date" → Sets deferredTo to null (someday)
5. User selects/creates category:
   - Existing → Selected from dropdown
   - New → Types name, presses Enter, category added to state
6. User clicks "Defer" button (enabled when date AND category selected)
7. Modal closes
8. Task slides out of current view (300ms animation)
9. Toast appears: "Deferred to [date/category]"
10. Task appears in Tomorrow or Deferred view based on date

**Category Creation Flow:**
1. User opens category dropdown
2. User clicks "Create new..."
3. Inline input appears
4. User types category name
5. User presses Enter
6. Category added to AppState.categories
7. New category auto-selected
8. Category available for future deferrals

**View Filtering Logic:**
- **Today:** `task.deferredTo === null || isToday(parseISO(task.deferredTo))` AND `task.completedAt === null`
- **Tomorrow:** `isTomorrow(parseISO(task.deferredTo))` AND `task.completedAt === null`
- **Deferred:** `task.deferredTo === null || (!isToday(task.deferredTo) && !isTomorrow(task.deferredTo))` AND `task.completedAt === null` AND `task.category !== null`

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Modal open | < 50ms | Radix Dialog with CSS transitions, no lazy loading needed |
| Category dropdown render | < 16ms | Radix Select with virtualization if >50 categories |
| Defer action | < 100ms | Synchronous state update via reducer |
| View switch | < 100ms | Instant filter operation on existing tasks array |
| Animation smoothness | 60fps | CSS transitions only, no JS animation libraries |

### Security

- No authentication required (local-only app per PRD FR21)
- No sensitive data handling - task text is user-generated content
- Category names sanitized: trimmed, empty strings rejected
- No XSS vectors - React auto-escapes all rendered content
- No external API calls - all data stays on device

### Reliability/Availability

- All operations are synchronous and atomic
- Defer action either succeeds completely or fails completely
- Invalid dates rejected (past dates, invalid formats)
- Empty category names rejected with validation
- Modal can be dismissed without side effects (Escape, click outside)
- State preserved even if modal closed mid-workflow

### Observability

- Console logging in dev mode: `[Today] DEFER_TASK { id, deferredTo, category }`
- Toast provides user-visible feedback for all defer actions
- No external telemetry or analytics (per PRD NFR4)

## Dependencies and Integrations

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @radix-ui/react-dialog | ^1.1.15 | DeferModal accessible dialog |
| @radix-ui/react-select | ^2.2.6 | CategoryDropdown accessible select |
| @radix-ui/react-popover | ^1.1.15 | DatePicker calendar popover |
| date-fns | ^4.1.0 | Date formatting, comparison (isToday, isTomorrow, addDays, format) |
| lucide-react | ^0.562.0 | Icons (Clock, ChevronDown, ChevronRight, Calendar) |
| react | ^19.2.0 | UI framework |
| react-dom | ^19.2.0 | React DOM renderer |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4.1.18 | Utility-first styling |
| typescript | ~5.9.3 | Type safety |
| vite | ^7.2.4 | Dev server and build |

### Internal Dependencies

- **Epic 1 artifacts:** Design tokens, Tailwind config, project structure
- **Epic 2 artifacts:** TaskCard.tsx, TaskList.tsx, useTasks.ts, TodayView.tsx
- **Architecture patterns:** Reducer pattern, immutable state updates

## Acceptance Criteria (Authoritative)

**Story 3.1: Defer Button on Task Cards**
1. AC-3.1.1: Hovering over a task card reveals a clock icon (defer button) in the actions area
2. AC-3.1.2: Clicking the defer button opens a modal dialog
3. AC-3.1.3: On mobile viewports (< 768px), the defer button is always visible without hover
4. AC-3.1.4: Modal opens centered on desktop, as bottom sheet on mobile

**Story 3.2: Defer Modal - Date Selection**
5. AC-3.2.1: Modal displays three date options: "Tomorrow", "Pick date", "No date"
6. AC-3.2.2: Clicking "Tomorrow" selects that option (dark background)
7. AC-3.2.3: Clicking "Pick date" reveals an inline calendar below the buttons
8. AC-3.2.4: Calendar only allows selecting future dates (not today or past)
9. AC-3.2.5: Clicking "No date" selects that option (task will go to Deferred with no date)

**Story 3.3: Defer Modal - Category Selection & Creation**
10. AC-3.3.1: Modal displays a category dropdown with existing categories plus "Create new..."
11. AC-3.3.2: Selecting an existing category selects it for the task
12. AC-3.3.3: Selecting "Create new..." reveals an inline input field
13. AC-3.3.4: Typing a name and pressing Enter creates the category and selects it
14. AC-3.3.5: New categories are immediately available in the dropdown for future use
15. AC-3.3.6: Empty category names are rejected (no action on Enter with empty input)
16. AC-3.3.7: "Defer" button is enabled only when both date AND category are selected

**Story 3.4: Defer Action & Tomorrow View**
17. AC-3.4.1: Clicking "Defer" closes the modal
18. AC-3.4.2: The task slides out of the current view (300ms animation)
19. AC-3.4.3: A toast appears: "Deferred to [Tomorrow/Jan 15/Someday] / [Category]"
20. AC-3.4.4: Toast auto-dismisses after 3 seconds
21. AC-3.4.5: Tomorrow tab shows tasks deferred to tomorrow
22. AC-3.4.6: Tasks in Tomorrow view display the same as Today view (card format)

**Story 3.5: Deferred View with Categories**
23. AC-3.5.1: Deferred tab shows tasks grouped under category headers
24. AC-3.5.2: Category headers show: chevron icon, category name, task count in parentheses
25. AC-3.5.3: Clicking a category header toggles expand/collapse
26. AC-3.5.4: First category is expanded by default
27. AC-3.5.5: Tasks within each category show their deferred date (or "Someday")
28. AC-3.5.6: Categories are sorted alphabetically

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-3.1.1 | Detailed Design - TaskCard | TaskCard.tsx | Hover task, verify clock icon appears |
| AC-3.1.2 | Workflows - Defer Task Flow | TaskCard.tsx, DeferModal.tsx | Click clock icon, verify modal opens |
| AC-3.1.3 | NFR - Responsive | TaskCard.tsx | Set viewport < 768px, verify clock always visible |
| AC-3.1.4 | Detailed Design - DeferModal | DeferModal.tsx | Test on mobile viewport, verify bottom sheet |
| AC-3.2.1 | Data Models - DatePicker | DeferModal.tsx | Open modal, verify three date buttons |
| AC-3.2.2 | Workflows - Defer Task Flow | DeferModal.tsx | Click "Tomorrow", verify selected state |
| AC-3.2.3 | Detailed Design - DatePicker | DatePicker.tsx | Click "Pick date", verify calendar appears |
| AC-3.2.4 | Data Models - DatePicker | DatePicker.tsx | Try to select past date, verify disabled |
| AC-3.2.5 | Workflows - Defer Task Flow | DeferModal.tsx | Click "No date", verify selected state |
| AC-3.3.1 | Data Models - CategoryDropdown | CategoryDropdown.tsx | Open modal, verify dropdown with categories |
| AC-3.3.2 | Workflows - Category Creation | CategoryDropdown.tsx | Select category, verify selection |
| AC-3.3.3 | Workflows - Category Creation | CategoryDropdown.tsx | Select "Create new...", verify input appears |
| AC-3.3.4 | Workflows - Category Creation | CategoryDropdown.tsx | Type name, press Enter, verify created |
| AC-3.3.5 | Data Models - AppState | CategoryDropdown.tsx | Create category, reopen dropdown, verify appears |
| AC-3.3.6 | NFR - Reliability | CategoryDropdown.tsx | Press Enter with empty input, verify no action |
| AC-3.3.7 | Workflows - Defer Task Flow | DeferModal.tsx | Select only date, verify Defer button disabled |
| AC-3.4.1 | Workflows - Defer Task Flow | DeferModal.tsx | Click Defer, verify modal closes |
| AC-3.4.2 | Workflows - Defer Task Flow | TaskCard.tsx | Defer task, verify slide-out animation |
| AC-3.4.3 | Detailed Design - Toast | Toast.tsx | Defer task, verify toast message |
| AC-3.4.4 | Detailed Design - Toast | Toast.tsx | Defer task, wait 3s, verify toast gone |
| AC-3.4.5 | Workflows - View Filtering | TomorrowView.tsx | Defer to tomorrow, switch tab, verify appears |
| AC-3.4.6 | Detailed Design - TomorrowView | TomorrowView.tsx | View tomorrow tasks, verify card format |
| AC-3.5.1 | Workflows - View Filtering | DeferredView.tsx | Defer tasks, open Deferred tab, verify grouping |
| AC-3.5.2 | Detailed Design - CategorySection | CategorySection.tsx | View category header, verify format |
| AC-3.5.3 | Detailed Design - CategorySection | CategorySection.tsx | Click header, verify toggle |
| AC-3.5.4 | Detailed Design - CategorySection | DeferredView.tsx | Open tab, verify first expanded |
| AC-3.5.5 | Data Models - Task | CategorySection.tsx | View tasks, verify date/Someday shown |
| AC-3.5.6 | Detailed Design - DeferredView | DeferredView.tsx | Create categories, verify alphabetical |

## Risks, Assumptions, Open Questions

**Risks:**
- **R1: Calendar date picker complexity** - Custom calendar UI can be complex to build. Mitigation: Use Radix Popover with simple month-view calendar; consider react-day-picker if needed.
- **R2: Bottom sheet on mobile** - CSS-only bottom sheet behavior may have edge cases. Mitigation: Test on real devices; use fixed positioning with transform.
- **R3: Category dropdown with create** - Combining select and create input is non-standard UX. Mitigation: Follow Radix Select patterns; test with users.

**Assumptions:**
- **A1:** Users will have < 50 categories total (no virtualization needed)
- **A2:** Users understand "No date" means the task goes to Deferred/Someday
- **A3:** Category names are simple text (no special characters to sanitize beyond trimming)
- **A4:** Toast stacking is rare (users defer one task at a time)

**Open Questions:**
- None - all design decisions resolved in PRD, UX spec, and architecture docs.

## Test Strategy Summary

**Test Levels:**

| Level | Framework | Scope |
|-------|-----------|-------|
| Component | Vitest + Testing Library | Individual components in isolation |
| Integration | Vitest + Testing Library | Component interactions (e.g., DeferModal with CategoryDropdown) |
| E2E | Manual testing | Full defer workflow, view switching |

**Coverage by AC:**

- **AC-3.1.x (Defer button):** Component test for TaskCard actions visibility; manual test for hover/mobile behavior
- **AC-3.2.x (Date selection):** Component test for DeferModal date buttons; DatePicker calendar interaction
- **AC-3.3.x (Category):** Component test for CategoryDropdown select/create; validation tests
- **AC-3.4.x (Defer action):** Integration test for useTasks DEFER_TASK action; manual test for animation/toast
- **AC-3.5.x (Deferred view):** Component test for CategorySection expand/collapse; integration test for view filtering

**Edge Cases:**
- Defer with no categories available (force create first category)
- Defer to past date (should be prevented by DatePicker)
- Create duplicate category name (should handle gracefully - use existing or reject)
- Modal dismissed mid-workflow (state should not be affected)
- Very long category names (truncate in UI with ellipsis)
- Many categories (test dropdown scrolling)
