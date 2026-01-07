# Story 4.4: Empty States Polish

Status: done

## Story

As a **user**,
I want **friendly empty state messages throughout the app**,
so that **I know what to do when views are empty and feel guided rather than confused**.

## Acceptance Criteria

1. **AC-4.4.1**: Given I am on the Today tab with no tasks, the empty state shows:
   - "Nothing for today."
   - "Add a task to get started."

2. **AC-4.4.2**: Given I am on the Tomorrow tab with no tasks, the empty state shows: "Nothing planned for tomorrow."

3. **AC-4.4.3**: Given I am on the Deferred tab with no tasks, the empty state shows: "No deferred tasks. Everything is in Today or Tomorrow!"

4. **AC-4.4.4**: All empty state text uses muted-foreground color (#64748b)

5. **AC-4.4.5**: Empty state text is centered in the content area

6. **AC-4.4.6**: The Add task input is visible below the Today empty state

## Frontend Test Gate

**Gate ID**: 4-4-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Stories 4.1, 4.2, 4.3 complete (persistence, auto-surfacing, toasts working)
- [ ] Test user: Any (no auth required)
- [ ] Starting state: App loaded with NO tasks (clear localStorage if needed)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Clear all localStorage data | Browser DevTools → Application → localStorage | App state reset |
| 2 | Refresh the app | Browser refresh | App loads fresh |
| 3 | Look at Today tab (should be active by default) | Main content area | Empty state shows "Nothing for today." and "Add a task to get started." |
| 4 | Verify Add task input is visible | Below empty state message | Input field with "Add a task..." placeholder visible |
| 5 | Click Tomorrow tab | Tab bar | Tab switches to Tomorrow view |
| 6 | Look at Tomorrow empty state | Main content area | Shows "Nothing planned for tomorrow." |
| 7 | Click Deferred tab | Tab bar | Tab switches to Deferred view |
| 8 | Look at Deferred empty state | Main content area | Shows "No deferred tasks. Everything is in Today or Tomorrow!" |
| 9 | Inspect empty state text color | Browser DevTools | Text color is #64748b (muted-foreground) |
| 10 | Verify text is centered | Main content area | Text is horizontally and vertically centered in content area |
| 11 | Add a task in Today view | Add task input | Task appears, empty state disappears |
| 12 | Complete/delete all tasks | Task cards | Empty state reappears |

### Success Criteria (What User Sees)
- [ ] Today empty state shows correct two-line message
- [ ] Tomorrow empty state shows correct one-line message
- [ ] Deferred empty state shows correct one-line message
- [ ] All empty state text is muted gray color (#64748b)
- [ ] All empty state text is centered horizontally
- [ ] Add task input is visible on Today empty state
- [ ] Empty states only appear when view has 0 tasks
- [ ] Empty states disappear when tasks are added
- [ ] Empty states reappear when all tasks are removed
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Are the empty state messages friendly and encouraging?
2. Is it clear what action to take (add a task)?
3. Does the muted text color feel appropriate (not too faint, not too prominent)?
4. Any UX friction or confusion with empty states?

## Tasks / Subtasks

- [x] **Task 1: Create EmptyState component** (AC: 4, 5)
  - [x] Create `today-app/src/components/EmptyState.tsx`
  - [x] Define props interface:
    ```typescript
    interface EmptyStateProps {
      title: string;
      subtitle?: string;
      children?: React.ReactNode;
    }
    ```
  - [x] Style container: flex, items-center, justify-center, flex-col
  - [x] Style title: text-muted-foreground (#64748b), text-center, text-base
  - [x] Style subtitle: text-muted-foreground, text-center, text-sm
  - [x] Add gap between title and subtitle (space-2)
  - [x] Allow children for additional content (e.g., Add task input)
  - [x] Export as named export

- [x] **Task 2: Update TodayView with empty state** (AC: 1, 6)
  - [x] Open `today-app/src/views/TodayView.tsx`
  - [x] Import EmptyState component
  - [x] Check if todayTasks.length === 0
  - [x] If empty, render:
    ```tsx
    <EmptyState
      title="Nothing for today."
      subtitle="Add a task to get started."
    >
      <AddTaskInput />
    </EmptyState>
    ```
  - [x] Ensure AddTaskInput is visible in empty state
  - [x] Verify empty state disappears when tasks exist

- [x] **Task 3: Update TomorrowView with empty state** (AC: 2)
  - [x] Open `today-app/src/views/TomorrowView.tsx`
  - [x] Import EmptyState component
  - [x] Check if tomorrowTasks.length === 0
  - [x] If empty, render:
    ```tsx
    <EmptyState title="Nothing planned for tomorrow." />
    ```
  - [x] Verify empty state disappears when tasks exist

- [x] **Task 4: Update DeferredView with empty state** (AC: 3)
  - [x] Open `today-app/src/views/DeferredView.tsx`
  - [x] Import EmptyState component
  - [x] Check if deferredTasks.length === 0
  - [x] If empty, render:
    ```tsx
    <EmptyState title="No deferred tasks. Everything is in Today or Tomorrow!" />
    ```
  - [x] Verify empty state disappears when tasks exist

- [x] **Task 5: Verify styling consistency** (AC: 4, 5)
  - [x] Confirm text color is #64748b (Tailwind: text-slate-500 or text-muted-foreground)
  - [x] Confirm text is centered horizontally (text-center)
  - [x] Confirm vertical centering in available content area
  - [x] Test on different viewport sizes (mobile, tablet, desktop)
  - [x] Verify spacing looks balanced

- [x] **Task 6: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Run `npm run dev` and test:
    - [x] Clear localStorage, verify Today empty state
    - [x] Navigate to Tomorrow, verify empty state
    - [x] Navigate to Deferred, verify empty state
    - [x] Add task, verify empty state disappears
    - [x] Delete all tasks, verify empty state reappears
    - [x] Check text color matches #64748b
    - [x] Check centering on all views
    - [x] Check Add input visible on Today empty state
  - [x] Verify no console errors
  - [x] Test on mobile viewport (responsive)

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-4.md, this story:
- **Creates:** `src/components/EmptyState.tsx`
- **Modifies:** `src/views/TodayView.tsx`, `src/views/TomorrowView.tsx`, `src/views/DeferredView.tsx`

Component patterns required (from architecture.md):
- Functional components with TypeScript
- Named exports (not default)
- Arrow function syntax
- Destructure props in function signature
- Tailwind CSS for styling

### Empty State Component Pattern

Per UX spec (Section 7.2 Empty States):

```typescript
// src/components/EmptyState.tsx
export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const EmptyState = ({ title, subtitle, children }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-slate-500 text-base">{title}</p>
      {subtitle && (
        <p className="text-slate-500 text-sm mt-2">{subtitle}</p>
      )}
      {children && (
        <div className="mt-6 w-full max-w-md">
          {children}
        </div>
      )}
    </div>
  );
};
```

### Empty State Messages (from UX Spec)

| View | Primary Message | Secondary Message |
|------|-----------------|-------------------|
| Today | "Nothing for today." | "Add a task to get started." |
| Tomorrow | "Nothing planned for tomorrow." | (none) |
| Deferred | "No deferred tasks. Everything is in Today or Tomorrow!" | (none) |

### Styling Reference

Per UX spec design tokens:
- `--muted-foreground: #64748b` (Tailwind: `text-slate-500`)
- `--background: #f8fafc` (page background)
- `--font-body: 'DM Sans'` (text font)

Empty state should blend naturally with the paper-like aesthetic - not too prominent, not too faint.

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── components/
│   └── EmptyState.tsx         # NEW: Reusable empty state component
├── views/
│   ├── TodayView.tsx          # MODIFY: Add empty state
│   ├── TomorrowView.tsx       # MODIFY: Add empty state
│   └── DeferredView.tsx       # MODIFY: Add empty state
```

### Dependency on Previous Stories

This story builds on:
- **Story 4.1**: localStorage persistence provides data state
- **Story 4.2**: Auto-surfacing determines which tasks appear in which view
- **Story 4.3**: Toast notifications pattern (unrelated but completes Epic 4)

Empty states show when views have 0 tasks after filtering by date (useAutoSurface logic from Story 4.2).

### Learnings from Previous Story

**From Story 4-3-toast-notifications (Status: in-progress)**

The previous story is currently in development. Key implementation notes:
- Toast context pattern being created for global state
- CSS transitions used for slide animations
- Component styling follows Tailwind utility-first approach
- Pattern: check length === 0 before rendering conditional content

For this story:
- EmptyState is a simple presentational component (no state needed)
- Can reuse the conditional rendering pattern from toast stacking
- Styling will match the muted, minimal aesthetic established in previous stories
- Tailwind classes should be consistent with existing view components

[Source: notes/sprint-artifacts/4-3-toast-notifications.md#Dev-Notes]

### Implementation Notes

1. **Keep it simple:** EmptyState is a pure presentational component - no hooks, no context
2. **Reusable:** Design EmptyState to be usable across all three views with props
3. **Add input placement:** On Today view, AddTaskInput should be a child of EmptyState
4. **Conditional rendering:** Views should check `tasks.length === 0` before showing empty state
5. **Accessibility:** Ensure empty state text has sufficient contrast and is readable by screen readers

### References

- [Source: notes/epics.md#Story-4.4] - Story definition
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Story-4.4] - AC-4.4.1 through AC-4.4.6
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Detailed-Design] - Empty state component spec
- [Source: notes/ux-design-specification.md#Empty-States] - Empty state messages and styling
- [Source: notes/architecture.md#Implementation-Patterns] - Component patterns

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/4-4-empty-states-polish.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- 2026-01-06: Implementation plan - Create reusable EmptyState component, refactor inline empty states in 3 views
- 2026-01-06: Build passed with no TypeScript errors

### Completion Notes List

- Created `EmptyState.tsx` as a reusable presentational component with title, subtitle, and children props
- Refactored TodayView to use EmptyState with AddTaskInput as child (AC-4.4.1, AC-4.4.6)
- Refactored TomorrowView to use EmptyState with single-line message per UX spec (AC-4.4.2)
- Refactored DeferredView to use EmptyState with combined single-line message (AC-4.4.3)
- All empty states use `text-muted-foreground` class for #64748b color (AC-4.4.4)
- All empty states centered with flex layout (AC-4.4.5)
- Build verification passed - no TypeScript errors
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Action | Description |
|------|--------|-------------|
| today-app/src/components/EmptyState.tsx | Created | Reusable empty state component |
| today-app/src/views/TodayView.tsx | Modified | Refactored to use EmptyState component |
| today-app/src/views/TomorrowView.tsx | Modified | Refactored to use EmptyState component |
| today-app/src/views/DeferredView.tsx | Modified | Refactored to use EmptyState component |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (4-4-empty-states-polish) | SM Agent |
| 2026-01-06 | Implementation complete - EmptyState component created, all views refactored | Dev Agent |
| 2026-01-06 | Frontend Test Gate PASSED - Story ready for review | Dev Agent |
