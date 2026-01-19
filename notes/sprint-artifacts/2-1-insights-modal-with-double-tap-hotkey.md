# Story 2.1: Insights Modal with Double-Tap Hotkey

Status: done

## Story

As a power user,
I want to double-tap `Cmd+Shift+T T` to open a dedicated insights view,
so that I can quickly see my time tracking data without interfering with the tracking modal.

## Acceptance Criteria

1. When I press `Cmd+Shift+T` and then press `T` again within 300ms (while still holding Cmd+Shift), the Insights modal opens instead of the Tracking modal
2. When the Insights modal is open and I press Escape or click the X button or click outside the modal, the modal closes and I return to the main app
3. When the Insights modal is open and I press `Cmd+Shift+T T` again, the modal closes (toggle behavior)
4. The Insights modal uses the larger size (420px width per UX spec)
5. The modal has title "Time Insights" with close button
6. The modal is scrollable if content exceeds 80vh
7. Single-tap `Cmd+Shift+T` continues to open the Tracking modal (not insights) after 300ms delay

## Frontend Test Gate

**Gate ID**: 2-1-TG1

### Prerequisites
- [ ] App running locally at http://localhost:5173
- [ ] User is logged in (any user)
- [ ] At least 1 time entry exists in IndexedDB (from Epic 1 testing)
- [ ] Browser DevTools open for console verification

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Press `Cmd+Shift+T` once, wait 500ms | Anywhere in app | Tracking modal opens (idle or active state) |
| 2 | Press Escape to close modal | Tracking modal | Modal closes |
| 3 | Press `Cmd+Shift+T` then quickly `T` (within 300ms, holding modifiers) | Anywhere in app | Insights modal opens (NOT tracking modal) |
| 4 | Verify Insights modal content | Insights modal | Title "Time Insights", X button visible, 420px width |
| 5 | Press Escape | Insights modal | Modal closes, return to main app |
| 6 | Repeat double-tap `Cmd+Shift+T T` | Anywhere in app | Insights modal opens again |
| 7 | Click X button | Insights modal header | Modal closes |
| 8 | Open insights again with double-tap | Anywhere | Insights modal opens |
| 9 | Click outside modal (overlay) | Modal backdrop | Modal closes |
| 10 | Open insights, then double-tap again | Insights modal open | Modal closes (toggle behavior) |

### Success Criteria (What User Sees)
- [x] Single-tap `Cmd+Shift+T` opens Tracking modal (after ~300ms delay)
- [x] Double-tap `Cmd+Shift+T T` opens Insights modal
- [x] Insights modal has title "Time Insights"
- [x] Insights modal is wider than Tracking modal (~420px vs ~320px)
- [x] X button visible in header
- [x] Escape key closes modal
- [x] Click outside closes modal
- [x] Double-tap when open closes modal (toggle)
- [x] Modal is scrollable if content overflows
- [x] No console errors in browser DevTools
- [x] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the double-tap detection reliable? Does it ever misfire?
2. Is the 300ms threshold comfortable or should it be adjusted?
3. Does the modal size feel appropriate for the insights content?
4. Is the close behavior (Escape, X, click outside, double-tap) intuitive?

## Tasks / Subtasks

- [x] Task 1: Extend useTimeTrackingHotkeys hook with double-tap detection (AC: 1, 7)
  - [x] Add `lastTriggerRef` to track timestamp of last `Cmd+Shift+T` press
  - [x] Define `DOUBLE_TAP_THRESHOLD = 300` constant
  - [x] On first trigger, set `lastTriggerRef.current = Date.now()` and schedule delayed single-tap action
  - [x] On trigger within threshold, cancel single-tap timeout and call `onOpenInsights()`
  - [x] Use `setTimeout` with cleanup to handle single-tap delay
  - [x] Ensure double-tap calls `onOpenInsights`, single-tap calls `onOpenTracking` after delay
  - [x] Write unit tests for timing logic with fake timers
  - **Note:** Already implemented from previous story - verified working

- [x] Task 2: Create TimeInsightsModal component shell (AC: 4, 5, 6)
  - [x] Create `src/components/time-tracking/TimeInsightsModal.tsx`
  - [x] Use Radix Dialog component (same pattern as TimeTrackingModal)
  - [x] Set modal width to 420px (desktop), full-width minus padding (mobile)
  - [x] Add title "Time Insights" with Playfair Display font (18px, weight 600)
  - [x] Add X close button in header with proper styling
  - [x] Set max-height to 80vh with `overflow-y: auto` for scrolling
  - [x] Accept `isOpen` and `onClose` props
  - [x] Implement focus trap and keyboard navigation

