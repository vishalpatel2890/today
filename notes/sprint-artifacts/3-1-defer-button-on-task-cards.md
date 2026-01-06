# Story 3.1: Defer Button on Task Cards

Status: done

## Story

As a **user**,
I want **to see a defer button on each task**,
so that **I can initiate the deferment workflow**.

## Acceptance Criteria

1. **AC-3.1.1**: Given I hover over a task card on desktop, a clock icon (defer button) appears in the actions area before the trash icon

2. **AC-3.1.2**: Given I click the defer button (clock icon), a modal dialog opens (placeholder for now)

3. **AC-3.1.3**: Given I am on mobile (< 768px), the defer button is always visible in the task card actions area (no hover required)

4. **AC-3.1.4**: Given the modal opens on desktop, it appears centered on the screen; on mobile, it appears as a bottom sheet

## Frontend Test Gate

**Gate ID**: 3-1-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Epic 2 complete (TaskCard, TaskList, TodayView, useTasks with ADD/COMPLETE/DELETE)
- [ ] Starting state: Today tab selected, at least 2 tasks visible in the list
- [ ] Test user: Any (no auth required)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | App loads with Today tab selected |
| 2 | Add 2 tasks if none exist | Add task input | Tasks "Task A", "Task B" visible |
| 3 | Hover over "Task A" (desktop) | Task card | Clock icon (defer button) appears in actions area |
| 4 | Verify icon order | Actions area | Clock icon appears BEFORE trash icon |
| 5 | Click clock icon | Task card actions | Modal opens centered on screen |
| 6 | Verify modal content | Modal dialog | Shows "Defer Modal Coming Soon" placeholder text |
| 7 | Close modal (click X or outside) | Modal overlay | Modal closes, task unchanged |
| 8 | Resize browser to mobile (<768px) | Browser window | Clock icon visible without hover |
| 9 | Click clock icon on mobile | Task card actions | Modal opens as bottom sheet (slides up from bottom) |
| 10 | Close modal on mobile | Modal overlay | Modal slides down and closes |

### Success Criteria (What User Sees)
- [ ] Clock icon appears on hover (desktop) or always visible (mobile)
- [ ] Clock icon positioned before trash icon in actions area
- [ ] Clicking clock icon opens modal dialog
- [ ] Modal is centered on desktop viewport
- [ ] Modal is bottom sheet on mobile viewport
- [ ] Modal can be closed without side effects
- [ ] Task remains unchanged after closing modal
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Was the clock icon easy to discover (hover on desktop)?
2. Is the icon clearly recognizable as "defer" functionality?
3. Did the modal open/close smoothly?
4. On mobile, does the bottom sheet feel natural?

## Tasks / Subtasks

- [x] **Task 1: Install Radix Dialog dependency** (AC: 2, 4)
  - [x] Verify @radix-ui/react-dialog is in package.json
  - [x] If not installed: `npm install @radix-ui/react-dialog`

- [x] **Task 2: Create placeholder DeferModal component** (AC: 2, 4)
  - [x] Create `today-app/src/components/DeferModal.tsx`
  - [x] Import Dialog primitives from @radix-ui/react-dialog
  - [x] Create DeferModalProps interface:
    ```typescript
    interface DeferModalProps {
      task: Task;
      isOpen: boolean;
      onClose: () => void;
    }
    ```
  - [x] Build modal structure with Radix Dialog:
    - Dialog.Root (controlled by isOpen)
    - Dialog.Portal
    - Dialog.Overlay (backdrop with bg-black/50)
    - Dialog.Content (white card with rounded corners)
    - Dialog.Title ("Defer Task")
    - Dialog.Close (X button)
  - [x] Add placeholder content: "Defer Modal Coming Soon"
  - [x] Style for desktop: centered, max-w-md, shadow-lg
  - [x] Style for mobile: fixed bottom-0, w-full, rounded-t-lg (bottom sheet)

