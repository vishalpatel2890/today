# Epic Technical Specification: Electron Foundation & Dual Build

Date: 2026-01-11
Author: Vishal
Epic ID: 1 (Electron Migration)
Status: Draft

---

## Overview

Epic 1 establishes the Electron wrapper around the existing Today React PWA, creating a dual-build pipeline that produces both web and desktop artifacts from a single codebase. This is the foundational epic that enables all subsequent desktop-only features (activity tracking in Epics 3-4) while maintaining the existing web app unchanged.

The primary deliverable is a working macOS .app bundle alongside the existing Vercel-deployable web build, with separate development modes for each target. This epic implements the "maintainability-first" philosophy from the PRD: one codebase, two outputs, zero regression to existing functionality.

**User Value:** Developer can build and run both web and Electron versions of the app from the same codebase, enabling rapid iteration on desktop features while preserving the PWA deployment workflow.

## Objectives and Scope

### In Scope (Epic 1)

- **FR1**: Single command builds both web and Electron artifacts (`npm run build:all`)
- **FR2**: Web app runs in dev mode independently of Electron (`npm run dev`)
- **FR3**: Electron app runs in dev mode with hot reload (`npm run dev:electron`)
- **FR4**: Build produces deployable web assets in `dist/`
- **FR5**: Build produces runnable macOS .app bundle in `release/`
- **FR9**: No Electron-specific code bundled into web build

### Out of Scope (Epic 1)

- Feature detection and IPC bridge (Epic 2)
- Activity tracking capture (Epic 3)
- Activity viewing and export (Epic 4)
- Windows/Linux platform support (Future)
- Code signing and notarization (Personal use only)
- Auto-update infrastructure (Not needed for MVP)

## System Architecture Alignment

### Architecture Reference

This epic implements the foundational layer from `notes/architecture-electron-migration.md`:

| Decision | Epic 1 Implementation |
|----------|----------------------|
| ADR-006: electron-vite over Electron Forge | `electron.vite.config.ts` with native Vite integration |
| ADR-010: No Signing for MVP | Unsigned .app bundle, user right-clicks to open |
| Build Tooling | electron-vite 2.x with externalizeDepsPlugin |
| Platform Target | macOS universal binary (arm64 + x64) |

### Components Introduced

| Component | Purpose | Location |
|-----------|---------|----------|
| `electron/main.ts` | Main process entry point, BrowserWindow setup | `electron/` |
| `electron/preload.ts` | Preload script stub (contextBridge setup) | `electron/` |
| `electron.vite.config.ts` | Electron build configuration | Project root |
| `resources/icon.icns` | macOS app icon | `resources/` |

### Project Structure After Epic 1

```
today-app/
├── electron/                       # NEW: Electron-specific code
│   ├── main.ts                     # Main process entry
│   └── preload.ts                  # Preload script (empty bridge)
├── resources/                      # NEW: Electron app resources
│   └── icon.icns                   # macOS app icon
├── electron.vite.config.ts         # NEW: Electron build config
├── vite.config.ts                  # Unchanged web config
├── package.json                    # Updated with Electron scripts
├── dist/                           # Web build output (unchanged)
├── dist-electron/                  # NEW: Electron build output
│   ├── main/
│   ├── preload/
│   └── renderer/
└── release/                        # NEW: Packaged app output
    └── Today.app
```

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **electron/main.ts** | Main process lifecycle, BrowserWindow creation | App events, CLI args | Window management, app state |
| **electron/preload.ts** | Context bridge setup (stub for Epic 2) | None | `window.electronAPI` (empty object) |
| **electron.vite.config.ts** | Build configuration for main/preload/renderer | Vite config | Build artifacts in dist-electron/ |

**Module Interactions (Epic 1):**

```
package.json scripts
  ├── dev:electron → electron-vite dev
  │     ├── Compiles electron/main.ts → launches Electron
  │     ├── Compiles electron/preload.ts → injects into renderer
  │     └── Serves src/ via Vite dev server → renderer process
  │
  ├── build:electron → electron-vite build
  │     └── Outputs to dist-electron/{main,preload,renderer}/
  │
  └── package → electron-vite build && electron-builder
        └── Outputs to release/Today.app (universal binary)
```

### Data Models and Contracts

**Epic 1 introduces no new data models.** This epic focuses purely on build infrastructure.