- [x] Task 3: Implement modal close behaviors (AC: 2, 3)
  - [x] Escape key closes modal (Radix default behavior)
  - [x] Click X button calls `onClose`
  - [x] Click outside modal (overlay) calls `onClose`
  - [x] Double-tap `Cmd+Shift+T T` when open triggers close (toggle)
  - [x] Add `isInsightsOpen` state to App.tsx or time tracking context
  - [x] Pass close callback to hotkey hook for toggle behavior

- [x] Task 4: Integrate TimeInsightsModal into App.tsx (AC: 1-3)
  - [x] Add `isInsightsModalOpen` state to App.tsx
  - [x] Add `handleOpenInsights` and `handleCloseInsights` callbacks
  - [x] Pass `onOpenInsights` to `useTimeTrackingHotkeys`
  - [x] Render `<TimeInsightsModal isOpen={isInsightsModalOpen} onClose={handleCloseInsights} />`
  - [x] Ensure tracking modal and insights modal don't conflict (only one open at a time)

- [x] Task 5: Add placeholder content for insights modal (AC: 4, 6)
  - [x] Add temporary placeholder content to verify scrolling works
  - [x] Include sections: "TODAY", "AVG / DAY", "BREAKDOWN", "RECENT ENTRIES" (placeholders for Story 2.2/2.3)
  - [x] Content structure per UX spec section 2.3
  - [x] Empty state: "Start tracking time to see insights here."

- [x] Task 6: Write unit tests for double-tap detection (AC: 1, 7)
  - [x] Test single-tap after 300ms delay opens tracking modal
  - [x] Test double-tap within 300ms opens insights modal
  - [x] Test double-tap at exactly 300ms boundary
  - [x] Test rapid triple-tap (should open insights once)
  - [x] Use `jest.useFakeTimers()` for timing control
  - [x] Add to `useTimeTrackingHotkeys.test.ts`
  - **Note:** Already implemented - verified complete test coverage exists

- [x] Task 7: Write component tests for TimeInsightsModal (AC: 2, 4, 5, 6)
  - [x] Test modal renders with correct title "Time Insights"
  - [x] Test X button click calls onClose
  - [x] Test Escape key calls onClose
  - [x] Test modal has correct width (420px)
  - [x] Test modal content is scrollable
  - [x] Test focus trap works

- [x] Task 8: Manual browser testing (AC: 1-7)
  - [x] Run through Frontend Test Gate checklist
  - [x] Test in Chrome
  - [x] Test on different views (task list, deferred, etc.)
  - [x] Verify no interference with existing keyboard shortcuts

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From Architecture (ADR-TT-003):**
- Use native `document.addEventListener('keydown')` with timing logic
- No additional dependencies (keep bundle small)
- Manual implementation of timing logic
- Handle both Mac (Cmd) and Windows (Ctrl)
- Fallback to `Cmd+Shift+I` available if double-tap unreliable

**Double-Tap Detection Pattern (from Architecture):**
```typescript
const lastTriggerRef = useRef<number>(0);
const DOUBLE_TAP_THRESHOLD = 300; // ms

// On trigger:
const now = Date.now();
const timeSinceLastTrigger = now - lastTriggerRef.current;

if (timeSinceLastTrigger < DOUBLE_TAP_THRESHOLD) {
  // Double-tap: open insights
  onOpenInsights();
  lastTriggerRef.current = 0;
} else {
  // Single tap: delayed to detect double-tap
  lastTriggerRef.current = now;
  setTimeout(() => {
    if (lastTriggerRef.current === now) {
      onOpenTracking();
    }
  }, DOUBLE_TAP_THRESHOLD);
}
```

**Modal Sizing (from UX spec section 4.2):**
- Insights Modal: 420px width (desktop), full-width minus padding (mobile)
- Max-height: 80vh with scrollable content
- Position: Centered (desktop), bottom sheet (mobile)

**Modal Components (from UX spec section 6.1):**
- Use existing Radix Dialog pattern
- Close button (X icon pattern from existing modals)
- Overlay (black/50 backdrop)

### Project Structure Notes

**Files to Create:**
```
src/components/time-tracking/
└── TimeInsightsModal.tsx    # NEW: Insights view modal shell
```

**Files to Modify:**
```
src/hooks/useTimeTrackingHotkeys.ts   # ADD double-tap detection
src/hooks/useTimeTrackingHotkeys.test.ts  # ADD timing tests
src/App.tsx                           # ADD insights modal state and render
```

**Existing Files to Reference (DO NOT recreate):**
- `src/components/time-tracking/TimeTrackingModal.tsx` - Pattern for modal structure
- `src/hooks/useTimeTracking.ts` - State management pattern
- `src/lib/timeFormatters.ts` - Duration formatting utilities (use in Story 2.2)

### Learnings from Previous Story

**From Story 1-4-view-active-tracking-and-stop-session (Status: done)**

