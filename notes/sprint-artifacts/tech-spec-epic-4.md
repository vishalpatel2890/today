# Epic Technical Specification: Persistence & Polish

Date: 2026-01-06
Author: Vishal
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 completes the **Today** app MVP by implementing the essential data persistence layer and polish features that ensure a seamless user experience. This epic transforms the app from a session-only tool into a reliable daily productivity companion by saving all task and category data to localStorage, automatically surfacing deferred tasks when their dates arrive, and providing refined feedback through toast notifications and thoughtful empty states.

The persistence layer (localStorage) ensures users never lose their data across browser sessions. Auto-surfacing delivers the core promise of the deferment system - tasks deferred to a future date automatically appear in the Today view when that date arrives, without user intervention. Toast notifications provide subtle confirmation of user actions, and polished empty states guide new users and celebrate inbox-zero moments.

## Objectives and Scope

**In-Scope:**
- localStorage persistence: automatic saving and loading of tasks and categories
- Data hydration on app load from localStorage
- Storage quota error handling with user feedback
- Auto-surfacing: tasks automatically appear in Today/Tomorrow views based on date
- Date-based filtering on app initialization
- Toast notification system with slide in/out animations
- Toast auto-dismiss after 3 seconds
- Toast stacking for multiple notifications
- Empty state messages for Today, Tomorrow, and Deferred views
- Empty state styling per UX spec (centered, muted text)

**Out-of-Scope:**
- Cloud sync (future Vision feature per PRD)
- Export/Import JSON functionality (Growth feature FR22-23)
- PWA support (Growth feature)
- Midnight auto-refresh for date changes (documented as enhancement)
- Data migration or schema versioning (single schema for MVP)
- Edit task functionality (Growth feature FR4)

## System Architecture Alignment

This epic completes the core architecture established in Epics 1-3:

- **Hooks:** Creates `useLocalStorage.ts` for persistence, `useAutoSurface.ts` for date-based task surfacing; extends `useTasks.ts` to integrate persistence and surfacing
- **Components:** Enhances `Toast.tsx` (started in Epic 3) with animations and stacking; adds empty state components to views
- **Data Flow:** On mount: localStorage → useTasks → views. On change: useTasks → localStorage (immediate write)
- **Storage:** Browser localStorage with key `today-app-state`, value is JSON-serialized AppState

**Architectural Constraints:**
- All localStorage operations are synchronous (blocking but fast)
- No external network calls - fully offline capable
- Single localStorage key for entire app state (atomic read/write)
- Date comparisons use user's local timezone via date-fns
- State hydration happens before first render (prevent flash of empty state)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `useLocalStorage.ts` | Generic localStorage read/write with JSON serialization | Key string, initial value | [storedValue, setValue, error] |
| `useAutoSurface.ts` | Run date-based task filtering on mount | Tasks array | Filtered tasks by view type |
| `useTasks.ts` (extension) | Integrate persistence: load on mount, save on every dispatch | N/A | Persisted state |
| `Toast.tsx` (enhancement) | Full toast system with animations, stacking, auto-dismiss | Message, type, duration | Animated toast UI |
| `TodayView.tsx` (enhancement) | Add empty state component | Tasks array | View with empty state fallback |
| `TomorrowView.tsx` (enhancement) | Add empty state component | Tasks array | View with empty state fallback |
| `DeferredView.tsx` (enhancement) | Add empty state component | Tasks array | View with empty state fallback |
| `storage.ts` | Low-level localStorage helpers with error handling | Key, value | Success/error status |

### Data Models and Contracts

**AppState interface (existing, persisted):**
```typescript
interface AppState {
  tasks: Task[];
  categories: string[];
}
```

**Task interface (existing, persisted fields):**
```typescript
interface Task {
  id: string;                    // UUID
  text: string;                  // Task content
  createdAt: string;             // ISO date string
  deferredTo: string | null;     // ISO date or null for "someday"
  category: string | null;       // Only set when deferred
  completedAt: string | null;    // ISO date when completed
}
```

**localStorage Schema:**
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

**Toast State:**
```typescript
interface ToastMessage {
  id: string;                    // Unique ID for stacking
  message: string;               // Display text
  type?: 'success' | 'error';    // Visual style (default: success)
  duration?: number;             // Auto-dismiss time (default: 3000ms)
}

interface ToastState {
  toasts: ToastMessage[];
}
```

**TaskAction extension (LOAD_STATE for hydration):**
```typescript
| { type: 'LOAD_STATE'; state: AppState }
```

