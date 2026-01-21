import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import * as Popover from '@radix-ui/react-popover'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import Check from 'lucide-react/dist/esm/icons/check'
import Search from 'lucide-react/dist/esm/icons/search'
import Minus from 'lucide-react/dist/esm/icons/minus'
import type { FilterOption } from './FilterDropdown'

/**
 * Props for MultiSelectTaskFilter component
 * Story 1.1: Task Search in Filter Dropdown
 * Story 1.2: Multi-Select Tasks
 * Story 1.3: Select All in View
 *
 * Source: notes/sprint-artifacts/tech-spec-task-filter-enhancements.md
 */
export interface MultiSelectTaskFilterProps {
  /** Display label above the dropdown */
  label: string
  /** Placeholder when no tasks selected */
  placeholder: string
  /** Available task options (derived from time entries) */
  options: FilterOption[]
  /** Currently selected task IDs (multi-select) - Story 1.2 */
  selectedValues: string[]
  /** Callback when selection changes - Story 1.2 */
  onSelectionChange: (values: string[]) => void
}

/**
 * MultiSelectTaskFilter - Task filter dropdown with search and multi-select capability
 *
 * Story 1.1: Implements searchable task filter dropdown using Radix Popover.
 * Story 1.2: Supports multiple task selection with checkboxes.
 * Story 1.3: Select All in View functionality.
 *
 * Features (Story 1.1):
 * - Search input with as-you-type filtering (AC-1.1.1, AC-1.1.2)
 * - "No tasks match" message when filter returns empty (AC-1.1.3)
 * - Search clears when dropdown closes (AC-1.1.4)
 * - Auto-focus search input on open (AC-1.1.5)
 * - Keyboard Escape to close (AC-1.1.6)
 *
 * Features (Story 1.2):
 * - Checkbox-based multi-select (AC-1.2.1)
 * - Selections persist when dropdown closes (AC-1.2.2)
 * - Trigger shows count ("3 tasks") or single task name (AC-1.2.5, AC-1.2.6)
 * - Selections persist across search filtering (AC-1.2.8)
 *
 * Features (Story 1.3):
 * - Select All checkbox at top of task list (AC-1.3.1)
 * - Shows count "Select All (X visible)" (AC-1.3.2)
 * - Toggle behavior: select all visible / deselect all visible (AC-1.3.3, AC-1.3.4)
 * - Preserves selections outside current search view (AC-1.3.5)
 * - Disabled when no visible tasks (AC-1.3.6)
 * - Checkbox states: checked/indeterminate/unchecked (AC-1.3.8)
 *
 * Source: notes/sprint-artifacts/story-task-filter-enhancements-1.md
 * Source: notes/sprint-artifacts/story-task-filter-enhancements-2.md
 * Source: notes/sprint-artifacts/story-task-filter-enhancements-3.md
 */