- **New Files Created**:
  - `today-app/src/lib/timeFormatters.ts` - Duration formatting utilities (formatDuration, formatDurationSummary)
  - `today-app/src/lib/timeFormatters.test.ts` - 15 tests for formatters

- **Modified Files**:
  - `today-app/src/lib/timeTrackingDb.ts` - Now has timeEntries store (v2), saveTimeEntry, getTimeEntries, getTimeEntryById
  - `today-app/src/hooks/useTimeTracking.ts` - Has complete startTracking() and stopTracking()
  - `today-app/src/components/time-tracking/TimeTrackingModal.tsx` - Has Stop handler, success feedback, Enter key handling

- **Completion Notes from 1.4**:
  - 131 tests passing (up from 106)
  - Frontend Test Gate passed - all functionality verified
  - TimeEntry interface already exists in `src/types/timeTracking.ts`
  - timeTrackingDb has indexes for `id, date, task_id, [user_id+date]`

- **Integration Points for This Story**:
  - `useTimeTrackingHotkeys.ts` already exists with single-tap logic - extend for double-tap
  - TimeTrackingModal pattern can be copied for TimeInsightsModal structure
  - `getTimeEntries()` from timeTrackingDb available for Story 2.2/2.3

- **For Future Stories (2.2, 2.3)**:
  - `getTimeEntries(dateRange?)` ready for use
  - `formatDurationSummary(ms)` ready for display
  - TimeEntry interface includes all fields for aggregation

[Source: notes/sprint-artifacts/1-4-view-active-tracking-and-stop-session.md#Dev-Agent-Record]

### References

- [Source: notes/epics-time-tracking.md#Story 2.1] - Story acceptance criteria and technical notes
- [Source: notes/architecture-time-tracking.md#ADR-TT-003] - Native keyboard shortcut hook pattern
- [Source: notes/architecture-time-tracking.md#Implementation Patterns] - Double-tap detection code pattern
- [Source: notes/ux-design-time-tracking.md#4.2 Modal Sizing] - Insights modal dimensions
- [Source: notes/ux-design-time-tracking.md#5.3 Flow: View Insights] - User flow for insights
- [Source: notes/ux-design-time-tracking.md#6.1 Component Strategy] - Modal shell pattern
- [Source: notes/ux-design-time-tracking.md#7.2 Hotkey Implementation] - Double-tap detection spec
- [Source: notes/PRD-time-tracking.md#FR13] - Open insights via keyboard shortcut
- [Source: notes/PRD-time-tracking.md#FR19] - Close insights modal

## Dev Agent Record

### Context Reference

- [Story Context XML](./2-1-insights-modal-with-double-tap-hotkey.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-10: Verified useTimeTrackingHotkeys.ts already has complete double-tap detection (Tasks 1, 6 pre-implemented)
- 2026-01-10: Created TimeInsightsModal following TimeTrackingModal pattern
- 2026-01-10: Integrated modal into App.tsx with toggle behavior and mutual exclusion with tracking modal
- 2026-01-10: All 144 tests pass (13 new tests for TimeInsightsModal)

### Completion Notes List

- Double-tap detection was already fully implemented in `useTimeTrackingHotkeys.ts` with complete test coverage from Epic 1
- Created `TimeInsightsModal.tsx` following Radix Dialog pattern from `TimeTrackingModal.tsx`
- Modal has 420px width (vs 320px for tracking modal), 80vh max-height with scrolling
- Placeholder content includes TODAY, AVG/DAY cards and BREAKDOWN, RECENT ENTRIES sections for Stories 2.2/2.3
- App.tsx updated to toggle insights modal on double-tap and ensure mutual exclusion with tracking modal
- 13 new component tests added for TimeInsightsModal covering rendering, close behaviors, and accessibility

### File List

| File | Status | Description |
|------|--------|-------------|
| today-app/src/components/time-tracking/TimeInsightsModal.tsx | NEW | Insights modal component (420px, scrollable, placeholder content) |
| today-app/src/components/time-tracking/TimeInsightsModal.test.tsx | NEW | 13 component tests for TimeInsightsModal |
| today-app/src/App.tsx | MODIFIED | Added isInsightsModalOpen state, handleOpenInsights toggle, TimeInsightsModal render |
| today-app/src/hooks/useTimeTrackingHotkeys.ts | EXISTING | Already had double-tap detection (verified working) |
| today-app/src/hooks/useTimeTrackingHotkeys.test.ts | EXISTING | Already had complete test coverage for double-tap (verified) |

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-10 | SM Agent | Initial story creation from sprint-status backlog |
| 2026-01-10 | Dev Agent | Implemented TimeInsightsModal, integrated into App.tsx, added tests (144 passing) |
| 2026-01-10 | Dev Agent | Frontend Test Gate PASSED - All 10 test steps passed, all success criteria met |