### APIs and Interfaces

**useLocalStorage Hook:**
```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, Error | null]
```

**useAutoSurface Hook:**
```typescript
function useAutoSurface(tasks: Task[]): {
  todayTasks: Task[];
  tomorrowTasks: Task[];
  deferredTasks: Task[];
}
```

**Toast Context/Provider:**
```typescript
interface ToastContextValue {
  addToast: (message: string, options?: { type?: 'success' | 'error'; duration?: number }) => void;
  removeToast: (id: string) => void;
}
```

**Storage Utility:**
```typescript
// src/utils/storage.ts
const STORAGE_KEY = 'today-app-state';

function saveState(state: AppState): { success: boolean; error?: Error };
function loadState(): AppState | null;
function clearState(): void;
```

### Workflows and Sequencing

**App Initialization Flow:**
1. App.tsx mounts
2. useTasks hook initializes
3. Check localStorage for existing state
4. If found: dispatch LOAD_STATE with parsed data
5. If not found: use initial empty state
6. useAutoSurface runs to categorize tasks by date
7. Views render with correct task lists

**Task Mutation Persistence Flow:**
1. User performs action (add, complete, delete, defer)
2. useTasks reducer processes action, returns new state
3. useEffect in useTasks detects state change
4. saveState() writes JSON to localStorage
5. If quota exceeded: show error toast, state still in memory
6. UI continues to work (graceful degradation)

**Auto-Surfacing Logic:**
```typescript
const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);

// Today View: tasks with no date OR date is today, not completed
const todayTasks = tasks.filter(task =>
  !task.completedAt &&
  (task.deferredTo === null || isToday(parseISO(task.deferredTo)))
);

// Tomorrow View: tasks with date tomorrow, not completed
const tomorrowTasks = tasks.filter(task =>
  !task.completedAt &&
  task.deferredTo &&
  isTomorrow(parseISO(task.deferredTo))
);

// Deferred View: tasks with date > tomorrow OR no date but has category, not completed
const deferredTasks = tasks.filter(task =>
  !task.completedAt &&
  task.category !== null &&
  (task.deferredTo === null ||
   (!isToday(parseISO(task.deferredTo)) && !isTomorrow(parseISO(task.deferredTo))))
);
```

**Toast Lifecycle:**
1. Action triggers addToast(message)
2. Toast added to queue with unique ID
3. Toast slides in from bottom (transform: translateY)
4. After duration (default 3000ms), toast slides out
5. Toast removed from queue after animation completes

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| localStorage read | < 10ms | Single JSON.parse on mount |
| localStorage write | < 10ms | Synchronous JSON.stringify |
| Initial hydration | < 50ms | State ready before first paint |
| Auto-surface calculation | < 5ms | Simple array filter operations |
| Toast animation | 60fps | CSS transitions only, GPU-accelerated transforms |
| Storage size | < 1KB per 100 tasks | Minimal JSON schema |

**Storage Efficiency Calculation:**
- Average task JSON: ~150 bytes
- 100 tasks: ~15KB (well under 5MB localStorage limit)
- 1000 tasks: ~150KB (still manageable)
- Categories: ~20 bytes each

### Security

- No sensitive data in localStorage (just task text, user-defined)
- No authentication or authorization (local-only per FR21)
- No external data transmission (per NFR4)
- localStorage is same-origin protected by browser
- No XSS vectors - React escapes all rendered content
- Storage data readable via DevTools (acceptable for personal productivity app)

### Reliability/Availability

- App functions without localStorage (falls back to memory-only, warns user)
- Quota exceeded: graceful degradation with toast warning
- Invalid/corrupt localStorage data: reset to empty state with toast notification
- Date parsing errors: treat as "no date" (someday)
- Atomic state updates: full state write prevents partial corruption
- No data loss on browser crash (state persisted after each action)

### Observability

- Console logging in dev mode: `[Today] Storage: saved/loaded/error`
- Toast provides user feedback for storage errors
- No external telemetry (per NFR4)
- Storage usage visible in browser DevTools

## Dependencies and Integrations

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.0 | UI framework |
| react-dom | ^19.2.0 | React DOM renderer |
| date-fns | ^4.1.0 | Date comparison: isToday, isTomorrow, parseISO, format |
| lucide-react | ^0.562.0 | Icons (CheckCircle for success toast) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4.1.18 | Utility-first styling |
| typescript | ~5.9.3 | Type safety |
| vite | ^7.2.4 | Dev server and build |

### Browser APIs

