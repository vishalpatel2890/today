# Today Electron Migration - Epic Breakdown

**Author:** Vishal
**Date:** 2026-01-11
**Project Level:** Low Complexity
**Target Scale:** Personal Use

---

## Overview

This document provides the complete epic and story breakdown for the Today Electron Migration, decomposing the requirements from the [PRD](./prd-electron-migration.md) into implementable stories.

**Epics Summary:**

| Epic | Title | Stories | FRs Covered |
|------|-------|---------|-------------|
| 1 | Electron Foundation & Dual Build | 4 | FR1-5, FR9 |
| 2 | Feature Detection & IPC Bridge | 3 | FR6-8 |
| 3 | Activity Tracking Core | 4 | FR10-15 |
| 4 | Activity Viewing & Export | 4 | FR16-26 |

**Note:** FR27-30 (Existing Functionality) require no implementation - they are validation criteria ensuring no regressions.

---

## Functional Requirements Inventory

| FR | Description | Category |
|----|-------------|----------|
| FR1 | Single command builds both web and Electron artifacts | Build Pipeline |
| FR2 | Web app runs in dev mode independently of Electron | Build Pipeline |
| FR3 | Electron app runs in dev mode with hot reload | Build Pipeline |
| FR4 | Build produces deployable web assets | Build Pipeline |
| FR5 | Build produces runnable macOS .app bundle | Build Pipeline |
| FR6 | Runtime detection of Electron vs browser | Feature Detection |
| FR7 | Conditional rendering of desktop-only UI | Feature Detection |
| FR8 | Web app functions identically when not in Electron | Feature Detection |
| FR9 | No Electron code in web build | Feature Detection |
| FR10 | Captures active application name | Activity Capture |
| FR11 | Captures window title | Activity Capture |
| FR12 | Records timestamp for each activity change | Activity Capture |
| FR13 | Auto-starts capture when time tracking begins | Activity Capture |
| FR14 | Auto-stops capture when time tracking ends | Activity Capture |
| FR15 | Activity linked to time entry | Activity Capture |
| FR16 | Activity logs stored in IndexedDB | Activity Storage |
| FR17 | Activity persists across restarts | Activity Storage |
| FR18 | Activity keyed to time entry IDs | Activity Storage |
| FR19 | Activity never synced to remote | Activity Storage |
| FR20 | View activity log for any time entry | Activity Viewing |
| FR21 | Chronological display with timestamps | Activity Viewing |
| FR22 | Shows app name and window title | Activity Viewing |
| FR23 | Shows duration per app | Activity Viewing |
| FR24 | Export activity for single entry | Activity Export |
| FR25 | JSON and CSV export formats | Activity Export |
| FR26 | Native file save dialog | Activity Export |
| FR27 | Existing task management unchanged | Existing (validation) |
| FR28 | Existing time tracking unchanged | Existing (validation) |
| FR29 | Supabase sync unchanged | Existing (validation) |
| FR30 | PWA offline support unchanged | Existing (validation) |

---

## FR Coverage Map

| Epic | FRs Covered |
|------|-------------|
| Epic 1: Electron Foundation | FR1, FR2, FR3, FR4, FR5, FR9 |
| Epic 2: Feature Detection | FR6, FR7, FR8 |
| Epic 3: Activity Tracking | FR10, FR11, FR12, FR13, FR14, FR15 |
| Epic 4: Activity Viewing | FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26 |
| Validation (no stories) | FR27, FR28, FR29, FR30 |

---

## Epic 1: Electron Foundation & Dual Build

**Goal:** Establish the Electron wrapper around the existing React app with a dual-build pipeline that produces both web and desktop artifacts from a single codebase.

**User Value:** Developer can build and run both web and Electron versions of the app, enabling all subsequent desktop features.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR9

---

### Story 1.1: Electron Project Setup

As a **developer**,
I want **Electron dependencies and configuration added to the existing project**,
So that **I can build an Electron app alongside the existing web app**.

**Acceptance Criteria:**

