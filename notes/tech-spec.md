# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-08
**Project Level:** Quick Flow (Single Story)
**Change Type:** Bug Fix
**Development Context:** Brownfield

---

## Context

### Available Documents

- No product briefs or research documents (focused bug fix)
- Existing codebase documentation via code analysis

### Project Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Vite | 7.2.4 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Testing | Vitest | 3.2.4 |
| Styling | TailwindCSS | 4.1.18 |
| Date Library | date-fns | 4.1.0 |
| Backend | Supabase | 2.89.0 |
| Local Storage | Dexie (IndexedDB) | 4.2.1 |
| UI Components | Radix UI, Lucide React | Latest |

### Existing Codebase Structure

```
today-app/src/
├── hooks/
│   ├── useAutoSurface.ts    ← Bug location
│   ├── useTasks.ts
│   ├── useAuth.ts
│   └── useOnlineStatus.ts
├── components/
│   ├── TaskCard.tsx
│   ├── DatePicker.tsx
│   ├── DeferModal.tsx
│   └── CategoryDropdown.tsx
├── views/
│   ├── TodayView.tsx
│   ├── TomorrowView.tsx
│   └── DeferredView.tsx
├── types/
│   └── index.ts
└── lib/
    ├── db.ts
    ├── supabase.ts
    └── syncQueue.ts
```

---

## The Change

### Problem Statement

When a user changes a task's date to a future date (beyond tomorrow) without assigning a category, the task incorrectly defaults to the "Today" view instead of the "Deferred" view. Additionally, tasks with no date and no category also incorrectly appear in "Today" instead of "Deferred".

**Current (incorrect) behavior:**
- Future date + category → Deferred ✓
- Future date + no category → Today ✗ (should be Deferred)
- No date + category → Deferred ✓
- No date + no category → Today ✗ (should be Deferred)

**Root cause:** The `useAutoSurface.ts` hook has logic that treats category as a requirement for deferred tasks, but the intended behavior is that date alone (or lack thereof) should determine placement.

### Proposed Solution

Simplify the task categorization logic in `useAutoSurface.ts`:

1. **Today view:** Tasks with today's date OR overdue (past) dates
2. **Tomorrow view:** Tasks with tomorrow's date
3. **Deferred view:** Everything else (future dates beyond tomorrow, no date, invalid dates)

Remove the category-based conditional logic for determining which view a task belongs to.

### Scope

**In Scope:**

- Fix the `useAutoSurface` hook to correctly route tasks to Deferred view
- Tasks with future dates (beyond tomorrow) → Deferred (regardless of category)
- Tasks with no date → Deferred (regardless of category)
- Tasks with invalid dates → Deferred (regardless of category)

**Out of Scope:**

- Changes to the DeferModal component
- Changes to the DatePicker component
- Changes to the Supabase sync logic
- Changes to the task data model
- UI/UX changes to the views themselves

---

## Implementation Details

### Source Tree Changes

| File | Action | Change Description |
|------|--------|-------------------|
| `src/hooks/useAutoSurface.ts` | MODIFY | Simplify routing logic at lines 46-78 to remove category-based conditions |

### Technical Approach

**Current logic (lines 46-78 in useAutoSurface.ts):**
```typescript
if (!task.deferredTo) {
  if (task.category) {
    deferred.push(task)
  } else {
    today.push(task)  // BUG: should be deferred
  }
} else if (!isValidDate) {
  if (task.category) {
    deferred.push(task)
  } else {
    today.push(task)  // BUG: should be deferred
  }
} else if (isToday(taskDate!)) {
  today.push(task)
} else if (isPast(startOfDay(taskDate!))) {
  today.push(task)
} else if (isTomorrow(taskDate!)) {
  tomorrow.push(task)
} else if (task.category) {
  deferred.push(task)
} else {
  today.push(task)  // BUG: should be deferred
}
```

**Fixed logic:**
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

### Existing Patterns to Follow

**Code Style Conventions:**
- No semicolons
- Single quotes for strings
- 2-space indentation
- Functional components with hooks
- `import.meta.env.DEV` for development logging
- JSDoc-style comments for acceptance criteria references (e.g., `// AC-4.2.1:`)

**Error Handling Pattern:**
- Use date-fns `isValid()` for date validation
- Graceful fallback for invalid dates

### Integration Points

- **Input:** `tasks: Task[]` array from `useTasks` hook
- **Output:** `{ todayTasks, tomorrowTasks, deferredTasks }` consumed by view components
- **No API changes:** This is internal logic only

---

## Development Context

### Relevant Existing Code

| File | Lines | Description |
|------|-------|-------------|
| `src/hooks/useAutoSurface.ts` | 1-93 | **Primary change location** - task filtering logic |
| `src/types/index.ts` | 29-37 | Task type definition (read-only reference) |
| `src/hooks/useTasks.ts` | 525-561 | updateTask function (read-only reference) |

### Dependencies

**Framework/Libraries:**
- date-fns 4.1.0: `isToday`, `isTomorrow`, `isPast`, `startOfDay`, `parseISO`, `isValid`
- React 19.2.0: `useMemo` hook

**Internal Modules:**
- `../types`: Task type

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

**Code Style:**
- No semicolons
- Single quotes
- 2-space indentation
- Functional React patterns

**Test Patterns:**
- Vitest for unit tests
- Tests located alongside source files (`.test.ts` suffix)
- `describe`/`it` blocks with clear descriptions

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **Test naming:** `*.test.ts` or `*.test.tsx`
- **Location:** Same directory as source file
- **Existing tests:** `src/hooks/useOnlineStatus.test.ts`, `src/lib/syncQueue.test.ts`

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Build Tool | Vite | 7.2.4 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Testing | Vitest | 3.2.4 |
| Linting | ESLint | 9.39.1 |
| Date Handling | date-fns | 4.1.0 |

