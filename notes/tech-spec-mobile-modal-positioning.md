# Today - Technical Specification

**Author:** Vishal
**Date:** 2025-01-25
**Project Level:** Quick Flow
**Change Type:** Bug Fix
**Development Context:** Brownfield - PWA tested on actual mobile device

---

## Context

### Available Documents

- No product briefs or research documents (standalone quick-flow project)
- Brownfield codebase with established modal patterns

### Project Stack

| Component | Version | Notes |
|-----------|---------|-------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Language |
| Vite | 7.2.4 | Build tool |
| Electron | 39.2.7 | Desktop wrapper |
| Tailwind CSS | 4.1.18 | Styling (v4 uses new CSS `translate` property) |
| Radix UI Dialog | 1.1.15 | Modal component |
| Vitest | 3.2.4 | Test framework |
| Testing Library | 16.3.1 | React testing utilities |

### Existing Codebase Structure

**Directory Organization:**
```
today-app/src/
├── components/           # React components (27 files)
│   ├── time-tracking/    # Time tracking modals
│   ├── NotesModal.tsx    # Task notes modal
│   ├── DeferModal.tsx    # Update/defer task modal
│   ├── CompletedTasksModal.tsx
│   ├── LinkEmailModal.tsx
│   └── ...
├── index.css             # Global styles and CSS animations
└── ...
```

**Modal Pattern:**
All modals use Radix UI Dialog with consistent positioning classes and shared CSS animations defined in `index.css`.

---

## The Change

### Problem Statement

On mobile devices (PWA), modals render incorrectly - appearing in the **bottom-right corner** instead of as a centered bottom sheet. Affected modals include:
- Notes modal
- Update/Defer modal (date picker)
- Completed tasks modal
- Time tracking modals
- All other modals using `animate-slide-up` class

**Root Cause:** CSS property conflict between Tailwind CSS v4 and legacy CSS animations.

Tailwind CSS v4 uses the **new CSS `translate` property**:
```css
/* Tailwind v4 generates: */
.-translate-x-1\/2 { translate: -50% 0; }
```

The animation uses the **legacy `transform` property**:
```css
@keyframes slideUp {
  from { transform: translate(-50%, 100%); }
  to { transform: translate(-50%, 0); }
}
```

**These are different CSS properties:**
- `translate` (new, from Tailwind) - applies X centering
- `transform` (legacy, from animation) - applies both X and Y

After animation completes, the `transform: translate(-50%, 0)` property tries to handle X centering, but Tailwind's `translate` property also applies. On mobile browsers, this conflict causes the modal to position incorrectly (only `left: 50%` applied, without the `-50%` X offset).

### Proposed Solution

**Separate concerns:**
- Let Tailwind handle X-axis centering via `translate` property
- Let animation handle Y-axis slide via `transform` property

Update CSS animations to use `translateY()` only:

**Before (conflicting):**
```css
@keyframes slideUp {
  from { transform: translate(-50%, 100%); }
  to { transform: translate(-50%, 0); }
}
```

**After (compatible):**
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

This works because:
- `translate` property (Tailwind) handles X: `-50%`
- `transform` property (animation) handles Y: `100%` → `0`
- Different properties, different axes = no conflict

### Scope

**In Scope:**
- Fix `slideUp` keyframes in `src/index.css` for mobile bottom sheet
- Fix `slideUpDesktop` keyframes for consistency
- Verify fix across all modals on mobile PWA

**Out of Scope:**
- Refactoring modal component classes
- Changing modal design or behavior
- Adding new features
- Electron-specific changes (uses same CSS)

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/index.css` | MODIFY | Lines 151-160: Update `slideUp` keyframes to use `translateY()` only |
| `src/index.css` | MODIFY | Lines 163-172: Update `slideUpDesktop` keyframes to use `translateY()` only |

### Technical Approach

**Change 1: Mobile `slideUp` animation (lines 151-160)**

From:
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 100%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
```

To:
```css
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
```

**Change 2: Desktop `slideUpDesktop` animation (lines 163-172)**

From:
```css
@keyframes slideUpDesktop {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

To:
```css
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

### Existing Patterns to Follow

**CSS Animation Pattern (from `index.css`):**
- Keyframe animations use `ease-out` timing
- Duration: 150-300ms
- Utility classes use `animate-*` naming

**Modal Component Pattern:**
All modals use identical positioning classes:
```tsx
className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[XXXpx] md:rounded-lg"
```

No component changes needed - CSS fix applies globally.

### Integration Points

**Affected Components (all use `animate-slide-up`):**
- `NotesModal.tsx`
- `DeferModal.tsx`
- `CompletedTasksModal.tsx`
- `LinkEmailModal.tsx`
- `TimeTrackingModal.tsx`
- `TimeInsightsModal.tsx`
- `ActivityLogModal.tsx`
- `EditTimeEntryModal.tsx`

---

## Development Context

### Relevant Existing Code

**CSS Animation (src/index.css:150-182):**
```css
/* Modal slide-up animation for content (mobile bottom sheet) */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 100%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* Desktop centered modal animation */
@keyframes slideUpDesktop {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.animate-slide-up {
  animation: slideUp 200ms ease-out;
}

@media (min-width: 768px) {
  .animate-slide-up {
    animation: slideUpDesktop 200ms ease-out;
  }
}
```

### Dependencies

**Framework/Libraries:**
- Tailwind CSS 4.1.18 - Uses new CSS `translate` property
- Radix UI Dialog 1.1.15 - Provides `data-[state=open]` for animation trigger

**Internal Modules:**
- None - CSS-only fix

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

