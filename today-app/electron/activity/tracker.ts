/**
 * macOS Activity Tracker
 *
 * Detects the currently active application and window title on macOS
 * using AppleScript via the osascript command.
 *
 * This module runs in the Electron main process only.
 *
 * Source: notes/epics-electron-migration.md#Story-3.1, Story-3.2
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import type { ActivityEntry, CurrentActivity, TrackerState } from './types'

const execAsync = promisify(exec)

/** Timeout for osascript commands (ms) */
const OSASCRIPT_TIMEOUT = 2000

/**
 * AppleScript to get the name of the frontmost application
 */
const GET_APP_NAME_SCRIPT = `
tell application "System Events"
  set frontApp to first process whose frontmost is true
  return name of frontApp
end tell
`

/**
 * AppleScript to get the title of the frontmost window
 * Returns empty string if no window exists or title is unavailable
 */
const GET_WINDOW_TITLE_SCRIPT = `
tell application "System Events"
  set frontApp to first process whose frontmost is true
  try
    set windowTitle to name of front window of frontApp
    return windowTitle
  on error
    return ""
  end try
end tell
`

/**
 * Execute an AppleScript and return the trimmed output
 * Returns null if execution fails or times out
 */
async function runAppleScript(script: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      timeout: OSASCRIPT_TIMEOUT,
    })
    return stdout.trim()
  } catch (error) {
    // Log in development, but don't throw - return null for graceful degradation
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Electron/Activity] AppleScript execution failed:', error)
    }
    return null
  }
}

/**
 * Get the currently active application and window title
 *
 * @returns CurrentActivity object with appName, windowTitle, and timestamp
 *          Returns null if no application is focused or detection fails
 *
 * @example
 * const activity = await getCurrentActivity()
 * // { appName: "Visual Studio Code", windowTitle: "App.tsx - today-app", timestamp: "2026-01-13T..." }
 */
export async function getCurrentActivity(): Promise<CurrentActivity | null> {
  // Only supported on macOS
  if (process.platform !== 'darwin') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Electron/Activity] Activity tracking only supported on macOS')
    }
    return null
  }

  // Get app name first - if this fails, we can't proceed
  const appName = await runAppleScript(GET_APP_NAME_SCRIPT)
  if (!appName) {
    return null
  }

  // Get window title (may be empty for some apps like Finder with no windows)
  const windowTitle = (await runAppleScript(GET_WINDOW_TITLE_SCRIPT)) ?? ''

  return {
    appName,
    windowTitle,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Check if activity tracking is supported on this platform
 */
export function isActivityTrackingSupported(): boolean {
  return process.platform === 'darwin'
}

// ============================================================================
// Story 3.2: Activity Polling During Time Tracking
// ============================================================================

const isDev = process.env.NODE_ENV === 'development'

/** Polling interval in milliseconds (5 seconds per architecture spec) */
const POLL_INTERVAL_MS = 5000

/**
 * Tracker state - manages polling sessions
 * Only one tracking session can be active at a time
 */
const state: TrackerState = {
  isTracking: false,
  timeEntryId: null,
  intervalId: null,
  entries: [],
  lastActivity: null,
}

/**
 * Get current tracker state (for debugging/testing)
 */
export function getTrackerState(): TrackerState {
  return { ...state, entries: [...state.entries] }
}

/**
 * Internal: Poll for activity and record if changed
 * Only records NEW activity - deduplicates based on appName + windowTitle
 */
async function pollActivity(): Promise<void> {
  if (!state.isTracking || !state.timeEntryId) {
    return
  }

  const current = await getCurrentActivity()
  if (!current) {
    return
  }

  // Deduplication: skip if same app and window title
  if (
    state.lastActivity &&
    state.lastActivity.appName === current.appName &&
    state.lastActivity.windowTitle === current.windowTitle
  ) {
    return
  }

  // Create new activity entry
  const entry: ActivityEntry = {
    id: randomUUID(),
    timeEntryId: state.timeEntryId,
    appName: current.appName,
    windowTitle: current.windowTitle,
    timestamp: current.timestamp,
  }

  state.entries.push(entry)
  state.lastActivity = { appName: current.appName, windowTitle: current.windowTitle }

  if (isDev) {
    console.log(`[Electron/Activity] Captured: ${current.appName} - ${current.windowTitle}`)
  }
}

/**
 * Start activity tracking for a time entry
 *
 * @param timeEntryId - The ID of the time entry to track activity for
 * @returns Success response or error if already tracking
 *
 * @example
 * const result = await startTracking('entry-123')
 * // { success: true }
 */
export async function startTracking(
  timeEntryId: string
): Promise<{ success: true } | { success: false; error: string }> {
  // Check if already tracking
  if (state.isTracking) {
    return { success: false, error: 'Already tracking. Call stop first.' }
  }

  // Initialize state
  state.isTracking = true
  state.timeEntryId = timeEntryId
  state.entries = []
  state.lastActivity = null

  if (isDev) {
    console.log(`[Electron/Activity] Started tracking for entry: ${timeEntryId}`)
  }

  // Capture initial activity immediately
  await pollActivity()

  // Start polling interval
  state.intervalId = setInterval(() => {
    pollActivity().catch((error) => {
      if (isDev) {
        console.error('[Electron/Activity] Poll error:', error)
      }
    })
  }, POLL_INTERVAL_MS)

  return { success: true }
}

/**
 * Stop activity tracking and return captured entries count
 *
 * @returns Success response with count of entries recorded
 *
 * @example
 * const result = await stopTracking()
 * // { success: true, data: { entriesRecorded: 5 } }
 */
export async function stopTracking(): Promise<{
  success: true
  data: { entriesRecorded: number; entries: ActivityEntry[] }
}> {
  // If not tracking, return success with 0 entries
  if (!state.isTracking) {
    return { success: true, data: { entriesRecorded: 0, entries: [] } }
  }

  // Clear the polling interval
  if (state.intervalId) {
    clearInterval(state.intervalId)
  }

  // Capture final count and entries before reset
  const entriesRecorded = state.entries.length
  const capturedEntries = [...state.entries]

  if (isDev) {
    console.log(
      `[Electron/Activity] Stopped tracking. Entries recorded: ${entriesRecorded}`
    )
  }

  // Reset state
  state.isTracking = false
  state.timeEntryId = null
  state.intervalId = null
  state.entries = []
  state.lastActivity = null

  // Return entries for Story 3.3 (IndexedDB persistence)
  return { success: true, data: { entriesRecorded, entries: capturedEntries } }
}
