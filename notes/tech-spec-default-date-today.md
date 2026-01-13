# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-12
**Project Level:** Quick Flow (Single Story)
**Change Type:** Bug Fix / Behavior Change
**Development Context:** Brownfield

---

## Context

### Available Documents

- No product briefs or research documents (standalone quick-flow mode)
- Existing codebase documentation analyzed from source

### Project Stack

| Component | Version | Notes |
|-----------|---------|-------|
| Framework | React 19.2.0 | Functional components with hooks |
| Language | TypeScript 5.9.3 | Strict mode |
| Build Tool | Vite 7.2.4 | ESM modules |
| Testing | Vitest 3.2.4 | With @testing-library/react 16.3.1 |
| CSS | Tailwind CSS 4.1.18 | Via @tailwindcss/vite plugin |
| Date Library | date-fns 4.1.0 | ISO string date handling |
| Local Storage | Dexie 4.2.1 (IndexedDB) | With localStorage fallback |
| Backend | Supabase | Real-time sync, auth |
| UI Components | Radix UI | Dialog, Popover, Select |

### Existing Codebase Structure

```
today-app/src/
├── App.tsx                    # Main app with view routing
├── components/
│   ├── AddTaskInput.tsx       # Quick-add task input (Enter to submit)
│   ├── TaskCard.tsx           # Individual task display
│   ├── TaskList.tsx           # Task list container
│   └── ...
├── hooks/
│   ├── useTasks.ts            # Task CRUD operations + sync
│   ├── useAutoSurface.ts      # Date-based task routing logic
│   └── ...
├── views/
│   ├── TodayView.tsx          # Today's tasks (only view with AddTaskInput)
│   ├── TomorrowView.tsx       # Tomorrow's tasks
│   └── DeferredView.tsx       # Future/undated tasks
├── types/
│   └── index.ts               # Task, AppState interfaces
└── utils/
    └── storage.ts             # localStorage utilities
```

**Key Architecture Insight:**
- Tasks flow: `AddTaskInput` → `useTasks.addTask()` → reducer → `useAutoSurface` → Views
- View routing is determined by `deferredTo` date field in `useAutoSurface` hook
- Tasks with `deferredTo: null` route to **Deferred** view

---

## The Change

### Problem Statement

When a user adds a new task via the AddTaskInput component, the task is created with `deferredTo: null`. The `useAutoSurface` hook then routes tasks with no date to the **Deferred** view instead of the **Today** view.

**User Impact:** New tasks disappear from the Today view immediately after creation, appearing in the Deferred view instead. This is counterintuitive - users expect new tasks to appear in Today since that's where they created them.

**Root Cause Location:**
- `src/hooks/useTasks.ts:36` - `ADD_TASK` reducer sets `deferredTo: null`
- `src/hooks/useTasks.ts:428` - `addTask` function creates task with `deferredTo: null`
- `src/hooks/useAutoSurface.ts:47-49` - Routes `null` dates to Deferred view

### Proposed Solution

Set the default `deferredTo` value to **today's date** (ISO string format) when creating new tasks. This ensures:
1. New tasks immediately appear in the Today view
2. Matches user mental model (new task = do today)
3. No change to existing task routing logic

**Implementation:**
- Use `startOfDay(new Date()).toISOString()` from date-fns for consistent date handling
- Apply in both the reducer action and the addTask function
- Sync payload to Supabase includes today's date

### Scope

**In Scope:**
- Modify `useTasks.ts` to set default `deferredTo` to today's date
- Update `ADD_TASK` reducer action
- Update `addTask` function and Supabase payload
- Add unit tests for new behavior

**Out of Scope:**
- Changing view routing logic in `useAutoSurface`
- UI changes to AddTaskInput component
- Changes to edit/update task flows
- Migrating existing tasks with null dates

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useTasks.ts` | MODIFY | Update `ADD_TASK` reducer (line 36) and `addTask` function (lines 402-464) to use today's date as default |
| `src/hooks/useTasks.test.ts` | CREATE | Add tests for default date behavior |

### Technical Approach

**Date Format:**
Use `startOfDay(new Date()).toISOString()` from date-fns 4.1.0 to generate today's date:
- Returns ISO 8601 string (e.g., `"2026-01-10T00:00:00.000Z"`)
- Matches existing `deferredTo` field format
- `startOfDay` ensures consistent midnight timestamp

**Reducer Change (line 36):**
```typescript
// Before
deferredTo: null,

