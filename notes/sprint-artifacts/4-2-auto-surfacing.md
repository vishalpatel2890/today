# Story 4.2: Auto-Surfacing

Status: done

## Story

As a **user**,
I want **deferred tasks to automatically appear in Today when their date arrives**,
so that **I don't have to manually move them**.

## Acceptance Criteria

1. **AC-4.2.1**: Given I have tasks deferred to today's date, they appear in the Today view (not Deferred)

2. **AC-4.2.2**: Given I have tasks deferred to tomorrow's date, they appear in the Tomorrow view

3. **AC-4.2.3**: Given I have tasks deferred to dates beyond tomorrow, they appear in the Deferred view

4. **AC-4.2.4**: Given I have tasks with no date (someday), they appear in the Deferred view (grouped by category)

5. **AC-4.2.5**: Date-based surfacing occurs automatically on app load (no user action required)

6. **AC-4.2.6**: Completed tasks do not appear in any view (filtered out regardless of date)

## Frontend Test Gate

**Gate ID**: 4-2-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 4.1 complete (localStorage persistence working)
- [ ] Test user: Any (no auth required)
- [ ] Starting state: Some tasks deferred to various dates via previous testing

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open DevTools > Application > Local Storage | Browser DevTools | See 'today-app-state' key |
| 2 | Manually edit localStorage: set a task's `deferredTo` to today's date (ISO format) | DevTools localStorage editor | JSON updated |
| 3 | Manually edit: set another task's `deferredTo` to tomorrow's date | DevTools localStorage editor | JSON updated |
| 4 | Manually edit: set another task's `deferredTo` to 5 days from now | DevTools localStorage editor | JSON updated |
| 5 | Manually edit: set another task's `deferredTo` to `null` (with category set) | DevTools localStorage editor | JSON updated for "Someday" task |
| 6 | Refresh the page (F5) | Browser | App reloads |
| 7 | Check Today tab | Today tab | Task with today's date appears here |
| 8 | Check Tomorrow tab | Tomorrow tab | Task with tomorrow's date appears here |
| 9 | Check Deferred tab | Deferred tab | Tasks with future dates AND "Someday" tasks appear here |
| 10 | Complete a task from Today view | Click checkbox | Task fades out, does not appear in any view |
| 11 | Verify completed task is filtered | Check all tabs | Completed task not visible anywhere |
| 12 | Add new task, defer to tomorrow | Today view > add > defer modal | Task immediately appears in Tomorrow view |
| 13 | Change system date to tomorrow (optional advanced test) | System settings | Task previously deferred to "tomorrow" now shows in Today |

### Success Criteria (What User Sees)
- [ ] Tasks with `deferredTo` matching today's date appear in Today view
- [ ] Tasks with `deferredTo` matching tomorrow's date appear in Tomorrow view
- [ ] Tasks with `deferredTo` beyond tomorrow appear in Deferred view
- [ ] Tasks with `deferredTo: null` AND `category` set appear in Deferred view ("Someday")
- [ ] Completed tasks (`completedAt` not null) do not appear in any view
- [ ] Surfacing happens automatically on page load (no button to trigger)
- [ ] Tasks without category stay in Today view (not deferred yet)
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Did tasks automatically appear in the correct view based on their deferred date?
2. Were "Someday" tasks (no date) correctly shown in Deferred?
3. Did completed tasks correctly disappear from all views?
4. Any unexpected behavior with date-based filtering?

## Tasks / Subtasks

- [x] **Task 1: Create useAutoSurface hook** (AC: 1, 2, 3, 4, 6)
  - [x] Create `today-app/src/hooks/useAutoSurface.ts`
  - [x] Import date-fns: `isToday`, `isTomorrow`, `parseISO`, `isValid`
  - [x] Implement hook signature:
    ```typescript
    export function useAutoSurface(tasks: Task[]): {
      todayTasks: Task[];
      tomorrowTasks: Task[];
      deferredTasks: Task[];
    }
    ```
  - [x] Filter todayTasks: not completed AND (deferredTo is null without category OR isToday(deferredTo))
  - [x] Filter tomorrowTasks: not completed AND isTomorrow(deferredTo)
  - [x] Filter deferredTasks: not completed AND has category AND (deferredTo is null OR beyond tomorrow)
  - [x] Memoize filters with useMemo for performance
  - [x] Export hook as named export

