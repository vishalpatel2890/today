# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-12
**Project Level:** Quick-flow (1 story)
**Change Type:** UI Enhancement
**Development Context:** Brownfield - existing React/Electron app

---

## Context

### Available Documents

- No product briefs or research docs (standalone mode)
- Brownfield codebase analysis completed

### Project Stack

- **Runtime:** Node.js with Electron 39.2.7
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Build:** Vite 7.2.4 + electron-vite 5.0.0
- **Testing:** Vitest 3.2.4 + @testing-library/react 16.3.1
- **Styling:** Tailwind CSS 4.1.18
- **UI Components:** Radix UI primitives, Lucide React icons

### Existing Codebase Structure

**Relevant Files:**
- `src/views/DeferredView.tsx` - Main deferred tasks view with category grouping
- `src/components/CategorySection.tsx` - Collapsible category component
- `src/App.tsx` - Main app with tab state and hotkey registration
- `src/hooks/useTimeTrackingHotkeys.ts` - Reference pattern for global hotkeys

**Current Behavior (DeferredView.tsx:63-68):**
```typescript
// AC-3.5.4: Initialize first category as expanded on mount
useEffect(() => {
  if (!hasInitialized && sortedCategories.length > 0) {
    setExpandedCategories(new Set([sortedCategories[0]]))
    setHasInitialized(true)
  }
}, [sortedCategories, hasInitialized])
```

**Existing Hotkey Pattern (useTimeTrackingHotkeys.ts):**
- Uses `document.addEventListener('keydown', handler, true)` (capture phase)
- Checks `e.metaKey` (Mac) or `e.ctrlKey` (Windows) + `e.altKey`
- Uses `e.code` instead of `e.key` to handle Option key character mapping
- Skips when focused on input/textarea/contenteditable elements
- Calls `e.preventDefault()` and `e.stopPropagation()` on match

---

## The Change

### Problem Statement

In the Deferred view, categories are currently expanded by default (first category open). Users want:
1. All categories collapsed by default for a cleaner initial view
2. A keyboard shortcut (Cmd+Opt+A) to quickly collapse or expand all categories at once

### Proposed Solution

1. **Change default state:** Initialize `expandedCategories` as empty Set instead of containing first category
2. **Add toggle-all function:** Smart toggle that collapses all if any expanded, expands all if all collapsed
3. **Add hotkey hook:** New `useDeferredViewHotkeys` hook following existing pattern, only active on Deferred tab

### Scope

**In Scope:**
- Change default collapsed state in DeferredView
- Add Cmd+Opt+A / Ctrl+Alt+A hotkey for toggle all
- Hotkey only active when Deferred tab is selected
- Smart toggle logic (any expanded → collapse all, all collapsed → expand all)
- Unit tests for new hook

**Out of Scope:**
- Persisting collapse state to localStorage
- Individual category memory between tab switches
- Animation changes to collapse/expand
- Other views (Today, Tomorrow)

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/views/DeferredView.tsx` | MODIFY | Change default state to empty Set, add `toggleAllCategories` function, expose via callback |
| `src/hooks/useDeferredViewHotkeys.ts` | CREATE | New hook for Cmd+Opt+A hotkey, follows useTimeTrackingHotkeys pattern |
| `src/hooks/useDeferredViewHotkeys.test.ts` | CREATE | Unit tests for new hook |
| `src/App.tsx` | MODIFY | Register new hotkey hook, pass toggle callback and active tab state |

### Technical Approach

**1. DeferredView.tsx Changes:**

Remove the `hasInitialized` state and the useEffect that expands first category. Initialize with empty Set:

```typescript
// Before (line 36-38):
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
const [hasInitialized, setHasInitialized] = useState(false)

