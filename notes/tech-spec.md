# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-20
**Project Level:** Quick Flow
**Change Type:** Bug Fix
**Development Context:** Brownfield - Existing React/TypeScript Electron App

---

## Context

### Available Documents

- Product Brief: None found
- Research Documents: None found
- Brownfield Documentation: None (codebase analyzed directly)

### Project Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js + Electron | 39.2.7 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite + electron-vite | 7.2.4 / 5.0.0 |
| Styling | Tailwind CSS | 4.1.18 |
| Testing | Vitest | 3.2.4 |
| Test Utils | Testing Library | React 16.3.1 |
| State (Local) | Dexie (IndexedDB) | 4.2.1 |
| State (Remote) | Supabase | 2.89.0 |
| UI Components | Radix UI | Various (Dialog, Select, Popover) |
| Icons | Lucide React | 0.562.0 |
| Date Utils | date-fns | 4.1.0 |

### Existing Codebase Structure

**Directory Organization:**
```
today-app/src/
├── components/           # React components (27 files)
│   ├── time-tracking/    # Time tracking feature components
│   ├── TaskCard.tsx      # Individual task display
│   ├── TaskList.tsx      # Task list container
│   ├── CategorySection.tsx  # Category grouping in Deferred view
│   └── ...
├── views/                # Top-level view components
│   ├── TodayView.tsx     # Today tab
│   ├── TomorrowView.tsx  # Tomorrow tab
│   └── DeferredView.tsx  # Deferred tab (affected file)
├── hooks/                # Custom React hooks
│   ├── useAutoSurface.ts # Task routing logic
│   ├── useTasks.ts       # Task CRUD operations
│   └── ...
├── lib/                  # Utilities and services
│   ├── db.ts             # Dexie database setup
│   └── ...
└── types/                # TypeScript type definitions
    ├── index.ts          # Task, TaskNotes types
    └── database.ts       # Supabase types
```

**Key Patterns:**
- Functional React components with hooks
- Props interfaces defined inline
- JSDoc comments for component documentation
- Test files co-located with source (`.test.ts`/`.test.tsx`)

---

## The Change

### Problem Statement

In the Deferred view, tasks without a category (`category: null`) are displayed under a category header showing the literal text "null" instead of a user-friendly label. This is a display bug that creates confusion for users.

**Root Cause:**
In `DeferredView.tsx:45`, tasks are grouped by category using:
```typescript
const cat = task.category!  // Non-null assertion on nullable field
```

When `task.category` is `null`, JavaScript coerces it to the string `"null"` when used as an object key, resulting in tasks appearing under a "null" header.

### Proposed Solution

Display "Other" as the category header for tasks where `category: null`. This is a display-only change - the underlying data model remains unchanged, preserving backward compatibility.

**Approach:**
1. When grouping tasks by category, use `"Other"` as the key for tasks with `null` category
2. Ensure "Other" appears at the end of the sorted category list (alphabetically it comes after most letters, but we may want to force it last)

### Scope

**In Scope:**
- Modify `DeferredView.tsx` to display "Other" for uncategorized tasks
- Update grouping logic to handle null → "Other" mapping
- Add unit test for the null category display behavior
- Ensure "Other" category sorts appropriately (at end of list)

**Out of Scope:**
- Database schema changes
- Making "Other" a stored/selectable category
- Changes to `useAutoSurface` hook (routing logic is correct)
- Changes to other views (Today, Tomorrow)
- Changes to CategorySection component (receives category prop as-is)

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `src/views/DeferredView.tsx` | MODIFY | Update `tasksByCategory` grouping to use "Other" for null categories; update sorting to place "Other" last |
| `src/views/DeferredView.test.tsx` | CREATE | Add test file for DeferredView null category behavior |

### Technical Approach

**DeferredView.tsx Changes:**

1. **Update grouping logic (line ~44-51):**
   - Replace `task.category!` with `task.category ?? 'Other'`
   - This maps null categories to the "Other" display key

2. **Update sorting logic (line ~55-58):**
   - Modify the sort comparator to place "Other" at the end
   - All other categories remain alphabetically sorted

**Implementation:**
```typescript
// Grouping: line ~44
const cat = task.category ?? 'Other'

// Sorting: line ~55
const sortedCategories = useMemo(() => {
  return Object.keys(tasksByCategory).sort((a, b) => {
    // "Other" always sorts last
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })
}, [tasksByCategory])
```

### Existing Patterns to Follow

**From DeferredView.tsx:**
- Use `useMemo` for computed values (performance optimization)
- Preserve existing JSDoc comments and AC references
- Follow existing prop destructuring pattern

**From test files:**
- Use `describe`/`it`/`expect` from Vitest
- Use `renderHook` from Testing Library for hook tests
- Create helper functions like `createTask()` for test data
- Group tests by behavior with nested `describe` blocks

### Integration Points

- **CategorySection component:** Receives `category` prop as a string - no changes needed since we're passing "Other" as a valid string
- **Task type:** `category: string | null` - data model unchanged
- **useAutoSurface hook:** Routes tasks to Deferred view - no changes needed

---

## Development Context

### Relevant Existing Code

| Location | Reference |
|----------|-----------|
| `src/views/DeferredView.tsx:41-52` | Current `tasksByCategory` grouping logic |
| `src/views/DeferredView.tsx:54-59` | Current `sortedCategories` sorting logic |
| `src/hooks/useAutoSurface.test.ts:8-18` | `createTask` helper pattern for tests |
| `src/types/index.ts:29-38` | Task type definition |

### Dependencies

