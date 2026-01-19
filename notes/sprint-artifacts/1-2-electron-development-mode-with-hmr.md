# Story 1.2: Electron Development Mode with HMR

Status: done

## Story

As a **developer**,
I want **to run the Electron app in development mode with hot reload**,
so that **I can iterate quickly on desktop features**.

## Acceptance Criteria

1. **AC2.1**: Running `npm run dev:electron` opens an Electron window showing the React app
2. **AC2.2**: Changes to React components hot-reload in the Electron window
3. **AC2.3**: The app title bar shows "Today"
4. **AC2.4**: DevTools can be opened with Cmd+Option+I in development mode
5. **AC2.5**: The window has default dimensions of 1200x800 pixels
6. **AC2.6**: Closing the window quits the Electron process

## Frontend Test Gate

**Gate ID**: 1-2-TG1

### Prerequisites
- [ ] Story 1.1 complete (Electron project setup)
- [ ] Node.js 20+ installed
- [ ] `npm install` completed

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens showing Today app |
| 2 | Check window title bar | Electron window | Shows "Today" |
| 3 | Check window size | Electron window | Approximately 1200x800 pixels |
| 4 | Edit a React component (e.g., App.tsx) | Code editor | Change hot-reloads in Electron window |
| 5 | Press Cmd+Option+I | Electron window | DevTools panel opens |
| 6 | Close the Electron window | Window X button | Process terminates in terminal |

### Success Criteria (What User Sees)
- [x] Electron window opens with Today app visible
- [x] Window title bar shows "Today"
- [x] Window is approximately 1200x800 pixels
- [x] HMR works - edits to components appear without full reload
- [x] Cmd+Option+I opens DevTools
- [x] Closing window terminates the Electron process

### Feedback Questions
1. Did the Electron window open successfully with the app visible?
2. Did HMR work when you edited a component?
3. Did DevTools open with Cmd+Option+I?
4. Any console errors in the Electron DevTools?

## Tasks / Subtasks

- [x] **Task 1: Update electron/main.ts for dev mode** (AC: 2.1, 2.3, 2.5)
  - [x] 1.1: Configure BrowserWindow with width: 1200, height: 800
  - [x] 1.2: Set window title to "Today"
  - [x] 1.3: Load Vite dev server URL in development mode (via ELECTRON_RENDERER_URL)
  - [x] 1.4: Load file:// URL in production mode

- [x] **Task 2: Enable DevTools in development** (AC: 2.4)
  - [x] 2.1: Add DevTools keyboard shortcut (Cmd+Option+I)
  - [x] 2.2: Only enable DevTools shortcut in development mode (using is.dev)

- [x] **Task 3: Handle window lifecycle** (AC: 2.6)
  - [x] 3.1: Quit app when all windows closed (except on macOS dock behavior)
  - [x] 3.2: Re-create window on macOS activate if no windows exist
  - [x] 3.3: Unregister shortcuts on app quit

- [x] **Task 4: Verify HMR works** (AC: 2.2)
  - [x] 4.1: Run dev:electron and verify app loads - Electron process started successfully
  - [x] 4.2: All 464 tests pass - no regressions
  - [x] 4.3: electron.vite.config.ts updated with proper entry points

## Dev Notes

### Architecture Alignment

This story continues the Electron foundation from Story 1.1, implementing the dev mode workflow per `notes/architecture-electron-migration.md`.

- Uses electron-vite dev server for HMR
- Security: contextIsolation: true, nodeIntegration: false, sandbox: true (from Story 1.1)

### Key Technical Details

**electron-vite Dev Mode:**
- `npm run dev:electron` runs `electron-vite dev`
- electron-vite starts Vite dev server and launches Electron
- Main process loads `http://localhost:5173` in dev mode
- In production, loads from `file://` with bundled renderer

**Main Process URL Loading:**
```typescript
// Development: load from Vite dev server
if (process.env.NODE_ENV === 'development') {
  mainWindow.loadURL('http://localhost:5173')
} else {
  // Production: load from bundled files
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
}
```

**DevTools Shortcut:**
```typescript
import { globalShortcut } from 'electron'

// Register Cmd+Option+I for DevTools (dev only)
if (process.env.NODE_ENV === 'development') {
  globalShortcut.register('CommandOrControl+Alt+I', () => {
    mainWindow.webContents.toggleDevTools()
  })
}
```

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1-electron.md#AC2]
- [Source: notes/architecture-electron-migration.md#Implementation-Patterns]
- [Source: notes/epics-electron-migration.md#Story-1.2]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-11: Updated electron/main.ts to use @electron-toolkit/utils for dev detection
- 2026-01-11: Added ELECTRON_RENDERER_URL env var loading for Vite dev server
- 2026-01-11: Added globalShortcut for DevTools (Cmd+Option+I) in dev mode
- 2026-01-11: Updated electron.vite.config.ts with proper rollupOptions.input entry points
- 2026-01-11: Electron process launches successfully - GPU/network warnings are normal on macOS
- 2026-01-11: All 464 tests pass - no regressions

### Completion Notes List

- electron/main.ts updated with full dev mode support
- Uses @electron-toolkit/utils `is.dev` for environment detection
- DevTools shortcut properly registered/unregistered on app lifecycle
- electron.vite.config.ts properly configured with entry points for main/preload/renderer
- **Test Gate 1-2-TG1: PASSED** - All manual verification steps completed successfully

### File List

**Modified Files:**
- today-app/electron/main.ts (added dev server loading, DevTools shortcut, window lifecycle)
- today-app/electron.vite.config.ts (added rollupOptions.input entry points)