- [x] **Task 2: Implement date comparison logic** (AC: 1, 2, 3, 4)
  - [x] Date comparison logic implemented inline in useAutoSurface hook using date-fns isToday, isTomorrow, parseISO, isValid
  - [x] Separate dates.ts not needed - logic centralized in hook for simplicity

- [x] **Task 3: Integrate useAutoSurface into App.tsx** (AC: 5)
  - [x] Open `today-app/src/App.tsx`
  - [x] Import useAutoSurface hook
  - [x] Call useAutoSurface with tasks from useTasks
  - [x] Pass filtered task arrays to each view:
    - `TodayView` receives `todayTasks`
    - `TomorrowView` receives `tomorrowTasks`
    - `DeferredView` receives `deferredTasks`
  - [x] Ensure surfacing runs on app load (no explicit action needed - useMemo recalculates)

- [x] **Task 4: Update view components to use filtered tasks** (AC: 1, 2, 3, 4)
  - [x] Update `TodayView.tsx`: Accept pre-filtered tasks prop (removed internal filtering)
  - [x] Update `TomorrowView.tsx`: Accept pre-filtered tasks prop (removed internal filtering)
  - [x] Update `DeferredView.tsx`: Accept pre-filtered tasks prop (kept category grouping, removed date filtering)
  - [x] Verify each view displays only its designated tasks

- [x] **Task 5: Handle edge cases** (AC: 1, 2, 3, 4, 6)
  - [x] Invalid date strings: treated as "someday" if has category, else Today (uses isValid from date-fns)
  - [x] Task with completedAt: excluded from ALL views
  - [x] Task with deferredTo but no category: stays in Today (not yet properly deferred)
  - [x] Timezone handling: uses local timezone (date-fns default behavior)

- [x] **Task 6: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors - PASSED
  - [x] Run `npm run dev` - server running at localhost:5175
  - [x] Manual testing - Test Gate PASSED by Vishal (2026-01-06)

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-4.md, this story:
- **Creates:** `src/hooks/useAutoSurface.ts`, possibly `src/utils/dates.ts`
- **Modifies:** `src/App.tsx` (integrate auto-surfacing), view components (accept filtered props)

Component patterns required (from architecture.md):
- Hooks use camelCase with `use` prefix: `useAutoSurface`
- Use date-fns for all date comparisons (isToday, isTomorrow, parseISO)
- No mutations - filtering creates new arrays
- Use useMemo for performance on filter operations

### Auto-Surfacing Logic

Per tech-spec-epic-4.md "Workflows and Sequencing":

```typescript
const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);

// Today View: tasks with no date (and no category) OR date is today, not completed
const todayTasks = tasks.filter(task =>
  !task.completedAt &&
  ((task.deferredTo === null && task.category === null) ||
   (task.deferredTo && isToday(parseISO(task.deferredTo))))
);

// Tomorrow View: tasks with date tomorrow, not completed
const tomorrowTasks = tasks.filter(task =>
  !task.completedAt &&
  task.deferredTo &&
  isTomorrow(parseISO(task.deferredTo))
);

// Deferred View: tasks with date > tomorrow OR no date but has category, not completed
const deferredTasks = tasks.filter(task =>
  !task.completedAt &&
  task.category !== null &&
  (task.deferredTo === null ||
   (!isToday(parseISO(task.deferredTo)) && !isTomorrow(parseISO(task.deferredTo))))
);
```

### Key Filtering Rules

| Task State | View |
|------------|------|
| No deferredTo, no category (new task) | Today |
| deferredTo = today's date | Today |
| deferredTo = tomorrow's date | Tomorrow |
| deferredTo = future date (>tomorrow), has category | Deferred |
| deferredTo = null, has category (Someday) | Deferred |
| completedAt set | None (filtered out) |

### Date-fns Usage

Per architecture.md: use date-fns for all date operations

```typescript
import { isToday, isTomorrow, parseISO } from 'date-fns';

// Compare task date to today
const taskDate = parseISO(task.deferredTo); // Parse ISO string to Date
isToday(taskDate); // true if today
isTomorrow(taskDate); // true if tomorrow
```

