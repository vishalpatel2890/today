import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Pencil from 'lucide-react/dist/esm/icons/pencil'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import type { TimeEntry } from '../../types/timeTracking'
import { formatRelativeTimestamp, formatDurationSummary } from '../../lib/timeFormatters'
import { isElectron } from '../../lib/platform'
import { ViewActivityButton } from './ViewActivityButton'

/** Base width of the action buttons area (Edit + Delete = 2 buttons) */
const BASE_ACTION_WIDTH = 120

/** Width per action button */
const BUTTON_WIDTH = 60

/** If swiped past this threshold, snap open; otherwise snap closed */
const SNAP_THRESHOLD = 60

interface InsightRowProps {
  /** Time entry to display */
  entry: TimeEntry
  /** Callback when edit action is clicked */
  onEdit?: (entry: TimeEntry) => void
  /** Callback when delete action is clicked */
  onDelete?: (entry: TimeEntry) => void
  /** Whether this row is currently revealed (controlled by parent) */
  isRevealed?: boolean
  /** Callback when swipe state changes (for single-row-revealed management) */
  onRevealChange?: (entryId: string, revealed: boolean) => void
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
 * - Swipe-to-reveal Edit and Delete action buttons (iOS Mail-style)
 * - Two-finger trackpad horizontal scroll detection
 * - Snap behavior with threshold
 * - Subtle hover state (light background highlight)
 * - Accessible with role="listitem" and aria-label
 * - Typography per UX spec: 13px timestamp, 15px task name, 14px duration
 *
 * Source: notes/ux-design-time-tracking.md#6.1 InsightRow
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#AC5.2, AC5.6
 * Source: notes/tech-spec-swipe-actions.md#Swipe Gesture Implementation
 */
export const InsightRow = ({
  entry,
  onEdit,
  onDelete,
  isRevealed = false,
  onRevealChange,
}: InsightRowProps) => {
  const timestamp = formatRelativeTimestamp(entry.start_time)
  const duration = formatDurationSummary(entry.duration)

  // Electron-only: Show View Activity button for completed entries (AC3.1, AC3.2)
  // Source: notes/sprint-artifacts/tech-spec-epic-2-electron.md#AC3
  const showActivityButton = useMemo(() => {
    return isElectron() && !!entry.end_time
  }, [entry.end_time])

  // Calculate action width: 3 buttons in Electron (180px), 2 buttons in web (120px)
  const actionWidth = showActivityButton ? BASE_ACTION_WIDTH + BUTTON_WIDTH : BASE_ACTION_WIDTH

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const scrollEndTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with controlled isRevealed prop
  useEffect(() => {
    if (isRevealed) {
      setSwipeOffset(actionWidth)
    } else if (!isDragging) {
      setSwipeOffset(0)
    }
  }, [isRevealed, isDragging, actionWidth])

  /**
   * Handle wheel event for trackpad swipe detection
   * Filters for horizontal scrolls (two-finger trackpad gesture)
   */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Only handle horizontal scrolls (two-finger swipe on trackpad)
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
        return
      }

      // Prevent page scrolling when swiping
      e.preventDefault()

      setIsDragging(true)

      // Clear previous scroll end timeout
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current)
      }

      // Update offset based on deltaX (negative = swipe left = reveal actions)
      setSwipeOffset((prev) => {
        const newOffset = Math.max(0, Math.min(actionWidth, prev + e.deltaX))
        return newOffset
      })

      // Detect scroll end with debounce
      scrollEndTimeout.current = setTimeout(() => {
        setIsDragging(false)

        // Snap to open or closed based on threshold
        setSwipeOffset((prev) => {
          const shouldSnap = prev > SNAP_THRESHOLD
          const newOffset = shouldSnap ? actionWidth : 0

          // Notify parent of reveal state change
          if (onRevealChange) {
            onRevealChange(entry.id, shouldSnap)
          }

          return newOffset
        })
      }, 150)
    },
    [entry.id, onRevealChange, actionWidth]
  )

  // Attach wheel event listener
  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    row.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      row.removeEventListener('wheel', handleWheel)
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current)
      }
    }
  }, [handleWheel])

  /**
   * Handle click outside to close revealed actions
   */
  const handleClickOutside = useCallback(() => {
    if (swipeOffset > 0 && !isDragging) {
      setSwipeOffset(0)
      onRevealChange?.(entry.id, false)
    }
  }, [swipeOffset, isDragging, entry.id, onRevealChange])

  /**
   * Handle edit button click
   */
  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit?.(entry)
      // Close actions after clicking
      setSwipeOffset(0)
      onRevealChange?.(entry.id, false)
    },
    [entry, onEdit, onRevealChange]
  )

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.(entry)
      // Close actions after clicking
      setSwipeOffset(0)
      onRevealChange?.(entry.id, false)
    },
    [entry, onDelete, onRevealChange]
  )

  const isActionVisible = swipeOffset > 0

  return (
    <div
      ref={rowRef}
      role="listitem"
      aria-label={`${entry.task_name}: ${duration} on ${timestamp}`}
      className="relative overflow-hidden"
      onClick={handleClickOutside}
    >
      {/* Action buttons (positioned behind the sliding content) */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{ width: actionWidth }}
        aria-hidden={!isActionVisible}
      >
        {/* View Activity button - Electron only (AC3.1, AC3.2) */}
        {showActivityButton && (
          <ViewActivityButton
            timeEntryId={entry.id}
            taskName={entry.task_name}
            startTime={entry.start_time}
            endTime={entry.end_time!}
            tabIndex={isActionVisible ? 0 : -1}
          />
        )}
        <button
          type="button"
          onClick={handleEditClick}
          className="flex-1 h-full flex items-center justify-center bg-slate-500 text-white hover:bg-slate-600 transition-colors"
          aria-label="Edit time entry"
          tabIndex={isActionVisible ? 0 : -1}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="flex-1 h-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
          aria-label="Delete time entry"
          tabIndex={isActionVisible ? 0 : -1}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Row content (slides left to reveal actions) */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-surface-muted hover:bg-slate-50 transition-transform"
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 200ms ease-out',
        }}
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
    </div>
  )
}
