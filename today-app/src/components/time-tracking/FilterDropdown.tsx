import * as Select from '@radix-ui/react-select'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import Check from 'lucide-react/dist/esm/icons/check'

/**
 * Option for filter dropdowns
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.3
 */
export interface FilterOption {
  value: string
  label: string
}

export interface FilterDropdownProps {
  /** Display label for the dropdown (e.g., "Tasks", "Category") */
  label: string
  /** Placeholder text when no option selected (e.g., "All tasks", "All") */
  placeholder: string
  /** Available options to select from */
  options: FilterOption[]
  /** Currently selected value, or null if showing placeholder */
  selectedValue: string | null
  /** Callback when an option is selected. Receives null when placeholder/clear option selected */
  onSelect: (value: string | null) => void
}

/**
 * FilterDropdown - Dropdown component for filtering insights by task or category
 *
 * Uses Radix Select for accessible dropdown behavior.
 * Styled per UX spec with slate colors and ChevronDown icon.
 *
 * Features:
 * - Keyboard accessible (Tab, Arrow keys, Enter, Escape)
 * - Shows placeholder when no selection
 * - "All" option clears the filter (returns null)
 * - Active state: border highlights, primary color text
 *
 * Source: notes/ux-design-time-tracking.md#6.1 FilterDropdown
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.3
 */
// Special value for "All" / clear option (Radix Select doesn't allow empty string)
const ALL_VALUE = '__all__'

export const FilterDropdown = ({
  label,
  placeholder,
  options,
  selectedValue,
  onSelect,
}: FilterDropdownProps) => {
  // Find selected option label for display
  const selectedOption = options.find((opt) => opt.value === selectedValue)
  const displayText = selectedOption?.label ?? placeholder
  const hasSelection = selectedValue !== null

  /**
   * Handle value change from Radix Select
   * "__all__" represents the "All" / clear option
   */
  const handleValueChange = (value: string) => {
    if (value === ALL_VALUE) {
      onSelect(null)
    } else {
      onSelect(value)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select.Root value={selectedValue ?? ALL_VALUE} onValueChange={handleValueChange}>
        <Select.Trigger
          className={`
            inline-flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm
            border transition-colors min-w-[140px]
            focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
            ${
              hasSelection
                ? 'border-slate-400 text-slate-700 bg-slate-50'
                : 'border-slate-300 text-slate-600 bg-white hover:border-slate-400'
            }
          `}
          aria-label={`${label} filter`}
        >
          <Select.Value placeholder={placeholder}>
            <span className={hasSelection ? 'font-medium' : ''}>{displayText}</span>
          </Select.Value>
          <Select.Icon>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="overflow-hidden rounded-md bg-white shadow-lg border border-slate-200 z-50"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {/* "All" option to clear the filter */}
              <Select.Item
                value={ALL_VALUE}
                className="
                  relative flex items-center rounded px-8 py-2 text-sm text-slate-600
                  cursor-pointer select-none
                  data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900
                  data-[highlighted]:outline-none
                "
              >
                <Select.ItemText>{placeholder}</Select.ItemText>
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>

              {/* Separator if there are options */}
              {options.length > 0 && (
                <Select.Separator className="h-px bg-slate-200 my-1" />
              )}

              {/* Dynamic options */}
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="
                    relative flex items-center rounded px-8 py-2 text-sm text-slate-600
                    cursor-pointer select-none
                    data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900
                    data-[highlighted]:outline-none
                  "
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
