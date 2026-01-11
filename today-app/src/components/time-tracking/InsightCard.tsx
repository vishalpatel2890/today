/**
 * InsightCard - Summary metric card for Time Insights modal
 *
 * Displays a single metric with label, value, and sublabel.
 * Used for TODAY and AVG / DAY summary cards.
 *
 * Source: notes/ux-design-time-tracking.md#6.1 InsightCard
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#AC3
 */

interface InsightCardProps {
  /** Card label (e.g., "TODAY", "AVG / DAY") */
  label: string
  /** Main value (e.g., "3h 42m") */
  value: string
  /** Sublabel below value (e.g., "tracked", "this week") */
  sublabel: string
  /** Optional loading state */
  isLoading?: boolean
}

export const InsightCard = ({ label, value, sublabel, isLoading = false }: InsightCardProps) => {
  return (
    <div
      className="bg-surface-muted rounded-lg p-4 shadow-sm"
      role="region"
      aria-label={`${label}: ${value} ${sublabel}`}
    >
      {/* Label */}
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>

      {/* Value */}
      {isLoading ? (
        <div className="h-8 w-20 bg-border/50 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
      )}

      {/* Sublabel */}
      <p className="text-xs text-muted-foreground mt-0.5">
        {sublabel}
      </p>
    </div>
  )
}
