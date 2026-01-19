# Story 1.1: Electron Project Setup

Status: done

## Story

As a **developer**,
I want **Electron dependencies and configuration added to the existing project**,
so that **I can build an Electron app alongside the existing web app**.

## Acceptance Criteria

1. **AC1.1**: Running `npm install` installs electron, electron-vite, and @electron-toolkit packages without errors
2. **AC1.2**: An `electron/` directory exists with `main.ts` and `preload.ts` files
3. **AC1.3**: An `electron.vite.config.ts` file exists at project root
4. **AC1.4**: The existing `vite.config.ts` remains unchanged
5. **AC1.5**: TypeScript compiles without errors (`tsc -b` passes)
6. **AC1.6**: Existing `npm run dev` still works and serves web app at localhost:5173

## Frontend Test Gate

**Gate ID**: 1-1-TG1

### Prerequisites
- [ ] Node.js 20+ installed
- [ ] Xcode Command Line Tools installed
- [ ] Project cloned with `npm install` completed
- [ ] Starting state: Clean git working directory

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm install` in terminal | Terminal | Installs without errors, includes electron packages |
| 2 | Check `electron/` directory | File system | Contains `main.ts` and `preload.ts` |
| 3 | Check project root | File system | `electron.vite.config.ts` exists |
| 4 | Compare `vite.config.ts` | File system | File is unchanged from before |
| 5 | Run `npm run dev` | Terminal | Vite dev server starts, web app available |
| 6 | Open localhost:5173 in browser | Browser | Today app loads and works normally |

### Success Criteria (What User Sees)
- [ ] `npm install` completes with electron, electron-vite, @electron-toolkit packages
- [ ] `ls electron/` shows main.ts and preload.ts
- [ ] `cat electron.vite.config.ts` shows valid Electron Vite config
- [ ] `npm run dev` starts Vite dev server on port 5173
- [ ] Web app loads in browser with all existing functionality
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you complete the npm install without dependency conflicts?
2. Did the existing web dev server start without issues?
3. Does the web app behave identically to before the Electron setup?
4. Any TypeScript or build errors encountered?

## Tasks / Subtasks

- [x] **Task 1: Install Electron dependencies** (AC: 1.1)
  - [x] 1.1: Add electron as devDependency
  - [x] 1.2: Add electron-vite as devDependency
  - [x] 1.3: Add @electron-toolkit/preload as devDependency
  - [x] 1.4: Add @electron-toolkit/utils as devDependency
  - [x] 1.5: Run `npm install` and verify no errors

- [x] **Task 2: Create Electron directory structure** (AC: 1.2)
  - [x] 2.1: Create `electron/` directory in today-app/
  - [x] 2.2: Create `electron/main.ts` with basic BrowserWindow setup
  - [x] 2.3: Create `electron/preload.ts` with empty contextBridge stub

- [x] **Task 3: Create electron.vite.config.ts** (AC: 1.3)
  - [x] 3.1: Create `electron.vite.config.ts` at project root
  - [x] 3.2: Configure main process build (externalizeDepsPlugin)
  - [x] 3.3: Configure preload process build
  - [x] 3.4: Configure renderer process build (reuse Vite React config)

- [x] **Task 4: Update package.json** (AC: 1.1, 1.6)
  - [x] 4.1: Add `"main": "dist-electron/main/main.js"` entry
  - [x] 4.2: Verify existing `"dev"` script is unchanged
  - [x] 4.3: Add placeholder scripts for future stories (dev:electron, build:electron)

- [x] **Task 5: Update .gitignore** (AC: 1.3)
  - [x] 5.1: Add `dist-electron/` to .gitignore
  - [x] 5.2: Add `release/` to .gitignore

- [x] **Task 6: Verify web app continuity** (AC: 1.4, 1.5, 1.6)
  - [x] 6.1: Confirm `vite.config.ts` has no changes
  - [x] 6.2: Run `tsc -b` - pre-existing TS errors in test files (unrelated to Electron setup)
  - [x] 6.3: Run `npm run dev` and verify web app works at localhost:5173
  - [x] 6.4: Run existing test suite - all 464 tests pass

## Dev Notes

### Architecture Alignment

This story implements the foundational Electron layer per `notes/architecture-electron-migration.md`:

- **ADR-006**: Using electron-vite over Electron Forge for native Vite integration
- **ADR-010**: No code signing for MVP (personal use only)
- **Security**: BrowserWindow will be configured with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`

### Key Technical Details

**Dependencies to Install:**
```bash
npm install -D electron electron-vite @electron-toolkit/preload @electron-toolkit/utils
```

**electron/main.ts Structure:**
```typescript
// Basic structure - minimal for Story 1.1
import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Today',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // Window loading handled in Story 1.2
}

app.whenReady().then(createWindow);
```

**electron/preload.ts Structure:**
```typescript
// Empty stub for Story 1.1 - IPC bridge added in Epic 2
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Methods will be added in Story 2.2
});
```

**electron.vite.config.ts Structure:**
```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { outDir: 'dist-electron/main' },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { outDir: 'dist-electron/preload' },
  },
  renderer: {
    plugins: [react()],
    build: { outDir: 'dist-electron/renderer' },
  },
});
```

### Project Structure After This Story

```
today-app/
├── electron/                       # NEW
│   ├── main.ts                     # Main process entry
│   └── preload.ts                  # Preload script (empty bridge)
├── electron.vite.config.ts         # NEW: Electron build config
├── vite.config.ts                  # UNCHANGED: Web config
├── package.json                    # UPDATED: dependencies + main field
└── .gitignore                      # UPDATED: dist-electron/, release/
```

### Testing Notes

- Web app must work identically after this story - zero regression
- TypeScript should compile both `src/` and `electron/` without errors
- The `npm run dev` command should remain unchanged (web only)
- Electron dev mode (`npm run dev:electron`) is NOT expected to work until Story 1.2

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1-electron.md#AC1]
- [Source: notes/architecture-electron-migration.md#Project-Structure]
- [Source: notes/epics-electron-migration.md#Story-1.1]
- [Source: notes/prd-electron-migration.md#Build-Development-Pipeline]

## Dev Agent Record

### Context Reference

- notes/sprint-artifacts/1-1-electron-project-setup.context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-11: Installed electron@39.2.7, electron-vite@5.0.0, @electron-toolkit/preload@3.0.2, @electron-toolkit/utils@4.0.0
- 2026-01-11: Created electron/main.ts with BrowserWindow config (contextIsolation: true, nodeIntegration: false, sandbox: true)
- 2026-01-11: Created electron/preload.ts with empty contextBridge stub
- 2026-01-11: Created electron.vite.config.ts with main/preload/renderer configs
- 2026-01-11: Pre-existing TS errors in test files (useTimeInsights.test.ts, etc.) - not related to Electron setup
- 2026-01-11: All 464 existing tests pass - no regressions

### Completion Notes List

- Electron infrastructure successfully added without affecting existing web app
- vite.config.ts remains unchanged as required by AC1.4
- Web dev server starts successfully on port 5173
- All existing tests pass (464/464)
- Note: AC1.5 (tsc -b passes) has pre-existing errors in test files that existed before this story - these are type mismatches in test files unrelated to Electron setup
- ✅ Test Gate PASSED by Vishal (2026-01-11)

### File List

**New Files:**
- today-app/electron/main.ts
- today-app/electron/preload.ts
- today-app/electron.vite.config.ts

**Modified Files:**
- today-app/package.json (added "main" field, electron devDependencies, dev:electron/build:electron scripts)
- today-app/.gitignore (added dist-electron/, release/)
- today-app/package-lock.json (updated with electron dependencies)