**Code Style:**
- CSS animations use `@keyframes` with descriptive names
- Animation classes prefixed with `animate-`
- Mobile-first with `md:` breakpoint overrides

**Test Patterns:**
- Vitest with Testing Library
- Visual testing done manually on device
- Test files colocated: `*.test.tsx`

### Test Framework & Standards

| Aspect | Standard |
|--------|----------|
| Framework | Vitest 3.2.4 |
| Utilities | @testing-library/react 16.3.1 |
| File naming | `*.test.tsx` colocated |
| Visual testing | Manual on device/viewport |

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.1.18 |
| Build | Vite | 7.2.4 |
| Testing | Vitest | 3.2.4 |

---

## Technical Details

**CSS Property Separation:**

The fix leverages that `translate` and `transform` are independent CSS properties:

1. **`translate` property** (Tailwind v4 `-translate-x-1/2`):
   ```css
   translate: -50% 0;  /* X-axis centering */
   ```

2. **`transform` property** (Animation):
   ```css
   transform: translateY(100%);  /* Y-axis slide only */
   ```

3. **Browser composites both** - no conflict when affecting different axes.

**Browser Compatibility:**
- CSS `translate` property: Chrome 104+, Safari 14.1+, Firefox 72+
- All modern mobile browsers support this
- PWA on iOS Safari and Chrome Android both work

**Edge Cases:**
- Animation interruption (modal closes mid-animation): Works correctly
- Rapid open/close: Radix UI handles animation state
- Orientation change: Fixed positioning + transform works

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies
npm install

# Start development server
npm run dev

# For PWA testing, build and serve
npm run build
npx serve dist
```

---

## Implementation Guide

### Setup Steps

1. Open `today-app/src/index.css`
2. Locate animation keyframes (around line 150)
3. Have mobile device ready for PWA testing

### Implementation Steps

**Step 1: Update `slideUp` keyframes (lines 151-160)**

Change:
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 100%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
```

To:
```css
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
```

**Step 2: Update `slideUpDesktop` keyframes (lines 163-172)**

Change:
```css
@keyframes slideUpDesktop {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

To:
```css
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

**Step 3: Test on mobile device**

### Testing Strategy

**Manual Testing (Required):**

1. Build PWA: `npm run build`
2. Serve: `npx serve dist` (or deploy to staging)
3. Open on mobile device
4. Test each modal:
   - [ ] Notes modal - tap notes icon on any task
   - [ ] Update modal - tap on task card
   - [ ] Completed tasks modal - tap completed tasks button
   - [ ] Time tracking modal - tap timer button
5. Verify:
   - Modal appears as centered bottom sheet
   - Slide-up animation plays smoothly
   - Modal is horizontally centered (not bottom-right)

**Desktop Verification:**
- Test modals on desktop viewport
- Verify centered modal behavior unchanged

### Acceptance Criteria

1. ✅ All modals render horizontally centered on mobile
2. ✅ Modals appear as bottom sheet (anchored to bottom) on mobile
3. ✅ Slide-up animation plays smoothly on open
4. ✅ Desktop modal behavior unchanged (centered)
5. ✅ Fix applies to all modal types: Notes, Update, Completed, Time Tracking, etc.
6. ✅ Works on iOS Safari and Chrome Mobile (PWA)

---

## Developer Resources

### File Paths Reference

| File | Purpose |
|------|---------|
| `today-app/src/index.css` | **PRIMARY** - Animation keyframes to fix |
| `today-app/src/components/NotesModal.tsx` | Uses `animate-slide-up` |
| `today-app/src/components/DeferModal.tsx` | Uses `animate-slide-up` |
| `today-app/src/components/CompletedTasksModal.tsx` | Uses `animate-slide-up` |
| `today-app/src/components/LinkEmailModal.tsx` | Uses `animate-slide-up` |
| `today-app/src/components/time-tracking/TimeTrackingModal.tsx` | Uses `animate-slide-up` |

### Key Code Locations

| Location | Description |
|----------|-------------|
| `src/index.css:150-160` | `slideUp` keyframes (mobile) - FIX HERE |
| `src/index.css:163-172` | `slideUpDesktop` keyframes - FIX HERE |
| `src/index.css:174-182` | Media query applying desktop animation |
| Modal components ~line 140 | `Dialog.Content` with animation class |

### Testing Locations

- Manual testing via mobile device PWA
- Desktop testing via browser

### Documentation to Update

None required - internal CSS fix.

---

## UX/UI Considerations

**UI Components Affected:**
- All modal components (visual positioning only)

**UX Flow:**
- No change to user flows
- Modals will appear in correct position

**Visual Patterns:**
- Maintains existing bottom sheet pattern on mobile
- Maintains centered dialog on desktop
- Animation timing unchanged (200ms ease-out)

**Accessibility:**
- No impact - positioning fix only
- Focus management unchanged

---

## Testing Approach

**Test Framework:** Manual visual testing

**Test Strategy:**
- CSS positioning changes require visual verification
- Automated tests don't catch this type of visual bug
- Test on actual mobile device (PWA)

**Coverage:**
- All modal types manually verified
- Both mobile and desktop viewports tested

---

## Deployment Strategy

### Deployment Steps

1. Merge fix to main branch
2. Build: `npm run build`
3. Deploy PWA to production
4. Verify on mobile device

### Rollback Plan

1. Revert CSS changes in `src/index.css`
2. Restore original `translate(-50%, Y)` in both keyframes
3. Redeploy

### Monitoring

- Visual spot-check modals on mobile after deployment
- No metrics needed for CSS fix
