# Story 2.3: Conditional UI Rendering

Status: ready-for-dev

## Story

As a **user**,
I want **desktop-only UI elements to appear only in Electron**,
so that **the web app looks unchanged while Electron has extra features**.

## Acceptance Criteria

1. **AC3.1**: In Electron, completed time entries show a "View Activity" button
2. **AC3.2**: In web browser, the same time entries do NOT show a "View Activity" button
3. **AC3.3**: The button uses existing Tailwind design patterns (consistent styling with other buttons)
4. **AC3.4**: Clicking the button logs a placeholder message (no modal yet - Epic 4)
5. **AC3.5**: Web build bundle size is unchanged (no Electron code included)
6. **AC3.6**: Running `grep -r "electronAPI" dist/` returns no matches

## Frontend Test Gate

**Gate ID**: 2-3-TG1

### Prerequisites
- [x] Story 2.2 complete (IPC bridge setup exists)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] App running locally (frontend at localhost:5173 for web, Electron window for desktop)
- [ ] Test user has at least one completed time entry (with end time)

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with React app |
| 2 | Navigate to Time Tracking / Time Insights | Time Tracking UI | See list of time entries |
| 3 | View a completed time entry | Time entry row/card | "View Activity" button is visible |
| 4 | Click "View Activity" button | Time entry actions | Console shows `[Epic 2] View Activity clicked` |
| 5 | Run `npm run dev` in terminal | Terminal | Web dev server starts |
| 6 | Open browser to localhost:5173 | Browser | App loads normally |
| 7 | View the same completed time entry | Time entry row/card | NO "View Activity" button visible |
| 8 | Run `npm run build` | Terminal | Build completes successfully |
| 9 | Run `grep -r "electronAPI" dist/` | Terminal | No matches found |
| 10 | Run `grep -r "ViewActivity" dist/` | Terminal | No matches found |

### Success Criteria (What User Sees)
- [ ] "View Activity" button appears on completed time entries in Electron
- [ ] "View Activity" button does NOT appear in web browser
- [ ] Button styling matches existing app design (ghost/icon button pattern)
- [ ] Clicking button shows console placeholder message
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you identify the "View Activity" button easily in the Electron UI?
2. Did the button placement feel natural within the time entry UI?
3. Were there any visual inconsistencies between Electron and web versions?
4. Any UX friction or unexpected behavior?

## Tasks / Subtasks

- [ ] **Task 1: Create ViewActivityButton component** (AC: 3.3, 3.4)
  - [ ] 1.1: Create `src/components/time-tracking/ViewActivityButton.tsx`
  - [ ] 1.2: Use lucide-react Activity icon for button content
  - [ ] 1.3: Style with existing Tailwind ghost button pattern (match Edit/Delete buttons)
  - [ ] 1.4: Accept `timeEntryId: string` prop for future Epic 4 use
  - [ ] 1.5: Implement onClick handler that logs `[Epic 2] View Activity clicked - modal in Epic 4`
  - [ ] 1.6: Add tooltip text "View Activity" for accessibility

- [ ] **Task 2: Integrate ViewActivityButton into time entry UI** (AC: 3.1, 3.2)
  - [ ] 2.1: Identify the correct component where time entry actions are rendered
  - [ ] 2.2: Import `isElectron` from `@/lib/platform`
  - [ ] 2.3: Add conditional rendering: `{isElectron() && <ViewActivityButton timeEntryId={entry.id} />}`
  - [ ] 2.4: Only show button for entries with `endTime` (completed entries)
  - [ ] 2.5: Position button consistently with other action buttons (Edit, Delete)

- [ ] **Task 3: Verify web build isolation** (AC: 3.5, 3.6)
  - [ ] 3.1: Run `npm run build` and verify successful completion
  - [ ] 3.2: Run `grep -r "electronAPI" dist/` - expect no matches
  - [ ] 3.3: Run `grep -r "ViewActivity" dist/` - expect no matches
  - [ ] 3.4: Run `grep -r "activity:start" dist/` - expect no matches (IPC channels)
  - [ ] 3.5: Compare dist/ folder size before and after (should be unchanged)

- [ ] **Task 4: Test in both environments** (AC: 3.1, 3.2)
  - [ ] 4.1: Run `npm run dev:electron` - verify button appears on completed entries
  - [ ] 4.2: Run `npm run dev` in browser - verify button does NOT appear
  - [ ] 4.3: Click button in Electron - verify console log appears
  - [ ] 4.4: Verify no TypeScript or runtime errors in either environment
  - [ ] 4.5: Run existing test suite - ensure no regressions

