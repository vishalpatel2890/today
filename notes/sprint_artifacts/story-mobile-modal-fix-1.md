# Story 9.1: Fix Modal CSS Animation Conflict

**Status:** Draft

---

## User Story

As a **mobile user**,
I want **modals to appear as centered bottom sheets**,
So that **I can interact with notes, date pickers, and other modals properly**.

---

## Acceptance Criteria

**AC #1:** Given any modal (Notes, Update, Completed Tasks, Time Tracking, etc.) on mobile, when the modal opens, then it renders horizontally centered at the bottom of the screen.

**AC #2:** Given the modal opening animation, when it plays, then the modal slides up smoothly from the bottom without jumping or misalignment.

**AC #3:** Given desktop viewport, when any modal opens, then it renders centered both horizontally and vertically (existing behavior unchanged).

**AC #4:** Given iOS Safari or Chrome Mobile (PWA), when testing modals, then all modals position correctly.

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1:** Update `slideUp` keyframes in `src/index.css` (lines 151-160)
  - Change `transform: translate(-50%, 100%)` to `transform: translateY(100%)`
  - Change `transform: translate(-50%, 0)` to `transform: translateY(0)`

- [ ] **Task 2:** Update `slideUpDesktop` keyframes in `src/index.css` (lines 163-172)
  - Change `transform: translate(-50%, -48%)` to `transform: translateY(2%)`
  - Change `transform: translate(-50%, -50%)` to `transform: translateY(0)`

- [ ] **Task 3:** Test on mobile device (PWA)
  - Build: `npm run build`
  - Serve: `npx serve dist` or deploy to staging
  - Open PWA on mobile device
  - Test all modals: Notes, Update, Completed Tasks, Time Tracking
  - Verify centered bottom sheet positioning

- [ ] **Task 4:** Verify desktop behavior unchanged
  - Test modals on desktop viewport
  - Verify centered modal positioning

### Technical Summary

**Root Cause:** CSS property conflict between Tailwind CSS v4 and legacy CSS animations.

- Tailwind v4 uses the new CSS `translate` property for `-translate-x-1/2`
- The animation uses legacy `transform: translate()` property
- These are different CSS properties that conflict on mobile browsers
- After animation completes, the modal positions incorrectly (bottom-right)

**Solution:** Update animations to use `translateY()` only, letting Tailwind's `translate` property handle X-axis centering independently.

### Project Structure Notes

- **Files to modify:** `src/index.css` (1 file, 2 keyframe animations)
- **Expected test locations:** Manual testing on mobile device
- **Estimated effort:** 1 story point
- **Prerequisites:** None

### Key Code References

**Current CSS (src/index.css:150-182):**
```css
/* Mobile animation - lines 151-160 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 100%);  /* CHANGE THIS */
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);     /* CHANGE THIS */
  }
}

/* Desktop animation - lines 163-172 */
@keyframes slideUpDesktop {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);  /* CHANGE THIS */
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);  /* CHANGE THIS */
  }
}
```

**Target CSS:**
```css
/* Mobile animation */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Desktop animation */
@keyframes slideUpDesktop {
  from {
    opacity: 0;
    transform: translateY(2%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Affected Modals (all use `animate-slide-up` class):**
- `NotesModal.tsx` - task notes
- `DeferModal.tsx` - update task / date picker
- `CompletedTasksModal.tsx` - completed tasks view
- `LinkEmailModal.tsx` - email linking
- `TimeTrackingModal.tsx` - time tracking
- `TimeInsightsModal.tsx` - time insights
- `ActivityLogModal.tsx` - activity log
- `EditTimeEntryModal.tsx` - edit time entry

---

## Context References

**Tech-Spec:** [tech-spec-mobile-modal-positioning.md](../tech-spec-mobile-modal-positioning.md) - Primary context document containing:

- Root cause analysis (Tailwind v4 `translate` vs animation `transform`)
- Detailed implementation steps
- Browser compatibility notes
- Testing strategy

**Architecture:** N/A - CSS-only fix, no architectural changes

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