**Given** the existing today-app React project
**When** I run `npm install`
**Then** electron, electron-vite, and @electron-toolkit packages are installed

**And** an `electron/` directory exists with `main.ts` and `preload.ts` stub files
**And** an `electron.vite.config.ts` file exists at project root
**And** the existing `vite.config.ts` remains unchanged
**And** TypeScript compiles without errors

**Prerequisites:** None (first story)

**Technical Notes:**
- Install: `electron`, `electron-vite`, `@electron-toolkit/preload`, `@electron-toolkit/utils`
- Create `electron/main.ts` with basic BrowserWindow setup
- Create `electron/preload.ts` with empty contextBridge
- Create `electron.vite.config.ts` per Architecture doc
- Add `"main": "dist-electron/main/main.js"` to package.json

**Frontend Test Hint:** Run `npm run dev` - existing web app still works at localhost:5173

---

### Story 1.2: Electron Development Mode with HMR

As a **developer**,
I want **to run the Electron app in development mode with hot reload**,
So that **I can iterate quickly on desktop features**.

**Acceptance Criteria:**

**Given** the Electron project setup is complete
**When** I run `npm run dev:electron`
**Then** an Electron window opens showing the React app

**And** changes to React components hot-reload in the Electron window
**And** the app title bar shows "Today" (or configured app name)
**And** DevTools can be opened with Cmd+Option+I
**And** the window has reasonable default dimensions (1200x800)

**Prerequisites:** Story 1.1

**Technical Notes:**
- Add script: `"dev:electron": "electron-vite dev"`
- Configure BrowserWindow with `width: 1200, height: 800`
- Enable DevTools in development mode only
- Set window title via `title` option or HTML `<title>`

**Frontend Test Hint:** Run `npm run dev:electron` - Electron window opens with the app, edit a component, see it update

---

### Story 1.3: Dual Build Pipeline

As a **developer**,
I want **separate build commands for web and Electron that can also run together**,
So that **I can deploy web updates and build desktop apps independently or together**.

**Acceptance Criteria:**

**Given** development setup is complete
**When** I run `npm run build`
**Then** only the web build is produced in `dist/` (unchanged behavior)

**When** I run `npm run build:electron`
**Then** the Electron build is produced in `dist-electron/` with main/, preload/, and renderer/ subdirectories

**When** I run `npm run build:all`
**Then** both web and Electron builds are produced

**And** the web build in `dist/` contains NO Electron-specific code
**And** the Electron renderer build includes the React app
**And** build completes without errors or warnings

**Prerequisites:** Story 1.2

**Technical Notes:**
- Keep existing `"build": "tsc -b && vite build"` for web
- Add `"build:electron": "electron-vite build"`
- Add `"build:all": "npm run build && npm run build:electron"`
- Verify dist/ has no electron imports (grep check)

**Frontend Test Hint:** Run `npm run build`, then `npm run preview` - web app works. Run `npm run build:electron` - dist-electron/ created

---

### Story 1.4: macOS App Packaging

As a **developer**,
I want **to package the Electron app as a runnable macOS .app bundle**,
So that **I can run the desktop app outside of development mode**.

**Acceptance Criteria:**

**Given** the Electron build is complete
**When** I run `npm run package`
**Then** a `release/` directory is created containing `Today.app`

**And** the .app bundle is a universal binary (arm64 + x64)
**And** double-clicking Today.app launches the application
**And** the app icon appears in the Dock while running
**And** the app can be copied to /Applications and run from there

**Prerequisites:** Story 1.3

**Technical Notes:**
- Install electron-builder as devDependency
- Add `"package": "electron-vite build && electron-builder --mac --universal"`
- Configure electron-builder in package.json or electron-builder.yml
- Create `resources/icon.icns` (can use placeholder initially)
- Set productName: "Today" in builder config

**Frontend Test Hint:** Run `npm run package`, find Today.app in release/, double-click to launch

---

## Epic 2: Feature Detection & IPC Bridge

