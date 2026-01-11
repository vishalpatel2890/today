import type { TimeEntry } from '../../types/timeTracking'
import { formatRelativeTimestamp, formatDurationSummary } from '../../lib/timeFormatters'

interface InsightRowProps {
  /** Time entry to display */
  entry: TimeEntry
}

/**
 * InsightRow - Individual time entry row for Recent Entries list
 *
 * Displays a single time entry with:
 * - Relative timestamp (left): "Today 2:30pm", "Yesterday 11:00am", etc.
 * - Task name (center): Truncated with ellipsis if too long
 * - Duration (right): "1h 23m" or "42m"
 *
 * Features:
 * - Subtle hover state (light background highlight)
 * - Accessible with role="listitem" and aria-label
 * - Typography per UX spec: 13px timestamp, 15px task name, 14px duration
 *
 * Source: notes/ux-design-time-tracking.md#6.1 InsightRow
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#AC5.2, AC5.6
 */
export const InsightRow = ({ entry }: InsightRowProps) => {
  const timestamp = formatRelativeTimestamp(entry.start_time)
  const duration = formatDurationSummary(entry.duration)

  return (
    <div
      role="listitem"
      aria-label={`${entry.task_name}: ${duration} on ${timestamp}`}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
    >
      {/* Relative timestamp (left) */}
      <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[90px]">
        {timestamp}
      </span>

      {/* Task name (center, truncated) */}
      <span className="text-sm text-foreground truncate mx-3 flex-1 min-w-0">
        {entry.task_name}
      </span>

      {/* Duration (right) */}
      <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
        {duration}
      </span>
    </div>
  )
}
