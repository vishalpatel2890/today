/**
 * IPC Channel Constants
 *
 * Central registry of IPC channel names for type-safe communication
 * between main process and renderer process.
 *
 * Per ADR-007: Channel names follow domain:action kebab-case convention
 */

export const IPC_CHANNELS = {
  /** Start activity tracking for a time entry */
  ACTIVITY_START: 'activity:start',

  /** Stop activity tracking */
  ACTIVITY_STOP: 'activity:stop',

  /** Get activity log for a time entry */
  ACTIVITY_GET_LOG: 'activity:get-log',

  /** Export activity log to file */
  ACTIVITY_EXPORT: 'activity:export',

  /** Get current activity (for testing/debugging) */
  ACTIVITY_GET_CURRENT: 'activity:get-current',
} as const

/** Type for IPC channel names */
export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
