# Story 1.1: Global Keyboard Shortcut Registration

Status: review

## Story

As a power user,
I want to press `Cmd+Shift+T` from anywhere in the app,
so that I can quickly access time tracking without navigating menus.

## Acceptance Criteria

1. Pressing `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows) opens the Time Tracking modal from any view in the app
2. The shortcut is prevented from triggering browser default behavior (e.g., reopen closed tab)
3. If the modal is already open, pressing the shortcut closes it (toggle behavior)
4. The shortcut works regardless of focus state, except when in text input fields (input/textarea)
5. Double-tap detection: If second `T` keypress occurs within 300ms of `Cmd+Shift+T`, the insights callback is triggered instead
6. Single tap: If no second `T` within 300ms, the tracking modal opens

## Frontend Test Gate

**Gate ID**: 1-1-TG1

### Prerequisites
- [ ] App running locally at http://localhost:5173
- [ ] Any user state (logged in or anonymous)
- [ ] Starting state: Main task list view visible

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Press `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Win) | Anywhere in app | Time Tracking modal opens |
| 2 | Press `Cmd+Shift+T` again while modal is open | With modal visible | Modal closes |
| 3 | Press `Cmd+Shift+T` while focused on a regular div/button | Non-input element | Modal opens |
| 4 | Click on a task title input, then press `Cmd+Shift+T` | Inside text input | Modal should NOT open |
| 5 | Press `Cmd+Shift+T` followed quickly by `T` (within 300ms) | Anywhere in app | Insights modal callback triggered (can verify via console log if modal not yet built) |
| 6 | Press `Cmd+Shift+T` and wait 500ms, no second `T` | Anywhere in app | Tracking modal opens after delay |

### Success Criteria (What User Sees)
- [ ] Keyboard shortcut opens modal from any non-input context
- [ ] Toggle behavior works (open → close → open)
- [ ] Browser does not reopen a closed tab when shortcut is pressed
- [ ] Text input fields are not interrupted by the shortcut
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you trigger the modal without confusion using the keyboard shortcut?
2. Did the modal appear within acceptable time (<100ms)?
3. Was the toggle behavior intuitive (press again to close)?
4. Any unexpected browser behavior when pressing the shortcut?

## Tasks / Subtasks

- [x] Task 1: Create TypeScript types for time tracking (AC: 1-6)
  - [x] Create `src/types/timeTracking.ts` with `ActiveSession` and related interfaces
  - [x] Export types for use across time tracking components

- [x] Task 2: Implement `useTimeTrackingHotkeys` hook (AC: 1, 2, 3, 4, 5, 6)
  - [x] Create `src/hooks/useTimeTrackingHotkeys.ts`
  - [x] Add `document.addEventListener('keydown')` in useEffect
  - [x] Detect `Cmd/Ctrl + Shift + T` combination
  - [x] Call `e.preventDefault()` to block browser default behavior
  - [x] Check if `activeElement` is input/textarea and skip if so
  - [x] Implement double-tap detection with 300ms threshold using `useRef` for timing
  - [x] Use `setTimeout` for single-tap delayed callback
  - [x] Accept `onOpenTracking` and `onOpenInsights` callbacks as parameters
  - [x] Clean up event listener in useEffect cleanup

- [x] Task 3: Create placeholder TimeTrackingModal component (AC: 1, 3)
  - [x] Create `src/components/time-tracking/TimeTrackingModal.tsx`
  - [x] Use Radix Dialog for modal shell (consistent with existing modals)
  - [x] Accept `isOpen` and `onClose` props
  - [x] Add placeholder content "Time Tracking Modal" for now (full UI in Story 1.2)

- [x] Task 4: Integrate hotkey hook in App.tsx (AC: 1, 3)
  - [x] Add modal open state: `const [isTimeTrackingOpen, setIsTimeTrackingOpen] = useState(false)`
  - [x] Call `useTimeTrackingHotkeys` with toggle callbacks
  - [x] Render `TimeTrackingModal` component conditionally

- [x] Task 5: Write unit tests for hotkey detection (AC: 1, 2, 4, 5, 6)
  - [x] Test Cmd+Shift+T detection on Mac
  - [x] Test Ctrl+Shift+T detection on Windows
  - [x] Test `preventDefault` is called
  - [x] Test input field exclusion logic
  - [x] Test double-tap detection timing
  - [x] Test single-tap delayed callback

