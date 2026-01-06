# Story 3.2: Defer Modal - Date Selection

Status: review

## Story

As a **user**,
I want **to choose when to defer a task (tomorrow, specific date, or no date)**,
so that **I can decide when to revisit the task**.

## Acceptance Criteria

1. **AC-3.2.1**: Given the defer modal is open, the "When?" section displays three date options: "Tomorrow", "Pick date", "No date"

2. **AC-3.2.2**: Given I click "Tomorrow", that button becomes selected (dark background) and stores tomorrow's date as the deferral target

3. **AC-3.2.3**: Given I click "Pick date", an inline calendar appears below the buttons allowing date selection

4. **AC-3.2.4**: Given the calendar is visible, only future dates (not today or past) are selectable; past/today dates are disabled

5. **AC-3.2.5**: Given I click "No date", that option is selected (task will go to Deferred with no date/someday)

## Frontend Test Gate

**Gate ID**: 3-2-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 3.1 complete (DeferModal placeholder with Radix Dialog)
- [ ] Starting state: Today tab selected, at least 1 task visible
- [ ] Test user: Any (no auth required)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add a task if none exist | Add task input | Task "Test Task" visible |
| 3 | Click clock icon on task | Task card actions | DeferModal opens |
| 4 | Verify "When?" section | Modal content | Three buttons visible: "Tomorrow", "Pick date", "No date" |
| 5 | Click "Tomorrow" button | Date selection buttons | Button shows selected state (dark background) |
| 6 | Click "Pick date" button | Date selection buttons | Calendar appears inline below buttons |
| 7 | Try to click today's date | Calendar | Date is disabled, cannot be selected |
| 8 | Try to click a past date | Calendar | Date is disabled, cannot be selected |
| 9 | Click a future date (e.g., +3 days) | Calendar | Date is selected, "Pick date" shows selected state |
| 10 | Click "No date" button | Date selection buttons | Button shows selected state, calendar hides |
| 11 | Close modal (click X or outside) | Modal overlay | Modal closes, task unchanged |

### Success Criteria (What User Sees)
- [ ] Modal displays "When?" label and three date option buttons
- [ ] Only one date option can be selected at a time
- [ ] "Tomorrow" button selectable with dark background when active
- [ ] "Pick date" reveals inline calendar below buttons
- [ ] Calendar disables today and all past dates
- [ ] Selecting a future date in calendar shows it as selected
- [ ] "No date" button selectable with dark background when active
- [ ] Switching between options updates selection visually
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Are the three date options clearly distinguishable?
2. Is the calendar easy to navigate and select dates?
3. Is it clear which date option is currently selected?
4. Does the calendar appear in a logical position?

## Tasks / Subtasks

- [x] **Task 1: Install date-fns if not present** (AC: 3, 4)
  - [x] Check if date-fns is in package.json
  - [x] If not: `npm install date-fns`
  - [x] Verify date-fns version is ^4.x per tech spec

- [x] **Task 2: Create DatePicker component** (AC: 3, 4)
  - [x] Create `today-app/src/components/DatePicker.tsx`
  - [x] Define DatePickerProps interface:
    ```typescript
    interface DatePickerProps {
      selectedDate: string | null;
      onSelect: (date: string | null) => void;
      minDate?: Date;  // Tomorrow (cannot select today or past)
    }
    ```
  - [x] Build simple month-view calendar grid:
    - Header with month/year and prev/next navigation
    - Day names row (S M T W T F S)
    - Calendar grid with clickable date cells
  - [x] Use date-fns for date manipulation:
    - `startOfMonth`, `endOfMonth`, `eachDayOfInterval`
    - `isBefore`, `isToday`, `isSameDay`
    - `format`, `addMonths`, `subMonths`
  - [x] Disable dates before minDate (tomorrow)
  - [x] Style with Tailwind:
    - Selected date: bg-primary text-white rounded
    - Disabled dates: text-muted-foreground cursor-not-allowed
    - Hover on enabled: bg-surface-muted