// After:
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
// Remove hasInitialized state entirely
```

Add toggle-all function:

```typescript
// Smart toggle: if any expanded → collapse all, if all collapsed → expand all
const toggleAllCategories = useCallback(() => {
  setExpandedCategories(prev => {
    if (prev.size > 0) {
      // Some categories expanded → collapse all
      return new Set()
    } else {
      // All collapsed → expand all
      return new Set(sortedCategories)
    }
  })
}, [sortedCategories])
```

**2. New Hook - useDeferredViewHotkeys.ts:**

Follow exact pattern from useTimeTrackingHotkeys:
- Check for Cmd+Opt+A (Mac) or Ctrl+Alt+A (Windows)
- Use `e.code === 'KeyA'` for reliable detection
- Skip when in input fields
- Only trigger when `isActive` prop is true (Deferred tab selected)

**3. App.tsx Integration:**

Pass `activeTab === 'deferred'` to control when hotkey is active.

### Existing Patterns to Follow

From `useTimeTrackingHotkeys.ts`:
- Use `useCallback` for stable handler reference
- Use `useRef` for callback refs to avoid re-registering listener
- Use `useEffect` for listener registration with cleanup
- Check `isInputElement(document.activeElement)` before triggering
- Use capture phase: `addEventListener('keydown', handler, true)`

From test file:
- Use `describe` blocks organized by acceptance criteria
- Use `vi.fn()` for mock callbacks
- Create helper `createKeyboardEvent()` function
- Test both Mac (metaKey) and Windows (ctrlKey) variants

### Integration Points

- **App.tsx:** Owns `activeTab` state, passes to hook
- **DeferredView:** Owns `expandedCategories` state, exposes toggle callback
- **Hook:** Bridges keyboard event to toggle callback

---

## Development Context

### Relevant Existing Code

- `src/hooks/useTimeTrackingHotkeys.ts` - Direct reference for hotkey implementation pattern
- `src/hooks/useTimeTrackingHotkeys.test.ts` - Test structure reference
- `src/views/DeferredView.tsx:63-68` - Code to remove (useEffect for first-expanded)
- `src/views/DeferredView.tsx:71-81` - Existing `toggleCategory` function pattern

### Dependencies

**Framework/Libraries:**
- React 19.2.0 (useCallback, useEffect, useRef)
- TypeScript 5.9.3
- Vitest 3.2.4 (testing)
- @testing-library/react 16.3.1 (renderHook)

**Internal Modules:**
- None - self-contained change

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

- No semicolons
- Single quotes for strings
- 2-space indentation
- Functional components with TypeScript interfaces
- Test files alongside source: `*.test.ts`
- JSDoc comments for public functions
- AC references in comments (e.g., `// AC-3.5.4:`)

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **React Testing:** @testing-library/react with renderHook
- **Mocking:** vi.fn(), vi.useFakeTimers()
- **File naming:** `{name}.test.ts` next to source file
- **Structure:** describe blocks per feature/AC, beforeEach/afterEach for setup

---

## Implementation Stack

- **Runtime:** Electron 39.2.7 / Browser
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Testing:** Vitest 3.2.4
- **Build:** Vite 7.2.4

---

## Technical Details

**Hotkey Detection Logic:**

```typescript
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  // Only active on Deferred tab
  if (!isActiveRef.current) return

  // Check for Cmd+Opt+A (Mac) or Ctrl+Alt+A (Windows)
  const isMac = e.metaKey && !e.ctrlKey
  const isWindows = e.ctrlKey && !e.metaKey
  const isModifierPressed = isMac || isWindows

  if (!isModifierPressed || !e.altKey || e.code !== 'KeyA') {
    return
  }

  // Don't intercept when in input fields
  if (isInputElement(document.activeElement)) {
    return
  }

  e.preventDefault()
  e.stopPropagation()

  onToggleAllRef.current()
}, [])
```

**Smart Toggle Logic:**

The toggle checks `expandedCategories.size`:
- If `size > 0` (any expanded): Clear the Set → all collapse
- If `size === 0` (none expanded): Add all categories → all expand

This provides intuitive behavior - pressing the hotkey always does "the other thing."

**Edge Cases:**
- Empty Deferred view (no categories): Hotkey does nothing (no-op is fine)
- Single category: Toggle works normally (expand/collapse that one)
- Tab switch: Hotkey becomes inactive immediately via `isActive` prop

---

## Development Setup

```bash
cd today-app
npm install          # Already done - no new deps
npm run dev          # Start Vite dev server
npm test             # Run Vitest in watch mode
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feat/deferred-collapse-hotkey`
2. Verify dev environment: `npm run dev`
3. Review existing hotkey hook: `src/hooks/useTimeTrackingHotkeys.ts`

### Implementation Steps

**Step 1: Create useDeferredViewHotkeys hook**
- Create `src/hooks/useDeferredViewHotkeys.ts`
- Copy pattern from useTimeTrackingHotkeys
- Modify to check for KeyA instead of KeyT
- Add `isActive` parameter to control when hotkey fires
- No double-tap logic needed (simpler than time tracking hook)

**Step 2: Create hook tests**
- Create `src/hooks/useDeferredViewHotkeys.test.ts`
- Test Cmd+Opt+A triggers callback (Mac)
- Test Ctrl+Alt+A triggers callback (Windows)
- Test does NOT trigger when isActive=false
- Test does NOT trigger in input fields
- Test cleanup on unmount

