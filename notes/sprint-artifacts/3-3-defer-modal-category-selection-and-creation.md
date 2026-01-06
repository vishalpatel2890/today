# Story 3.3: Defer Modal - Category Selection & Creation

Status: done

## Story

As a **user**,
I want **to assign a category when deferring a task**,
so that **my deferred tasks are organized and easy to find later**.

## Acceptance Criteria

1. **AC-3.3.1**: Given the defer modal is open, the "Category" section displays a dropdown with existing categories plus "Create new..." option at the bottom

2. **AC-3.3.2**: Given I click the dropdown and select an existing category, that category is selected for the task

3. **AC-3.3.3**: Given I select "Create new...", an inline input field appears below the dropdown for entering a new category name

4. **AC-3.3.4**: Given I type a category name and press Enter, the category is created and automatically selected for the task

5. **AC-3.3.5**: Given I create a new category, it is immediately available in the dropdown for future deferrals

6. **AC-3.3.6**: Given I press Enter with an empty input field, nothing happens (no empty category created)

7. **AC-3.3.7**: Given both a date option AND a category are selected, the "Defer" button becomes enabled; otherwise it remains disabled

## Frontend Test Gate

**Gate ID**: 3-3-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 3.2 complete (DeferModal with date selection working)
- [ ] Starting state: Today tab selected, at least 1 task visible
- [ ] Test user: Any (no auth required)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add a task if none exist | Add task input | Task visible in Today view |
| 3 | Click clock icon on task | Task card actions | DeferModal opens |
| 4 | Select a date option (e.g., "Tomorrow") | Date selection buttons | Date option selected (dark background) |
| 5 | Verify "Category" section | Modal content | Dropdown visible with placeholder text |
| 6 | Click category dropdown | Dropdown trigger | Dropdown opens showing "Create new..." option |
| 7 | Click "Create new..." | Dropdown option | Input field appears for new category name |
| 8 | Type "Work" and press Enter | Category input | Category "Work" created and selected |
| 9 | Verify Defer button | Modal footer | "Defer" button is now enabled (not disabled) |
| 10 | Close modal and reopen | Modal close button | Modal reopens with reset state |
| 11 | Select date option again | Date selection | Date selected |
| 12 | Open category dropdown | Dropdown trigger | "Work" category now appears in list |
| 13 | Select "Work" category | Dropdown option | Category selected |
| 14 | Verify Defer button enabled | Modal footer | "Defer" button is enabled |
| 15 | Try creating empty category | "Create new..." then Enter | Nothing happens (no empty category) |

### Success Criteria (What User Sees)
- [ ] Modal displays "Category" label and a dropdown
- [ ] Dropdown shows existing categories (if any) plus "Create new..." option
- [ ] Selecting existing category shows it in the dropdown trigger
- [ ] "Create new..." reveals inline text input
- [ ] Typing category name and pressing Enter creates and selects it
- [ ] New categories persist in dropdown for future modal opens
- [ ] Empty category names are rejected (no action on Enter)
- [ ] "Defer" button enabled only when BOTH date AND category selected
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the category dropdown easy to find and use?
2. Is creating a new category intuitive?
3. Is it clear when the Defer button is enabled vs disabled?
4. Does the category selection feel natural in the defer workflow?

## Tasks / Subtasks

- [x] **Task 1: Create CategoryDropdown component** (AC: 1, 2)
  - [x] Create `today-app/src/components/CategoryDropdown.tsx`
  - [x] Define CategoryDropdownProps interface:
    ```typescript
    interface CategoryDropdownProps {
      categories: string[];
      selectedCategory: string | null;
      onSelect: (category: string) => void;
      onCreate: (name: string) => void;
    }
    ```
  - [x] Use Radix Select for accessible dropdown
  - [x] Render existing categories as options
  - [x] Add "Create new..." as last option with distinct styling