- [x] Task 6: Manual browser testing across browsers (AC: 1, 2, 3, 4)
  - [x] Test in Chrome
  - [x] Test in Safari
  - [x] Test in Firefox
  - [x] Verify browser default (reopen tab) is blocked

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Keyboard Shortcut Implementation (ADR-TT-003):**
- Use native `document.addEventListener('keydown')` in a custom hook
- No external keyboard shortcut libraries (keep bundle small)
- Handle both Mac (`e.metaKey`) and Windows (`e.ctrlKey`) modifiers
- Double-tap threshold of 300ms for insights modal trigger

**Component Structure:**
- Hook registered at `App.tsx` level for global scope
- `useTimeTrackingHotkeys` follows existing hook patterns (arrow functions, named exports)
- Timing logic uses `useRef` to track `lastTriggerRef.current` timestamp

**Browser Behavior:**
- `Cmd+Shift+T` reopens closed tabs in Chrome/Safari - must call `e.preventDefault()`
- `Ctrl+Shift+T` reopens closed tabs in Chrome/Firefox on Windows - same prevention needed

**Input Field Exclusion:**
- Check `document.activeElement?.tagName` for 'INPUT', 'TEXTAREA'
- Also check for `contenteditable` attribute on active element

### Project Structure Notes

New files to create:
```
src/
├── types/
│   └── timeTracking.ts         # TypeScript interfaces
├── hooks/
│   └── useTimeTrackingHotkeys.ts  # Global keyboard shortcuts
└── components/
    └── time-tracking/
        └── TimeTrackingModal.tsx  # Placeholder modal (full UI in 1.2)
```

Integration point:
- `App.tsx` - Add hook call and modal render

### Testing Standards

Per existing patterns:
- Unit tests with Vitest
- Use `@testing-library/react` for hook testing via `renderHook`
- Mock `document.addEventListener` and `KeyboardEvent` for hotkey tests
- Test timing logic with `jest.useFakeTimers()` or Vitest equivalent

### References

- [Source: notes/architecture-time-tracking.md#ADR-TT-003] - Native keyboard shortcut hook decision
- [Source: notes/architecture-time-tracking.md#Implementation Patterns] - Hook patterns and component structure
- [Source: notes/epics-time-tracking.md#Story 1.1] - Original story requirements and acceptance criteria
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC1] - Authoritative acceptance criteria AC1.1-AC1.4
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#AC7] - Double-tap detection infrastructure AC7.1-AC7.2
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Detailed Design: Workflows] - Hotkey flow sequence
- [Source: notes/ux-design-time-tracking.md#7.2 Hotkey Implementation] - UX hotkey specifications

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/1-1-global-keyboard-shortcut-registration.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-10: Implementation plan - Create types, hook, modal, integrate in App.tsx, write tests
- All 18 unit tests pass for useTimeTrackingHotkeys hook
- Build successful, no TypeScript errors

### Completion Notes List

- Created ActiveSession and TimeEntry interfaces for future stories
- Implemented double-tap detection with 300ms threshold using useRef for timing
- Hook uses native document.addEventListener per ADR-TT-003 (no external libraries)
- Modal uses Radix Dialog with same styling as existing modals (DeferModal, LinkEmailModal)
- Toggle behavior implemented in App.tsx using setIsTimeTrackingOpen(prev => !prev)
- Console.log placeholder for insights modal double-tap (Epic 2)
- ✅ Test Gate PASSED by Vishal (2026-01-10)

### File List

- NEW: today-app/src/types/timeTracking.ts
- NEW: today-app/src/hooks/useTimeTrackingHotkeys.ts
- NEW: today-app/src/hooks/useTimeTrackingHotkeys.test.ts
- NEW: today-app/src/components/time-tracking/TimeTrackingModal.tsx
- MODIFIED: today-app/src/App.tsx

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-10 | SM Agent | Initial story creation from sprint-status backlog |
| 2026-01-10 | Dev Agent | Implemented Tasks 1-5: types, hook, modal, App.tsx integration, unit tests |
| 2026-01-10 | Dev Agent | Task 6 complete, Test Gate PASSED, story ready for review |
