import { format, parseISO } from 'date-fns'
import type { ActivityEntryWithDuration } from '../../hooks/useActivityLog'

/**
 * Props for ActivityLogList component
 */
export interface ActivityLogListProps {
  /** Activity entries with calculated durations */
  entries: ActivityEntryWithDuration[]
}

/**
 * Format timestamp to time display
 *
 * @param timestamp - ISO 8601 timestamp
 * @returns Formatted time: "9:00:15 AM"
 */
function formatTime(timestamp: string): string {
  return format(parseISO(timestamp), 'h:mm:ss a')
}

/**
 * ActivityLogList - Chronological list of activity entries
 *
 * Displays activity entries in a scrollable list with:
 * - Time (HH:MM:SS AM/PM)
 * - App name
 * - Window title (truncated with tooltip)
 * - Duration
 *
 * Features:
 * - Chronological order (oldest first) (AC4.2.4)
 * - Each row shows time, app, window, duration (AC4.2.5)
 * - Scrollable for long lists (AC4.2.6)
 * - Empty state when no entries (AC4.2.9)
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Task-3
 */
export const ActivityLogList = ({ entries }: ActivityLogListProps) => {
  // Empty state (AC4.2.9)
  if (entries.length === 0) {
    return (
      <div className="bg-surface-muted rounded-lg p-8">
        <p className="text-sm text-muted-foreground text-center">
          No activity recorded for this session
        </p>
      </div>
    )
  }

  return (
    <div
      className="bg-surface-muted rounded-lg divide-y divide-border/50 max-h-[400px] overflow-y-auto"
      role="list"
      aria-label="Activity log entries"
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          role="listitem"
          className="px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          {/* Top row: Time and Duration */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(entry.timestamp)}
            </span>
            <span className="text-xs font-medium text-foreground tabular-nums">
              {entry.durationFormatted}
            </span>
          </div>

          {/* Bottom row: App name and Window title */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-foreground flex-shrink-0">
              {entry.appName}
            </span>
            <span
              className="text-sm text-muted-foreground truncate"
              title={entry.windowTitle}
            >
              {entry.windowTitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
