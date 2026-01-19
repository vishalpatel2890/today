# Story 1.4: macOS App Packaging

Status: done

## Story

As a **developer**,
I want **to package the Electron app as a runnable macOS .app bundle**,
so that **I can run the desktop app outside of development mode**.

## Acceptance Criteria

1. **AC4.1**: Running `npm run package` creates a `release/` directory containing `Today.app`
2. **AC4.2**: The .app bundle is a universal binary (supports both arm64 and x64)
3. **AC4.3**: Double-clicking Today.app launches the application
4. **AC4.4**: The app icon appears in the Dock while running
5. **AC4.5**: The app can be copied to /Applications and run from there
6. **AC4.6**: First launch shows expected macOS security warning (unsigned app)

## Frontend Test Gate

**Gate ID**: 1-4-TG1

### Prerequisites
- [ ] Story 1.3 complete (Dual build pipeline working)
- [ ] Node.js 20+ installed
- [ ] `npm install` completed
- [ ] Xcode Command Line Tools installed
- [ ] Starting state: Clean working directory

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run package` | Terminal | Build completes, `release/` directory created |
| 2 | Navigate to `release/` folder | Finder | `Today.app` is visible |
| 3 | Run `file release/*/Contents/MacOS/*` | Terminal | Shows "Mach-O universal binary" with arm64 and x86_64 |
| 4 | Double-click `Today.app` | Finder | macOS shows "unidentified developer" warning |
| 5 | Right-click → Open → Open | Context menu | App launches successfully |
| 6 | View Dock | macOS Dock | Today app icon visible while running |
| 7 | Copy `Today.app` to `/Applications` | Finder | App copies successfully |
| 8 | Launch from `/Applications` | Launchpad or Finder | App runs from Applications folder |

### Success Criteria (What User Sees)
- [ ] `npm run package` completes without errors
- [ ] `release/Today.app` exists
- [ ] App is a universal binary (arm64 + x64)
- [ ] App launches after bypassing Gatekeeper
- [ ] App icon appears in Dock while running
- [ ] App runs from /Applications folder
- [ ] No console errors in Electron DevTools
- [ ] App functions identically to dev mode

### Feedback Questions
1. Did the packaging command complete without errors?
2. How long did the universal binary build take?
3. Did the Gatekeeper bypass work (right-click → Open)?
4. Any visual issues with the app icon in Dock?

## Tasks / Subtasks

- [x] **Task 1: Install electron-builder** (AC: 4.1)
  - [x] 1.1: Run `npm install -D electron-builder`
  - [x] 1.2: Verify electron-builder appears in package.json devDependencies
  - [x] 1.3: Verify no npm audit vulnerabilities introduced

- [x] **Task 2: Configure electron-builder** (AC: 4.1, 4.2, 4.4)
  - [x] 2.1: Add electron-builder configuration to package.json `"build"` key
  - [x] 2.2: Set `appId: "com.vishal.today"`
  - [x] 2.3: Set `productName: "Today"`
  - [x] 2.4: Configure `mac.target: ["universal"]` for universal binary
  - [x] 2.5: Set `mac.category: "public.app-category.productivity"`
  - [x] 2.6: Set `directories.output: "release"`
  - [x] 2.7: Configure `files` to include `dist-electron/**/*`

- [x] **Task 3: Create placeholder app icon** (AC: 4.4)
  - [x] 3.1: Create `resources/` directory
  - [x] 3.2: Create or source placeholder `icon.icns` file (512x512 minimum)
  - [x] 3.3: Configure electron-builder to use `resources/icon.icns`

- [x] **Task 4: Add package script** (AC: 4.1)
  - [x] 4.1: Add script `"package": "electron-vite build && electron-builder --mac --universal"` to package.json
  - [x] 4.2: Verify script runs electron-vite build first (ensures fresh Electron build)

- [x] **Task 5: Verify universal binary packaging** (AC: 4.2, 4.3)
  - [x] 5.1: Run `npm run package`
  - [x] 5.2: Verify `release/Today.app` exists
  - [x] 5.3: Run `file release/*/Contents/MacOS/*` to verify universal binary
  - [x] 5.4: Verify both arm64 and x86_64 architectures present

- [x] **Task 6: Test app launch and functionality** (AC: 4.3, 4.5, 4.6)
  - [x] 6.1: Double-click Today.app - verify Gatekeeper warning appears
  - [x] 6.2: Right-click → Open → Open to bypass Gatekeeper
  - [x] 6.3: Verify app launches and React UI renders
  - [x] 6.4: Verify app icon appears in Dock
  - [x] 6.5: Copy to /Applications and launch from there
  - [x] 6.6: Verify all existing app functionality works (tasks, time tracking)

- [x] **Task 7: Update .gitignore** (AC: N/A - cleanup)
  - [x] 7.1: Add `release/` to .gitignore if not present
  - [x] 7.2: Verify packaged app not committed to repo

## Dev Notes

### Architecture Alignment

This story implements the final piece of Epic 1 from `notes/architecture-electron-migration.md`:

- **FR5**: Build produces runnable macOS .app bundle
- **ADR-010**: No signing/notarization for MVP (personal use only)
- **Architecture Target**: macOS universal binary (arm64 + x64)

Per ADR-010, we skip code signing - user will right-click → Open to bypass Gatekeeper.

### Key Technical Details

**electron-builder Configuration (package.json):**
```json
{
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

**Package Script:**
```json
{
  "scripts": {
    "package": "electron-vite build && electron-builder --mac --universal"
  }
}
```

**Expected Output:**
```
today-app/
├── release/
│   ├── Today.app/
│   │   ├── Contents/
│   │   │   ├── MacOS/
│   │   │   │   └── Today    # Universal binary
│   │   │   ├── Resources/
│   │   │   │   └── icon.icns
│   │   │   └── Info.plist
│   └── (other build artifacts)
```

**Verification Commands:**
```bash
# Check universal binary
file release/*/Contents/MacOS/*
# Should show: Mach-O universal binary with 2 architectures: [x86_64:Mach-O 64-bit executable x86_64] [arm64]

# Check app bundle structure
ls -la release/Today.app/Contents/

# Test launch
open release/Today.app
```

### Project Structure Notes

- `resources/icon.icns` - macOS app icon (512x512 minimum for Retina)
- `release/` - Build output directory (gitignored)
- No changes to `src/` or `electron/` code required

### Learnings from Previous Story

**From Story 1-3-dual-build-pipeline (Status: done)**

- **Build Scripts**: All scripts (`build`, `build:electron`, `build:all`) working correctly
- **Electron Build Output**: `dist-electron/` structure is correct (main/, preload/, renderer/)
- **Bundle Sizes**: main.js (1.56KB), preload.mjs (0.15KB), renderer (~1.6MB)
- **Test Suite**: 464 tests pass - no regressions
- **Vite Warning**: Chunk size >500KB warning is expected and acceptable
- **Key Pattern**: Script chaining works (`npm run build:all` runs both builds sequentially)

The dual build pipeline from Story 1.3 should integrate cleanly with electron-builder. The `package` script will run `electron-vite build` first to ensure fresh Electron artifacts.

[Source: notes/sprint-artifacts/1-3-dual-build-pipeline.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1-electron.md#AC4]
- [Source: notes/architecture-electron-migration.md#Deployment-Architecture]
- [Source: notes/epics-electron-migration.md#Story-1.4]
- [Source: notes/prd-electron-migration.md#Build-Development-Pipeline]

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/1-4-macos-app-packaging.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-11: Installed electron-builder@26.4.0 - 0 vulnerabilities
- 2026-01-11: Fixed mac.target config - "universal" invalid as target value, using "dir" with --universal flag
- 2026-01-11: Created icon.icns (234KB) using sharp + iconutil from SVG placeholder
- 2026-01-11: npm run package builds both x64 and arm64 temps, then creates universal binary
- 2026-01-11: Verified universal binary: Mach-O universal binary with 2 architectures [x86_64] [arm64]
- 2026-01-11: All 494 tests pass - no regressions

### Completion Notes List

- electron-builder v26.4.0 installed successfully
- App packaged to release/mac-universal/Today.app (not release/Today.app as originally expected)
- Universal binary verified with both arm64 and x86_64 architectures
- Icon generated programmatically using sharp (purple gradient with "T" letter)
- .gitignore already had `release` entry - no changes needed
- Ad-hoc code signing applied (no certificate required for personal use)
- ✅ Test Gate PASSED by Vishal (2026-01-11)
- App copied to /Applications/Today.app successfully

### File List

**New Files:**
- today-app/resources/icon.png (48KB - source PNG for icon)
- today-app/resources/icon.icns (234KB - macOS app icon)
- today-app/release/mac-universal/Today.app (build output, gitignored)

**Modified Files:**
- today-app/package.json (added electron-builder, build config, package script)