- [x] **Task 3: Add Clock icon to TaskCard** (AC: 1, 3)
  - [x] Open `today-app/src/components/TaskCard.tsx`
  - [x] Import Clock icon from lucide-react
  - [x] Update TaskCardProps: add `onDefer: (id: string) => void`
  - [x] Add defer button in task-actions area BEFORE trash icon:
    - Use Clock icon (18px)
    - Style: `text-muted-foreground hover:text-primary`
    - Accessible aria-label: "Defer task"
  - [x] Apply responsive visibility:
    - `opacity-100 md:opacity-0 md:group-hover:opacity-100` (mobile always, desktop on hover)

- [x] **Task 4: Add modal state management to TaskCard** (AC: 2)
  - [x] Add local state: `const [isDeferModalOpen, setIsDeferModalOpen] = useState(false)`
  - [x] Create handleDeferClick: `() => setIsDeferModalOpen(true)`
  - [x] Attach handleDeferClick to clock icon button
  - [x] Render DeferModal with:
    - task={task}
    - isOpen={isDeferModalOpen}
    - onClose={() => setIsDeferModalOpen(false)}

- [x] **Task 5: Update TaskList to pass onDefer prop** (AC: 2)
  - [x] Open `today-app/src/components/TaskList.tsx`
  - [x] TaskListProps: verify/add `onDefer?: (id: string) => void` (optional for now)
  - [x] Pass onDefer to each TaskCard (can be no-op placeholder)

- [x] **Task 6: Update TodayView to pass onDefer prop** (AC: 2)
  - [x] Open `today-app/src/views/TodayView.tsx`
  - [x] TodayViewProps: verify/add `onDeferTask?: (id: string) => void`
  - [x] Pass onDefer to TaskList

- [x] **Task 7: Wire up placeholder in App.tsx** (AC: 2)
  - [x] Open `today-app/src/App.tsx`
  - [x] Create placeholder deferTask function:
    ```typescript
    const deferTask = useCallback((id: string) => {
      console.log('[Today] Defer requested for task:', id);
      // Full implementation in Story 3.4
    }, []);
    ```
  - [x] Pass deferTask to TodayView as onDeferTask

- [x] **Task 8: Style bottom sheet for mobile** (AC: 4)
  - [x] In DeferModal.tsx, use Tailwind responsive classes:
    ```tsx
    // Desktop: centered modal
    // Mobile: bottom sheet
    <Dialog.Content className="
      fixed left-1/2 -translate-x-1/2
      md:top-1/2 md:-translate-y-1/2
      bottom-0 md:bottom-auto
      w-full md:max-w-md
      rounded-t-2xl md:rounded-lg
      bg-surface p-6 shadow-lg
    ">
    ```
  - [x] Add slide-up animation for mobile with CSS transform

- [x] **Task 9: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Test hover to reveal clock icon (desktop)
  - [x] Test click clock icon opens modal
  - [x] Test modal centered on desktop
  - [x] Test mobile viewport - clock icon always visible
  - [x] Test modal as bottom sheet on mobile
  - [x] Test closing modal (X button, click outside, Escape key)
  - [x] Verify no console errors

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-3.md, this story creates:
- **DeferModal.tsx**: New component using Radix Dialog
- **TaskCard.tsx**: Extended with defer button (Clock icon)

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports: `export const DeferModal = () => { ... }`
- Destructure props in function signature

### Radix Dialog Pattern

Per architecture.md Section "Integration Points":
- Use @radix-ui/react-dialog for accessible modal
- Modal should be controlled (isOpen prop)
- Use Dialog.Portal to render outside component tree

### Task Card Actions Pattern

Per UX spec Section 6.1 and tech-spec-epic-3.md:
- Actions visible on hover (desktop)
- Actions always visible on mobile
- Icon order: Defer (Clock) → Delete (Trash)
- Icons: 18px, text-muted-foreground, hover effects

### Mobile Bottom Sheet Pattern

Per AC-3.1.4 and tech-spec-epic-3.md:
- Desktop: centered modal with backdrop
- Mobile (<768px): slides up from bottom, rounded top corners
- Can use Tailwind responsive classes for positioning

### Learnings from Previous Story

**From Story 2-4-delete-task (Status: done)**

