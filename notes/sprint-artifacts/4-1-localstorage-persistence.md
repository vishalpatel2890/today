# Story 4.1: localStorage Persistence

Status: done

## Story

As a **user**,
I want **my tasks to be saved automatically and persist across browser sessions**,
so that **I never lose my data**.

## Acceptance Criteria

1. **AC-4.1.1**: Given I add, complete, defer, or delete a task, the entire app state is saved to localStorage immediately after the action completes

2. **AC-4.1.2**: Given I close the browser and reopen the app, all my tasks and categories are restored exactly as I left them

3. **AC-4.1.3**: Given I inspect browser DevTools, data is stored under the key 'today-app-state' as a JSON string

4. **AC-4.1.4**: Given localStorage quota is exceeded during a save operation, a toast warning appears: "Storage full. Some data may not save."

5. **AC-4.1.5**: Given localStorage write fails for any reason, the app continues to function normally (graceful degradation - state remains in memory)

## Frontend Test Gate

**Gate ID**: 4-1-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Story 3.5 complete (Deferred view with categories working)
- [ ] Starting state: Fresh browser session (clear localStorage first via DevTools)
- [ ] Test user: Any (no auth required)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open DevTools, go to Application > Local Storage | Browser DevTools | See localStorage for localhost:5173 |
| 2 | Clear all localStorage for this site | DevTools > Clear | localStorage is empty |
| 3 | Open localhost:5173 | Browser address bar | App loads with empty Today view |
| 4 | Add a task "Buy groceries" | Today view input, press Enter | Task appears in list |
| 5 | Check localStorage in DevTools | Application > Local Storage | See 'today-app-state' key with JSON containing the task |
| 6 | Add another task "Call mom" | Today view input | Task appears, localStorage updates |
| 7 | Complete "Buy groceries" | Click checkbox | Task slides out, localStorage updates with completedAt |
| 8 | Delete "Call mom" | Hover > click trash > confirm | Task removed, localStorage updates |
| 9 | Add 3 new tasks | Today view input | Tasks appear |
| 10 | Defer one task to "Tomorrow" with category "Work" | Click clock > Tomorrow > select category > Defer | Task moves, localStorage shows updated deferredTo and category |
| 11 | Defer another to "No date" with category "Ideas" | Click clock > No date > select category > Defer | Task deferred with null deferredTo |
| 12 | Refresh the page (F5) | Browser | App reloads with all tasks exactly as before |
| 13 | Verify Today view | Today tab | Shows remaining Today tasks |
| 14 | Verify Tomorrow view | Tomorrow tab | Shows task deferred to tomorrow |
| 15 | Verify Deferred view | Deferred tab | Shows task with "Someday" under "Ideas" category |
| 16 | Close browser tab completely | Browser X button | Tab closed |
| 17 | Open new tab to localhost:5173 | New browser tab | App loads with all data intact |
| 18 | Verify all tasks and categories restored | All tabs | Exact same state as before closing |

### Success Criteria (What User Sees)
- [ ] localStorage key 'today-app-state' appears after first task action
- [ ] localStorage updates after every task mutation (add, complete, delete, defer)
- [ ] Page refresh restores all tasks exactly
- [ ] Browser close/reopen restores all tasks exactly
- [ ] Categories created during deferment are also persisted
- [ ] Task dates and categories preserved correctly
- [ ] No data loss across sessions
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Did all your tasks survive a page refresh without any loss?
2. Did closing and reopening the browser preserve everything?
3. Were deferred dates and categories correctly restored?
4. Any unexpected behavior during persistence operations?

## Tasks / Subtasks

- [x] **Task 1: Create storage utility module** (AC: 3)
  - [x] Create `today-app/src/utils/storage.ts`
  - [x] Define STORAGE_KEY constant: `'today-app-state'`
  - [x] Implement `saveState(state: AppState): { success: boolean; error?: Error }`:
    ```typescript
    export const saveState = (state: AppState): { success: boolean; error?: Error } => {
      try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
        return { success: true };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    };
    ```
  - [x] Implement `loadState(): AppState | null`:
    ```typescript
    export const loadState = (): AppState | null => {
      try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) return null;
        return JSON.parse(serialized);
      } catch {
        return null;
      }
    };
    ```
  - [x] Implement `clearState(): void` for development/testing
  - [x] Add dev-mode logging: `if (import.meta.env.DEV) console.log('[Today] Storage:', action)`

- [x] **Task 2: Create useLocalStorage hook** (AC: 1, 2, 5)
  - [x] Create `today-app/src/hooks/useLocalStorage.ts`
  - [x] Implement generic hook signature:
    ```typescript
    export function useLocalStorage<T>(
      key: string,
      initialValue: T
    ): [T, (value: T) => void, Error | null]
    ```
  - [x] Handle initial load from localStorage
  - [x] Handle serialization errors gracefully
  - [x] Return error state for storage failures (for toast integration)

