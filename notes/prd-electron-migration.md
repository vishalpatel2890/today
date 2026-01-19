# Today - Product Requirements Document

**Author:** Vishal
**Date:** 2026-01-11
**Version:** 1.0

---

## Executive Summary

Today is an existing PWA task management app with time tracking capabilities. This PRD defines the requirements for migrating to an Electron desktop application while maintaining the web app. The primary motivation is enabling desktop-only features like app activity tracking, while the primary success criteria is establishing a maintainable single-codebase architecture that serves both web and Electron targets.

The Electron version will track which applications the user interacts with during active time tracking sessions, enabling time entry corrections when users forget to stop timers and providing evidence for accurate time logging.

### What Makes This Special

**The real value isn't the feature - it's the pipeline.** While app tracking enables better time accuracy, the true differentiator is a clean, maintainable architecture where:
- One codebase produces both web and Electron apps
- Feature flags cleanly separate desktop-only capabilities
- Updates to shared functionality deploy to both targets seamlessly
- The web app continues working exactly as it does today

This is a personal productivity tool built for its creator, prioritizing simplicity and maintainability over feature richness.

---

## Project Classification

**Technical Type:** Desktop App (Electron)
**Domain:** General/Productivity
**Complexity:** Low

This is a desktop application migration of an existing PWA. The project involves:
- Wrapping the existing React/TypeScript web app in Electron
- Adding Electron-specific native modules for app tracking
- Establishing build pipelines for both web and desktop targets
- Implementing feature detection to conditionally enable desktop features

The domain is personal productivity tooling with no regulatory requirements, external integrations, or complex business logic beyond what already exists in the web app.

---

## Success Criteria

Success for this project is defined by **build simplicity** - the ability to maintain and deploy both web and Electron apps with minimal friction:

1. **Single Build Command:** One command produces both web deployment artifacts and Electron app bundle
2. **Shared Codebase:** 95%+ of application code is shared between targets with no duplication
3. **Feature Isolation:** Desktop-only features are cleanly gated behind runtime detection, not build-time branching
4. **Web Continuity:** The existing PWA continues to function exactly as it does today with zero regression
5. **App Tracking Works:** Can view which apps (with window titles) were active during any tracked time session

The Electron app is for personal use only - no distribution, signing, or update infrastructure required.

---

## Product Scope

### MVP - Minimum Viable Product

**Build & Architecture:**
- Electron wrapper around existing React app
- Single codebase with shared components
- Feature detection for Electron vs. web context
- Simple build script that outputs both web and Electron targets
- macOS only

**App Tracking Feature:**
- Capture active application name during time tracking sessions
- Capture window/document titles for context
- Store activity log locally in IndexedDB (Electron-only data)
- View activity log for any completed time entry
- Manual export of activity data

**Constraints:**
- No changes to existing web app behavior
- No cloud sync of activity tracking data
- No auto-updates or distribution infrastructure

### Growth Features (Post-MVP)

- Activity reports: Weekly/monthly summaries of app usage patterns during tracked tasks
- Productivity insights: Aggregate statistics on time spent per app category

### Vision (Future)

- Cross-platform support (Windows, Linux) if personal workflow changes
- Smart time suggestions based on detected activity patterns
- Integration with the existing time entries sync (privacy-preserving aggregates only)

---

## Desktop App Specific Requirements

### Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS | MVP | Primary target, required for app tracking APIs |
| Windows | Future | Consider if workflow changes |
| Linux | Future | Low priority |

### System Integration

**App Tracking Integration (macOS):**
- Use macOS Accessibility APIs or `NSWorkspace` notifications to detect active application
- Capture `localizedName` of frontmost application
- Capture window title from frontmost window
- Poll interval: Every 5-10 seconds during active tracking (balance accuracy vs. resource usage)

**Electron IPC Bridge:**
- Main process handles native macOS APIs for app tracking
- Renderer process (React app) communicates via IPC for:
  - Starting/stopping activity capture
  - Retrieving activity log for a session
  - Exporting activity data

**Feature Detection:**
- Runtime check: `window.electronAPI` or similar bridge object
- Conditionally render "View Activity" button on time entries
- Graceful degradation: web app simply doesn't show desktop-only UI

### Offline Capabilities

The existing app already works offline via IndexedDB and service worker. The Electron version inherits this behavior with additions:
- Activity tracking data stored in separate IndexedDB store
- No network dependency for any Electron-specific features
- Activity export generates local JSON/CSV file

---

## User Experience Principles

### Visual Personality

The Electron app should feel **identical to the web app** - same UI, same interactions, same design language. The only visible difference is the presence of activity tracking features when viewing time entries.

