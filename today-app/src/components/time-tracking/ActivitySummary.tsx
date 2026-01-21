import type { ActivitySummaryItem } from '../../hooks/useActivityLog'

/**
 * Props for ActivitySummary component
 *
 * Source: notes/sprint-artifacts/4-3-activity-duration-summary.context.xml#interfaces
 */
export interface ActivitySummaryProps {
  /** Per-app summary items, sorted by duration descending */
  items: ActivitySummaryItem[]
  /** Total duration formatted (e.g., "2h 15m") */
  totalDurationFormatted: string
}

/**
 * ActivitySummary - Visual breakdown of time spent per application
 *
 * Displays a summary section above the chronological activity list with:
 * - App name
 * - Total duration for that app
 * - Percentage of session time
 * - Visual progress bar
 *
 * Features:
 * - Apps sorted by duration (most time first) (AC4.3.2)
 * - Each row shows app name, duration, percentage (AC4.3.3)
 * - Progress bars show relative percentages (AC4.3.4)
 * - Human-readable duration format (AC4.3.6)
 * - Returns null when no items (hides section)
 *
 * Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Task-2
 * Source: notes/sprint-artifacts/tech-spec-epic-4-electron.md#AC3
 */
export const ActivitySummary = ({ items, totalDurationFormatted }: ActivitySummaryProps) => {
  // Hide section when no items (AC4.3.1 - only display if there's data)
  if (items.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      {/* Section header with total duration */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Time by App
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: {totalDurationFormatted}
        </span>
      </div>

      {/* Summary items */}
      <div
        className="bg-surface-muted rounded-lg divide-y divide-border/50"
        role="list"
        aria-label="Time spent per application"
      >
        {items.map((item) => (
          <div
            key={item.appName}
            role="listitem"
            className="px-4 py-3"
          >
            {/* Top row: App name, duration, percentage */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">
                {item.appName}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-foreground tabular-nums">
                  {item.totalDurationFormatted}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Progress bar (AC4.3.4) */}
            <div
              className="h-2 bg-border/30 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.appName}: ${item.percentage}%`}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