- [x] **Task 3: Update DeferModal with date selection UI** (AC: 1, 2, 5)
  - [x] Open `today-app/src/components/DeferModal.tsx`
  - [x] Add state for date selection:
    ```typescript
    type DateOption = 'tomorrow' | 'pick-date' | 'no-date' | null;
    const [dateOption, setDateOption] = useState<DateOption>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    ```
  - [x] Replace placeholder content with date selection section:
    - "When?" label (text-sm font-medium)
    - Three buttons: "Tomorrow", "Pick date", "No date"
  - [x] Style buttons:
    - Default: border border-border bg-surface text-foreground
    - Selected: bg-primary text-white
  - [x] Wire up button click handlers:
    - Tomorrow: setDateOption('tomorrow'), setSelectedDate(tomorrow ISO)
    - Pick date: setDateOption('pick-date')
    - No date: setDateOption('no-date'), setSelectedDate(null)

- [x] **Task 4: Integrate DatePicker into DeferModal** (AC: 3, 4)
  - [x] Conditionally render DatePicker when dateOption === 'pick-date':
    ```tsx
    {dateOption === 'pick-date' && (
      <DatePicker
        selectedDate={selectedDate}
        onSelect={(date) => setSelectedDate(date)}
        minDate={addDays(new Date(), 1)}  // Tomorrow
      />
    )}
    ```
  - [x] Import `addDays` from date-fns
  - [x] When date selected in DatePicker, update selectedDate state
  - [x] Calendar should appear inline below the date buttons

- [x] **Task 5: Implement date helper functions** (AC: 2, 4)
  - [x] Create or use existing dates.ts utility:
    - `getTomorrowISO()`: Returns tomorrow as ISO string
    - `formatDisplayDate(isoString)`: Returns "Jan 15" format
  - [x] Use in DeferModal to compute tomorrow's date
  - [x] Use date-fns `format`, `addDays`, `startOfDay`

- [x] **Task 6: Update DeferModalProps interface** (AC: all)
  - [x] Extend DeferModalProps to prepare for full defer flow:
    ```typescript
    interface DeferModalProps {
      task: Task;
      isOpen: boolean;
      onClose: () => void;
      // Will be used in Story 3.3/3.4:
      // categories: string[];
      // onDefer: (deferredTo: string | null, category: string) => void;
      // onCreateCategory: (name: string) => void;
    }
    ```
  - [x] Modal should NOT have a working "Defer" button yet (category required first)
  - [x] Add disabled state to future Defer button area

- [x] **Task 7: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Run `npm run dev` and test:
    - [x] Open defer modal
    - [x] Verify "When?" section with three buttons
    - [x] Click "Tomorrow" - verify selected state
    - [x] Click "Pick date" - verify calendar appears
    - [x] Verify today and past dates are disabled in calendar
    - [x] Select future date - verify selection
    - [x] Click "No date" - verify selected state, calendar hides
    - [x] Close modal and reopen - verify state resets
  - [x] Verify no console errors

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-3.md, this story:
- **Creates:** DatePicker.tsx component
- **Modifies:** DeferModal.tsx (replaces placeholder with date selection UI)

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const DatePicker = () => { ... }`
- Destructure props in function signature

### Date Handling Pattern

Per architecture.md Section "Date Handling Patterns":
- All dates MUST be stored as ISO 8601 strings
- Use date-fns for comparison and formatting
- Compare using `isToday()`, `isTomorrow()` from date-fns

```typescript
import { isToday, isBefore, addDays, format, startOfDay } from 'date-fns';

// Get tomorrow's date
const tomorrow = addDays(startOfDay(new Date()), 1);

