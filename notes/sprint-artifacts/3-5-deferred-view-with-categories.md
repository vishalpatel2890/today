# Story 3.5: Deferred View with Categories

Status: review

## Story

As a **user**,
I want **to see all my deferred tasks organized by category**,
so that **I can review what I've pushed back and find tasks easily**.

## Acceptance Criteria

1. **AC-3.5.1**: Given I click the "Deferred" tab, the view shows tasks grouped under category headers

2. **AC-3.5.2**: Given I see a category header, it displays: chevron icon (down when expanded, right when collapsed), category name, and task count in parentheses

3. **AC-3.5.3**: Given I click a category header, it toggles between expanded (showing tasks) and collapsed (hiding tasks)

4. **AC-3.5.4**: Given I open the Deferred view with multiple categories, the first category is expanded by default and others are collapsed

5. **AC-3.5.5**: Given I view tasks within a category, each task shows its deferred date (formatted as "Jan 15") or "Someday" for tasks with no date

6. **AC-3.5.6**: Given I have multiple categories with deferred tasks, categories are sorted alphabetically

## Frontend Test Gate

**Gate ID**: 3-5-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 3.4 complete (Defer action and Tomorrow view working)
- [ ] Starting state: Multiple tasks deferred to different categories with various dates
- [ ] Test user: Any (no auth required)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add 4+ tasks and defer them to different categories | Today view + DeferModal | Tasks created with various categories |
| 3 | Defer Task A to "Work" category with "No date" | DeferModal | Task deferred to Work/Someday |
| 4 | Defer Task B to "Work" category with specific date | DeferModal | Task deferred to Work/Jan 20 |
| 5 | Defer Task C to "Personal" category with "No date" | DeferModal | Task deferred to Personal/Someday |
| 6 | Defer Task D to "Ideas" category with specific date | DeferModal | Task deferred to Ideas/Feb 1 |
| 7 | Click "Deferred" tab | Tab bar | Deferred view loads |
| 8 | Verify category grouping | Deferred view | Tasks grouped under category headers |
| 9 | Verify category header format | Category headers | "[Chevron] Ideas (1)", "[Chevron] Personal (1)", "[Chevron] Work (2)" |
| 10 | Verify alphabetical order | Category headers | Categories in A-Z order: Ideas, Personal, Work |
| 11 | Verify first category expanded | First category (Ideas) | Chevron points down, tasks visible |
| 12 | Verify other categories collapsed | Personal, Work categories | Chevron points right, tasks hidden |
| 13 | Click "Personal" header | Category header | Personal expands, shows its task |
| 14 | Click "Ideas" header | Category header | Ideas collapses, hides its task |
| 15 | Verify date display on tasks | Task cards in Deferred | Shows "Jan 20", "Feb 1", or "Someday" |
| 16 | Verify task card format | Task cards | Same format as Today (checkbox, text, actions) |
| 17 | Complete a task in Deferred view | Click checkbox | Task slides out, count updates |
| 18 | Delete a task in Deferred view | Click trash icon | Task removed, count updates |

### Success Criteria (What User Sees)
- [ ] Deferred tab shows tasks grouped by category
- [ ] Category headers show: chevron + name + count in parentheses
- [ ] Clicking header toggles expand/collapse
- [ ] First category expanded by default, others collapsed
- [ ] Tasks display their deferred date or "Someday"
- [ ] Categories sorted alphabetically (A-Z)
- [ ] Task cards match Today view format
- [ ] Complete/delete actions work within Deferred view
- [ ] Empty category headers hidden (categories only show when they have tasks)
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the category organization intuitive and easy to scan?
2. Is the expand/collapse interaction smooth and expected?
3. Is the date display (Jan 15 vs Someday) clear?
4. Can you find specific deferred tasks quickly?

## Tasks / Subtasks