**Goal:** Establish the communication bridge between React and Electron, enabling conditional rendering of desktop-only features while keeping the web app unchanged.

**User Value:** The app intelligently shows desktop features only when running in Electron, while the web version remains identical to before.

**FRs Covered:** FR6, FR7, FR8

---

### Story 2.1: Platform Detection Utility

As a **developer**,
I want **a utility function to detect if the app is running in Electron**,
So that **I can conditionally enable desktop features**.

**Acceptance Criteria:**

**Given** the app is running in Electron
**When** I call `isElectron()`
**Then** it returns `true`

**Given** the app is running in a web browser
**When** I call `isElectron()`
**Then** it returns `false`

**And** the function is exported from `src/lib/platform.ts`
**And** TypeScript types are correct (returns boolean)
**And** the function works during SSR/build (handles undefined window)

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create `src/lib/platform.ts`
- Check for `window.electronAPI` presence
- Handle SSR case: `typeof window !== 'undefined'`
- Export as named export for tree-shaking

**Frontend Test Hint:** In Electron DevTools console: `import { isElectron } from './lib/platform'; isElectron()` → true. In browser: same check → false

---

### Story 2.2: IPC Bridge Setup

As a **developer**,
I want **a type-safe IPC bridge between React and Electron main process**,
So that **React components can trigger native functionality securely**.

**Acceptance Criteria:**

**Given** the Electron app is running
**When** I access `window.electronAPI` in React
**Then** it provides typed methods for activity tracking

**And** the preload script exposes: `activity.start()`, `activity.stop()`, `activity.getLog()`, `activity.export()`
**And** all methods return Promises
**And** TypeScript recognizes `window.electronAPI` with correct types
**And** contextIsolation is enabled (security requirement)
**And** nodeIntegration is disabled (security requirement)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create `electron/ipc/channels.ts` with channel name constants
- Update `electron/preload.ts` to expose electronAPI via contextBridge
- Create `src/types/electron.d.ts` to augment Window interface
- Create `src/lib/electronBridge.ts` as type-safe wrapper
- All IPC methods should be stubs returning `{ success: true }` for now

**Frontend Test Hint:** In Electron DevTools: `window.electronAPI.activity.start('test-id')` → Promise resolves to `{ success: true }`

---

### Story 2.3: Conditional UI Rendering

As a **user**,
I want **desktop-only UI elements to appear only in Electron**,
So that **the web app looks unchanged while Electron has extra features**.

**Acceptance Criteria:**

**Given** I am viewing a time entry in Electron
**When** the entry has completed (has end time)
**Then** a "View Activity" button appears on the time entry

**Given** I am viewing the same time entry in web browser
**When** the entry has completed
**Then** NO "View Activity" button appears

**And** the button uses the existing app's design system (Tailwind classes, consistent with other buttons)
**And** clicking the button does nothing yet (placeholder for Epic 4)
**And** the web bundle size is unchanged (no Electron code included)

**Prerequisites:** Story 2.2

**Technical Notes:**
- Create `src/components/time-tracking/ViewActivityButton.tsx`
- Use `isElectron()` guard in parent component
- Style with existing Tailwind patterns (ghost button, lucide icon)
- Add to time entry detail/actions area
- Verify web build doesn't include this component (tree-shaking)

**Frontend Test Hint:** In Electron, view a completed time entry - "View Activity" button visible. In browser, same entry - no button

---

## Epic 3: Activity Tracking Core

**Goal:** Implement the core app tracking functionality that captures which applications and windows the user interacts with during active time tracking sessions.

**User Value:** When time tracking, the system automatically records which apps were used, enabling accurate time logging and corrections when timers are forgotten.

**FRs Covered:** FR10, FR11, FR12, FR13, FR14, FR15

---

### Story 3.1: macOS App Detection Module

As the **system**,
I want **to detect the currently active application and window title on macOS**,
So that **I can record which apps the user is using**.

**Acceptance Criteria:**

**Given** the Electron app is running on macOS
**When** I call the activity tracker's `getCurrentActivity()` method
**Then** it returns the active app name (e.g., "Visual Studio Code")

