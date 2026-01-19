/**
 * IPC Handlers for Main Process
 *
 * Registers IPC handlers for activity tracking functionality.
 * Story 2.2 established stubs, Story 3.1+ implements actual functionality.
 *
 * Per ADR-007: All IPC methods return IPCResponse shape { success, data?, error? }
 */

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from './channels'
import { getCurrentActivity, startTracking, stopTracking } from '../activity/tracker'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Log IPC calls in development mode
 */
function logIPC(channel: string, args?: unknown): void {
  if (isDev) {
    console.log(`[Electron/IPC] ${channel}`, args ?? '')
  }
}

/**
 * Register all IPC handlers
 * Call this before creating BrowserWindow in main process
 */
export function registerIpcHandlers(): void {
  // Activity: Start tracking (Story 3.2)
  ipcMain.handle(IPC_CHANNELS.ACTIVITY_START, async (_event, timeEntryId: string) => {
    logIPC(IPC_CHANNELS.ACTIVITY_START, { timeEntryId })
    return await startTracking(timeEntryId)
  })

  // Activity: Stop tracking (Story 3.2)
  ipcMain.handle(IPC_CHANNELS.ACTIVITY_STOP, async () => {
    logIPC(IPC_CHANNELS.ACTIVITY_STOP)
    return await stopTracking()
  })

  // Activity: Get log for time entry
  ipcMain.handle(IPC_CHANNELS.ACTIVITY_GET_LOG, async (_event, timeEntryId: string) => {
    logIPC(IPC_CHANNELS.ACTIVITY_GET_LOG, { timeEntryId })
    // Stub implementation - returns empty array
    return { success: true, data: [] }
  })

  // Activity: Export log to file
  ipcMain.handle(
    IPC_CHANNELS.ACTIVITY_EXPORT,
    async (_event, timeEntryId: string, format: 'json' | 'csv') => {
      logIPC(IPC_CHANNELS.ACTIVITY_EXPORT, { timeEntryId, format })
      // Stub implementation - returns empty file path
      return { success: true, data: { filePath: '' } }
    }
  )

  // Activity: Get current activity (Story 3.1 - for testing/debugging)
  ipcMain.handle(IPC_CHANNELS.ACTIVITY_GET_CURRENT, async () => {
    logIPC(IPC_CHANNELS.ACTIVITY_GET_CURRENT)
    try {
      const activity = await getCurrentActivity()
      if (activity) {
        return { success: true, data: activity }
      } else {
        return { success: false, error: 'No activity detected (no focused window or unsupported platform)' }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  if (isDev) {
    console.log('[Electron/IPC] All handlers registered')
  }
}