### Key Interactions

**Starting Time Tracking (unchanged):**
- User starts tracking a task via existing UI
- In Electron: background activity capture begins automatically
- No additional user action required

**Viewing Activity Log:**
- User opens a completed time entry
- "View Activity" button appears (Electron only)
- Modal/panel shows chronological list of apps + window titles
- Each entry shows: timestamp, app name, window title

**Exporting Activity:**
- From activity view, user can export to JSON/CSV
- Standard file save dialog
- No cloud upload

---

## Functional Requirements

### Build & Development Pipeline

- **FR1:** Developer can run a single command to build both web and Electron artifacts
- **FR2:** Developer can run web app in development mode independently of Electron
- **FR3:** Developer can run Electron app in development mode with hot reload
- **FR4:** Build process produces deployable web assets (existing Vercel/static deploy)
- **FR5:** Build process produces runnable macOS .app bundle

### Feature Detection & Isolation

- **FR6:** Application detects at runtime whether it's running in Electron or browser
- **FR7:** Desktop-only UI elements are conditionally rendered based on runtime context
- **FR8:** Web app functions identically to current behavior when not in Electron
- **FR9:** No Electron-specific code is bundled into the web build

### Activity Tracking - Capture

- **FR10:** System captures the active application name when time tracking is active
- **FR11:** System captures the window title of the active application
- **FR12:** System records timestamp for each activity change
- **FR13:** Activity capture starts automatically when user starts time tracking
- **FR14:** Activity capture stops automatically when user stops time tracking
- **FR15:** Activity data is associated with the corresponding time entry

### Activity Tracking - Storage

- **FR16:** Activity logs are stored locally in IndexedDB
- **FR17:** Activity data persists across app restarts
- **FR18:** Activity data is keyed to time entry IDs for retrieval
- **FR19:** Activity data is never synced to Supabase or any remote server

### Activity Tracking - Viewing

- **FR20:** User can view activity log for any time entry (Electron only)
- **FR21:** Activity log displays chronologically with timestamps
- **FR22:** Activity log shows app name and window title for each entry
- **FR23:** User can see duration spent in each app during the session

### Activity Tracking - Export

- **FR24:** User can export activity log for a single time entry
- **FR25:** Export formats include JSON and CSV
- **FR26:** Export uses native file save dialog

### Existing Functionality (No Changes)

- **FR27:** All existing task management features work unchanged
- **FR28:** All existing time tracking features work unchanged
- **FR29:** Supabase sync continues to work for tasks and time entries
- **FR30:** PWA installation and offline support work unchanged in web version

---

## Non-Functional Requirements

### Performance

- **NFR1:** Activity polling must not noticeably impact system performance (<1% CPU)
- **NFR2:** Electron app startup time should be under 3 seconds
- **NFR3:** Activity log queries should return in under 100ms for sessions up to 8 hours
- **NFR4:** Web build size should not increase due to Electron migration

### Security

- **NFR5:** Activity data remains local and is never transmitted
- **NFR6:** No new permissions required beyond macOS Accessibility (for app tracking)
- **NFR7:** Electron app follows security best practices (contextIsolation, no nodeIntegration in renderer)

### Maintainability

- **NFR8:** Shared code changes require updates in one location only
- **NFR9:** Adding new shared features should not require Electron-specific modifications
- **NFR10:** Clear separation between main process (Electron) and renderer process (React) code
- **NFR11:** TypeScript types shared between web and Electron builds

---

## Technical Approach (Informational)

This section provides architectural guidance for the implementation team.

### Recommended Stack

- **Electron Forge** or **electron-vite**: Modern Electron tooling with Vite integration
- **Vite**: Already used by the React app, enables shared build config
- **electron-builder** (optional): For future distribution if needed

### Project Structure Pattern

```
today-app/
├── src/                    # Shared React application
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── ...
├── electron/               # Electron-specific code
│   ├── main.ts            # Main process
│   ├── preload.ts         # Preload script (IPC bridge)
│   └── activity/          # App tracking module
├── vite.config.ts         # Web build config
├── electron.vite.config.ts # Electron build config (extends web)
└── package.json
```

### Feature Flag Pattern

```typescript
// src/lib/platform.ts
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' &&
         window.electronAPI !== undefined;
};

// Usage in components
{isElectron() && <ViewActivityButton entryId={entry.id} />}
```

---

_This PRD captures the essence of Today Electron Migration - a maintainability-first approach to adding desktop capabilities while preserving the simplicity of a single codebase._

_Created through collaborative discovery between Vishal and AI facilitator._