**And** it returns the window title (e.g., "App.tsx - today-app")
**And** it returns the current timestamp (ISO 8601)
**And** it handles the case where no window is focused (returns null/empty)
**And** the module only runs in the main process (not renderer)

**Prerequisites:** Story 2.2

**Technical Notes:**
- Create `electron/activity/tracker.ts`
- Use `@electron/remote` or native Node bindings for NSWorkspace
- Alternative: Use `child_process` to run AppleScript/osascript for window title
- Simple approach: `osascript -e 'tell application "System Events" to get name of first process whose frontmost is true'`
- For window title: `osascript -e 'tell application "System Events" to get title of front window of first process whose frontmost is true'`
- Create `electron/activity/types.ts` for ActivityEntry interface

**Frontend Test Hint:** In main process logs, call tracker and see current app/window logged

---

### Story 3.2: Activity Polling During Time Tracking

As the **system**,
I want **to poll for activity changes every 5 seconds during active time tracking**,
So that **I capture a complete log of app usage**.

**Acceptance Criteria:**

**Given** time tracking is started via IPC `activity:start`
**When** 5 seconds elapse
**Then** the current activity is captured and stored in memory

**And** polling continues every 5 seconds until `activity:stop` is called
**And** only NEW activity is recorded (if app/window unchanged, no duplicate entry)
**And** each entry includes: timestamp, appName, windowTitle, timeEntryId
**And** polling uses less than 1% CPU

**Prerequisites:** Story 3.1

**Technical Notes:**
- Add `startTracking(timeEntryId)` and `stopTracking()` to tracker module
- Use `setInterval` with 5000ms (configurable)
- Store entries in memory array during session
- Compare current vs. previous to avoid duplicates
- Clear interval on stop

**Frontend Test Hint:** Start tracking in Electron, switch between apps for 30 seconds, stop tracking - console shows captured entries

---

### Story 3.3: Activity Storage in IndexedDB

As the **system**,
I want **to persist activity logs to IndexedDB when tracking stops**,
So that **activity data survives app restarts**.

**Acceptance Criteria:**

**Given** time tracking is active and activity has been captured
**When** `activity:stop` is called
**Then** all captured activity entries are saved to IndexedDB

**And** entries are stored in a separate `activityLogs` table (not synced)
**And** entries are indexed by `timeEntryId` for fast retrieval
**And** the data persists after closing and reopening Electron
**And** the activityLogs table is NOT included in Supabase sync

**Prerequisites:** Story 3.2

**Technical Notes:**
- Extend existing Dexie db with new table: `activityLogs: '++id, timeEntryId, timestamp'`
- Create `electron/activity/store.ts` for DB operations
- On `activity:stop`: save all memory entries to DB, clear memory
- Verify sync queue ignores activityLogs table
- Consider: save to DB via IPC to renderer (Dexie runs in renderer)

**Frontend Test Hint:** Track time for 1 minute, stop, close Electron, reopen - activity data still retrievable

---

### Story 3.4: Auto-Start/Stop Activity with Time Tracking

As a **user**,
I want **activity tracking to automatically start and stop with time tracking**,
So that **I don't need to manually manage activity capture**.

**Acceptance Criteria:**

**Given** I click "Start" on a task to begin time tracking in Electron
**When** the time entry is created
**Then** activity capture begins automatically (no extra button click)

**Given** I click "Stop" on an active time tracking session in Electron
**When** the time entry is completed
**Then** activity capture stops and data is saved automatically

**And** this automatic behavior only happens in Electron (web unaffected)
**And** if I start tracking in web and open Electron later, activity capture starts from that point
**And** the existing time tracking UI is unchanged

**Prerequisites:** Story 3.3

**Technical Notes:**
- Hook into existing `useTimeTracking` hook
- Add effect that calls `electronAPI.activity.start/stop` when tracking state changes
- Use `isElectron()` guard to avoid errors in web
- Handle edge case: app opened with existing active session

