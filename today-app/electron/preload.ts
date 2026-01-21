/**
 * Electron Preload Script
 *
 * Exposes a safe, typed API to the renderer process via contextBridge.
 * This is the only way the React app can communicate with the main process.
 *
 * Security: contextIsolation is enabled, nodeIntegration is disabled.
 * Per ADR-007: Never expose ipcRenderer directly - only expose specific methods.
 */

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from './ipc/channels'

/**
 * Expose electronAPI to renderer process
 *
 * All methods use ipcRenderer.invoke() for async request-response pattern.
 * Channel names are imported from constants to ensure type safety.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  activity: {
    /**
     * Start activity tracking for a time entry
     * @param timeEntryId - The ID of the time entry to track
     */
    start: (timeEntryId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_START, timeEntryId),

    /**
     * Stop activity tracking
     */
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_STOP),

    /**
     * Get activity log for a time entry
     * @param timeEntryId - The ID of the time entry
     */
    getLog: (timeEntryId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_GET_LOG, timeEntryId),

    /**
     * Export activity log to file (Story 4.4)
     * @param request - Export request with entries, format, and taskName
     * @param request.entries - Activity entries to export (from renderer's IndexedDB query)
     * @param request.format - Export format ('json' or 'csv')
     * @param request.taskName - Task name for default filename
     */
    export: (request: {
      entries: Array<{
        id: string
        timeEntryId: string
        timestamp: string
        appName: string
        windowTitle: string
        durationMs: number
      }>
      format: 'json' | 'csv'
      taskName: string
    }) => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_EXPORT, request),

    /**
     * Get current activity (for testing/debugging)
     * Returns the currently active app and window title
     */
    getCurrent: () => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_GET_CURRENT),
  },
})