**Framework/Libraries:**
- React 19.2.0 (hooks: useState, useMemo, useCallback)
- TypeScript 5.9.3 (strict null checks)

**Internal Modules:**
- `../types` - Task type
- `../hooks/useDeferredViewHotkeys` - keyboard shortcuts
- `../components/CategorySection` - category display
- `../components/EmptyState` - empty state UI

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

**Code Style:**
- Functional components with TypeScript
- Props interfaces defined above component
- JSDoc with AC (Acceptance Criteria) references
- No semicolons (inferred from codebase)
- Single quotes for strings
- 2-space indentation

**Test Patterns:**
- Test files: `*.test.ts` / `*.test.tsx`
- Framework: Vitest with Testing Library
- Assertions: `expect().toContain()`, `expect().toHaveLength()`
- Helper factories: `createTask()` style

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **DOM Testing:** @testing-library/react 16.3.1
- **Setup:** `src/test/setup.ts` (fake-indexeddb, JSDOM mocks)
- **Test Location:** Co-located with source files
- **Naming:** `ComponentName.test.tsx`

---

## Implementation Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20.x |
| Framework | React 19.2.0 |
| Language | TypeScript 5.9.3 |
| Testing | Vitest 3.2.4 + Testing Library |
| Build | Vite 7.2.4 |

---

## Technical Details

**Algorithm:**
1. Iterate through tasks array
2. For each task, determine category key: `task.category ?? 'Other'`
3. Group tasks by this key into a Record<string, Task[]>
4. Sort category keys alphabetically, with "Other" forced to end
5. Render CategorySection for each sorted category

**Edge Cases:**
- All tasks have categories (no "Other" section appears)
- All tasks have null category (only "Other" section appears)
- Mix of categorized and uncategorized tasks
- Empty task list (shows EmptyState - existing behavior)

**Performance:**
- No additional iterations - single pass through tasks
- `useMemo` ensures grouping only recalculates when tasks change
- Existing performance target: < 5ms

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests once (no watch)
npm run test:run

# Run linter
npm run lint
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b fix/deferred-other-category`
2. Verify dev environment: `npm run dev`
3. Review existing code: `src/views/DeferredView.tsx`

### Implementation Steps

1. **Modify DeferredView.tsx grouping logic:**
   - Line ~45: Change `task.category!` to `task.category ?? 'Other'`

2. **Modify DeferredView.tsx sorting logic:**
   - Lines ~55-58: Update sort comparator to place "Other" last

3. **Create test file:**
   - Create `src/views/DeferredView.test.tsx`
   - Add tests for null category → "Other" display
   - Add tests for "Other" sorting position

4. **Verify changes:**
   - Run `npm test` to ensure tests pass
   - Run `npm run lint` to check code style
   - Manual testing in browser

### Testing Strategy

**Unit Tests (DeferredView.test.tsx):**
1. Tasks with null category appear under "Other" section
2. "Other" section appears at end of category list
3. Mixed categorized/uncategorized tasks grouped correctly
4. Empty task list shows EmptyState (regression test)

**Manual Testing:**
1. Create task with no category, defer to next week
2. Navigate to Deferred tab
3. Verify task appears under "Other" (not "null")
4. Verify "Other" appears after all alphabetically sorted categories

### Acceptance Criteria

1. **AC-FIX-1:** Tasks with `category: null` in Deferred view display under "Other" category header
2. **AC-FIX-2:** "Other" category appears at the end of the sorted category list
3. **AC-FIX-3:** All existing tests pass
4. **AC-FIX-4:** No changes to database schema or data storage

---

## Developer Resources

### File Paths Reference

| Purpose | Path |
|---------|------|
| Main change | `src/views/DeferredView.tsx` |
| New test | `src/views/DeferredView.test.tsx` |
| Task type | `src/types/index.ts` |
| Category display | `src/components/CategorySection.tsx` |
| Test setup | `src/test/setup.ts` |

### Key Code Locations

| Description | Location |
|-------------|----------|
| Task grouping logic | `src/views/DeferredView.tsx:41-52` |
| Category sorting logic | `src/views/DeferredView.tsx:54-59` |
| Task type definition | `src/types/index.ts:29-38` |
| createTask helper pattern | `src/hooks/useAutoSurface.test.ts:8-18` |

### Testing Locations

| Type | Location |
|------|----------|
| Unit tests | `src/views/DeferredView.test.tsx` (new) |
| Related tests | `src/hooks/useAutoSurface.test.ts` |
| Test setup | `src/test/setup.ts` |

### Documentation to Update

None required for this fix.

---

## UX/UI Considerations

**UI Components Affected:**
- DeferredView category headers - display change only

**User Experience:**
- Before: Confusing "null" text in category header
- After: Clear "Other" label for uncategorized tasks

**No visual design changes required** - uses existing CategorySection component styling.

---

## Testing Approach

**Test Framework:** Vitest 3.2.4

**Test File:** `src/views/DeferredView.test.tsx`

**Test Cases:**
```typescript
describe('DeferredView', () => {
  describe('Category grouping', () => {
    it('should display tasks with null category under "Other"')
    it('should sort "Other" category last')
    it('should handle mix of categorized and uncategorized tasks')
  })
})
```

**Coverage Target:** All new code paths tested

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main branch
2. CI runs tests automatically
3. Build and release Electron app (if applicable)
4. Web version auto-deploys via CI/CD

### Rollback Plan

1. Revert the commit
2. Redeploy previous version

### Monitoring

- No specific monitoring needed for this display fix
- User feedback if "Other" label is unclear (unlikely)
