import { useState, useMemo, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTimeInsights } from '../../hooks/useTimeInsights'
import { useTimeEntries } from '../../hooks/useTimeEntries'
import { InsightCard } from './InsightCard'
import { InsightRow } from './InsightRow'
import { QuickFilterBar } from './QuickFilterBar'
import { DateRangePicker } from './DateRangePicker'
import { FilterChip } from './FilterChip'
import { FilterDropdown, type FilterOption } from './FilterDropdown'
import { MultiSelectTaskFilter } from './MultiSelectTaskFilter'
import { EditTimeEntryModal } from './EditTimeEntryModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { formatDurationSummary, formatDateRange } from '../../lib/timeFormatters'
import type { DatePreset, DateRange, TimeEntry } from '../../types/timeTracking'
import type { Task } from '../../types'

interface TimeInsightsModalProps {
  isOpen: boolean
  onClose: () => void
  /** Current user's ID for data isolation - required */
  userId: string | null
  /** All tasks for deriving filter options - Story 3.3 */
  tasks?: Task[]
}

/**
 * Time Insights Modal - Stories 2.1, 2.2, 2.3, 6.1
 *
 * Larger modal (550px width) for viewing time tracking insights.
 * Opened via double-tap Cmd+Shift+T T keyboard shortcut.
 *
 * Features:
 * - 550px width (desktop), full-width minus padding (mobile)
 * - Max-height 80vh with scrollable content
 * - Title "Time Insights" with close button
 * - TOTAL, TODAY, and AVG / DAY summary cards (3-column grid)
 * - Task breakdown section for today
 * - Recent entries section with relative timestamps
 *
 * Source: notes/ux-design-time-tracking.md#4.2 Modal Sizing
 * Source: notes/ux-design-time-tracking.md#2.3 Insights Modal Structure
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#AC3, AC4, AC5
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.1
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.3
 */