- [x] **Task 2: Implement category creation flow** (AC: 3, 4, 6)
  - [x] Add state for "create mode" in CategoryDropdown or DeferModal
  - [x] When "Create new..." selected, show inline text input
  - [x] Handle Enter key to create category:
    - Validate: name is not empty after trimming
    - Call onCreate callback with trimmed name
    - Auto-select the new category
  - [x] Handle Escape key to cancel creation mode
  - [x] Clear input after successful creation

- [x] **Task 3: Integrate CategoryDropdown into DeferModal** (AC: 1, 7)
  - [x] Open `today-app/src/components/DeferModal.tsx`
  - [x] Add "Category" section below date selection
  - [x] Add state for selectedCategory:
    ```typescript
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    ```
  - [x] Render CategoryDropdown with categories prop
  - [x] Wire up onSelect and onCreate callbacks

- [x] **Task 4: Add categories to AppState** (AC: 5)
  - [x] Verify AppState.categories exists in types/index.ts
  - [x] Ensure useTasks hook exposes categories array
  - [x] Pass categories from App through to DeferModal
  - [x] When category created, add to AppState.categories

- [x] **Task 5: Implement Defer button enable/disable logic** (AC: 7)
  - [x] Defer button disabled if:
    - dateOption is null (no date selected) OR
    - selectedCategory is null (no category selected)
  - [x] Defer button enabled when both are selected
  - [x] Add visual styling for disabled state:
    - opacity-50 cursor-not-allowed when disabled
    - Full opacity, pointer cursor when enabled
  - [x] Button text: "Defer"

- [x] **Task 6: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Run `npm run dev` and test:
    - [x] Open defer modal
    - [x] Verify "Category" section with dropdown
    - [x] Create new category - verify input appears
    - [x] Type name and press Enter - verify created and selected
    - [x] Close modal, reopen - verify category persists
    - [x] Select existing category - verify selection
    - [x] Verify Defer button disabled without category
    - [x] Verify Defer button enabled with date + category
    - [x] Try empty category creation - verify rejected
  - [x] Verify no console errors

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-3.md, this story:
- **Creates:** CategoryDropdown.tsx component
- **Modifies:** DeferModal.tsx (adds category selection section)
- **May modify:** types/index.ts, useTasks.ts (if categories not yet in AppState)

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const CategoryDropdown = () => { ... }`
- Destructure props in function signature

### Category Data Model

Per architecture.md "Data Architecture":
```typescript
interface AppState {
  tasks: Task[];
  categories: string[];  // List of category names
}
```

Per tech-spec-epic-3.md:
- Categories stored in AppState.categories array
- New categories immediately added to array
- Validate: category name not empty, not duplicate

### Radix Select Usage

Per tech-spec-epic-3.md dependencies:
- @radix-ui/react-select ^2.2.6 for accessible dropdown
- Already installed (verify in package.json)

Basic Radix Select pattern:
```tsx
import * as Select from '@radix-ui/react-select';

<Select.Root value={value} onValueChange={setValue}>
  <Select.Trigger>
    <Select.Value placeholder="Select category" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Viewport>
        {categories.map(cat => (
          <Select.Item key={cat} value={cat}>
            <Select.ItemText>{cat}</Select.ItemText>
          </Select.Item>
        ))}
        <Select.Item value="__create_new__">
          <Select.ItemText>Create new...</Select.ItemText>
        </Select.Item>
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

### Learnings from Previous Story

**From Story 3-2-defer-modal-date-selection (Status: review)**

- **DatePicker Created**: Month-view calendar at `src/components/DatePicker.tsx` - use as reference for component patterns
- **DeferModal State Pattern**: Uses `dateOption` and `selectedDate` state - extend with `selectedCategory`
- **Modal Structure**:
  ```tsx
  <Dialog.Content>
    <Dialog.Title>Defer Task</Dialog.Title>
    {/* Date selection section */}
    {/* Add Category section HERE */}
    {/* Defer button (currently disabled) */}
  </Dialog.Content>
  ```
- **Selection Summary**: Modal shows summary of selected date - follow same pattern for category
- **Build Info**: 261.96KB JS (82.51KB gzipped), 18.41KB CSS