The existing data models remain unchanged:
- Tasks stored in IndexedDB via Dexie
- Time entries stored in IndexedDB via Dexie
- Supabase sync continues unaffected

**Configuration Models:**

```typescript
// electron.vite.config.ts structure
interface ElectronViteConfig {
  main: {
    plugins: Plugin[];
    build: { outDir: string };
  };
  preload: {
    plugins: Plugin[];
    build: { outDir: string };
  };
  renderer: {
    plugins: Plugin[];
    build: { outDir: string };
  };
}
```

```typescript
// electron-builder configuration (package.json or electron-builder.yml)
interface ElectronBuilderConfig {
  appId: string;           // "com.vishal.today"
  productName: string;     // "Today"
  mac: {
    target: string[];      // ["universal"]
    category: string;      // "public.app-category.productivity"
  };
  directories: {
    output: string;        // "release"
  };
}
```

### APIs and Interfaces

**Epic 1 introduces no application APIs.** The IPC bridge is established in Epic 2.

**Build Script Interface (package.json):**

```json
{
  "scripts": {
    "dev": "vite",                                    // Existing: web dev
    "dev:electron": "electron-vite dev",             // NEW: Electron dev
    "build": "tsc -b && vite build",                 // Existing: web build
    "build:electron": "electron-vite build",         // NEW: Electron build
    "build:all": "npm run build && npm run build:electron",  // NEW: both
    "package": "electron-vite build && electron-builder --mac --universal"  // NEW
  }
}
```

**Main Process Window API:**

```typescript
// electron/main.ts - BrowserWindow configuration
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  title: 'Today',
  webPreferences: {
    preload: path.join(__dirname, '../preload/preload.js'),
    contextIsolation: true,    // Security requirement
    nodeIntegration: false,    // Security requirement
    sandbox: true,             // Additional protection
  },
});
```

### Workflows and Sequencing

**Flow 1: Developer Runs Web App (unchanged)**

```
Developer runs: npm run dev
  │
  ▼
Vite dev server starts on localhost:5173
  │
  ▼
React app served with HMR
(No Electron involvement)
```

**Flow 2: Developer Runs Electron App**

```
Developer runs: npm run dev:electron
  │
  ▼
electron-vite dev starts
  │
  ├── Compiles electron/main.ts
  ├── Compiles electron/preload.ts
  ├── Starts Vite dev server for renderer
  │
  ▼
Electron main process launches
  │
  ▼
BrowserWindow created with preload script
  │
  ▼
Window loads Vite dev server URL (localhost:5173)
  │
  ▼
React app renders in Electron window with HMR
```

**Flow 3: Build Both Targets**

```
Developer runs: npm run build:all
  │
  ├── npm run build (web)
  │     ├── tsc -b (TypeScript check)
  │     └── vite build → dist/
  │
  └── npm run build:electron
        └── electron-vite build → dist-electron/
              ├── main/main.js
              ├── preload/preload.js
              └── renderer/ (React app)
```

**Flow 4: Package macOS App**

```
Developer runs: npm run package
  │
  ▼
electron-vite build (if not already built)
  │
  ▼
electron-builder --mac --universal
  │
  ├── Reads electron-builder config
  ├── Creates universal binary (arm64 + x64)
  ├── Bundles resources/icon.icns
  │
  ▼
Outputs: release/Today.app
  │
  ▼
Developer can:
  ├── Double-click Today.app to launch
  └── Copy to /Applications
```

## Non-Functional Requirements

### Performance

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **NFR2**: Electron startup | < 3 seconds | Minimal main.ts, no heavy initialization | PRD NFR2 |
| **NFR4**: Web bundle unchanged | 0 KB increase | Electron code excluded via separate entry points | PRD NFR4 |
| **Build time** | < 30 seconds (incremental) | electron-vite caching, externalizeDepsPlugin | Architecture |

**Implementation Notes:**
- `electron/main.ts` should be minimal: create window, load URL, done
- No eager loading of activity tracking modules (those come in Epic 3)
- electron-vite's `externalizeDepsPlugin` prevents re-bundling node_modules
- Web build uses existing `vite.config.ts` unchanged - no Electron code included

### Security