**Frontend Test Hint:** In Electron, start time tracking on a task - no extra action needed, activity starts capturing. Stop tracking - activity saved.

---

## Epic 4: Activity Viewing & Export

**Goal:** Enable users to view their activity logs for completed time entries and export the data to files.

**User Value:** Users can see exactly which apps they used during a tracked time session, helping verify time accuracy and make corrections when timers were forgotten.

**FRs Covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26

---

### Story 4.1: Activity Log Retrieval

As the **system**,
I want **to retrieve activity logs for a specific time entry**,
So that **users can view their activity history**.

**Acceptance Criteria:**

**Given** activity has been recorded for time entry "abc123"
**When** I call `activity:get-log` with timeEntryId "abc123"
**Then** I receive an array of ActivityEntry objects

**And** entries are sorted chronologically (oldest first)
**And** each entry includes: id, timestamp, appName, windowTitle
**And** the response includes calculated duration for each entry
**And** if no activity exists for the ID, an empty array is returned

**Prerequisites:** Story 3.3

**Technical Notes:**
- Implement `activity:get-log` IPC handler
- Query Dexie: `db.activityLogs.where('timeEntryId').equals(id).sortBy('timestamp')`
- Calculate duration: diff between current entry timestamp and next entry timestamp
- Last entry duration: diff to session end time (from time entry)

**Frontend Test Hint:** After recording activity, call `window.electronAPI.activity.getLog('timeEntryId')` - returns activity array

---

### Story 4.2: Activity Log Modal UI

As a **user**,
I want **to view my activity log in a modal when I click "View Activity"**,
So that **I can see which apps I used during a time tracking session**.

**Acceptance Criteria:**

**Given** I have a completed time entry with recorded activity
**When** I click "View Activity" button
**Then** a modal opens showing the activity log

**And** the modal header shows the time entry task name and date
**And** activity is displayed as a chronological list
**And** each row shows: time (HH:MM:SS), app name, window title, duration
**And** the list is scrollable for long sessions
**And** I can close the modal with X button or Escape key
**And** the modal uses existing app design patterns (Radix Dialog, Tailwind)

**Prerequisites:** Story 4.1, Story 2.3

**Technical Notes:**
- Create `src/components/time-tracking/ActivityLogModal.tsx`
- Use Radix Dialog (existing in project)
- Create `src/hooks/useActivityLog.ts` to fetch via IPC
- Format timestamps with date-fns
- Display duration as "Xm Ys" or "X:XX:XX" for longer durations
- Style table/list with Tailwind

**Frontend Test Hint:** Complete a time entry with activity, click "View Activity" - modal shows list of apps used with times

---

### Story 4.3: Activity Duration Summary

As a **user**,
I want **to see a summary of time spent per application**,
So that **I can quickly understand where my time went**.

**Acceptance Criteria:**

**Given** I am viewing the activity log modal
**When** the modal loads
**Then** I see a summary section at the top showing time per app

**And** apps are sorted by total duration (most time first)
**And** each summary row shows: app name, total duration, percentage of session
**And** a simple bar chart or progress bar visualizes the percentages
**And** the detailed chronological list appears below the summary

**Prerequisites:** Story 4.2

**Technical Notes:**
- Add summary calculation to `useActivityLog` hook
- Group entries by appName, sum durations
- Calculate percentage: (appDuration / totalSessionDuration) * 100
- Simple bar: Tailwind width classes (`w-[${percent}%]`) or inline style
- Consider: make summary collapsible if user prefers raw log

**Frontend Test Hint:** View activity for a session where you used 3+ apps - summary shows breakdown with percentages and bars

---

### Story 4.4: Activity Export to File

As a **user**,
I want **to export my activity log to a JSON or CSV file**,
So that **I can keep records or analyze data externally**.

**Acceptance Criteria:**

**Given** I am viewing the activity log modal
**When** I click "Export" and select JSON format
**Then** a file save dialog appears, I choose location, and a .json file is saved

