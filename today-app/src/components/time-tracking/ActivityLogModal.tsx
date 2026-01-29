import { useState, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import X from 'lucide-react/dist/esm/icons/x'
import Activity from 'lucide-react/dist/esm/icons/activity'
import Download from 'lucide-react/dist/esm/icons/download'
import { format, parseISO } from 'date-fns'
import { useActivityLog } from '../../hooks/useActivityLog'
import { ActivityLogList } from './ActivityLogList'
import { ActivitySummary } from './ActivitySummary'
import { electronBridge } from '../../lib/electronBridge'
import { isElectron } from '../../lib/platform'
import { useToast } from '../../contexts/ToastContext'

/**
 * Props for ActivityLogModal component
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Component-Props
 */
export interface ActivityLogModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Time entry ID to fetch activity for */
  timeEntryId: string
  /** Task name to display in header */
  taskName: string
  /** Session start time (ISO 8601) */
  startTime: string
  /** Session end time (ISO 8601) */
  endTime: string
}

/**
 * Format the session date and time range for modal header
 *
 * @param startTime - ISO 8601 start timestamp
 * @param endTime - ISO 8601 end timestamp
 * @returns Formatted string: "Jan 18, 2026 \u2022 9:00 AM - 10:30 AM"
 */
function formatSessionRange(startTime: string, endTime: string): string {
  const start = parseISO(startTime)
  const end = parseISO(endTime)

  const dateStr = format(start, 'MMM d, yyyy')
  const startTimeStr = format(start, 'h:mm a')
  const endTimeStr = format(end, 'h:mm a')

  return `${dateStr} \u2022 ${startTimeStr} - ${endTimeStr}`
}

/**
 * ActivityLogModal - Modal for viewing activity log entries
 *
 * Displays a chronological list of apps/windows that were active
 * during a time tracking session. Shows task name and time range
 * in the header.
 *
 * Features:
 * - Loading spinner while fetching data (AC4.2.3)
 * - Chronological activity list with durations (AC4.2.4, AC4.2.5)
 * - Scrollable list for long sessions (AC4.2.6)
 * - Close via X, Escape, or backdrop click (AC4.2.7)
 * - Empty state when no activity recorded (AC4.2.9)
 * - Export to JSON/CSV with native file dialog (AC4.4.1-4.4.6) [Story 4.4]
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Task-2
 * Source: notes/architecture-electron-migration.md#Activity-Viewing
 * Source: notes/sprint-artifacts/4-4-activity-export-to-file.md [Story 4.4]
 */
export const ActivityLogModal = ({
  isOpen,
  onClose,
  timeEntryId,
  taskName,
  startTime,
  endTime,
}: ActivityLogModalProps) => {
  // Fetch activity entries with duration calculations and summary
  const { entries, summary, totalDurationFormatted, isLoading, error } = useActivityLog(timeEntryId, endTime)
  const { addToast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  // Format header subtitle
  const sessionRange = formatSessionRange(startTime, endTime)

  /**
   * Handle export to JSON or CSV (Story 4.4)
   * AC4.4.1: Opens native file save dialog
   * AC4.4.2/AC4.4.3: Saves JSON or CSV file
   * AC4.4.5: Shows success toast
   * AC4.4.6: Shows error toast on failure
   */
  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      if (entries.length === 0 || isExporting) return

      setIsExporting(true)
      try {
        const result = await electronBridge.activity.export({
          entries: entries.map((e) => ({
            id: e.id,
            timeEntryId: e.timeEntryId,
            timestamp: e.timestamp,
            appName: e.appName,
            windowTitle: e.windowTitle,
            durationMs: e.durationMs,
          })),
          format,
          taskName,
        })

        if (result.success) {
          addToast('Activity exported successfully', { type: 'success' })
        } else if (result.error !== 'Export cancelled') {
          // Don't show error toast for user cancellation
          addToast(result.error || 'Failed to export activity', { type: 'error' })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to export activity'
        addToast(message, { type: 'error' })
      } finally {
        setIsExporting(false)
      }
    },
    [entries, taskName, addToast, isExporting]
  )

  // Check if export is available (Electron only and has entries)
  const canExport = isElectron() && entries.length > 0 && !isLoading && !error

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-0 right-0 z-50 w-full rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[500px] lg:max-w-[600px] md:rounded-lg max-h-[80vh] overflow-hidden flex flex-col"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4 flex-shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="font-display text-lg font-semibold text-foreground truncate">
                  {taskName}
                </Dialog.Title>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sessionRange}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex-shrink-0 rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Error State */}
            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4">
                <p className="text-sm">Failed to load activity log: {error}</p>
              </div>
            )}

            {/* Loading State (AC4.2.3) */}
            {isLoading && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-blue-600" />
              </div>
            )}

            {/* Activity Content (Summary + List) */}
            {!isLoading && !error && (
              <>
                {/* Summary Section (AC4.3.1, AC4.3.2, AC4.3.3, AC4.3.4, AC4.3.6) */}
                <ActivitySummary
                  items={summary}
                  totalDurationFormatted={totalDurationFormatted}
                />

                {/* Visual separator between summary and list */}
                {summary.length > 0 && entries.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Activity Log
                    </h3>
                  </div>
                )}

                {/* Activity List (AC4.2.4, AC4.2.5, AC4.2.6, AC4.2.9) */}
                <ActivityLogList entries={entries} />
              </>
            )}
          </div>

          {/* Footer with Export Buttons (Story 4.4: AC4.4.1) */}
          {canExport && (
            <div className="flex-shrink-0 pt-4 mt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-surface-muted hover:bg-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Export as JSON"
                  >
                    <Download className="h-4 w-4" />
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-surface-muted hover:bg-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Export as CSV"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