| NFR | Implementation | Source |
|-----|----------------|--------|
| **NFR7**: Electron security best practices | contextIsolation: true, nodeIntegration: false, sandbox: true | PRD NFR7, Architecture |
| **No remote content** | App loads only from localhost (dev) or file:// (production) | Best practice |

**BrowserWindow Security Configuration:**

```typescript
webPreferences: {
  contextIsolation: true,      // REQUIRED - isolates preload from renderer
  nodeIntegration: false,      // REQUIRED - no Node.js in renderer
  sandbox: true,               // Additional process isolation
  webSecurity: true,           // Enforce same-origin policy
}
```

**Implementation Notes:**
- Preload script is the ONLY bridge between main and renderer
- In Epic 1, preload exposes empty `electronAPI` object (stub)
- No `remote` module usage (deprecated and insecure)
- No `shell.openExternal` without URL validation (Epic 4 concern)

### Reliability/Availability

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **Web continuity** | Zero regression | Web build path unchanged, separate configs | PRD Success Criteria 4 |
| **Build reproducibility** | Deterministic builds | Lock file, pinned versions | Best practice |
| **Crash recovery** | App restarts cleanly | No state in main process (all in IndexedDB) | Architecture |

**Implementation Notes:**
- Existing `npm run dev` and `npm run build` commands unchanged
- Electron scripts are additive, not modifications
- If Electron build fails, web build still works independently
- Main process holds no application state - renderer owns all data

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| **Console logging (main)** | `console.log('[Electron/Main]', ...)` | Debug main process |
| **Console logging (renderer)** | Existing React patterns | Debug renderer |
| **DevTools** | Enabled in dev mode only | Inspect renderer |

**Development Mode DevTools:**

