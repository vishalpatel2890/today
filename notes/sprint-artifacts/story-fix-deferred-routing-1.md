# Story: Simplify Task Routing Logic

**Story ID:** fix-deferred-routing-1
**Epic:** Fix Deferred Task Routing
**Type:** Bug Fix
**Priority:** High
**Status:** in-progress

---

## User Story

**As a** user,
**I want** tasks with future dates or no dates to appear in the Deferred view,
**So that** my Today view only shows tasks I need to work on today.

---

## Acceptance Criteria

1. **AC-1:** Tasks with future dates (beyond tomorrow) appear in Deferred view regardless of category
2. **AC-2:** Tasks with no date appear in Deferred view regardless of category
3. **AC-3:** Tasks with invalid dates appear in Deferred view
4. **AC-4:** Tasks with today's date appear in Today view (unchanged)
5. **AC-5:** Tasks with tomorrow's date appear in Tomorrow view (unchanged)
6. **AC-6:** Overdue tasks (past dates) appear in Today view (unchanged)
7. **AC-7:** Completed tasks are excluded from all views (unchanged)

---

## Tasks

### [x] Task 1: Update useAutoSurface.ts Conditional Logic (AC: #1, #2, #3, #4, #5, #6)

**File:** `src/hooks/useAutoSurface.ts`
**Lines:** 46-78

Replace the existing nested conditional logic with simplified date-only routing:

```typescript
if (!task.deferredTo || !isValidDate) {
  // No date or invalid date → Deferred
  deferred.push(task)
} else if (isToday(taskDate!)) {
  // Today's date → Today view
  today.push(task)
} else if (isPast(startOfDay(taskDate!))) {
  // Overdue (past date) → Today view (surfaces for attention)
  today.push(task)
} else if (isTomorrow(taskDate!)) {
  // Tomorrow's date → Tomorrow view
  tomorrow.push(task)
} else {
  // Future date (beyond tomorrow) → Deferred
  deferred.push(task)
}
```

### [x] Task 2: Update Inline Comments (AC: #1, #2)

Remove outdated AC references that mention category-based routing:
- Remove: `// AC-4.2.4: "Someday" task - has category but no date → Deferred`
- Update comments to reflect new behavior

### [x] Task 3: Create Unit Tests (AC: #1, #2, #3, #4, #5, #6, #7)

**File:** `src/hooks/useAutoSurface.test.ts` (CREATE)

Write unit tests covering:

| Test Case | Input | Expected |
|-----------|-------|----------|
| No date, no category | `{ deferredTo: null, category: null }` | deferredTasks |
| No date, with category | `{ deferredTo: null, category: 'Work' }` | deferredTasks |
| Today's date | `{ deferredTo: today }` | todayTasks |
| Tomorrow's date | `{ deferredTo: tomorrow }` | tomorrowTasks |
| Future date, no category | `{ deferredTo: nextWeek, category: null }` | deferredTasks |
| Future date, with category | `{ deferredTo: nextWeek, category: 'Work' }` | deferredTasks |
| Past date (overdue) | `{ deferredTo: yesterday }` | todayTasks |
| Invalid date string | `{ deferredTo: 'invalid' }` | deferredTasks |
| Completed task | `{ completedAt: now }` | excluded from all |

---

## Dev Notes

### Context Reference
📄 **Primary:** [notes/tech-spec.md](../tech-spec.md) - Contains full technical specification

### Key Files
- `src/hooks/useAutoSurface.ts:46-78` - Bug fix location
- `src/types/index.ts:29-37` - Task type definition
- `src/hooks/useOnlineStatus.test.ts` - Test pattern reference

### Dependencies
- date-fns 4.1.0: `isToday`, `isTomorrow`, `isPast`, `startOfDay`, `parseISO`, `isValid`
- Vitest 3.2.4: Test framework

### Code Style
- No semicolons
- Single quotes
- 2-space indentation

---

## Dev Agent Record

### Context Reference
- **Tech-Spec:** notes/tech-spec.md
- **Story Context:** Not required (tech-spec is comprehensive)

### Agent Model
- **Recommended:** Any (simple bug fix)

### Pre-Implementation Checklist
- [x] Read `src/hooks/useAutoSurface.ts`
- [x] Understand current routing logic
- [x] Review test patterns in `src/hooks/useOnlineStatus.test.ts`

### Implementation Order
1. Modify `useAutoSurface.ts` (Task 1)
2. Update comments (Task 2)
3. Create unit tests (Task 3)
4. Run `npm test` to verify
5. Manual testing in browser

### Debug Log
- Simplified conditional logic from nested category-based checks to linear date-only routing
- Removed 3 category-dependent branches that incorrectly routed tasks to Today
- Updated JSDoc comments to reflect new routing behavior

### Completion Notes
- All 37 tests passing (14 new + 23 existing)
- TypeScript compilation clean
- Code follows existing patterns (no semicolons, single quotes, 2-space indent)

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Unit tests pass | ✅ | 37/37 tests passing |
| No date → Deferred | ✅ | Both with/without category |
| Future date → Deferred | ✅ | Both with/without category |
| Today date → Today | ✅ | Verified |
| Tomorrow date → Tomorrow | ✅ | Verified |
| Past date → Today | ✅ | Overdue surfacing works |

---

## File List

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAutoSurface.ts` | MODIFIED | Simplified routing logic, updated comments |
| `src/hooks/useAutoSurface.test.ts` | CREATED | 14 unit tests for routing logic |

---

## Review Notes

*To be filled during code review*

---

## Definition of Done

- [x] All acceptance criteria verified
- [x] Unit tests passing
- [x] No TypeScript errors
- [ ] Manual testing complete
- [x] Code follows existing patterns