---

## Technical Details

**Algorithm Change:**

The current algorithm uses a nested conditional structure with category checks at multiple points. The fix simplifies this to a linear decision tree based purely on date:

1. Check if date is missing or invalid → Deferred
2. Check if date is today → Today
3. Check if date is in the past → Today (overdue surfacing)
4. Check if date is tomorrow → Tomorrow
5. Otherwise (future) → Deferred

**Performance Considerations:**
- No performance impact - same O(n) iteration over tasks
- Fewer conditional checks may marginally improve performance
- Target: < 5ms per existing tech-spec requirement

**Edge Cases Handled:**
- `null` deferredTo → Deferred
- Empty string deferredTo → Deferred (via isValid check)
- Invalid date string → Deferred
- Past dates → Today (overdue surfacing preserved)

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run

# Type check
npm run build  # includes tsc -b
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b fix/deferred-task-routing`
2. Verify dev environment: `npm run dev`
3. Review `src/hooks/useAutoSurface.ts` (already analyzed above)

### Implementation Steps

1. **Open `src/hooks/useAutoSurface.ts`**
2. **Replace lines 46-78** with simplified logic (see Technical Approach section)
3. **Update comments** to reflect new behavior:
   - Remove references to category-based routing
   - Update AC comments to match new acceptance criteria
4. **Run tests:** `npm test`
5. **Manual testing:**
   - Create task with no date, no category → Should appear in Deferred
   - Create task with future date, no category → Should appear in Deferred
   - Verify Today/Tomorrow/Overdue behavior unchanged

### Testing Strategy

**Unit Tests (create `src/hooks/useAutoSurface.test.ts`):**

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| No date, no category | `{ deferredTo: null, category: null }` | deferredTasks |
| No date, with category | `{ deferredTo: null, category: 'Work' }` | deferredTasks |
| Today's date | `{ deferredTo: today }` | todayTasks |
| Tomorrow's date | `{ deferredTo: tomorrow }` | tomorrowTasks |
| Future date, no category | `{ deferredTo: nextWeek, category: null }` | deferredTasks |
| Future date, with category | `{ deferredTo: nextWeek, category: 'Work' }` | deferredTasks |
| Past date (overdue) | `{ deferredTo: yesterday }` | todayTasks |
| Invalid date string | `{ deferredTo: 'invalid' }` | deferredTasks |
| Completed task | `{ completedAt: now }` | excluded from all |

**Manual Testing:**
1. Open app in browser
2. Create a new task (should appear in Today initially - this is ADD behavior, not the bug)
3. Edit task, set future date (next week), no category → Should move to Deferred
4. Edit task, set future date, add category → Should stay in Deferred
5. Edit task, remove date entirely → Should stay in Deferred
6. Verify Today/Tomorrow views still work correctly

### Acceptance Criteria

1. **AC-1:** Tasks with future dates (beyond tomorrow) appear in Deferred view regardless of category
2. **AC-2:** Tasks with no date appear in Deferred view regardless of category
3. **AC-3:** Tasks with invalid dates appear in Deferred view
4. **AC-4:** Tasks with today's date appear in Today view (unchanged)
5. **AC-5:** Tasks with tomorrow's date appear in Tomorrow view (unchanged)
6. **AC-6:** Overdue tasks (past dates) appear in Today view (unchanged)
7. **AC-7:** Completed tasks are excluded from all views (unchanged)

---

## Developer Resources

### File Paths Reference

| File | Purpose |
|------|---------|
| `/today-app/src/hooks/useAutoSurface.ts` | **MODIFY** - Main bug fix location |
| `/today-app/src/hooks/useAutoSurface.test.ts` | **CREATE** - Unit tests for the hook |

### Key Code Locations

| Code Element | Location |
|--------------|----------|
| `useAutoSurface` hook | `src/hooks/useAutoSurface.ts:16` |
| Task filtering logic | `src/hooks/useAutoSurface.ts:46-78` |
| Task type definition | `src/types/index.ts:29` |
| date-fns imports | `src/hooks/useAutoSurface.ts:2` |

### Testing Locations

- Unit tests: `src/hooks/useAutoSurface.test.ts` (to be created)
- Existing test examples: `src/hooks/useOnlineStatus.test.ts`

### Documentation to Update

- Update inline comments in `useAutoSurface.ts` to reflect new behavior
- No external documentation changes required

---

## UX/UI Considerations

**No UI changes required.** This is a logic-only fix. The views (TodayView, TomorrowView, DeferredView) will automatically display the correct tasks based on the fixed filtering logic.

**User Impact:**
- Tasks that were incorrectly appearing in Today will now correctly appear in Deferred
- Users may notice tasks "moving" to the correct view after the fix

---

## Testing Approach

**Test Framework:** Vitest 3.2.4

**Unit Tests:**
- Create `src/hooks/useAutoSurface.test.ts`
- Test all date scenarios with and without categories
- Verify completed tasks are filtered
- Use `describe`/`it` blocks matching existing patterns

**Coverage Target:**
- 100% of conditional branches in the filtering logic
- All edge cases documented above

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main branch
2. Vite build triggered automatically (or `npm run build`)
3. Deploy to hosting (Vercel/Netlify/etc.)
4. Verify in production

### Rollback Plan

1. Revert the commit: `git revert <commit-hash>`
2. Redeploy
3. Verify tasks appear in original locations

### Monitoring

- Check browser console for any errors in dev mode
- Verify IndexedDB sync continues working
- Monitor Supabase logs for any sync issues (unlikely - this is frontend-only)
