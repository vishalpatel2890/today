/**
 * IPC Handlers for Main Process
 *
 * Registers IPC handlers for activity tracking functionality.
 * Story 2.2 established stubs, Story 3.1+ implements actual functionality.
 * Story 4.4: Added activity export handler with file dialog and CSV/JSON generation.
 *
 * Per ADR-007: All IPC methods return IPCResponse shape { success, data?, error? }
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'
import { IPC_CHANNELS } from './channels'
import { getCurrentActivity, startTracking, stopTracking } from '../activity/tracker'
import {
  ActivityEntryForExport,
  generateCSV,
  generateJSON,
  generateDefaultFilename,
} from '../../src/lib/activityExport'

/**
 * Export request payload from renderer
 */
interface ExportRequest {
  entries: ActivityEntryForExport[]
  format: 'json' | 'csv'
  taskName: string
}

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

  // Activity: Export log to file (Story 4.4)
  // Receives activity entries from renderer (since IndexedDB is in renderer process)
  // Shows native file dialog and writes JSON or CSV file
  ipcMain.handle(
    IPC_CHANNELS.ACTIVITY_EXPORT,
    async (event, request: ExportRequest) => {
      const { entries, format, taskName } = request
      logIPC(IPC_CHANNELS.ACTIVITY_EXPORT, { entriesCount: entries.length, format, taskName })

      try {
        // Generate default filename with sanitized task name and today's date
        const defaultFilename = generateDefaultFilename(taskName, format)

        // Get the BrowserWindow that sent this IPC message
        const win = BrowserWindow.fromWebContents(event.sender)

        // Show native save dialog
        const result = await dialog.showSaveDialog(win ?? undefined, {
          defaultPath: defaultFilename,
          filters:
            format === 'json'
              ? [{ name: 'JSON Files', extensions: ['json'] }]
              : [{ name: 'CSV Files', extensions: ['csv'] }],
        })

        // User cancelled the dialog
        if (result.canceled || !result.filePath) {
          return { success: false, error: 'Export cancelled' }
        }

        // Generate file content based on format
        const content = format === 'json' ? generateJSON(entries) : generateCSV(entries)

        // Write to file
        await writeFile(result.filePath, content, 'utf-8')

        if (isDev) {
          console.log(`[Electron/Activity] Exported ${entries.length} entries to ${result.filePath}`)
        }

        return { success: true, data: { filePath: result.filePath } }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to export activity log'
        console.error('[Electron/Activity] Export error:', error)
        return { success: false, error: message }
      }
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