export const TimeInsightsModal = ({ isOpen, onClose, userId, tasks = [] }: TimeInsightsModalProps) => {
  // Date filter state - resets on modal unmount (React default behavior)
  // Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#AC-3.1.9
  const [datePreset, setDatePreset] = useState<DatePreset>(null)

  // Custom date range state - Story 3.2
  // Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Task and category filter state - Story 3.3, Story 1.2 (multi-select)
  // Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.3
  // Source: notes/sprint-artifacts/story-task-filter-enhancements-2.md
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [category, setCategory] = useState<string | null>(null)

  // Edit/Delete modal state - Swipe Actions Story 1.1
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null)
  const [revealedRowId, setRevealedRowId] = useState<string | null>(null)

  // Build task categories lookup map (taskId -> category)
  const taskCategories = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const task of tasks) {
      map.set(task.id, task.category)
    }
    return map
  }, [tasks])

  // Time entries hook for update/delete operations
  const { updateEntry, deleteEntry: deleteEntryFn, syncEntries } = useTimeEntries()

  // Pass filters to insights hook (including task/category filters)
  // Story 1.2: Use taskIds array for multi-select
  // Data isolation: userId is required to prevent seeing other users' entries
  const { insights, isLoading, error, entries, removeEntry, updateEntryLocal } = useTimeInsights(userId, {
    datePreset,
    customRange,
    taskIds: selectedTaskIds.length > 0 ? selectedTaskIds : null,
    category,
    taskCategories,
  })

  // Derive task filter options from time entries (AC-3.3.2)
  // Only show tasks that have time entries, not all tasks
  const taskOptions = useMemo<FilterOption[]>(() => {
    const taskMap = new Map<string, string>()
    for (const entry of entries) {
      if (entry.task_id && !taskMap.has(entry.task_id)) {
        taskMap.set(entry.task_id, entry.task_name)
      }
    }
    return Array.from(taskMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [entries])

  // Derive category filter options from tasks that have time entries (AC-3.3.4)
  const categoryOptions = useMemo<FilterOption[]>(() => {
    const taskIdsWithEntries = new Set(entries.map((e) => e.task_id).filter(Boolean))
    const categorySet = new Set<string>()
    for (const task of tasks) {
      if (taskIdsWithEntries.has(task.id) && task.category) {
        categorySet.add(task.category)
      }
    }
    return Array.from(categorySet)
      .map((cat) => ({ value: cat, label: cat }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [entries, tasks])

  // Get selected task label for FilterChip display (Story 1.2 - AC-1.2.5, AC-1.2.6)
  const selectedTaskLabel = useMemo(() => {
    if (selectedTaskIds.length === 0) return null
    if (selectedTaskIds.length === 1) {
      // AC-1.2.6: Show task name when exactly one selected
      const option = taskOptions.find((opt) => opt.value === selectedTaskIds[0])
      return option?.label ?? null
    }
    // AC-1.2.5: Show "X tasks" when multiple selected
    return `${selectedTaskIds.length} tasks`
  }, [selectedTaskIds, taskOptions])

  /**
   * Handle preset selection - clears custom range (AC-3.2.7)
   */
  const handlePresetSelect = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset !== null) {
      setCustomRange(null) // Preset replaces custom range
    }
  }

  /**
   * Handle custom range selection - clears preset (AC-3.2.6)
   */
  const handleCustomRangeSelect = (range: DateRange) => {
    setCustomRange(range)
    setDatePreset(null) // Custom range clears preset
    setIsDatePickerOpen(false)
  }

  /**
   * Handle custom button click - opens date picker
   */
  const handleCustomClick = () => {
    setIsDatePickerOpen(true)
  }

  /**
   * Handle removing custom range filter
   */
  const handleRemoveCustomRange = () => {
    setCustomRange(null)
  }

  /**
   * Handle task selection change (Story 1.2 - multi-select)
   */
  const handleTaskSelectionChange = (values: string[]) => {
    setSelectedTaskIds(values)
  }

  /**
   * Handle category selection (AC-3.3.5, AC-3.3.7)
   */
  const handleCategorySelect = (value: string | null) => {
    setCategory(value)
  }

  /**
   * Handle removing task filter via chip (AC-1.2.7)
   * Clears all task selections
   */
  const handleRemoveTaskFilter = () => {
    setSelectedTaskIds([])
  }

  /**
   * Handle removing category filter via chip
   */
  const handleRemoveCategoryFilter = () => {
    setCategory(null)
  }

  /**
   * Handle removing date preset filter via chip - Story 3.4 (AC-3.4.4)
   */
  const handleRemoveDatePreset = () => {
    setDatePreset(null)
  }

  /**
   * Get display label for date preset - Story 3.4 (AC-3.4.2)
   * Maps internal preset values to user-friendly labels
   */
  const getDatePresetLabel = (preset: DatePreset): string | null => {
    if (!preset) return null
    const labels: Record<Exclude<DatePreset, null>, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'This Week',
      month: 'This Month',
    }
    return labels[preset]
  }

  // Format custom range label for display
  const customRangeLabel = customRange ? formatDateRange(customRange) : null

  // Get date preset label for chip display - Story 3.4
  const datePresetLabel = getDatePresetLabel(datePreset)

  // Format duration for display: "Xh Ym" or "0m" for zero
  const formatDisplay = (ms: number): string => {
    if (ms === 0) return '0m'
    return formatDurationSummary(ms)
  }

  /**
   * Handle row swipe reveal state change (AC-3: single-row-revealed)
   * Ensures only one row can have actions revealed at a time
   */
  const handleRowRevealChange = useCallback((entryId: string, revealed: boolean) => {
    if (revealed) {
      setRevealedRowId(entryId)
    } else if (revealedRowId === entryId) {
      setRevealedRowId(null)
    }
  }, [revealedRowId])

  /**
   * Handle edit action from InsightRow (AC-4)
   */
  const handleEdit = useCallback((entry: TimeEntry) => {
    setEditEntry(entry)
    setRevealedRowId(null)
  }, [])

  /**
   * Handle delete action from InsightRow (AC-7)
   */
  const handleDelete = useCallback((entry: TimeEntry) => {
    setDeleteEntry(entry)
    setRevealedRowId(null)
  }, [])

  /**
   * Handle save from EditTimeEntryModal (AC-6)
   */
  const handleEditSave = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    // Optimistic update: update UI immediately
    updateEntryLocal(id, updates)

    // Persist to IndexedDB and queue for sync
    await updateEntry(id, updates)

    // Sync to Supabase in background (non-blocking)
    if (navigator.onLine) {
      syncEntries().catch((syncError) => {
        console.warn('[Today] TimeInsightsModal: Sync failed, will retry later', syncError)
      })
    }
  }, [updateEntry, syncEntries, updateEntryLocal])

  /**
   * Handle confirm from DeleteConfirmDialog (AC-8)
   */
  const handleDeleteConfirm = useCallback(async (id: string) => {
    // Optimistic update: remove from UI immediately
    removeEntry(id)

    // Persist to IndexedDB and queue for sync
    await deleteEntryFn(id)

    // Sync to Supabase in background (non-blocking)
    if (navigator.onLine) {
      syncEntries().catch((syncError) => {
        console.warn('[Today] TimeInsightsModal: Sync failed, will retry later', syncError)
      })
    }
  }, [deleteEntryFn, syncEntries, removeEntry])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[550px] md:rounded-lg max-h-[80vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              Time Insights
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm">Failed to load time insights. Please try again.</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Quick Filter Bar - Story 3.1, 3.2 */}
            <div className="space-y-3">
              <DateRangePicker
                isOpen={isDatePickerOpen}
                selectedRange={customRange}
                onSelect={handleCustomRangeSelect}
                onClose={() => setIsDatePickerOpen(false)}
              >
                <div>
                  <QuickFilterBar
                    activePreset={datePreset}
                    onPresetSelect={handlePresetSelect}
                    hasCustomRange={customRange !== null}
                    customRangeLabel={customRangeLabel}
                    onCustomClick={handleCustomClick}
                  />
                </div>
              </DateRangePicker>

              {/* Task and Category Filter Dropdowns - Story 3.3 (AC-3.3.1) */}
              {/* Task filter uses MultiSelectTaskFilter with search and multi-select - Story 1.1, 1.2 */}
              <div className="flex flex-wrap gap-4">
                <MultiSelectTaskFilter
                  label="Tasks"
                  placeholder="All tasks"
                  options={taskOptions}
                  selectedValues={selectedTaskIds}
                  onSelectionChange={handleTaskSelectionChange}
                />
                <FilterDropdown
                  label="Category"
                  placeholder="All"
                  options={categoryOptions}
                  selectedValue={category}
                  onSelect={handleCategorySelect}
                />
              </div>

              {/* Active filter chips - Story 3.2, 3.3, 3.4, 1.2 (AC-3.4.1, AC-3.4.6, AC-1.2.7) */}
              {(datePreset || customRange || selectedTaskIds.length > 0 || category) && (
                <div className="flex flex-wrap gap-2">
                  {/* Date preset chip - Story 3.4 (AC-3.4.2) */}
                  {datePreset && datePresetLabel && (
                    <FilterChip
                      label={datePresetLabel}
                      onRemove={handleRemoveDatePreset}
                    />
                  )}
                  {/* Custom date range chip - Story 3.2 (AC-3.4.8) */}
                  {customRange && customRangeLabel && (
                    <FilterChip
                      label={customRangeLabel}
                      onRemove={handleRemoveCustomRange}
                    />
                  )}
                  {/* Task filter chip - Story 1.2 (AC-1.2.5, AC-1.2.6, AC-1.2.7) */}
                  {selectedTaskIds.length > 0 && selectedTaskLabel && (
                    <FilterChip
                      label={selectedTaskLabel}
                      onRemove={handleRemoveTaskFilter}
                    />
                  )}
                  {/* Category filter chip - Story 3.3 */}
                  {category && (
                    <FilterChip
                      label={category}
                      onRemove={handleRemoveCategoryFilter}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Summary Cards Section */}
            <div className="grid grid-cols-3 gap-3">
              {/* TOTAL card */}
              <InsightCard
                label="Total"
                value={isLoading ? '--' : formatDisplay(insights?.totalWeek ?? 0)}
                sublabel="this week"
                isLoading={isLoading}
              />
              {/* TODAY card */}
              <InsightCard
                label="Today"
                value={isLoading ? '--' : formatDisplay(insights?.totalToday ?? 0)}
                sublabel="tracked"
                isLoading={isLoading}
              />
              {/* AVG / DAY card */}
              <InsightCard
                label="Avg / Day"
                value={isLoading ? '--' : formatDisplay(insights?.avgPerDay ?? 0)}
                sublabel="this week"
                isLoading={isLoading}
              />
            </div>

            {/* Breakdown Section */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Breakdown{' '}
                {insights && insights.byTask.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({insights.byTask.length} {insights.byTask.length === 1 ? 'task' : 'tasks'})
                  </span>
                )}
              </h3>

              {isLoading ? (
                <div className="bg-surface-muted rounded-lg p-4 space-y-3">
                  <div className="h-5 w-full bg-border/50 rounded animate-pulse" />
                  <div className="h-5 w-3/4 bg-border/50 rounded animate-pulse" />
                </div>
              ) : insights && insights.byTask.length > 0 ? (
                <div className="bg-surface-muted rounded-lg divide-y divide-border/50">
                  {insights.byTask.map((task, index) => (
                    <div
                      key={task.taskId ?? `deleted-${index}`}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm text-foreground truncate mr-4 flex-1">
                        {task.taskName}
                      </span>
                      <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
                        {formatDisplay(task.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No tasks tracked today
                  </p>
                </div>
              )}
            </div>

            {/* Recent Entries Section - Story 2.3 */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Recent Entries{' '}
                {insights && insights.recentEntries.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({insights.recentEntries.length} {insights.recentEntries.length === 1 ? 'entry' : 'entries'})
                  </span>
                )}
              </h3>

              {isLoading ? (
                <div className="bg-surface-muted rounded-lg p-4 space-y-3">
                  <div className="h-5 w-full bg-border/50 rounded animate-pulse" />
                  <div className="h-5 w-3/4 bg-border/50 rounded animate-pulse" />
                  <div className="h-5 w-5/6 bg-border/50 rounded animate-pulse" />
                </div>
              ) : insights && insights.recentEntries.length > 0 ? (
                <div
                  className="bg-surface-muted rounded-lg divide-y divide-border/50"
                  role="list"
                  aria-label="Recent time entries"
                >
                  {insights.recentEntries.map((entry) => (
                    <InsightRow
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isRevealed={revealedRowId === entry.id}
                      onRevealChange={handleRowRevealChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-surface-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Start tracking time to see insights here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Edit Time Entry Modal - Swipe Actions Story (AC-4, AC-5, AC-6) */}
      <EditTimeEntryModal
        isOpen={editEntry !== null}
        onClose={() => setEditEntry(null)}
        entry={editEntry}
        tasks={tasks}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation Dialog - Swipe Actions Story (AC-7, AC-8, AC-9) */}
      <DeleteConfirmDialog
        isOpen={deleteEntry !== null}
        onClose={() => setDeleteEntry(null)}
        entry={deleteEntry}
        onConfirm={handleDeleteConfirm}
      />
    </Dialog.Root>
  )
}