- [x] **Task 3: Extend useTasks hook with persistence** (AC: 1, 2, 4, 5)
  - [x] Open `today-app/src/hooks/useTasks.ts`
  - [x] Add LOAD_STATE action to reducer:
    ```typescript
    | { type: 'LOAD_STATE'; state: AppState }
    ```
  - [x] Handle LOAD_STATE in reducer: replace entire state
  - [x] On mount (useEffect with []):
    - Call loadState() from storage.ts
    - If data found, dispatch LOAD_STATE
    - Log hydration in dev mode
  - [x] After every dispatch (useEffect on state):
    - Call saveState() with current state
    - If save fails with QuotaExceededError, set error state
    - Log save in dev mode
  - [x] Return error state from hook for parent to show toast

- [x] **Task 4: Integrate persistence into App** (AC: 4)
  - [x] Open `today-app/src/App.tsx`
  - [x] Get error state from useTasks (if exposing storage errors)
  - [x] When storage error occurs, call showToast with "Storage full. Some data may not save."
  - [x] Ensure toast displays for storage errors

- [x] **Task 5: Handle corrupt/invalid localStorage gracefully** (AC: 2, 5)
  - [x] In loadState(), wrap JSON.parse in try/catch
  - [x] If parse fails (corrupt data):
    - Log warning in dev mode
    - Return null (will use initial empty state)
    - Optionally show toast on first load failure
  - [x] App continues with empty state rather than crashing

- [x] **Task 6: Build verification and testing** (AC: all)
  - [x] Run `npm run build` to verify no TypeScript errors
  - [x] Run `npm run dev` and test:
    - [x] Add tasks, verify localStorage in DevTools
    - [x] Check 'today-app-state' key structure
    - [x] Refresh page - verify all tasks persist
    - [x] Close browser, reopen - verify persistence
    - [x] Test defer/complete/delete - verify each saves
    - [x] Test with multiple categories
  - [x] Verify no console errors
  - [x] (Optional) Simulate quota exceeded for AC-4.1.4 testing

## Dev Notes

### Architecture Alignment

Per architecture.md and tech-spec-epic-4.md, this story:
- **Creates:** `src/utils/storage.ts`, `src/hooks/useLocalStorage.ts`
- **Modifies:** `src/hooks/useTasks.ts` (add persistence integration), `src/App.tsx` (error handling)

Component patterns required (from architecture.md):
- All hooks use camelCase with `use` prefix
- Constants use SCREAMING_SNAKE_CASE: `STORAGE_KEY`
- Error handling: show toast, don't crash
- Dev logging pattern: `if (import.meta.env.DEV) console.log('[Today]', ...)`

### Data Flow

Per tech-spec-epic-4.md "Workflows and Sequencing":

**App Initialization Flow:**
1. App.tsx mounts
2. useTasks hook initializes
3. Check localStorage for existing state via loadState()
4. If found: dispatch LOAD_STATE with parsed data
5. If not found: use initial empty state `{ tasks: [], categories: [] }`
6. Views render with correct task lists

**Task Mutation Persistence Flow:**
1. User performs action (add, complete, delete, defer)
2. useTasks reducer processes action, returns new state
3. useEffect in useTasks detects state change
4. saveState() writes JSON to localStorage
5. If quota exceeded: show error toast, state still in memory
6. UI continues to work (graceful degradation)

### Storage Schema

Per tech-spec-epic-4.md:
```typescript
// Key: 'today-app-state'
// Value: JSON.stringify(AppState)
{
  "tasks": [
    {
      "id": "uuid-1",
      "text": "Review PRD",
      "createdAt": "2026-01-05T10:00:00.000Z",
      "deferredTo": null,
      "category": null,
      "completedAt": null
    }
  ],
  "categories": ["Work", "Personal"]
}
```

### Performance Considerations

Per tech-spec-epic-4.md NFR:
- localStorage read: < 10ms (single JSON.parse on mount)
- localStorage write: < 10ms (synchronous JSON.stringify)
- Initial hydration: < 50ms (state ready before first paint)
- Storage efficiency: ~150 bytes per task (100 tasks ≈ 15KB, well under 5MB limit)

### Error Handling

Per tech-spec-epic-4.md "Reliability/Availability":
- App functions without localStorage (falls back to memory-only, warns user)
- Quota exceeded: graceful degradation with toast warning
- Invalid/corrupt localStorage data: reset to empty state with toast notification
- Atomic state updates: full state write prevents partial corruption
- No data loss on browser crash (state persisted after each action)