**Step 3: Modify DeferredView.tsx**
- Remove `hasInitialized` state
- Remove the useEffect that sets first category expanded
- Add `toggleAllCategories` callback function
- Accept optional `onToggleAllRef` prop (or expose via forwardRef/callback)

**Step 4: Integrate in App.tsx**
- Import new hook
- Create toggle callback that refs DeferredView's toggleAll
- Call hook with `activeTab === 'deferred'` for isActive
- Wire up the callback

**Step 5: Manual testing**
- Open app, go to Deferred tab
- Verify all categories start collapsed
- Press Cmd+Opt+A → all expand
- Press Cmd+Opt+A again → all collapse
- Expand one manually, press Cmd+Opt+A → all collapse
- Switch to Today tab, press Cmd+Opt+A → nothing happens
- Focus input field, press Cmd+Opt+A → nothing happens

### Testing Strategy

**Unit Tests (useDeferredViewHotkeys.test.ts):**
- Hotkey detection (Mac/Windows variants)
- isActive=false blocks callback
- Input field exclusion
- preventDefault/stopPropagation called
- Cleanup on unmount

**Integration (manual):**
- Default collapsed state on app load
- Toggle all behavior (expand/collapse)
- Tab-scoped activation
- Input field exclusion

### Acceptance Criteria

1. **AC1:** All categories in Deferred view are collapsed by default on app load
2. **AC2:** Cmd+Opt+A (Mac) / Ctrl+Alt+A (Windows) toggles all categories
3. **AC3:** Smart toggle: any expanded → collapse all; all collapsed → expand all
4. **AC4:** Hotkey only works when Deferred tab is active
5. **AC5:** Hotkey does not trigger when focused on input/textarea
6. **AC6:** Hotkey calls preventDefault to avoid browser conflicts

---

## Developer Resources

### File Paths Reference

- `/today-app/src/views/DeferredView.tsx` - MODIFY
- `/today-app/src/hooks/useDeferredViewHotkeys.ts` - CREATE
- `/today-app/src/hooks/useDeferredViewHotkeys.test.ts` - CREATE
- `/today-app/src/App.tsx` - MODIFY

### Key Code Locations

- `DeferredView.tsx:36-38` - State initialization to change
- `DeferredView.tsx:63-68` - useEffect to remove
- `DeferredView.tsx:71-81` - toggleCategory pattern to reference
- `useTimeTrackingHotkeys.ts:12-26` - isInputElement helper to reuse
- `useTimeTrackingHotkeys.ts:57-102` - handleKeyDown pattern to follow
- `App.tsx:47` - Existing hotkey registration pattern

### Testing Locations

- Unit tests: `src/hooks/useDeferredViewHotkeys.test.ts`

### Documentation to Update

None required - internal UI enhancement.

---

## UX/UI Considerations

**UI Components Affected:**
- DeferredView category sections (visual state only)

**UX Flow Changes:**
- Before: First category expanded on load
- After: All categories collapsed on load, Cmd+Opt+A to expand all

**User Feedback:**
- Immediate visual feedback (categories expand/collapse)
- No toast or notification needed

**Accessibility:**
- Existing `aria-expanded` attribute on CategorySection headers reflects state
- Keyboard shortcut documented in app (if help exists)

---

## Testing Approach

**Framework:** Vitest 3.2.4 with @testing-library/react

**Test Structure:**
```typescript
describe('useDeferredViewHotkeys', () => {
  describe('Hotkey Detection', () => {
    it('should trigger callback on Cmd+Opt+A (Mac)')
    it('should trigger callback on Ctrl+Alt+A (Windows)')
    it('should not trigger for wrong key')
    it('should not trigger without modifiers')
  })

  describe('Tab Activation (isActive)', () => {
    it('should trigger when isActive=true')
    it('should NOT trigger when isActive=false')
  })

  describe('Input Field Exclusion', () => {
    it('should not trigger when focused on input')
    it('should not trigger when focused on textarea')
    it('should not trigger when focused on contenteditable')
  })

  describe('Event Handling', () => {
    it('should call preventDefault')
    it('should call stopPropagation')
  })

  describe('Cleanup', () => {
    it('should remove listener on unmount')
  })
})
```

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main
2. CI runs tests automatically
3. Build web version: `npm run build`
4. Build Electron: `npm run build:electron`
5. Deploy/package as normal

### Rollback Plan

Revert commit - no database or API changes, pure frontend.

### Monitoring

No special monitoring needed - UI-only change.
