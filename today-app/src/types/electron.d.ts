/**
 * Electron API type definitions
 *
 * These types define the window.electronAPI object exposed by the
 * Electron preload script via contextBridge.
 *
 * Per ADR-007: contextIsolation is enabled, nodeIntegration is disabled.
 * All Electron functionality is accessed through this typed API.
 */

/**
 * Standard IPC response format for all Electron API calls
 */
export interface IPCResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Activity tracking entry recorded during time tracking sessions
 */
export interface ActivityEntry {
  id: string
  timeEntryId: string
  timestamp: string
  appName: string
  windowTitle: string
}

/**
 * Activity entry with duration for export (Story 4.4)
 * Includes durationMs calculated by renderer
 */
export interface ActivityEntryForExport extends ActivityEntry {
  durationMs: number
}

/**
 * Export request payload for activity:export IPC (Story 4.4)
 */
export interface ActivityExportRequest {
  entries: ActivityEntryForExport[]
  format: 'json' | 'csv'
  taskName: string
}

/**
 * Current activity snapshot (for getCurrent)
 */
export interface CurrentActivity {
  appName: string
  windowTitle: string
  timestamp: string
}

/**
 * Response from activity:stop including captured entries for persistence
 * Story 3.3: entries array is used by renderer to save to IndexedDB
 */
export interface ActivityStopResponse {
  entriesRecorded: number
  entries: ActivityEntry[]
}

/**
 * Activity tracking API exposed by Electron
 * Methods are stubs in Story 2.1, implemented in Story 2.2+
 */
export interface ElectronActivityAPI {
  start: (timeEntryId: string) => Promise<IPCResponse>
  /** Stop tracking and return captured entries for persistence (Story 3.3) */
  stop: () => Promise<IPCResponse<ActivityStopResponse>>
  getLog: (timeEntryId: string) => Promise<IPCResponse<ActivityEntry[]>>
  /** Export activity entries to file (Story 4.4) - entries passed from renderer since main can't access IndexedDB */
  export: (request: ActivityExportRequest) => Promise<IPCResponse<{ filePath: string }>>
  getCurrent: () => Promise<IPCResponse<CurrentActivity>>
}

/**
 * Main Electron API interface exposed on window object
 */
export interface ElectronAPI {
  activity: ElectronActivityAPI
}

/**
 * Global window augmentation to include electronAPI
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
