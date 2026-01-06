# Story 2.1: Today View with Task List

Status: done

## Story

As a **user**,
I want **to see my today's tasks in a clean list**,
so that **I know exactly what I need to focus on today**.

## Acceptance Criteria

1. **AC-2.1.1**: Given I am on the Today tab with tasks for today, I see each task as a white card with:
   - Circle checkbox on the left
   - Task text in DM Sans 16px (font-body)
   - Subtle border (#e2e8f0 / border-border)
   - 12px gap between cards (space-3)

2. **AC-2.1.2**: Given I am on the Today tab with no tasks, I see:
   - "Nothing for today." message (text-foreground)
   - "Add a task to get started." subtitle (text-muted-foreground)
   - Add task input visible below the message

3. **AC-2.1.3**: Task cards have white background (bg-surface) with subtle shadow on hover (shadow-sm)

4. **AC-2.1.4**: The view is responsive:
   - Full-width cards on mobile (< 768px) with appropriate padding
   - Centered within 600px container on desktop

5. **AC-2.1.5**: TodayView component receives and displays tasks filtered for today (mock data for now)

6. **AC-2.1.6**: TaskList component renders an array of tasks with consistent spacing

7. **AC-2.1.7**: TaskCard component displays individual task with checkbox circle and text

## Frontend Test Gate

**Gate ID**: 2-1-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Core layout structure from Story 1.3 complete (Header, TabBar, tab state)
- [ ] Starting state: Today tab selected by default

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | View Today tab content | Content area below tabs | Task list displays (mock data) |
| 3 | Inspect task card | Any task card | White background, subtle border, circle checkbox on left |
| 4 | Check task text styling | Task text | DM Sans font, 16px, dark text color |
| 5 | Check spacing between tasks | Gap between cards | 12px consistent gap |
| 6 | Hover over task card | Task card | Subtle shadow lift effect |
| 7 | Clear mock data and refresh | Browser | Empty state shows "Nothing for today." |
| 8 | Resize to mobile (< 768px) | Browser viewport | Cards become full-width with padding |
| 9 | Resize to desktop (> 1024px) | Browser viewport | Cards contained within 600px centered container |

### Success Criteria (What User Sees)
- [ ] Task cards display as clean white cards with subtle borders
- [ ] Circle checkbox visible on left side of each task
- [ ] Task text is readable in DM Sans font
- [ ] Consistent 12px gaps between task cards
- [ ] Hover state adds subtle shadow lift
- [ ] Empty state message shows when no tasks exist
- [ ] Layout is responsive across viewports
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you clearly identify individual tasks in the list?
2. Does the task card styling feel clean and paper-like?
3. Is the empty state message helpful and non-judgmental?
4. Does the responsive layout feel natural on mobile?

## Tasks / Subtasks

- [x] **Task 1: Create TaskCard Component** (AC: 1, 3)
  - [x] Create `today-app/src/components/TaskCard.tsx`
  - [x] Define TaskCardProps interface: `{ task: Task; }`
  - [x] Display circle checkbox on left (unchecked state only for now)
  - [x] Display task text using font-body (DM Sans), text-base (16px)
  - [x] Apply styling: bg-surface, border border-border, rounded-lg, p-4
  - [x] Add hover state: shadow-sm on hover (transition-shadow)
  - [x] Use named export pattern: `export const TaskCard = ({ task }: TaskCardProps) => { ... }`

- [x] **Task 2: Create TaskList Component** (AC: 6)
  - [x] Create `today-app/src/components/TaskList.tsx`
  - [x] Define TaskListProps interface: `{ tasks: Task[]; }`
  - [x] Map over tasks array and render TaskCard for each
  - [x] Apply gap-3 (12px) between cards using flex column layout
  - [x] Use named export pattern

- [x] **Task 3: Create TodayView Component** (AC: 2, 5)
  - [x] Create `today-app/src/views/TodayView.tsx`
  - [x] Accept tasks prop (filtered for today - filtering logic in parent)
  - [x] Render TaskList when tasks exist
  - [x] Render empty state when no tasks:
    - "Nothing for today." in text-foreground, text-center
    - "Add a task to get started." in text-muted-foreground, text-sm
  - [x] Use named export pattern

- [x] **Task 4: Define Task Type** (AC: 5, 6, 7)
  - [x] Create `today-app/src/types/index.ts`
  - [x] Define Task interface per architecture.md:
    ```typescript
    interface Task {
      id: string;
      text: string;
      createdAt: string;
      deferredTo: string | null;
      category: string | null;
      completedAt: string | null;
    }
    ```
  - [x] Export Task type for use in components

- [x] **Task 5: Add Mock Data for Testing** (AC: 1, 5)
  - [x] Create mock tasks array in App.tsx or separate mock file
  - [x] Include 2-3 sample tasks with today's date
  - [x] Pass mock tasks to TodayView for visual testing
  - [x] Ensure easy toggle between mock data and empty state for testing

- [x] **Task 6: Integrate TodayView into App** (AC: 4, 5)
  - [x] Import TodayView in App.tsx
  - [x] Render TodayView when activeTab === 'today'
  - [x] Keep placeholder views for Tomorrow and Deferred tabs
  - [x] Ensure responsive layout from Story 1.3 contains the views

- [x] **Task 7: Style Circle Checkbox** (AC: 1, 3)
  - [x] Create checkbox circle UI element (unchecked state only)
  - [x] Use Lucide Circle icon or custom SVG/div
  - [x] Size: 20-24px diameter
  - [x] Border: 2px solid border-muted (#e2e8f0) or similar
  - [x] Background: transparent or surface
  - [x] Add hover cursor pointer for future interactivity

- [x] **Task 8: Visual Testing Across Viewports** (AC: 4)
  - [x] Test at mobile viewport (375px width) - full-width cards
  - [x] Test at tablet viewport (768px width) - contained cards
  - [x] Test at desktop viewport (1280px width) - 600px max-width container
  - [x] Verify empty state displays correctly at all sizes
  - [x] Run `npm run build` to ensure no TypeScript errors

## Dev Notes

### Architecture Alignment

Per architecture.md, this story creates the following structure:
- **TaskCard.tsx**: Presentational component for individual task display
- **TaskList.tsx**: Container component for rendering task array
- **TodayView.tsx**: View component for the Today tab

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports (not default): `export const TaskCard = () => { ... }`
- Destructure props in function signature

### Data Model (from architecture.md)

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

For Story 2.1, we only need: `id`, `text` (others can be optional/unused for display).

### Task Card Styling (from UX spec)

Per ux-design-specification.md Section 6.1 (Task Card):
- White card (bg-surface): #ffffff
- Gray border (border-border): #e2e8f0
- Circle checkbox on left
- Hover: slight shadow lift (shadow-sm)
- Completing animation: not in this story (Story 2.3)
- Actions menu: not in this story (Story 2.4)

### Empty State Design (from UX spec)

Per ux-design-specification.md Section 7.2:
```
Nothing for today.
Add a task to get started.

[Add a task input - Story 2.2]
```
- Centered text
- Primary message in text-foreground
- Secondary message in text-muted-foreground, smaller

### Responsive Design (from UX spec)

Per ux-design-specification.md Section 8.1:
| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Full-width cards, larger touch targets |
| Tablet (768px+) | Centered column (500px) |
| Desktop (1024px+) | Centered column (600px) |

Container already set up in Story 1.3: `max-w-[600px] mx-auto`

### Project Structure Notes

Per architecture.md, files created in this story:
```
today-app/src/
├── types/
│   └── index.ts           # NEW: Task interface
├── components/
│   ├── TaskCard.tsx       # NEW: Individual task display
│   └── TaskList.tsx       # NEW: Task list container
├── views/
│   └── TodayView.tsx      # NEW: Today tab view
└── App.tsx                # MODIFIED: Add TodayView integration
```

### Dependencies

No new dependencies required. Uses existing:
- React (useState, component patterns)
- Tailwind CSS (styling via design tokens from Story 1.2)
- Lucide React (Circle icon for checkbox)
- date-fns (not needed for this story - no date logic yet)

### Learnings from Previous Stories

**From Story 1-2-design-tokens-and-base-styling (Status: done)**

- **Tailwind v4 Configuration**: Uses CSS-first configuration via @theme directive in index.css - no tailwind.config.js needed
- **Design Tokens Available**: All 15 color tokens working: bg-background, bg-surface, bg-surface-muted, text-foreground, text-muted-foreground, border-border, etc.
- **Font Classes Available**: font-display (Playfair Display), font-body (DM Sans), font-mono (JetBrains Mono)
- **TokenShowcase Component**: Should be removed (cleanup done in Story 1.3)
- **Build Size**: 201KB JS (60KB gzipped), 12KB CSS - well under targets
- **React 19 + TypeScript 5.9**: Using latest versions

**From Story 1-3-core-layout-structure (Status: in-progress)**

- **Tab State**: App.tsx manages `activeTab` state with TabId type
- **Layout Container**: `max-w-[600px] mx-auto px-4` established
- **Header/TabBar**: Components created for app shell
- **Content Area**: Placeholder views exist for each tab - replace Today placeholder with TodayView

[Source: notes/sprint-artifacts/1-2-design-tokens-and-base-styling.md#Dev-Agent-Record]
[Source: notes/sprint-artifacts/1-3-core-layout-structure.md#Dev-Notes]

### References

- [Source: notes/epics.md#Story-2.1] - Story definition and acceptance criteria
- [Source: notes/architecture.md#Project-Structure] - Component file locations
- [Source: notes/architecture.md#Data-Architecture] - Task interface definition
- [Source: notes/architecture.md#Component-Patterns] - Named exports, arrow functions, TypeScript
- [Source: notes/ux-design-specification.md#6.1-Component-Strategy] - Task Card component specs
- [Source: notes/ux-design-specification.md#7.2-Empty-States] - Empty state design
- [Source: notes/ux-design-specification.md#8.1-Responsive-Strategy] - Breakpoints and mobile adaptations
- [Source: notes/prd.md#Functional-Requirements] - FR1, FR2, FR14, FR28-30

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/2-1-today-view-with-task-list.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented all 8 tasks in logical order: Task 4 (types) first as dependency, then Tasks 1, 7 (TaskCard with checkbox), Task 2 (TaskList), Task 3 (TodayView), Tasks 5, 6 (mock data and App integration), Task 8 (build verification)
- Build passes: 217KB JS (68KB gzipped), 14KB CSS
- SHOW_MOCK_DATA toggle in App.tsx allows easy switching between populated and empty states

### Completion Notes List

- Created Task interface in types/index.ts with all required fields per architecture.md
- TaskCard component uses Lucide Circle icon (20px, strokeWidth 2) with hover state and transition-shadow
- TaskList renders tasks in flex column with gap-3 (12px spacing per UX spec)
- TodayView handles empty state with centered "Nothing for today." message
- App.tsx updated with mock data array and switch statement for view rendering
- All components follow named export pattern with TypeScript interfaces
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Status | Description |
|------|--------|-------------|
| today-app/src/types/index.ts | Created | Task interface definition |
| today-app/src/components/TaskCard.tsx | Created | Individual task card with checkbox and text |
| today-app/src/components/TaskList.tsx | Created | Task list container with 12px gap |
| today-app/src/views/TodayView.tsx | Created | Today tab view with empty state handling |
| today-app/src/App.tsx | Modified | Added TodayView integration, mock data, view switching |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog | SM Agent |
| 2026-01-06 | Implemented all 8 tasks: Task type, TaskCard, TaskList, TodayView, mock data, App integration | Dev Agent |
| 2026-01-06 | Story marked done after Test Gate PASS | Vishal |
