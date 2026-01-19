/**
 * Activity Tracking Types
 *
 * Type definitions for the activity tracking system.
 * These types are used by the main process tracker module.
 *
 * Source: notes/epics-electron-migration.md#Story-3.1
 */

/**
 * Represents a single activity capture at a point in time
 */
export interface ActivityEntry {
  /** Unique identifier for the entry */
  id: string

  /** ID of the time entry this activity belongs to */
  timeEntryId: string

  /** Name of the active application (e.g., "Visual Studio Code") */
  appName: string

  /** Title of the active window (e.g., "App.tsx - today-app") */
  windowTitle: string

  /** ISO 8601 timestamp when this activity was captured */
  timestamp: string
}

/**
 * Result of getCurrentActivity() call
 * Returns null if no window is focused or detection fails
 */
export interface CurrentActivity {
  /** Name of the frontmost application */
  appName: string

  /** Title of the frontmost window (may be empty if app has no title) */
  windowTitle: string

  /** ISO 8601 timestamp of capture */
  timestamp: string
}

/**
 * Tracker state for managing polling sessions
 */
export interface TrackerState {
  /** Whether tracking is currently active */
  isTracking: boolean

  /** ID of the time entry being tracked */
  timeEntryId: string | null

  /** Interval ID for polling (for cleanup) */
  intervalId: NodeJS.Timeout | null

  /** Activity entries captured during this session */
  entries: ActivityEntry[]

  /** Last captured activity (for deduplication) */
  lastActivity: { appName: string; windowTitle: string } | null
}