**Key files to reference:**
- `src/components/DeferModal.tsx` - extend with category section
- `src/components/DatePicker.tsx` - reference for Tailwind styling patterns

[Source: notes/sprint-artifacts/3-2-defer-modal-date-selection.md#Dev-Agent-Record]

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── components/
│   ├── CategoryDropdown.tsx  # NEW: Category selection with create
│   └── DeferModal.tsx        # MODIFIED: Add category section, enable Defer button logic
├── types/
│   └── index.ts              # VERIFY: AppState.categories exists
└── hooks/
    └── useTasks.ts           # MAY MODIFY: Ensure categories exposed
```

### Styling Guide

Per UX spec design tokens:
- Dropdown trigger: `bg-surface border border-border rounded-lg px-3 py-2`
- Dropdown content: `bg-surface border border-border rounded-lg shadow-md`
- Option hover: `bg-surface-muted`
- Selected option: `bg-primary/10 text-primary`
- "Create new..." option: `text-primary font-medium`
- Input for new category: `border-b border-border bg-transparent`
- Defer button disabled: `opacity-50 cursor-not-allowed`
- Defer button enabled: `bg-primary text-white hover:bg-primary/90`

### Edge Cases

Per tech-spec-epic-3.md "Edge Cases":
- **Empty category name**: Reject silently (no action on Enter with empty input)
- **Duplicate category name**: Either use existing or reject - prefer using existing
- **Very long category names**: Truncate in UI with ellipsis (max visible ~20 chars)
- **Many categories**: Dropdown should scroll if >10 categories

### References

- [Source: notes/epics.md#Story-3.3] - Story definition
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story-3.3] - AC-3.3.1 through AC-3.3.7
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#CategoryDropdown-Props] - CategoryDropdown interface
- [Source: notes/architecture.md#Data-Architecture] - AppState.categories
- [Source: notes/ux-design-specification.md#Defer-Modal] - Modal visual design

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/3-3-defer-modal-category-selection-and-creation.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-06: Starting implementation - Task 1: Create CategoryDropdown component with Radix Select
- 2026-01-06: Added AppState interface to types/index.ts
- 2026-01-06: Updated useTasks.ts with categories state and addCategory function
- 2026-01-06: Created CategoryDropdown.tsx with Radix Select, inline creation input
- 2026-01-06: Extended DeferModalProps, added category section, implemented canDefer logic
- 2026-01-06: Threaded categories through App → TodayView → TaskList → TaskCard → DeferModal

### Completion Notes List

- Created CategoryDropdown component using @radix-ui/react-select with full accessibility
- Category creation flow uses inline input with Enter/Escape key handlers
- Empty category names rejected (AC-3.3.6)
- Duplicate categories handled (case-insensitive comparison, uses existing)
- Defer button dynamically enabled when both date AND category selected (AC-3.3.7)
- Categories persisted in useTasks hook state (will persist in localStorage in Epic 4)
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Action | Description |
|------|--------|-------------|
| today-app/src/types/index.ts | MODIFIED | Added AppState interface with categories: string[] |
| today-app/src/hooks/useTasks.ts | MODIFIED | Added categories state, addCategory function |
| today-app/src/components/CategoryDropdown.tsx | CREATED | New dropdown component with Radix Select and inline creation |
| today-app/src/components/DeferModal.tsx | MODIFIED | Added category section, selectedCategory state, canDefer logic |
| today-app/src/App.tsx | MODIFIED | Extract categories and addCategory from useTasks, pass to TodayView |
| today-app/src/views/TodayView.tsx | MODIFIED | Accept and pass categories, onCreateCategory props |
| today-app/src/components/TaskList.tsx | MODIFIED | Accept and pass categories, onCreateCategory props |
| today-app/src/components/TaskCard.tsx | MODIFIED | Accept categories, onCreateCategory; pass to DeferModal |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (3-3-defer-modal-category-selection-and-creation) | SM Agent |
| 2026-01-06 | Implementation complete - CategoryDropdown created, DeferModal updated, categories threaded through app | Dev Agent |
| 2026-01-06 | Test Gate PASSED - Story ready for review | Vishal |