### Learnings from Previous Story

**From Story 3-5-deferred-view-with-categories (Status: review)**

- **New Components Created:**
  - `CategorySection.tsx` at `src/components/CategorySection.tsx` - collapsible category header
  - `DeferredView.tsx` at `src/views/DeferredView.tsx` - category-grouped deferred tasks
- **Files Modified:**
  - `TodayView.tsx` - fixed filter to exclude "Someday" tasks
  - `App.tsx` - DeferredView routing integrated
- **State Shape Confirmed:**
  ```typescript
  interface AppState {
    tasks: Task[];
    categories: string[];
  }
  ```
  This is the exact structure to persist to localStorage.
- **Toast Component Available:** Toast.tsx at `src/components/Toast.tsx` - use for storage error feedback
- **Patterns Established:**
  - Props threading: App → View → TaskList → TaskCard
  - 200ms transitions for smooth UI

[Source: notes/sprint-artifacts/3-5-deferred-view-with-categories.md#Dev-Agent-Record]

### Project Structure Notes

Files to create/modify in this story:
```
today-app/src/
├── hooks/
│   ├── useLocalStorage.ts    # NEW: Generic localStorage hook
│   └── useTasks.ts           # MODIFIED: Add LOAD_STATE action, persistence integration
├── utils/
│   └── storage.ts            # NEW: Low-level localStorage helpers
└── App.tsx                   # MODIFIED: Handle storage error for toast
```

### Edge Cases

Per tech-spec-epic-4.md:
- **localStorage disabled** (private browsing mode): App works in memory-only mode, consider showing info toast
- **localStorage full** (QuotaExceededError): Show warning toast, state preserved in memory
- **Corrupt JSON in localStorage**: Reset to empty state, log warning, continue
- **Very large state** (1000+ tasks): Still within 5MB limit (~150KB), but test performance
- **Rapid mutations**: Each mutation saves, localStorage handles synchronous writes well

### Testing Checklist

1. **Persistence Tests:**
   - Add task → check localStorage → verify task in JSON
   - Complete task → verify completedAt timestamp saved
   - Delete task → verify task removed from JSON
   - Defer task → verify deferredTo and category saved
   - Create new category → verify categories array updated

2. **Hydration Tests:**
   - Refresh page → verify all data restored
   - Close browser → reopen → verify all data restored
   - Multiple tabs → each tab sees same data (localStorage is shared)

3. **Error Handling Tests:**
   - Manually corrupt localStorage JSON → app loads with empty state
   - Disable localStorage (private mode) → app works in memory
   - Fill localStorage near quota → test warning behavior

### References

- [Source: notes/epics.md#Story-4.1] - Story definition with AC
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Story-4.1] - AC-4.1.1 through AC-4.1.5
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Services-and-Modules] - useLocalStorage, storage.ts specs
- [Source: notes/sprint-artifacts/tech-spec-epic-4.md#Workflows-and-Sequencing] - Persistence flow diagrams
- [Source: notes/architecture.md#Data-Architecture] - Task and AppState types
- [Source: notes/architecture.md#Implementation-Patterns] - Error handling, logging patterns

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/4-1-localstorage-persistence.context.xml`

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Implementation plan: Create storage.ts utilities, useLocalStorage hook, extend useTasks with persistence, integrate into App.tsx
- Build verification: `npm run build` passed with no TypeScript errors

### Completion Notes List

- Created `src/utils/storage.ts` with saveState, loadState, clearState utilities
- Created `src/hooks/useLocalStorage.ts` as generic localStorage hook
- Extended `src/hooks/useTasks.ts` with LOAD_STATE action and persistence integration
- Updated `src/App.tsx` to handle storage errors via toast
- All localStorage operations use STORAGE_KEY = 'today-app-state'
- Dev mode logging enabled via `import.meta.env.DEV` checks
- Graceful degradation: app continues in memory-only mode on storage failure
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

**New Files:**
- `today-app/src/utils/storage.ts` - localStorage helpers (saveState, loadState, clearState)
- `today-app/src/hooks/useLocalStorage.ts` - Generic localStorage hook

**Modified Files:**
- `today-app/src/hooks/useTasks.ts` - Added LOAD_STATE action, persistence useEffects, storageError state
- `today-app/src/App.tsx` - Added storageError handling with toast display

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog (4-1-localstorage-persistence) | SM Agent |
| 2026-01-06 | Implementation complete: storage utilities, persistence hooks, App integration | Dev Agent |
| 2026-01-06 | Test Gate PASSED, story moved to review | Dev Agent |
| 2026-01-06 | Story marked done | Vishal |
