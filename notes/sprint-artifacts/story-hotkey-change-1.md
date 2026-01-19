# Story 1.1: Change Time Tracking Hotkey to Cmd+Opt+T

**Status:** Done

---

## User Story

As a **user**,
I want **to use Cmd+Opt+T (Mac) / Ctrl+Alt+T (Windows) for time tracking**,
So that **the hotkey doesn't conflict with Chrome's "Reopen Closed Tab" shortcut**.

---

## Acceptance Criteria

**AC #1: Mac Hotkey Detection**
**Given** I am using the app on a Mac
**When** I press `Cmd+Opt+T` (Command + Option + T)
**Then** the Time Tracking modal opens

**AC #2: Windows Hotkey Detection**
**Given** I am using the app on Windows
**When** I press `Ctrl+Alt+T`
**Then** the Time Tracking modal opens

**AC #3: Old Hotkey Disabled**
**Given** the new hotkey is implemented
**When** I press `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows)
**Then** the browser handles the keypress (reopens closed tab)
**And** the Time Tracking modal does NOT open

**AC #4: Double-Tap for Insights**
**Given** I press the new hotkey `Cmd+Opt+T`
**When** I press `T` again within 300ms (while holding modifiers)
**Then** the Insights modal opens instead of the Tracking modal

**AC #5: Input Field Exclusion**
**Given** I am focused on an input, textarea, or contenteditable element
**When** I press `Cmd+Opt+T`
**Then** nothing happens (hotkey is ignored to allow typing)

**AC #6: All Tests Pass**
**Given** I update the test file with `altKey` instead of `shiftKey`
**When** I run `npm run test:run`
**Then** all 18 existing tests pass

**AC #7: No TypeScript Errors**
**Given** the changes are complete
**When** I run `npm run build`
**Then** TypeScript compilation succeeds with no errors

---

## Implementation Details

### Tasks / Subtasks

- [x] **Update JSDoc comments in useTimeTrackingHotkeys.ts** (AC: #1, #2)
  - [x] Line 31: Change "Cmd+Shift+T" to "Cmd+Opt+T"
  - [x] Line 31: Change "Ctrl+Shift+T" to "Ctrl+Alt+T"

- [x] **Update inline comment** (AC: #1, #2)
  - [x] Line 58: Change comment to "Cmd+Opt+T (Mac) or Ctrl+Alt+T (Windows)"

- [x] **Change modifier check** (AC: #1, #2, #3)
  - [x] Line 63: Replace `!e.shiftKey` with `!e.altKey`
  - [x] Line 63: Change from `e.key` to `e.code` (Mac Option+T produces † character)

- [x] **Update test helper in useTimeTrackingHotkeys.test.ts** (AC: #6)
  - [x] Line 25: Change `shiftKey?: boolean` to `altKey?: boolean`
  - [x] Update default value to `altKey: options.altKey ?? false`
  - [x] Change from `key` to `code` property

- [x] **Update all test events** (AC: #6)
  - [x] Replace all `shiftKey: true` with `altKey: true` (~20 occurrences)
  - [x] Replace all `key: 't'` with `code: 'KeyT'`
  - [x] Update test descriptions if they mention "Shift" (optional - for clarity)

- [x] **Run tests** (AC: #6)
  - [x] Execute `npm run test:run`
  - [x] Verify all 19 tests pass

- [x] **Build verification** (AC: #7)
  - [x] Execute `npm run build`
  - [x] Pre-existing TS errors in unrelated files - not caused by this change

- [x] **Manual testing** (AC: #1, #2, #3, #4, #5)
  - [x] Test Cmd+Opt+T opens modal on Mac
  - [x] Verify Cmd+Shift+T reopens Chrome tab (doesn't open modal)
  - [x] Test double-tap Cmd+Opt+T T opens insights
  - [x] Test hotkey ignored in input fields

### Technical Summary

Simple modifier key swap in the keyboard event handler:
- Change from checking `e.shiftKey` to checking `e.altKey`
- Change from `e.key` to `e.code` because Option+T on Mac produces † character
- The `altKey` property corresponds to Option on Mac and Alt on Windows
- No logic changes required - same double-tap detection, input exclusion, and cleanup

### Project Structure Notes

- **Files to modify:**
  - `src/hooks/useTimeTrackingHotkeys.ts` (4 lines)
  - `src/hooks/useTimeTrackingHotkeys.test.ts` (~25 lines)
- **Expected test locations:** `src/hooks/useTimeTrackingHotkeys.test.ts`
- **Estimated effort:** 1 story point (< 1 hour)
- **Prerequisites:** None

### Key Code References

**Hook file (useTimeTrackingHotkeys.ts):**
- Line 31-32: JSDoc comments describing the hotkey
- Line 58: Inline comment for the key check
- Line 63-64: The actual modifier check using `e.altKey` and `e.code`

**Test file (useTimeTrackingHotkeys.test.ts):**
- Lines 20-34: `createKeyboardEvent` helper function
- All tests use `altKey: true` and `code: 'KeyT'` in event creation

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Problem statement: Chrome's Cmd+Shift+T conflict
- Solution: Use altKey instead of shiftKey
- Complete implementation guidance
- Test update strategy

**Architecture:** N/A - No architectural changes

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Plan:**
1. Update JSDoc comments (lines 30-32)
2. Update inline comment (line 58)
3. Change modifier check from `shiftKey` to `altKey` (line 63)
4. Update test helper to use `altKey`
5. Replace all `shiftKey: true` with `altKey: true` in tests
6. Run tests
7. Run build

**Bug Fix During Testing:**
- Issue: Cmd+Opt+T not working on Mac
- Root cause: On Mac, Option+T produces `†` character, so `e.key` was `†` not `t`
- Fix: Changed from `e.key.toLowerCase() !== 't'` to `e.code !== 'KeyT'`
- `e.code` gives the physical key code regardless of modifier keys

### Completion Notes

**Implementation Summary:**
- Changed hotkey from `Cmd+Shift+T` to `Cmd+Opt+T` (Mac) / `Ctrl+Alt+T` (Windows)
- Updated `useTimeTrackingHotkeys.ts`: 4 edits (JSDoc, inline comment, modifier check, key→code)
- Updated `useTimeTrackingHotkeys.test.ts`: Updated helper interface + replaced all event properties
- All 19 hotkey tests pass
- All 420 project tests pass
- Manual testing PASSED by Vishal (2026-01-11)

### Files Modified

- `src/hooks/useTimeTrackingHotkeys.ts` - Changed `shiftKey` to `altKey`, `e.key` to `e.code`, updated comments
- `src/hooks/useTimeTrackingHotkeys.test.ts` - Updated helper interface and all test events

### Test Results

```
Test Files  21 passed (21)
     Tests  420 passed (420)
  Duration  4.80s

Hotkey-specific: 19 passed
```

---

## Review Notes

✅ Test Gate PASSED by Vishal (2026-01-11)