- [x] **Task 1: Create CategorySection component** (AC: 2, 3)
  - [x] Create `today-app/src/components/CategorySection.tsx`
  - [x] Define CategorySectionProps interface:
    ```typescript
    interface CategorySectionProps {
      category: string;
      tasks: Task[];
      isExpanded: boolean;
      onToggle: () => void;
      onComplete: (id: string) => void;
      onDelete: (id: string) => void;
      onDefer: (id: string, deferredTo: string | null, category: string) => void;
      categories: string[];
      onCreateCategory: (name: string) => void;
      onShowToast: (message: string) => void;
    }
    ```
  - [x] Implement collapsible header with:
    - Chevron icon (ChevronDown when expanded, ChevronRight when collapsed)
    - Category name
    - Task count in parentheses: `({tasks.length})`
  - [x] Use CSS transition for smooth expand/collapse (max-height or height animation)
  - [x] Render TaskList inside when expanded
  - [x] Use Lucide icons: `ChevronDown`, `ChevronRight`

- [x] **Task 2: Create DeferredView component** (AC: 1, 4, 6)
  - [x] Create `today-app/src/views/DeferredView.tsx`
  - [x] Define DeferredViewProps interface:
    ```typescript
    interface DeferredViewProps {
      tasks: Task[];
      categories: string[];
      onComplete: (id: string) => void;
      onDelete: (id: string) => void;
      onDefer: (id: string, deferredTo: string | null, category: string) => void;
      onCreateCategory: (name: string) => void;
      onShowToast: (message: string) => void;
    }
    ```
  - [x] Filter tasks for Deferred view:
    ```typescript
    const deferredTasks = tasks.filter(task =>
      !task.completedAt &&
      task.category !== null &&
      task.deferredTo !== null &&
      !isToday(parseISO(task.deferredTo)) &&
      !isTomorrow(parseISO(task.deferredTo))
    );
    // Also include "someday" tasks (deferredTo === null with category set)
    const somedayTasks = tasks.filter(task =>
      !task.completedAt &&
      task.category !== null &&
      task.deferredTo === null
    );
    const allDeferredTasks = [...deferredTasks, ...somedayTasks];
    ```
  - [x] Group tasks by category:
    ```typescript
    const tasksByCategory = allDeferredTasks.reduce((acc, task) => {
      const cat = task.category!;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
    ```
  - [x] Sort categories alphabetically
  - [x] Track expanded state: `const [expandedCategories, setExpandedCategories] = useState<Set<string>>()`
  - [x] Initialize first category as expanded on mount
  - [x] Add empty state: "No deferred tasks. Everything is in Today or Tomorrow!"

- [x] **Task 3: Implement expand/collapse state management** (AC: 3, 4)
  - [x] In DeferredView, manage expanded state:
    ```typescript
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    useEffect(() => {
      // Expand first category by default
      const sortedCategories = Object.keys(tasksByCategory).sort();
      if (sortedCategories.length > 0 && expandedCategories.size === 0) {
        setExpandedCategories(new Set([sortedCategories[0]]));
      }
    }, [tasksByCategory]);

    const toggleCategory = (category: string) => {
      setExpandedCategories(prev => {
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }
        return next;
      });
    };
    ```
  - [x] Pass `isExpanded` and `onToggle` to each CategorySection

- [x] **Task 4: Display deferred date on task cards** (AC: 5)
  - [x] In TaskCard or CategorySection, add date badge below/beside task text
  - [x] Format date display:
    ```typescript
    const formatDeferredDate = (deferredTo: string | null): string => {
      if (!deferredTo) return 'Someday';
      return format(parseISO(deferredTo), 'MMM d'); // "Jan 15"
    };
    ```
  - [x] Style date badge: `text-xs text-muted-foreground`
  - [x] Only show date badge in Deferred view (not Today/Tomorrow)

- [x] **Task 5: Integrate DeferredView into App** (AC: 1)
  - [x] Open `today-app/src/App.tsx`
  - [x] Import DeferredView
  - [x] Add DeferredView rendering when `activeTab === 'deferred'`
  - [x] Pass required props (tasks, handlers, categories)

