import { X } from 'lucide-react'

export interface FilterChipProps {
  /** Display text for the filter (e.g., "Dec 1 - Dec 15") */
  label: string
  /** Callback when the remove button is clicked */
  onRemove: () => void
}

/**
 * FilterChip - Removable filter indicator chip
 *
 * Displays active filters as styled chips with a remove button.
 * Used below the filter controls in TimeInsightsModal.
 *
 * Styling:
 * - Primary background with white text
 * - Rounded-full for pill shape
 * - Small X button for removal
 *
 * Source: notes/ux-design-time-tracking.md#6.1 FilterChip
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
 */
export const FilterChip = ({ label, onRemove }: FilterChipProps) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-600 text-white text-sm px-3 py-1">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-slate-500 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
