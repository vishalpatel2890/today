# Story 1.1: Default Collapse with Toggle-All Hotkey

**Status:** Draft

---

## User Story

As a **user viewing deferred tasks**,
I want **all categories collapsed by default and a hotkey to expand/collapse all**,
So that **I can see a clean overview and quickly expand everything when needed**.

---

## Acceptance Criteria

**AC1: Default Collapsed**
- **Given** the app loads with deferred tasks
- **When** I navigate to the Deferred tab
- **Then** all category sections are collapsed (none expanded)

**AC2: Toggle All Hotkey (Mac)**
- **Given** I am on the Deferred tab with categories
- **When** I press Cmd+Opt+A
- **Then** all categories toggle (expand if collapsed, collapse if any expanded)

**AC3: Toggle All Hotkey (Windows)**
- **Given** I am on the Deferred tab with categories
- **When** I press Ctrl+Alt+A
- **Then** all categories toggle (expand if collapsed, collapse if any expanded)

**AC4: Smart Toggle Logic**
- **Given** one or more categories are expanded
- **When** I press the toggle hotkey
- **Then** all categories collapse
- **And** pressing the hotkey again expands all categories

**AC5: Tab Scope**
- **Given** I am on the Today or Tomorrow tab
- **When** I press Cmd+Opt+A
- **Then** nothing happens (hotkey only works on Deferred tab)

**AC6: Input Field Exclusion**
- **Given** I am on the Deferred tab with focus in an input field
- **When** I press Cmd+Opt+A
- **Then** the hotkey is not triggered (allows normal typing)

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1: Modify DeferredView.tsx - Default State**
  - Remove `hasInitialized` state (line 38)
  - Remove useEffect that expands first category (lines 63-68)
  - Categories now start with empty `expandedCategories` Set

- [ ] **Task 2: Add toggleAllCategories Function**
  - Add `useCallback` function in DeferredView
  - Smart toggle: `prev.size > 0` → clear Set, else → add all sortedCategories
  - Depends on `sortedCategories` in dependency array

- [ ] **Task 3: Create useDeferredViewHotkeys Hook**
  - Create `src/hooks/useDeferredViewHotkeys.ts`
  - Accept `onToggleAll: () => void` and `isActive: boolean` params
  - Check for `e.code === 'KeyA'` with `metaKey`/`ctrlKey` + `altKey`
  - Skip when `isInputElement(document.activeElement)`
  - Only trigger when `isActive === true`

- [ ] **Task 4: Write Hook Unit Tests**
  - Create `src/hooks/useDeferredViewHotkeys.test.ts`
  - Test Mac hotkey (metaKey + altKey + KeyA)
  - Test Windows hotkey (ctrlKey + altKey + KeyA)
  - Test isActive=false blocks callback
  - Test input field exclusion
  - Test cleanup on unmount

- [ ] **Task 5: Integrate in App.tsx**
  - Import `useDeferredViewHotkeys`
  - Create ref/callback to pass toggle function from DeferredView
  - Call hook with `activeTab === 'deferred'`

- [ ] **Task 6: Manual Testing**
  - Verify default collapsed state
  - Test Cmd+Opt+A expand/collapse cycle
  - Test tab switching disables hotkey
  - Test input field focus disables hotkey

### Technical Summary

This story implements two related features:
1. **Default collapsed state** - Simple removal of initialization logic
2. **Toggle-all hotkey** - New hook following existing `useTimeTrackingHotkeys` pattern

The hook pattern is well-established in this codebase. The main complexity is wiring up the callback from DeferredView through App.tsx to the hook.

### Project Structure Notes

- **Files to modify:**
  - `src/views/DeferredView.tsx`
  - `src/App.tsx`
- **Files to create:**
  - `src/hooks/useDeferredViewHotkeys.ts`
  - `src/hooks/useDeferredViewHotkeys.test.ts`
- **Expected test locations:** `src/hooks/useDeferredViewHotkeys.test.ts`
- **Prerequisites:** None

### Key Code References

| Reference | Location | Purpose |
|-----------|----------|---------|
| Hotkey pattern | `src/hooks/useTimeTrackingHotkeys.ts` | Copy structure for new hook |
| Test pattern | `src/hooks/useTimeTrackingHotkeys.test.ts` | Copy test structure |
| isInputElement helper | `useTimeTrackingHotkeys.ts:12-26` | Reuse or duplicate |
| Code to remove | `DeferredView.tsx:63-68` | useEffect for first-expanded |
| toggleCategory pattern | `DeferredView.tsx:71-81` | Reference for toggle logic |
| Tab state | `App.tsx:22` | `activeTab` state to check |

---

## Context References

**Tech-Spec:** [tech-spec-deferred-collapse.md](../tech-spec-deferred-collapse.md) - Primary context document containing:

- Brownfield codebase analysis
- Framework and library details with versions
- Existing patterns to follow (useTimeTrackingHotkeys)
- Integration points and dependencies
- Complete implementation guidance with code snippets

**Architecture:** N/A - UI-only change, no architectural impact

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