- [x] **Task 6: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Run `npm run dev` and test:
    - [x] Defer multiple tasks to different categories
    - [x] Open Deferred tab - verify grouping
    - [x] Verify first category expanded, others collapsed
    - [x] Click headers to toggle expand/collapse
    - [x] Verify alphabetical category order
    - [x] Verify date display ("Jan 15" or "Someday")
    - [x] Complete a task - verify it disappears
    - [x] Delete a task - verify removal
  - [x] Verify no console errors

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-3.md, this story:
- **Creates:** CategorySection.tsx, DeferredView.tsx
- **Modifies:** TaskCard.tsx (optional date badge), App.tsx (DeferredView routing)

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const DeferredView = () => { ... }`
- Destructure props in function signature

### View Filtering Logic

Per tech-spec-epic-3.md "Workflows and Sequencing":
- **Deferred view includes:**
  - Tasks with `deferredTo` date beyond tomorrow (future dates)
  - Tasks with `deferredTo === null` AND `category !== null` (someday tasks)
  - Excludes completed tasks (`completedAt !== null`)

```typescript
// Deferred = (future date OR no date) AND has category AND not completed
const isDeferredTask = (task: Task): boolean => {
  if (task.completedAt) return false;
  if (!task.category) return false;
  if (!task.deferredTo) return true; // Someday
  const date = parseISO(task.deferredTo);
  return !isToday(date) && !isTomorrow(date);
};
```

### CategorySection Component

Per tech-spec-epic-3.md "CategorySection Props":
```typescript
interface CategorySectionProps {
  category: string;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
}
```

Header anatomy per UX spec:
```
+---------------------------------------+
| > Work (3)                            |  <- Collapsed (ChevronRight)
+---------------------------------------+

+---------------------------------------+
| v Personal (2)                        |  <- Expanded (ChevronDown)
|   +-------------------------------+   |
|   | [ ] Task text         Jan 15  |   |
|   +-------------------------------+   |
|   | [ ] Another task      Someday |   |
|   +-------------------------------+   |
+---------------------------------------+
```

### Date Formatting

Per tech-spec-epic-3.md dependencies:
- date-fns ^4.1.0 for: `format`, `parseISO`, `isToday`, `isTomorrow`

Date badge display:
- Future date: `format(parseISO(deferredTo), 'MMM d')` → "Jan 15"
- No date: "Someday"

### Expand/Collapse Animation

Per tech-spec-epic-3.md NFR:
- Animation smoothness: 60fps (CSS transitions only)

Recommend using CSS transition on `max-height` or `grid-template-rows`:
```css
.category-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
}
.category-content.expanded {
  grid-template-rows: 1fr;
}
.category-content > div {
  overflow: hidden;
}
```

### Learnings from Previous Story

**From Story 3-4-defer-action-and-tomorrow-view (Status: in-progress)**

Per story 3-4 spec (ready-for-dev):
- **Toast.tsx Created**: Toast component at `src/components/Toast.tsx` (when completed)
- **TomorrowView.tsx Created**: Tomorrow view at `src/views/TomorrowView.tsx` (when completed)
- **DEFER_TASK Action**: Added to useTasks reducer (when completed)
- **Props Pattern**: Tasks, handlers, categories threaded through App → View → TaskList → TaskCard

Note: Story 3-4 is in-progress. This story (3-5) should:
- Reuse the same props threading pattern
- Follow TomorrowView.tsx patterns for DeferredView.tsx
- Leverage existing Toast component for any feedback

**From Story 3-3-defer-modal-category-selection-and-creation (Status: done)**

- **CategoryDropdown Created**: Component at `src/components/CategoryDropdown.tsx`
- **Categories State**: AppState.categories array managed in useTasks
- **Props Threading**: categories + onCreateCategory flow through component tree
- **Files Modified**: App.tsx, TodayView.tsx, TaskList.tsx, TaskCard.tsx all updated

Key interfaces to reference:
```typescript
// From types/index.ts
interface AppState {
  tasks: Task[];
  categories: string[];
}

