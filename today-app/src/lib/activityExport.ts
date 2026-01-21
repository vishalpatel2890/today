/**
 * Activity Export Utilities (Story 4.4)
 *
 * Pure functions for generating export content (JSON/CSV)
 * and sanitizing filenames. These are used by the UI for
 * testing and can also be used by the Electron main process.
 *
 * Source: notes/sprint-artifacts/4-4-activity-export-to-file.md
 */

/**
 * Activity entry interface for export
 */
export interface ActivityEntryForExport {
  id: string
  timeEntryId: string
  timestamp: string
  appName: string
  windowTitle: string
  durationMs: number
}

/**
 * Sanitize a string to be safe for use as a filename
 * Removes characters invalid on Windows/macOS/Linux: < > : " / \ | ? *
 *
 * @param name - The string to sanitize
 * @returns A filename-safe string
 *
 * AC4.4.4: Default filename includes task name (sanitized)
 */
export function sanitizeFilename(name: string): string {
  const sanitized = name.replace(/[<>:"/\\|?*]/g, '-').trim()
  // Return 'activity' if result is empty or only dashes
  return sanitized && !/^-+$/.test(sanitized) ? sanitized : 'activity'
}

/**
 * Escape a field for CSV output per RFC 4180
 * - If field contains comma, double-quote, or newline, wrap in quotes
 * - Double any existing double-quotes
 *
 * @param value - The field value to escape
 * @returns The escaped field value
 */
export function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Generate CSV content from activity entries
 * Headers: timestamp,app_name,window_title,duration_seconds
 *
 * @param entries - Activity entries with duration
 * @returns CSV content as string
 *
 * AC4.4.3: CSV with headers timestamp,app_name,window_title,duration_seconds
 */
export function generateCSV(entries: ActivityEntryForExport[]): string {
  const headers = 'timestamp,app_name,window_title,duration_seconds'
  const rows = entries.map((e) => {
    const escapedAppName = escapeCSVField(e.appName)
    const escapedTitle = escapeCSVField(e.windowTitle)
    const durationSeconds = Math.round(e.durationMs / 1000)
    return `${e.timestamp},${escapedAppName},${escapedTitle},${durationSeconds}`
  })
  return [headers, ...rows].join('\n')
}

/**
 * Generate JSON content from activity entries
 * Pretty-printed with 2-space indentation
 *
 * @param entries - Activity entries with duration
 * @returns JSON content as string
 *
 * AC4.4.2: JSON file saved with full activity array
 */
export function generateJSON(entries: ActivityEntryForExport[]): string {
  return JSON.stringify(entries, null, 2)
}

/**
 * Generate default filename for export
 *
 * @param taskName - The task name (will be sanitized)
 * @param format - Export format ('json' or 'csv')
 * @returns Default filename string
 *
 * AC4.4.4: Default filename includes task name and date
 */
export function generateDefaultFilename(taskName: string, format: 'json' | 'csv'): string {
  const sanitizedTaskName = sanitizeFilename(taskName)
  const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `activity-${sanitizedTaskName}-${dateStr}.${format}`
}
