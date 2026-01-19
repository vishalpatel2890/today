/**
 * Electron Bridge - Type-safe wrapper for Electron IPC
 *
 * This module provides a safe way to call Electron APIs from React components.
 * It checks if the app is running in Electron before making IPC calls,
 * returning an error response gracefully when running in a web browser.
 *
 * Story 3.3: Activity data is stored in IndexedDB (renderer process).
 * - stop() saves entries to IndexedDB after receiving from main process
 * - getLog() queries IndexedDB directly (main process can't access IndexedDB)
 *
 * Usage:
 * ```typescript
 * import { electronBridge } from '@/lib/electronBridge';
 *
 * const result = await electronBridge.activity.start(entryId);
 * if (!result.success) {
 *   console.warn('Activity tracking unavailable:', result.error);
 * }
 * ```
 */

import { isElectron } from './platform'
import type { IPCResponse, ActivityEntry, CurrentActivity, ActivityStopResponse } from '../types/electron'
import { saveActivityEntries, getActivityEntriesByTimeEntryId } from './activityStore'
import type { ActivityLogEntry } from './db'

/** Error returned when trying to use Electron APIs in web browser */
const NOT_IN_ELECTRON_ERROR = 'Not in Electron'

/**
 * Type-safe wrapper for Electron IPC calls
 *
 * All methods:
 * - Check `isElectron()` before making IPC calls
 * - Return consistent `IPCResponse` shape
 * - Return error response (not throw) when not in Electron
 */
export const electronBridge = {
  activity: {
    /**
     * Start activity tracking for a time entry
     *
     * @param timeEntryId - The ID of the time entry to track
     * @returns Promise resolving to success or error response
     *
     * @example
     * ```typescript
     * const result = await electronBridge.activity.start('entry-123');
     * if (result.success) {
     *   console.log('Tracking started');
     * }
     * ```
     */
    start: async (timeEntryId: string): Promise<IPCResponse> => {
      if (!isElectron()) {
        return { success: false, error: NOT_IN_ELECTRON_ERROR }
      }
      return window.electronAPI!.activity.start(timeEntryId)
    },

    /**
     * Stop activity tracking and persist entries to IndexedDB
     *
     * Story 3.3: After receiving entries from main process IPC,
     * saves them to IndexedDB (renderer-side) for persistence.
     *
     * @returns Promise resolving to success with entries count or error
     *
     * @example
     * ```typescript
     * const result = await electronBridge.activity.stop();
     * if (result.success) {
     *   console.log(`Recorded ${result.data?.entriesRecorded} entries`);
     * }
     * ```
     *
     * AC-3.3.1: When activity:stop IPC is called, entries are saved to IndexedDB
     */
    stop: async (): Promise<IPCResponse<ActivityStopResponse>> => {
      if (!isElectron()) {
        return { success: false, error: NOT_IN_ELECTRON_ERROR }
      }

      // Get entries from main process
      const result = await window.electronAPI!.activity.stop()

      // If successful and we have entries, save them to IndexedDB
      if (result.success && result.data && result.data.entries.length > 0) {
        try {
          await saveActivityEntries(result.data.entries)

          if (import.meta.env.DEV) {
            console.log(
              `[Today] electronBridge: Saved ${result.data.entries.length} activity entries to IndexedDB`
            )
          }
        } catch (error) {
          // Log error but don't fail the stop operation
          console.error('[Today] electronBridge: Failed to save activity entries', error)
          // Still return success since tracking was stopped successfully
        }
      }

      return result
    },

    /**
     * Get activity log for a time entry from IndexedDB
     *
     * Story 3.3: Queries IndexedDB directly (renderer-side) since
     * main process cannot access IndexedDB. Falls back to IPC for
     * backwards compatibility if needed.
     *
     * @param timeEntryId - The ID of the time entry
     * @returns Promise resolving to activity entries array or error
     *
     * @example
     * ```typescript
     * const result = await electronBridge.activity.getLog('entry-123');
     * if (result.success && result.data) {
     *   result.data.forEach(entry => {
     *     console.log(`${entry.timestamp}: ${entry.appName} - ${entry.windowTitle}`);
     *   });
     * }
     * ```
     *
     * AC-3.3.6: activity:get-log returns entries from IndexedDB
     * AC-3.3.7: Returns empty array if no activity exists
     */
    getLog: async (timeEntryId: string): Promise<IPCResponse<ActivityEntry[]>> => {
      if (!isElectron()) {
        return { success: false, error: NOT_IN_ELECTRON_ERROR }
      }

      try {
        // Query IndexedDB directly (renderer-side) per ADR-008
        if (import.meta.env.DEV) {
          console.time('[Today/IPC] activity:get-log query')
        }
        const entries = await getActivityEntriesByTimeEntryId(timeEntryId)

        // Convert ActivityLogEntry to ActivityEntry format
        // (ActivityLogEntry has numeric id, ActivityEntry expects string id)
        const activityEntries: ActivityEntry[] = entries.map((entry: ActivityLogEntry) => ({
          id: String(entry.id ?? ''),
          timeEntryId: entry.timeEntryId,
          appName: entry.appName,
          windowTitle: entry.windowTitle,
          timestamp: entry.timestamp,
        }))

        if (import.meta.env.DEV) {
          console.timeEnd('[Today/IPC] activity:get-log query')
          console.log(
            `[Today] electronBridge: Retrieved ${activityEntries.length} entries for timeEntryId: ${timeEntryId}`
          )
        }

        return { success: true, data: activityEntries }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to retrieve activity log'
        console.error('[Today] electronBridge: Error getting activity log', error)
        return { success: false, error: message }
      }
    },

    /**
     * Export activity log to file
     *
     * @param timeEntryId - The ID of the time entry
     * @param format - Export format ('json' or 'csv')
     * @returns Promise resolving to file path or error
     *
     * @example
     * ```typescript
     * const result = await electronBridge.activity.export('entry-123', 'csv');
     * if (result.success && result.data) {
     *   console.log(`Exported to: ${result.data.filePath}`);
     * }
     * ```
     */
    export: async (
      timeEntryId: string,
      format: 'json' | 'csv'
    ): Promise<IPCResponse<{ filePath: string }>> => {
      if (!isElectron()) {
        return { success: false, error: NOT_IN_ELECTRON_ERROR }
      }
      return window.electronAPI!.activity.export(timeEntryId, format)
    },

    /**
     * Get current activity (for testing/debugging)
     *
     * @returns Promise resolving to current activity snapshot or error
     *
     * @example
     * ```typescript
     * const result = await electronBridge.activity.getCurrent();
     * if (result.success && result.data) {
     *   console.log(`Active app: ${result.data.appName} - ${result.data.windowTitle}`);
     * }
     * ```
     */
    getCurrent: async (): Promise<IPCResponse<CurrentActivity>> => {
      if (!isElectron()) {
        return { success: false, error: NOT_IN_ELECTRON_ERROR }
      }
      return window.electronAPI!.activity.getCurrent()
    },
  },
}