### Dependency on Story 4.1

This story requires Story 4.1 (localStorage persistence) because:
- Auto-surfacing needs tasks to persist across sessions
- On app load, tasks are loaded from localStorage, then filtered by date
- Without persistence, there's no meaningful "app load" scenario to test

If 4.1 is not complete, auto-surfacing can still be implemented using in-memory state, but the full UX (deferred task appearing next day) won't be testable without persistence.

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── hooks/
│   └── useAutoSurface.ts     # NEW: Date-based task filtering hook
├── utils/
│   └── dates.ts              # NEW or EXTEND: Date helper functions
├── views/
│   ├── TodayView.tsx         # MODIFY: Accept filtered tasks prop
│   ├── TomorrowView.tsx      # MODIFY: Accept filtered tasks prop
│   └── DeferredView.tsx      # MODIFY: Accept filtered tasks prop
└── App.tsx                   # MODIFY: Integrate useAutoSurface
```

### Edge Cases

Per tech-spec-epic-4.md:
- **Invalid date string**: parseISO returns Invalid Date, isToday/isTomorrow return false → treat as deferred
- **Timezone changes**: date-fns uses local timezone by default (acceptable per NFR)
- **Midnight edge case**: Task for "today" at 11:59pm vs 12:01am - handled by startOfDay comparison
- **No tasks**: Empty arrays returned, views show empty states (Story 4.4)

### Performance Considerations

Per tech-spec-epic-4.md:
- Auto-surface calculation: < 5ms (simple array filter operations)
- Use useMemo to prevent recalculation on every render
- Dependencies: [tasks] - only recalculate when tasks change

```typescript
const { todayTasks, tomorrowTasks, deferredTasks } = useMemo(() => {
  // filtering logic
}, [tasks]);
```

### Previous Story Context

**Previous story 4-1-localstorage-persistence has status "drafted" - not yet implemented.**

When 4-1 is implemented, it will provide:
- `storage.ts` with saveState/loadState utilities
- `useLocalStorage.ts` hook
- Persistence integration in `useTasks.ts`
- LOAD_STATE action in reducer

This story (4-2) builds on that foundation by filtering the loaded tasks by date.

### References

- [Source: notes/epics.md#Story-4.2] - Story definition with AC
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Story-4.2] - AC-4.2.1 through AC-4.2.6
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#APIs-and-Interfaces] - useAutoSurface hook signature
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Workflows-and-Sequencing] - Auto-surfacing logic
- [Source: notes/architecture.md#Data-Architecture] - Task interface, date handling
- [Source: notes/prd.md#Auto-Surfacing] - FR11, FR12, FR13 requirements

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/4-2-auto-surfacing.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-06: Implemented centralized useAutoSurface hook to replace distributed filtering logic in views
- Implementation approach: Single pass through tasks array, categorizing into today/tomorrow/deferred arrays
- Edge case handling: Added isValid() check from date-fns to handle invalid date strings
- Performance: useMemo with [tasks] dependency, single loop iteration for O(n) complexity

### Completion Notes List

- Created `useAutoSurface.ts` hook that centralizes all date-based filtering logic
- Removed redundant date-fns imports and filtering from TodayView, TomorrowView, DeferredView
- App.tsx now calls useAutoSurface and passes pre-filtered arrays to each view
- DeferredView retained its category grouping logic (only filtering was removed)
- Build passes with no TypeScript errors
- Dev server running successfully
- Test Gate PASSED by Vishal (2026-01-06)

### File List

**New Files:**
- `today-app/src/hooks/useAutoSurface.ts` - Date-based task filtering hook

**Modified Files:**
- `today-app/src/App.tsx` - Integrated useAutoSurface hook, passes filtered tasks to views
- `today-app/src/views/TodayView.tsx` - Removed internal filtering, accepts pre-filtered tasks
- `today-app/src/views/TomorrowView.tsx` - Removed internal filtering, accepts pre-filtered tasks
- `today-app/src/views/DeferredView.tsx` - Removed date filtering (kept category grouping), accepts pre-filtered tasks

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (4-2-auto-surfacing) | SM Agent |
| 2026-01-06 | Implementation complete - useAutoSurface hook created, views updated | Dev Agent |
| 2026-01-06 | Story marked done | Vishal |