// After
deferredTo: startOfDay(new Date()).toISOString(),
```

**addTask Function (line 428):**
```typescript
// Before
deferredTo: null,

// After
deferredTo: startOfDay(new Date()).toISOString(),
```

**Supabase Payload (line 438-443):**
```typescript
// Before: deferred_to not included (defaults to null)

// After: include deferred_to
deferred_to: startOfDay(new Date()).toISOString(),
```

### Existing Patterns to Follow

Follow patterns established in `useTasks.ts`:
- Import date-fns functions at top of file (already imports are common in codebase)
- Use ISO string format for all date values
- Maintain sync between local state and Supabase payload
- Log operations in dev mode with `[Today]` prefix

**Testing Pattern from `useAutoSurface.test.ts`:**
- Use `describe`/`it` blocks with Vitest
- Use `renderHook` from @testing-library/react
- Use date-fns helpers (`startOfDay`, `addDays`) for date manipulation
- Mock task creation with helper functions

### Integration Points

| System | Integration |
|--------|-------------|
| `useAutoSurface` hook | Will now receive tasks with today's date → routes to Today view |
| IndexedDB (Dexie) | Task saved with `deferred_to` field populated |
| Supabase | Insert payload includes `deferred_to` column |
| localStorage | Backup includes task with populated `deferredTo` |

---

## Development Context

### Relevant Existing Code

| Reference | Location | Purpose |
|-----------|----------|---------|
| ADD_TASK reducer | `src/hooks/useTasks.ts:29-41` | Creates new task object |
| addTask function | `src/hooks/useTasks.ts:402-464` | Full add task flow |
| Task interface | `src/types/index.ts:29-37` | Task type definition |
| Date routing | `src/hooks/useAutoSurface.ts:47-62` | View routing logic |
| Existing tests | `src/hooks/useAutoSurface.test.ts` | Test patterns to follow |

### Dependencies

**Framework/Libraries:**
- date-fns 4.1.0 - `startOfDay` function (already used in `useAutoSurface.ts`)

**Internal Modules:**
- No new internal dependencies required

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

| Convention | Pattern |
|------------|---------|
| Date format | ISO 8601 strings (`toISOString()`) |
| Imports | Named imports, grouped by type |
| Comments | JSDoc with AC references |
| Logging | `if (import.meta.env.DEV) console.log('[Today]', ...)` |
| Tests | Co-located `.test.ts` files |

### Test Framework & Standards

| Aspect | Standard |
|--------|----------|
| Framework | Vitest 3.2.4 |
| DOM Testing | @testing-library/react 16.3.1 |
| Mocking | IndexedDB via fake-indexeddb |
| Setup File | `src/test/setup.ts` |
| File Pattern | `*.test.ts` co-located with source |
| Run Command | `npm test` (watch) / `npm run test:run` (single) |

---

## Implementation Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (Vite dev server) |
| Framework | React 19.2.0 |
| Language | TypeScript 5.9.3 |
| Testing | Vitest 3.2.4 |
| Date Handling | date-fns 4.1.0 |
| Linting | ESLint 9.39.1 |

---

## Technical Details

**Date Calculation:**
```typescript
import { startOfDay } from 'date-fns'

const todayDate = startOfDay(new Date()).toISOString()
// Result: "2026-01-10T00:00:00.000Z" (midnight UTC of current day)
```

**Why `startOfDay`:**
- Consistent with existing usage in `useAutoSurface.ts`
- Ensures `isToday()` check passes regardless of when task is created
- Avoids timezone edge cases by normalizing to midnight

**Edge Cases:**
1. **Timezone handling:** `startOfDay` uses local timezone, which aligns with user expectation
2. **Midnight creation:** Task created at 11:59 PM still gets today's date
3. **Offline creation:** Same logic applies; sync payload includes date

---

## Development Setup

```bash
# 1. Navigate to app directory
cd today-app