export const MultiSelectTaskFilter = ({
  label,
  placeholder,
  options,
  selectedValues,
  onSelectionChange,
}: MultiSelectTaskFilterProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Convert selectedValues to Set for efficient lookup (Story 1.2)
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues])

  // Filter tasks based on search query (case-insensitive substring match)
  // Pattern from TaskSelector.tsx:44-47
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Determine display text for trigger (AC-1.2.5, AC-1.2.6, AC-1.2.9)
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder // AC-1.2.9: "All tasks" placeholder
    }
    if (selectedValues.length === 1) {
      // AC-1.2.6: Show task name when exactly one selected
      const selectedOption = options.find((opt) => opt.value === selectedValues[0])
      return selectedOption?.label ?? placeholder
    }
    // AC-1.2.5: Show "X tasks" when multiple selected
    return `${selectedValues.length} tasks`
  }, [selectedValues, options, placeholder])

  const hasSelection = selectedValues.length > 0

  // Auto-focus search input when popover opens (AC-1.1.5)
  // Pattern from TaskSelector.tsx:66-70
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure popover animation completes
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Clear search when popover closes (AC-1.1.4)
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  /**
   * Toggle task selection (Story 1.2)
   * Adds or removes task from selection without closing dropdown (AC-1.2.2)
   */
  const toggleSelection = useCallback((value: string) => {
    const newSelectedValues = selectedSet.has(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onSelectionChange(newSelectedValues)
  }, [selectedSet, selectedValues, onSelectionChange])

  /**
   * Clear all selections (AC-1.2.7)
   * Called when user clicks "All tasks" option
   */
  const clearAllSelections = useCallback(() => {
    onSelectionChange([])
    setIsOpen(false)
    setSearchQuery('')
    triggerRef.current?.focus()
  }, [onSelectionChange])

  /**
   * Handle keyboard events (AC-1.1.6)
   * Pattern from TaskSelector.tsx:91-125
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setSearchQuery('')
      triggerRef.current?.focus()
    }
  }, [])

  // Check for empty results
  const hasNoResults = filteredOptions.length === 0 && searchQuery.length > 0

  // Story 1.3: Select All state calculations (AC-1.3.2, AC-1.3.8)
  const visibleTaskIds = useMemo(
    () => filteredOptions.map((t) => t.value),
    [filteredOptions]
  )

  const visibleCount = visibleTaskIds.length

  // Count how many visible tasks are currently selected (AC-1.3.8)
  const selectedVisibleCount = useMemo(
    () => visibleTaskIds.filter((id) => selectedSet.has(id)).length,
    [visibleTaskIds, selectedSet]
  )

  // Determine checkbox state: all/some/none visible selected (AC-1.3.8)
  const allVisibleSelected = visibleCount > 0 && selectedVisibleCount === visibleCount
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

  // aria-checked value for tri-state checkbox
  const selectAllAriaChecked: 'true' | 'false' | 'mixed' = allVisibleSelected
    ? 'true'
    : someVisibleSelected
    ? 'mixed'
    : 'false'

  /**
   * Toggle Select All for visible tasks (Story 1.3)
   * AC-1.3.3: Select all visible when not all selected
   * AC-1.3.4: Deselect all visible when all selected (toggle)
   * AC-1.3.5: Preserves selections outside current view
   */
  const handleSelectAllClick = useCallback(() => {
    if (visibleCount === 0) return // AC-1.3.6: Disabled when no visible tasks

    if (allVisibleSelected) {
      // AC-1.3.4: Deselect all visible tasks
      const newSelection = selectedValues.filter((id) => !visibleTaskIds.includes(id))
      onSelectionChange(newSelection)
    } else {
      // AC-1.3.3: Select all visible tasks (add to existing)
      const newSelection = [...new Set([...selectedValues, ...visibleTaskIds])]
      onSelectionChange(newSelection)
    }
  }, [visibleCount, allVisibleSelected, selectedValues, visibleTaskIds, onSelectionChange])

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
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
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className={hasSelection ? 'font-medium' : ''}>{displayText}</span>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="w-[var(--radix-popover-trigger-width)] min-w-[200px] bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden z-50"
            sideOffset={4}
            align="start"
            onKeyDown={handleKeyDown}
          >
            {/* Search input (AC-1.1.1) */}
            <div className="p-2 border-b border-slate-200">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                  aria-label="Search tasks"
                />
              </div>
            </div>

            {/* Task list with multi-select checkboxes (Story 1.2) */}
            <div
              role="listbox"
              aria-label="Tasks"
              aria-multiselectable="true"
              className="max-h-48 overflow-y-auto"
            >
              {/* "All tasks" option to clear all selections (AC-1.2.7) */}
              <div
                role="option"
                aria-selected={!hasSelection}
                onClick={clearAllSelections}
                className={`
                  flex items-center justify-between px-3 py-2 cursor-pointer text-sm
                  hover:bg-slate-100
                  ${!hasSelection ? 'text-slate-900 font-medium' : 'text-slate-600'}
                `}
              >
                <span>{placeholder}</span>
                {!hasSelection && (
                  <Check className="h-4 w-4 text-slate-600" aria-hidden="true" />
                )}
              </div>

              {/* Separator */}
              {options.length > 0 && (
                <div className="h-px bg-slate-200 my-1" />
              )}

              {/* Select All row (Story 1.3 - AC-1.3.1, AC-1.3.2) */}
              {options.length > 0 && (
                <div className="px-3 py-2 border-b border-slate-200">
                  <label
                    className={`flex items-center gap-2 cursor-pointer ${
                      visibleCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Tri-state checkbox (AC-1.3.8) */}
                    <div
                      role="checkbox"
                      aria-checked={selectAllAriaChecked}
                      aria-disabled={visibleCount === 0}
                      aria-label={`Select All (${visibleCount} visible)`}
                      onClick={visibleCount > 0 ? handleSelectAllClick : undefined}
                      className={`
                        w-4 h-4 border rounded flex items-center justify-center flex-shrink-0
                        ${allVisibleSelected ? 'bg-slate-600 border-slate-600' : ''}
                        ${someVisibleSelected ? 'bg-slate-400 border-slate-400' : ''}
                        ${!allVisibleSelected && !someVisibleSelected ? 'border-slate-300' : ''}
                      `}
                    >
                      {allVisibleSelected && <Check className="w-3 h-3 text-white" />}
                      {someVisibleSelected && <Minus className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`text-sm ${
                        visibleCount === 0 ? 'text-slate-400' : 'text-slate-600'
                      }`}
                      onClick={visibleCount > 0 ? handleSelectAllClick : undefined}
                    >
                      Select All ({visibleCount} visible)
                    </span>
                  </label>
                </div>
              )}

              {/* No results message (AC-1.1.3) */}
              {hasNoResults ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  No tasks match "{searchQuery}"
                </div>
              ) : (
                /* Filtered task options with checkboxes (AC-1.2.1, AC-1.1.2) */
                filteredOptions.map((option) => {
                  const isSelected = selectedSet.has(option.value)
                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleSelection(option.value)}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-slate-100"
                    >
                      {/* Checkbox visual (AC-1.2.1) */}
                      <div
                        className={`
                          w-4 h-4 border rounded flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-slate-600 border-slate-600' : 'border-slate-300'}
                        `}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`truncate ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {option.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