- **Actions Pattern Established**: Trash icon with `opacity-100 md:opacity-0 md:group-hover:opacity-100`
- **TaskCard Props**: Already has `onDelete` - add parallel `onDefer` prop
- **Group Hover**: TaskCard already has `group` class for hover detection
- **Icon Size**: Trash uses `w-[18px] h-[18px]` - use same for Clock
- **Prop Threading**: TaskCard → TaskList → TodayView → App pattern established
- **Build Size**: 219.43KB JS, 15.67KB CSS - modal will add ~5-10KB

**Key Implementation Notes from 2-4:**
- Delete button uses: `className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"`
- Icons use: `text-muted-foreground` with hover state
- Confirmation before action (window.confirm) - Defer modal serves similar purpose

**Files Modified in 2-4 (relevant pattern):**
- `useTasks.ts` - action patterns
- `TaskCard.tsx` - action button patterns
- `TaskList.tsx` - prop threading
- `TodayView.tsx` - prop threading
- `App.tsx` - hook wiring

[Source: notes/sprint-artifacts/2-4-delete-task.md#Dev-Agent-Record]

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── components/
│   ├── DeferModal.tsx     # NEW: Placeholder defer modal
│   └── TaskCard.tsx       # MODIFIED: Add Clock icon, modal state
│   └── TaskList.tsx       # MODIFIED: Pass onDefer prop
├── views/
│   └── TodayView.tsx      # MODIFIED: Pass onDeferTask prop
└── App.tsx                # MODIFIED: Add placeholder deferTask
```

### Dependencies

Existing (verify installed):
- @radix-ui/react-dialog (for modal)
- lucide-react (Clock icon)

Per tech-spec-epic-3.md, @radix-ui/react-dialog should be ^1.1.15.

### References

- [Source: notes/epics.md#Story-3.1] - Story definition and acceptance criteria
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Story-3.1] - AC-3.1.1 through AC-3.1.4
- [Source: notes/sprint-artifacts/tech-spec-epic-3.md#Detailed-Design] - DeferModal design
- [Source: notes/architecture.md#Project-Structure] - Component locations
- [Source: notes/architecture.md#Integration-Points] - Radix Dialog usage

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/3-1-defer-button-on-task-cards.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Verified @radix-ui/react-dialog ^1.1.15 already in package.json
- Created DeferModal.tsx with Radix Dialog primitives
- Added Clock icon to TaskCard before Trash icon
- Used responsive visibility pattern: `opacity-100 md:opacity-0 md:group-hover:opacity-100`
- Modal positioned: bottom-0 (mobile) / centered (desktop via md:top-1/2 md:-translate-y-1/2)
- Added fadeIn and slideUp animations to index.css
- Build passes: 254.34KB JS (80.19KB gzipped), 17.91KB CSS

### Completion Notes List

- Created DeferModal.tsx using Radix Dialog with controlled isOpen prop
- Modal shows task text and "Defer Modal Coming Soon" placeholder
- Clock icon added to TaskCard in flex container before Trash icon
- Icons grouped in div with gap-2 for consistent spacing
- Modal closes via X button, click outside, or Escape key (Radix handles all)
- onDefer prop threaded through: TaskCard → TaskList → TodayView → App
- Placeholder deferTask uses useCallback with console.log for future Story 3.4
- CSS animations: fadeIn (150ms), slideUp (200ms mobile), slideUpDesktop (200ms desktop)
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Status | Description |
|------|--------|-------------|
| today-app/src/components/DeferModal.tsx | Created | Placeholder defer modal with Radix Dialog |
| today-app/src/components/TaskCard.tsx | Modified | Added Clock icon, isDeferModalOpen state, DeferModal render |
| today-app/src/components/TaskList.tsx | Modified | Added onDefer prop, pass to TaskCard |
| today-app/src/views/TodayView.tsx | Modified | Added onDeferTask prop, pass to TaskList |
| today-app/src/App.tsx | Modified | Added deferTask callback with useCallback |
| today-app/src/index.css | Modified | Added fadeIn, slideUp, slideUpDesktop animations |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (3-1-defer-button-on-task-cards) | SM Agent |
| 2026-01-06 | Implemented all 9 tasks: DeferModal, Clock icon, prop threading, animations | Dev Agent |