# 2. Install dependencies (if needed)
npm install

# 3. Run development server
npm run dev

# 4. Run tests (watch mode)
npm test

# 5. Run tests (single run)
npm run test:run

# 6. Type check
npm run build  # Runs tsc -b first
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b fix/default-date-today`
2. Verify dev environment: `npm run dev`
3. Review existing code: `src/hooks/useTasks.ts` lines 29-41, 402-464

### Implementation Steps

1. **Add date-fns import to useTasks.ts**
   - Add `startOfDay` to imports from 'date-fns'

2. **Update ADD_TASK reducer action (line 36)**
   - Change `deferredTo: null` to `deferredTo: startOfDay(new Date()).toISOString()`

3. **Update addTask function (lines 420-431)**
   - Update `newTask` object to use today's date for `deferredTo`

4. **Update Supabase payload (lines 438-443)**
   - Add `deferred_to: startOfDay(new Date()).toISOString()` to insert payload

5. **Create tests in useTasks.test.ts**
   - Test that new tasks have today's date
   - Test that tasks appear in Today view after creation

6. **Verify behavior**
   - Run `npm test` to ensure tests pass
   - Manual test: Add task, verify it stays in Today view

### Testing Strategy

**Unit Tests (useTasks.test.ts):**
- `addTask should set deferredTo to today's date`
- `addTask should create task that routes to Today view`

**Integration Verification:**
- Add task via UI → task remains in Today view
- Refresh page → task still in Today view
- Check IndexedDB → task has correct deferred_to value

### Acceptance Criteria

1. ✅ When a new task is created, `deferredTo` is set to today's date (not null)
2. ✅ New tasks appear in the Today view immediately after creation
3. ✅ New tasks remain in Today view after page refresh
4. ✅ Supabase sync includes the `deferred_to` field with today's date
5. ✅ Existing tasks with null dates are NOT affected (no migration)
6. ✅ All existing tests continue to pass

---

## Developer Resources

### File Paths Reference

- `/today-app/src/hooks/useTasks.ts` - Main file to modify
- `/today-app/src/hooks/useTasks.test.ts` - Tests to create
- `/today-app/src/hooks/useAutoSurface.ts` - Reference for routing logic
- `/today-app/src/hooks/useAutoSurface.test.ts` - Reference for test patterns
- `/today-app/src/types/index.ts` - Task type definition

### Key Code Locations

| Function | File:Line |
|----------|-----------|
| ADD_TASK reducer | `useTasks.ts:29-41` |
| addTask function | `useTasks.ts:402-464` |
| newTask object | `useTasks.ts:423-431` |
| Supabase payload | `useTasks.ts:438-443` |
| isToday check | `useAutoSurface.ts:50` |

### Testing Locations

- Unit tests: `src/hooks/useTasks.test.ts` (to create)
- Reference: `src/hooks/useAutoSurface.test.ts`
- Test setup: `src/test/setup.ts`

### Documentation to Update

None required for this change.

---

## UX/UI Considerations

**No UI changes required.**

The fix is purely in the data layer. User experience improvement:
- Before: New task disappears to Deferred view (confusing)
- After: New task stays in Today view (expected behavior)

---

## Testing Approach

**Conform to existing test standards:**
- File naming: `*.test.ts` co-located
- Framework: Vitest with @testing-library/react
- Assertion style: `expect()` with Vitest matchers
- Date mocking: Use real dates with date-fns helpers

**Test Cases:**
```typescript
describe('useTasks', () => {
  describe('addTask', () => {
    it('should set deferredTo to today when creating a task', async () => {
      // Create task
      // Assert deferredTo equals startOfDay(new Date()).toISOString()
    })
  })
})
```

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main branch
2. Vite build runs via `npm run build`
3. Deploy static assets to hosting
4. PWA service worker updates automatically

### Rollback Plan

1. Revert commit
2. Redeploy previous version
3. No database migration to revert

### Monitoring

- Check console for `[Today]` log messages in dev mode
- Verify new tasks appear in Today view in production
- No additional monitoring needed for this change