```typescript
// electron/main.ts
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

**Implementation Notes:**
- No external logging/analytics infrastructure needed
- Main process logs appear in terminal where `npm run dev:electron` was run
- Renderer logs appear in Electron DevTools console (Cmd+Option+I)
- Production builds should not auto-open DevTools

## Dependencies and Integrations

### New Dependencies Required (Epic 1)

| Dependency | Version | Type | Purpose |
|------------|---------|------|---------|
| `electron` | ^33.x | devDependency | Electron framework |
| `electron-vite` | ^2.x | devDependency | Build tooling with Vite integration |
| `@electron-toolkit/preload` | latest | devDependency | Secure IPC helpers |
| `@electron-toolkit/utils` | latest | devDependency | Platform utilities |
| `electron-builder` | ^24.x | devDependency | App packaging for macOS |

**Installation Command:**

```bash
npm install -D electron electron-vite @electron-toolkit/preload @electron-toolkit/utils electron-builder
```

### Existing Dependencies (Unchanged)

| Dependency | Version | Usage in Epic 1 |
|------------|---------|-----------------|
| `react` | ^19.2.0 | Renderer process UI |
| `react-dom` | ^19.2.0 | Renderer process DOM |
| `vite` | ^7.2.4 | Web build (unchanged), renderer build base |
| `@vitejs/plugin-react` | ^5.1.1 | React plugin for both web and Electron renderer |
| `typescript` | ~5.9.3 | Type checking for all code |

### Internal Dependencies

| Module | Dependency | Integration Point |
|--------|------------|-------------------|
| `electron/main.ts` | `electron` | BrowserWindow, app lifecycle |
| `electron/preload.ts` | `@electron-toolkit/preload` | contextBridge helpers |
| `electron.vite.config.ts` | `electron-vite` | Build configuration |
| Renderer (src/) | None new | Existing React app unchanged |

### Integration Points with Existing Code

**Files Modified:**

| File | Change | Reason |
|------|--------|--------|
| `package.json` | Add scripts, devDependencies, main field | Electron configuration |
| `tsconfig.json` | Add electron/ to includes (optional) | TypeScript compilation |

**Files Added:**

| File | Purpose |
|------|---------|
| `electron/main.ts` | Main process entry |
| `electron/preload.ts` | Preload script stub |
| `electron.vite.config.ts` | Electron build config |
| `resources/icon.icns` | macOS app icon |

**Files Unchanged:**

- `vite.config.ts` - Web build configuration
- `src/**/*` - All React application code
- `index.html` - Web entry point
- `.env*` - Environment configuration

### package.json Updates

```json
{
  "main": "dist-electron/main/main.js",
  "scripts": {
    "dev": "vite",
    "dev:electron": "electron-vite dev",
    "build": "tsc -b && vite build",
    "build:electron": "electron-vite build",
    "build:all": "npm run build && npm run build:electron",
    "package": "electron-vite build && electron-builder --mac --universal"
  },
  "build": {
    "appId": "com.vishal.today",
    "productName": "Today",
    "mac": {
      "target": ["universal"],
      "category": "public.app-category.productivity"
    },
    "directories": {
      "output": "release"
    },
    "files": [
      "dist-electron/**/*"
    ]
  }
}
```

## Acceptance Criteria (Authoritative)

### AC1: Electron Project Setup (Story 1.1)
- **AC1.1**: Running `npm install` installs electron, electron-vite, and @electron-toolkit packages without errors
- **AC1.2**: An `electron/` directory exists with `main.ts` and `preload.ts` files
- **AC1.3**: An `electron.vite.config.ts` file exists at project root
- **AC1.4**: The existing `vite.config.ts` remains unchanged
- **AC1.5**: TypeScript compiles without errors (`tsc -b` passes)
- **AC1.6**: Existing `npm run dev` still works and serves web app at localhost:5173

### AC2: Electron Development Mode (Story 1.2)
- **AC2.1**: Running `npm run dev:electron` opens an Electron window showing the React app
- **AC2.2**: Changes to React components hot-reload in the Electron window
- **AC2.3**: The app title bar shows "Today"
- **AC2.4**: DevTools can be opened with Cmd+Option+I in development mode
- **AC2.5**: The window has default dimensions of 1200x800 pixels
- **AC2.6**: Closing the window quits the Electron process

### AC3: Dual Build Pipeline (Story 1.3)
- **AC3.1**: Running `npm run build` produces only the web build in `dist/` (unchanged behavior)
- **AC3.2**: Running `npm run build:electron` produces Electron build in `dist-electron/` with main/, preload/, and renderer/ subdirectories
- **AC3.3**: Running `npm run build:all` produces both web and Electron builds
- **AC3.4**: The web build in `dist/` contains NO Electron-specific code (verified by grep)
- **AC3.5**: The Electron renderer build includes the complete React app
- **AC3.6**: Both builds complete without errors or warnings

### AC4: macOS App Packaging (Story 1.4)
- **AC4.1**: Running `npm run package` creates a `release/` directory containing `Today.app`
- **AC4.2**: The .app bundle is a universal binary (supports both arm64 and x64)
- **AC4.3**: Double-clicking Today.app launches the application
- **AC4.4**: The app icon appears in the Dock while running
- **AC4.5**: The app can be copied to /Applications and run from there
- **AC4.6**: First launch shows expected macOS security warning (unsigned app)

### AC5: Web Continuity (Cross-cutting)
- **AC5.1**: All existing task management features work unchanged in web browser
- **AC5.2**: All existing time tracking features work unchanged in web browser
- **AC5.3**: Supabase sync continues to work for tasks and time entries
- **AC5.4**: PWA installation still works in web version
- **AC5.5**: Offline support still works in web version

## Traceability Mapping

| AC | FR(s) | Spec Section | Component(s) | Test Approach |
|----|-------|--------------|--------------|---------------|
| AC1.1-1.6 | FR2 | Dependencies | package.json, electron/ | Manual: npm install, npm run dev |
| AC2.1-2.6 | FR3 | Workflows: Flow 2 | electron/main.ts | Manual: npm run dev:electron, edit component |
| AC3.1-3.6 | FR1, FR4, FR9 | Workflows: Flow 3 | electron.vite.config.ts | Manual: build commands, grep dist/ for "electron" |
| AC4.1-4.6 | FR5 | Workflows: Flow 4 | electron-builder config | Manual: npm run package, launch .app |
| AC5.1-5.5 | FR27-30 | Reliability | All existing src/ | Manual: regression test web app in browser |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | electron-vite incompatibility with Vite 7.x | Medium | High | Check electron-vite release notes; fallback to electron-forge if needed |
| R2 | Universal binary build fails on CI (if added later) | Low | Medium | Test on both Intel and Apple Silicon Macs locally |
| R3 | Electron security warnings in console | Medium | Low | Expected for unsigned app; document for user |
| R4 | Large node_modules increase from Electron | High | Low | Electron adds ~150MB; acceptable for desktop dev |
| R5 | HMR not working in Electron renderer | Medium | Medium | Verify electron-vite config; fallback to manual refresh |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A1 | Developer has Node.js 20+ installed | Document in README prerequisites |
| A2 | Developer is on macOS 12+ (for universal binary support) | Document in README |
| A3 | Xcode Command Line Tools are installed | Required for native module compilation |
| A4 | electron-vite 2.x is compatible with existing Vite config | Verify during Story 1.1 implementation |
| A5 | Existing React app has no hardcoded browser-only APIs that break in Electron | React app is standard - should work |

### Open Questions

| ID | Question | Owner | Resolution Target |
|----|----------|-------|-------------------|
| Q1 | Should we add .gitignore entries for dist-electron/ and release/? | Dev | Resolve during Story 1.1 - likely yes |
| Q2 | Should DevTools auto-open in dev mode or require Cmd+Option+I? | Dev | Resolve during Story 1.2 - recommend manual open |
| Q3 | Do we need a placeholder icon.icns or can we skip it initially? | Dev | Resolve during Story 1.4 - use placeholder |
| Q4 | Should we add electron-builder.yml or keep config in package.json? | Dev | Resolve during Story 1.4 - package.json is simpler |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Manual Tests** | All acceptance criteria | Checklist | 100% of ACs |
| **Build Verification** | Build outputs, no regressions | Shell scripts | Critical paths |
| **Smoke Tests** | App launches, basic functionality | Manual | Per story completion |

### Test Scenarios by Story

**Story 1.1: Electron Project Setup**
- Manual: Run `npm install` - no errors
- Manual: Verify `electron/` directory structure exists
- Manual: Run `npm run dev` - web app still works at localhost:5173
- Manual: Run `tsc -b` - TypeScript compiles without errors
- Verification: `ls electron/` shows main.ts and preload.ts

**Story 1.2: Electron Development Mode**
- Manual: Run `npm run dev:electron` - Electron window opens
- Manual: Edit a React component - change appears in Electron window (HMR)
- Manual: Verify window title shows "Today"
- Manual: Press Cmd+Option+I - DevTools opens
- Manual: Close window - process terminates cleanly

**Story 1.3: Dual Build Pipeline**
- Manual: Run `npm run build` - only dist/ created
- Manual: Run `npm run build:electron` - dist-electron/ created with subdirs
- Manual: Run `npm run build:all` - both outputs created
- Verification: `grep -r "electron" dist/` returns no matches
- Verification: `ls dist-electron/` shows main/, preload/, renderer/

**Story 1.4: macOS App Packaging**
- Manual: Run `npm run package` - release/Today.app created
- Manual: Double-click Today.app - app launches
- Manual: Verify app icon in Dock
- Manual: Copy to /Applications, launch from there
- Verification: `file release/Today.app/Contents/MacOS/Today` shows universal binary

### Web Regression Tests (Cross-cutting)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Task creation | Add task in web browser | Task appears, persists on refresh |
| Time tracking | Start/stop timer in web | Entry saved correctly |
| Supabase sync | Sign in, create task | Syncs to Supabase |
| PWA install | Click install prompt in Chrome | App installs as PWA |
| Offline mode | Disable network, use app | App functions offline |

### Build Verification Script

```bash
#!/bin/bash
# verify-builds.sh - Run after npm run build:all

echo "Verifying web build..."
if [ -d "dist" ]; then
  echo "✓ dist/ exists"
  if grep -rq "electron" dist/; then
    echo "✗ FAIL: Electron code found in web build!"
    exit 1
  else
    echo "✓ No Electron code in web build"
  fi
else
  echo "✗ FAIL: dist/ not found"
  exit 1
fi

echo "Verifying Electron build..."
if [ -d "dist-electron/main" ] && [ -d "dist-electron/preload" ] && [ -d "dist-electron/renderer" ]; then
  echo "✓ dist-electron/ structure correct"
else
  echo "✗ FAIL: dist-electron/ structure incorrect"
  exit 1
fi

echo "All verifications passed!"
```

### Acceptance Criteria Coverage

All 21 acceptance criteria (AC1.1 through AC5.5) are covered by manual test scenarios above. Epic 1 is primarily infrastructure/build tooling, so automated tests are not practical - manual verification is appropriate.

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2026-01-11_
_For: Vishal_