// Task has category field
interface Task {
  id: string;
  text: string;
  deferredTo: string | null;
  category: string | null;
  completedAt: string | null;
  createdAt: string;
}
```

[Source: notes/sprint-artifacts/3-3-defer-modal-category-selection-and-creation.md#Dev-Agent-Record]

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── components/
│   ├── CategorySection.tsx    # NEW: Collapsible category with header
│   └── TaskCard.tsx           # MODIFIED: Add optional date badge prop
├── views/
│   └── DeferredView.tsx       # NEW: Deferred view with category grouping
└── App.tsx                    # MODIFIED: Add DeferredView routing
```

### Styling Guide

Per UX spec design tokens:

Category header:
- Container: `flex items-center gap-2 py-3 px-2 cursor-pointer hover:bg-surface-muted rounded-lg`
- Chevron: `w-4 h-4 text-muted-foreground transition-transform`
- Category name: `font-medium text-foreground`
- Count: `text-sm text-muted-foreground`

Expanded chevron rotation:
```css
.chevron-expanded {
  transform: rotate(90deg);
}
/* Or use rotate-90 with Tailwind */
```

Date badge on task:
- Style: `text-xs text-muted-foreground bg-surface-muted px-2 py-0.5 rounded`
- Position: Right side of task text or below

Empty state:
- Style: `text-center text-muted-foreground py-12`
- Message: "No deferred tasks. Everything is in Today or Tomorrow!"

### Edge Cases

Per tech-spec-epic-3.md:
- **No deferred tasks**: Show empty state message
- **Single category**: That category should be expanded by default
- **All categories collapsed**: User manually collapsed all - maintain state
- **Category becomes empty**: Hide category header entirely (no "Work (0)")
- **Very many categories**: List should scroll naturally
- **Re-defer from Deferred view**: Task moves to different category or date - handle smoothly

### References

- [Source: notes/epics.md#Story-3.5] - Story definition with AC
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story-3.5] - AC-3.5.1 through AC-3.5.6
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#CategorySection-Props] - CategorySection interface
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Workflows-and-Sequencing] - View filtering logic
- [Source: notes/architecture.md#Data-Architecture] - Task and AppState types

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/3-5-deferred-view-with-categories.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-06: Starting implementation - Task 1: Create CategorySection component with collapsible header
- 2026-01-06: CategorySection uses grid-template-rows CSS transition for smooth expand/collapse (200ms)
- 2026-01-06: Task 2-3: DeferredView with filtering logic for future dates OR someday (null deferredTo + category)
- 2026-01-06: Task 4: Date badge integrated into CategorySection with formatDeferredDate helper
- 2026-01-06: Task 5: App.tsx updated to render DeferredView on 'deferred' tab
- 2026-01-06: Task 6: Build passed - 316.77KB JS (100.95KB gzipped), 21.92KB CSS
- 2026-01-06: BUG FIX: TodayView filter updated to exclude "Someday" tasks (tasks with category but no deferredTo)

### Completion Notes List

- Created CategorySection.tsx with collapsible header (chevron + name + count), TaskList rendering, date badge
- Created DeferredView.tsx with task filtering (future dates + someday), category grouping, alphabetical sorting
- Expand/collapse state managed with useState<Set<string>>, first category expanded by default
- Date badge shows "Jan 15" format or "Someday" for null deferredTo
- Integrated DeferredView into App.tsx renderView switch
- Build passes with no TypeScript errors
- Fixed TodayView filter bug: "Someday" tasks now correctly excluded from Today view
- Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Action | Description |
|------|--------|-------------|
| today-app/src/components/CategorySection.tsx | CREATED | Collapsible category section with header and task list |
| today-app/src/views/DeferredView.tsx | CREATED | Deferred view with category grouping and filtering |
| today-app/src/views/TodayView.tsx | MODIFIED | Fixed filter to exclude "Someday" tasks (category set, no date) |
| today-app/src/App.tsx | MODIFIED | Added DeferredView import and routing |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (3-5-deferred-view-with-categories) | SM Agent |
| 2026-01-06 | Implementation complete - CategorySection, DeferredView created, App.tsx integrated | Dev Agent |
| 2026-01-06 | Test Gate PASSED - Story ready for review | Vishal |