// Check if date is selectable (future only)
const isSelectable = (date: Date) => !isBefore(date, tomorrow);
```

### DatePicker Design

Per tech-spec-epic-3.md Section "APIs and Interfaces":
```typescript
interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  minDate?: Date;  // Tomorrow (cannot select today or past)
}
```

Per UX spec Section 6.1 "Defer Modal":
- Calendar appears inline below date buttons when "Pick date" selected
- Simple month-view calendar with navigation

### Modal State Flow

Per tech-spec-epic-3.md "Workflows and Sequencing":
1. User clicks Defer button → Modal opens
2. Modal displays date options: "Tomorrow", "Pick date", "No date"
3. User selects date option:
   - "Tomorrow" → Sets deferredTo to tomorrow's ISO date
   - "Pick date" → Opens DatePicker, user selects future date
   - "No date" → Sets deferredTo to null (someday)
4. (Story 3.3 adds category selection)
5. (Story 3.4 adds defer action)

### Learnings from Previous Story

**From Story 3-1-defer-button-on-task-cards (Status: in-progress)**

- **DeferModal Created**: Placeholder modal using Radix Dialog at `src/components/DeferModal.tsx`
- **Modal Positioning**: Uses responsive classes for centered (desktop) / bottom sheet (mobile)
- **Animations**: fadeIn (150ms), slideUp (200ms mobile), slideUpDesktop (200ms desktop) in index.css
- **Prop Pattern**: DeferModal receives `task`, `isOpen`, `onClose` props
- **Radix Dialog**: Already imported and configured - reuse Dialog.Root, Portal, Overlay, Content, Title, Close

**Key Implementation Pattern from 3-1:**
```tsx
// Existing modal structure to extend:
<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Portal>
    <Dialog.Overlay className="..." />
    <Dialog.Content className="...">
      <Dialog.Title>Defer Task</Dialog.Title>
      <Dialog.Close>X</Dialog.Close>
      {/* Replace placeholder here with date selection */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Build Info**: 254.34KB JS (80.19KB gzipped), 17.91KB CSS

[Source: notes/sprint-artifacts/3-1-defer-button-on-task-cards.md#Dev-Agent-Record]

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── components/
│   ├── DatePicker.tsx     # NEW: Calendar date picker
│   └── DeferModal.tsx     # MODIFIED: Add date selection UI
└── utils/
    └── dates.ts           # OPTIONAL: Date helper functions
```

### Dependencies

Per tech-spec-epic-3.md:
- date-fns ^4.1.0 (verify installed)
- @radix-ui/react-dialog (already installed from 3-1)
- lucide-react for icons (Calendar, ChevronLeft, ChevronRight)

### Styling Guide

Per UX spec design tokens:
- Selected button: `bg-primary text-white` (#475569 → white)
- Unselected button: `bg-surface border border-border text-foreground`
- Disabled date: `text-muted-foreground cursor-not-allowed opacity-50`
- Calendar grid: 7 columns, day cells 32x32px minimum touch target

### References

- [Source: notes/epics.md#Story-3.2] - Story definition and acceptance criteria
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story-3.2] - AC-3.2.1 through AC-3.2.5
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#DatePicker-Props] - DatePicker interface
- [Source: notes/ux-design-specification.md#Defer-Modal] - Modal visual design
- [Source: notes/architecture.md#Date-Handling-Patterns] - Date storage patterns

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/3-2-defer-modal-date-selection.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-06: Verified date-fns ^4.1.0 already installed
- 2026-01-06: Created DatePicker.tsx with month-view calendar, prev/next navigation, disabled past dates
- 2026-01-06: Updated DeferModal.tsx - replaced placeholder with date selection UI
- 2026-01-06: Build passed: 261.96KB JS (82.51KB gzipped), 18.41KB CSS

### Completion Notes List

- Created DatePicker component with full calendar functionality using date-fns
- DeferModal now shows "When?" section with Tomorrow/Pick date/No date options
- Calendar appears inline when "Pick date" selected
- Past dates and today are disabled in calendar
- Selection summary shows chosen date
- State resets when modal closes
- Defer button disabled (awaiting category selection in Story 3.3)
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Action | Description |
|------|--------|-------------|
| today-app/src/components/DatePicker.tsx | CREATED | Month-view calendar component with date-fns integration |
| today-app/src/components/DeferModal.tsx | MODIFIED | Added date selection UI with three options and DatePicker integration |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (3-2-defer-modal-date-selection) | SM Agent |
| 2026-01-06 | Implementation complete - DatePicker created, DeferModal updated with date selection | Dev Agent |