| API | Purpose | Fallback |
|-----|---------|----------|
| localStorage | State persistence | In-memory only (session) |
| JSON.parse/stringify | Serialization | N/A (required) |
| crypto.randomUUID | Toast ID generation | Math.random fallback |

### Internal Dependencies

- **Epic 1 artifacts:** Design tokens for toast styling, Tailwind config
- **Epic 2 artifacts:** useTasks hook (to extend), TodayView (to enhance)
- **Epic 3 artifacts:** Toast.tsx (to enhance), TomorrowView.tsx, DeferredView.tsx (to enhance)
- **Architecture patterns:** Reducer pattern, immutable state updates

## Acceptance Criteria (Authoritative)

**Story 4.1: localStorage Persistence**
1. AC-4.1.1: Adding, completing, deferring, or deleting a task immediately saves the entire state to localStorage
2. AC-4.1.2: Closing the browser and reopening the app restores all tasks and categories exactly as left
3. AC-4.1.3: Data is stored under the key 'today-app-state' in localStorage
4. AC-4.1.4: If localStorage quota is exceeded, a toast warns: "Storage full. Some data may not save."
5. AC-4.1.5: App continues to function even if localStorage write fails (graceful degradation)

**Story 4.2: Auto-Surfacing**
6. AC-4.2.1: Tasks deferred to today's date appear in the Today view
7. AC-4.2.2: Tasks deferred to tomorrow's date appear in the Tomorrow view
8. AC-4.2.3: Tasks deferred to dates beyond tomorrow appear in the Deferred view
9. AC-4.2.4: Tasks with no date (someday) appear in the Deferred view
10. AC-4.2.5: Date-based surfacing occurs automatically on app load
11. AC-4.2.6: Completed tasks do not appear in any view (filtered out)

**Story 4.3: Toast Notifications**
12. AC-4.3.1: Defer action shows toast: "Deferred to [Tomorrow/Jan 15/Someday] / [Category]"
13. AC-4.3.2: Delete action shows toast: "Task deleted"
14. AC-4.3.3: Storage error shows toast: "Storage full. Some data may not save."
15. AC-4.3.4: Toasts appear at the bottom-center of the screen
16. AC-4.3.5: Toasts auto-dismiss after 3 seconds
17. AC-4.3.6: Toasts slide in from below and slide out to below
18. AC-4.3.7: Multiple toasts stack vertically (most recent at bottom)