## Dev Notes

### Architecture Alignment

This story implements FR7 (Conditional desktop UI) and FR8 (Web unchanged) from the PRD. It validates the feature detection architecture established in Stories 2.1 and 2.2 by adding the first visible Electron-only UI element.

**Key Pattern from Architecture (Feature Detection):**

```typescript
// Usage in components per notes/architecture-electron-migration.md
import { isElectron } from '@/lib/platform';

export const TimeEntryActions = ({ entry }: Props) => {
  return (
    <div>
      <EditButton entry={entry} />
      {isElectron() && <ViewActivityButton entryId={entry.id} />}
    </div>
  );
};
```

**Tree-shaking Requirement:**
- ViewActivityButton should ONLY be imported within the `isElectron()` conditional path
- If imported unconditionally at module top-level, it may leak into web build
- Alternative: Use dynamic import inside condition (not necessary for this simple case)
- The `isElectron()` check returns `false` during build, allowing dead code elimination

### Button Styling Pattern

Per existing UI patterns in the codebase, use ghost button style:

```typescript
// Reference existing button patterns in the codebase
// Look for: className="...hover:bg-gray-100..." or similar ghost patterns
// Use lucide-react Activity icon: import { Activity } from 'lucide-react'
```

### Time Entry Location Analysis

The ViewActivityButton should be placed where time entry actions are displayed. Based on the project structure, check:
- `src/components/time-tracking/TimeTrackingModal.tsx` - Time Insights modal
- Any time entry list/card components showing completed entries
- Look for existing Edit/Delete buttons as placement reference

### Completed Entry Detection

Only show ViewActivityButton when entry has `endTime`:

```typescript
// Entry is completed when it has an endTime
const isCompleted = !!entry.endTime;
{isElectron() && isCompleted && <ViewActivityButton timeEntryId={entry.id} />}
```

### Project Structure Notes

**New Files:**
- `src/components/time-tracking/ViewActivityButton.tsx` - Desktop-only button component

**Modified Files:**
- Time entry component (to be identified in Task 2.1) - Add conditional ViewActivityButton

**No Changes To:**
- `electron/` directory - No changes needed, IPC bridge already exists
- `src/lib/platform.ts` - Already has `isElectron()` function
- `src/lib/electronBridge.ts` - Already has activity methods

### Learnings from Previous Story

**From Story 2-2-ipc-bridge-setup (Status: done)**

- **IPC Bridge Complete**: `window.electronAPI.activity` methods all available
  - `start(timeEntryId)`, `stop()`, `getLog(timeEntryId)`, `export(timeEntryId, format)`

- **Platform Detection Verified**: `isElectron()` function works correctly
  - Returns `true` in Electron, `false` in browser
  - Located at `src/lib/platform.ts`

- **TypeScript Types Available**: `src/types/electron.d.ts` has complete definitions
  - `ElectronAPI`, `IPCResponse<T>`, `ActivityEntry` interfaces defined
  - No additional type work needed for this story

- **electronBridge Wrapper**: `src/lib/electronBridge.ts` provides safe access
  - Not needed for this story (only using isElectron() for conditional render)

- **Test Baseline**: 512 tests pass - maintain this in Story 2.3

- **Build Verification Pattern**: Use grep commands to verify no Electron leakage:
  ```bash
  grep -r "electronAPI" dist/  # Should return no matches
  grep -r "ViewActivity" dist/  # Should return no matches
  ```

- **Files Created in 2.2**:
  - `today-app/electron/ipc/channels.ts` - IPC channel constants
  - `today-app/electron/ipc/handlers.ts` - Main process IPC handlers
  - `today-app/src/lib/electronBridge.ts` - Type-safe IPC wrapper

- **Files Modified in 2.2**:
  - `today-app/electron/main.ts` - registerIpcHandlers() call
  - `today-app/electron/preload.ts` - electronAPI exposure

**Implication for This Story:**
- Use `isElectron()` directly from `@/lib/platform` (already exists)
- No need to call any IPC methods - button is placeholder only
- Follow existing button patterns in the time tracking components
- Verify web build isolation with grep commands after implementation

[Source: notes/sprint-artifacts/2-2-ipc-bridge-setup.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2-electron.md#AC3-Conditional-UI-Rendering]
- [Source: notes/architecture-electron-migration.md#Feature-Detection-Pattern]
- [Source: notes/epics-electron-migration.md#Story-2.3]
- [Source: notes/prd-electron-migration.md#FR7-FR8]

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/2-3-conditional-ui-rendering.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Story drafted from epics, tech spec, and architecture | SM Agent |
