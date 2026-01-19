import type { DatePreset } from '../../types/timeTracking'

interface QuickFilterBarProps {
  /** Currently active date preset */
  activePreset: DatePreset
  /** Callback when a preset is selected or deselected */
  onPresetSelect: (preset: DatePreset) => void
  /** Whether a custom date range is currently active */
  hasCustomRange?: boolean
  /** Formatted label for the custom range (e.g., "Dec 1 - Dec 15") */
  customRangeLabel?: string | null
  /** Callback when the Custom button is clicked */
  onCustomClick?: () => void
}

/** Preset button configuration */
interface PresetConfig {
  value: Exclude<DatePreset, null>
  label: string
}

const PRESETS: PresetConfig[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

/**
 * QuickFilterBar - Row of date preset filter pills
 *
 * Displays preset date filter buttons for the Insights modal.
 * Only one preset can be active at a time. Clicking an active
 * preset deselects it (toggle behavior).
 *
 * Pills:
 * - Today, Yesterday, This Week, This Month, Custom
 * - Default: gray outline, muted text
 * - Active: filled primary background, white text
 *
 * Source: notes/ux-design-time-tracking.md#6.1 QuickFilterBar
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.1
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
 */
export const QuickFilterBar = ({
  activePreset,
  onPresetSelect,
  hasCustomRange = false,
  customRangeLabel = null,
  onCustomClick,
}: QuickFilterBarProps) => {
  /**
   * Handle pill click with toggle behavior
   * If clicking the active preset, deselect it (set to null)
   * Otherwise, select the clicked preset
   */
  const handlePresetClick = (preset: Exclude<DatePreset, null>) => {
    if (activePreset === preset) {
      // Deselect current preset
      onPresetSelect(null)
    } else {
      // Select new preset
      onPresetSelect(preset)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Date filter"
      className="flex flex-wrap lg:flex-nowrap gap-2 mb-4"
    >
      {PRESETS.map(({ value, label }) => {
        const isActive = activePreset === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => handlePresetClick(value)}
            className={`
              rounded-full px-3 py-1 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
              ${
                isActive
                  ? 'bg-slate-600 text-white'
                  : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
              }
            `}
          >
            {label}
          </button>
        )
      })}
      {/* Custom button - Story 3.2 */}
      <button
        type="button"
        role="radio"
        aria-checked={hasCustomRange}
        onClick={onCustomClick}
        className={`
          rounded-full px-3 py-1 text-sm font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
          ${
            hasCustomRange
              ? 'bg-slate-600 text-white'
              : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
          }
        `}
      >
        {hasCustomRange && customRangeLabel ? customRangeLabel : 'Custom'}
      </button>
    </div>
  )
}