**Story 4.4: Empty States Polish**
19. AC-4.4.1: Today tab with no tasks shows: "Nothing for today." and "Add a task to get started."
20. AC-4.4.2: Tomorrow tab with no tasks shows: "Nothing planned for tomorrow."
21. AC-4.4.3: Deferred tab with no tasks shows: "No deferred tasks. Everything is in Today or Tomorrow!"
22. AC-4.4.4: Empty state text uses muted-foreground color (#64748b)
23. AC-4.4.5: Empty state text is centered in the content area
24. AC-4.4.6: Add task input is visible below the Today empty state

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Idea |
|----|--------------|--------------|-----------|
| AC-4.1.1 | Workflows - Task Mutation | useTasks.ts, storage.ts | Add task, check localStorage in DevTools |
| AC-4.1.2 | Workflows - App Init | useTasks.ts | Add tasks, refresh page, verify restoration |
| AC-4.1.3 | Data Models - localStorage | storage.ts | Check localStorage key name in DevTools |
| AC-4.1.4 | NFR - Reliability | useTasks.ts, Toast.tsx | Fill localStorage, try to add task |
| AC-4.1.5 | NFR - Reliability | useTasks.ts | Disable localStorage, verify app works |
| AC-4.2.1 | Workflows - Auto-Surfacing | useAutoSurface.ts | Set task date to today, verify Today view |
| AC-4.2.2 | Workflows - Auto-Surfacing | useAutoSurface.ts | Set task date to tomorrow, verify Tomorrow view |
| AC-4.2.3 | Workflows - Auto-Surfacing | useAutoSurface.ts | Set task date to next week, verify Deferred view |
| AC-4.2.4 | Workflows - Auto-Surfacing | useAutoSurface.ts | Defer with no date, verify Deferred view |
| AC-4.2.5 | Workflows - App Init | App.tsx | Refresh with deferred tasks, verify correct views |
| AC-4.2.6 | Workflows - Auto-Surfacing | useAutoSurface.ts | Complete task, verify not in any view |
| AC-4.3.1 | Detailed Design - Toast | Toast.tsx, DeferModal.tsx | Defer task, verify toast message |
| AC-4.3.2 | Detailed Design - Toast | Toast.tsx, TaskCard.tsx | Delete task, verify toast message |
| AC-4.3.3 | NFR - Reliability | Toast.tsx | Trigger storage error, verify toast |
| AC-4.3.4 | Detailed Design - Toast | Toast.tsx | Trigger toast, verify position |
| AC-4.3.5 | Detailed Design - Toast | Toast.tsx | Trigger toast, wait 3s, verify dismissed |
| AC-4.3.6 | Detailed Design - Toast | Toast.tsx | Trigger toast, observe animation |
| AC-4.3.7 | Detailed Design - Toast | Toast.tsx | Trigger multiple toasts quickly, verify stacking |
| AC-4.4.1 | Detailed Design - Empty States | TodayView.tsx | Clear all tasks, verify Today empty state |
| AC-4.4.2 | Detailed Design - Empty States | TomorrowView.tsx | Clear tomorrow tasks, verify empty state |
| AC-4.4.3 | Detailed Design - Empty States | DeferredView.tsx | Clear deferred tasks, verify empty state |
| AC-4.4.4 | Detailed Design - Empty States | All views | Check empty state text color |
| AC-4.4.5 | Detailed Design - Empty States | All views | Check empty state centering |
| AC-4.4.6 | Detailed Design - Empty States | TodayView.tsx | Today empty, verify add input visible |

## Risks, Assumptions, Open Questions

**Risks:**
- **R1: localStorage quota exceeded** - Users with many tasks could hit the 5MB limit. Mitigation: 100 tasks ≈ 15KB, unlikely to hit limit; show warning toast; future: add export feature to offload data.
- **R2: Corrupt localStorage data** - Manual DevTools editing or browser issues could corrupt state. Mitigation: Wrap JSON.parse in try/catch; reset to empty state on parse error; show toast notification.
- **R3: Date timezone edge cases** - Tasks deferred to "tomorrow" may behave unexpectedly around midnight or with timezone changes. Mitigation: Use date-fns startOfDay/endOfDay; test with various timezones; document as known limitation.
- **R4: Toast stacking performance** - Rapid actions could create many toasts. Mitigation: Limit visible toasts to 3; older toasts dismissed early if exceeded.

**Assumptions:**
- **A1:** Users have localStorage enabled (most browsers do by default)
- **A2:** 5MB localStorage limit is sufficient (100 tasks = 15KB, leaves room for ~30,000 tasks)
- **A3:** Users understand empty states are contextual to each view
- **A4:** Date comparisons use user's local timezone (acceptable for personal productivity app)
- **A5:** Storage errors are rare (modern browsers handle localStorage reliably)

**Open Questions:**
- None - all design decisions resolved in PRD, UX spec, and architecture docs.

## Test Strategy Summary

**Test Levels:**

| Level | Framework | Scope |
|-------|-----------|-------|
| Unit | Vitest | useLocalStorage hook, storage.ts utilities |
| Component | Vitest + Testing Library | Toast component, empty state components |
| Integration | Vitest + Testing Library | useTasks persistence, auto-surfacing logic |
| E2E | Manual testing | Full persistence workflow, toast animations |

**Coverage by AC:**

- **AC-4.1.x (Persistence):** Unit tests for storage utilities; integration test for save/load cycle; manual test for browser close/reopen
- **AC-4.2.x (Auto-surfacing):** Unit tests for date comparison logic; integration test for view filtering; manual test with various dates
- **AC-4.3.x (Toasts):** Component tests for Toast rendering; manual test for animations and stacking
- **AC-4.4.x (Empty states):** Component tests for empty state rendering; visual regression with screenshots

**Edge Cases:**
- localStorage disabled (private browsing mode)
- localStorage full (simulate with quota-limited write)
- Corrupt JSON in localStorage (manually corrupt, verify recovery)
- Task with invalid date string (verify graceful handling)
- Many tasks (100+) for performance verification
- Rapid task mutations (verify persistence keeps up)
- Multiple toasts in quick succession (verify stacking limit)
- Timezone change during session (document as known behavior)

**Manual Testing Script:**
1. Open app fresh (empty localStorage)
2. Add 3 tasks, verify they appear in Today
3. Defer one to tomorrow, one to next week, one with no date
4. Refresh page - verify all tasks restored in correct views
5. Check localStorage in DevTools - verify 'today-app-state' key
6. Complete a task, verify toast appears and task removed
7. Clear all Today tasks - verify empty state message
8. Fill localStorage (other data), try to add task - verify warning toast