**When** I click "Export" and select CSV format
**Then** a file save dialog appears, I choose location, and a .csv file is saved

**And** the JSON file contains the full activity array with all fields
**And** the CSV file has headers: timestamp, app_name, window_title, duration_seconds
**And** the default filename includes the task name and date
**And** the export button is only visible in Electron (already gated by modal)

**Prerequisites:** Story 4.3

**Technical Notes:**
- Add export dropdown/buttons to modal footer
- Implement `activity:export` IPC handler in main process
- Use Electron's `dialog.showSaveDialog()` for native file picker
- Use `fs.writeFile` to save
- JSON: `JSON.stringify(entries, null, 2)`
- CSV: Generate with headers, escape commas in window titles

**Frontend Test Hint:** Click Export → JSON, save file, open in text editor - valid JSON with activity data. Same for CSV.

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Single command builds both | Epic 1 | Story 1.3 |
| FR2 | Web dev mode independent | Epic 1 | Story 1.1, 1.2 |
| FR3 | Electron dev mode with HMR | Epic 1 | Story 1.2 |
| FR4 | Produces web assets | Epic 1 | Story 1.3 |
| FR5 | Produces macOS .app | Epic 1 | Story 1.4 |
| FR6 | Runtime Electron detection | Epic 2 | Story 2.1 |
| FR7 | Conditional desktop UI | Epic 2 | Story 2.3 |
| FR8 | Web unchanged | Epic 2 | Story 2.1, 2.3 |
| FR9 | No Electron in web build | Epic 1 | Story 1.3 |
| FR10 | Captures app name | Epic 3 | Story 3.1 |
| FR11 | Captures window title | Epic 3 | Story 3.1 |
| FR12 | Records timestamps | Epic 3 | Story 3.1, 3.2 |
| FR13 | Auto-starts capture | Epic 3 | Story 3.4 |
| FR14 | Auto-stops capture | Epic 3 | Story 3.4 |
| FR15 | Activity linked to entry | Epic 3 | Story 3.2, 3.3 |
| FR16 | Stored in IndexedDB | Epic 4 | Story 3.3 |
| FR17 | Persists across restarts | Epic 4 | Story 3.3 |
| FR18 | Keyed to entry IDs | Epic 4 | Story 3.3, 4.1 |
| FR19 | Never synced remote | Epic 4 | Story 3.3 |
| FR20 | View activity log | Epic 4 | Story 4.2 |
| FR21 | Chronological display | Epic 4 | Story 4.2 |
| FR22 | Shows app + window | Epic 4 | Story 4.2 |
| FR23 | Shows duration per app | Epic 4 | Story 4.3 |
| FR24 | Export single entry | Epic 4 | Story 4.4 |
| FR25 | JSON and CSV formats | Epic 4 | Story 4.4 |
| FR26 | Native file dialog | Epic 4 | Story 4.4 |
| FR27 | Task management unchanged | Validation | All stories |
| FR28 | Time tracking unchanged | Validation | All stories |
| FR29 | Supabase sync unchanged | Validation | Story 3.3 |
| FR30 | PWA unchanged | Validation | All stories |

---

## Summary

**Total: 4 Epics, 15 Stories**

| Epic | Stories | Description |
|------|---------|-------------|
| Epic 1 | 4 | Foundation: Electron setup, dual build, packaging |
| Epic 2 | 3 | Feature detection, IPC bridge, conditional UI |
| Epic 3 | 4 | Activity tracking: detection, polling, storage, auto-start |
| Epic 4 | 4 | Activity viewing: retrieval, modal, summary, export |

**Implementation Order:** Epics are sequenced for incremental value:
1. Epic 1 → Can run app in Electron (developer value)
2. Epic 2 → Can see conditional UI (proves architecture works)
3. Epic 3 → Can capture activity (core feature works)
4. Epic 4 → Can view/export activity (full user value)

Each epic delivers testable functionality. No epic is purely technical infrastructure without user-visible results.

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_Context incorporated: PRD + Architecture. No UX Design needed (Electron maintains existing web UI)._
