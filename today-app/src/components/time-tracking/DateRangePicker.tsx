import { useState, useEffect, useCallback, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns'
import type { DateRange } from '../../types/timeTracking'

export interface DateRangePickerProps {
  /** Whether the picker popover is open */
  isOpen: boolean
  /** Currently selected date range, or null if none */
  selectedRange: DateRange | null
  /** Callback when a range is selected and confirmed */
  onSelect: (range: DateRange) => void
  /** Callback when picker is closed without selection */
  onClose: () => void
  /** Maximum selectable date (default: today). Future dates are disabled. */
  maxDate?: Date
  /** Trigger element to anchor the popover to */
  children: React.ReactNode
}

/**
 * DateRangePicker - Custom date range selection popover
 *
 * Features:
 * - Dual start/end date selection
 * - Calendar navigation (prev/next month)
 * - Future dates disabled (maxDate)
 * - Start cannot be after end (auto-swap)
 * - Keyboard accessible (Tab, Arrow keys, Enter, Escape)
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
 * Source: notes/ux-design-time-tracking.md#6.1 QuickFilterBar
 */
export const DateRangePicker = ({
  isOpen,
  selectedRange,
  onSelect,
  onClose,
  maxDate = new Date(),
  children,
}: DateRangePickerProps) => {
  // Local state for building the range before confirmation
  const [selectingStart, setSelectingStart] = useState<Date | null>(null)
  const [selectingEnd, setSelectingEnd] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [focusedDate, setFocusedDate] = useState<Date | null>(null)

  // Ref for calendar grid for keyboard navigation
  const calendarRef = useRef<HTMLDivElement>(null)

  // Normalize maxDate to end of day for comparison
  const normalizedMaxDate = startOfDay(maxDate)

  // Reset selection state when popover opens
  useEffect(() => {
    if (isOpen) {
      if (selectedRange) {
        setSelectingStart(selectedRange.start)
        setSelectingEnd(selectedRange.end)
        setCurrentMonth(selectedRange.start)
      } else {
        setSelectingStart(null)
        setSelectingEnd(null)
        setCurrentMonth(new Date())
      }
      setFocusedDate(null)
    }
  }, [isOpen, selectedRange])

  // Navigate to previous month
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }, [])

  // Navigate to next month
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }, [])

  // Check if a date is selectable (not in future)
  const isDateSelectable = useCallback(
    (date: Date): boolean => {
      return !isAfter(startOfDay(date), normalizedMaxDate)
    },
    [normalizedMaxDate]
  )

  // Handle date click - builds the range
  const handleDateClick = useCallback(
    (date: Date) => {
      if (!isDateSelectable(date)) return

      if (!selectingStart || (selectingStart && selectingEnd)) {
        // Starting a new selection
        setSelectingStart(date)
        setSelectingEnd(null)
      } else {
        // Completing the selection
        let start = selectingStart
        let end = date

        // Auto-swap if end is before start (AC-3.2.4)
        if (isBefore(end, start)) {
          ;[start, end] = [end, start]
        }

        setSelectingStart(start)
        setSelectingEnd(end)
      }
    },
    [selectingStart, selectingEnd, isDateSelectable]
  )

  // Apply the selected range
  const handleApply = useCallback(() => {
    if (selectingStart && selectingEnd) {
      onSelect({
        start: startOfDay(selectingStart),
        end: startOfDay(selectingEnd),
      })
    } else if (selectingStart) {
      // Single date selected - use same day for both
      onSelect({
        start: startOfDay(selectingStart),
        end: startOfDay(selectingStart),
      })
    }
  }, [selectingStart, selectingEnd, onSelect])

  // Check if a date is within the selecting range
  const isInRange = useCallback(
    (date: Date): boolean => {
      if (!selectingStart) return false
      if (!selectingEnd) return isSameDay(date, selectingStart)

      const start = isBefore(selectingStart, selectingEnd) ? selectingStart : selectingEnd
      const end = isBefore(selectingStart, selectingEnd) ? selectingEnd : selectingStart

      return (
        (isAfter(date, start) || isSameDay(date, start)) &&
        (isBefore(date, end) || isSameDay(date, end))
      )
    },
    [selectingStart, selectingEnd]
  )

  // Check if date is range start
  const isRangeStart = useCallback(
    (date: Date): boolean => {
      if (!selectingStart) return false
      if (!selectingEnd) return isSameDay(date, selectingStart)
      const start = isBefore(selectingStart, selectingEnd) ? selectingStart : selectingEnd
      return isSameDay(date, start)
    },
    [selectingStart, selectingEnd]
  )

  // Check if date is range end
  const isRangeEnd = useCallback(
    (date: Date): boolean => {
      if (!selectingEnd) return false
      const end = isBefore(selectingStart!, selectingEnd) ? selectingEnd : selectingStart!
      return isSameDay(date, end)
    },
    [selectingStart, selectingEnd]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedDate) {
        // If no focused date, set it to start of visible month
        setFocusedDate(startOfMonth(currentMonth))
        return
      }

      let newDate = focusedDate

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          newDate = addDays(focusedDate, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          newDate = addDays(focusedDate, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          newDate = addDays(focusedDate, -7)
          break
        case 'ArrowDown':
          e.preventDefault()
          newDate = addDays(focusedDate, 7)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (isDateSelectable(focusedDate)) {
            handleDateClick(focusedDate)
          }
          return
        case 'Escape':
          e.preventDefault()
          onClose()
          return
        default:
          return
      }

      // Update focused date and navigate months if needed
      setFocusedDate(newDate)
      if (!isSameMonth(newDate, currentMonth)) {
        setCurrentMonth(startOfMonth(newDate))
      }
    },
    [focusedDate, currentMonth, isDateSelectable, handleDateClick, onClose]
  )

  // Generate calendar days for current month
  const generateCalendarDays = useCallback(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days: Date[] = []
    let day = calendarStart

    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }, [currentMonth])

  const calendarDays = generateCalendarDays()
  const canApply = selectingStart !== null

  return (
    <Popover.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 bg-surface rounded-lg shadow-lg p-4 w-[280px] animate-fade-in"
          sideOffset={4}
          align="start"
          onKeyDown={handleKeyDown}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-surface-muted transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-surface-muted transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground font-medium py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            ref={calendarRef}
            className="grid grid-cols-7 gap-1"
            role="grid"
            aria-label="Calendar"
            tabIndex={0}
          >
            {calendarDays.map((date) => {
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelectable = isDateSelectable(date)
              const inRange = isInRange(date)
              const isStart = isRangeStart(date)
              const isEnd = isRangeEnd(date)
              const isFocused = focusedDate && isSameDay(date, focusedDate)
              const isToday = isSameDay(date, new Date())

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  disabled={!isSelectable}
                  tabIndex={isFocused ? 0 : -1}
                  className={`
                    h-8 w-full text-sm rounded transition-colors
                    ${!isCurrentMonth ? 'text-slate-300' : ''}
                    ${!isSelectable ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-surface-muted cursor-pointer'}
                    ${inRange && !isStart && !isEnd ? 'bg-slate-100' : ''}
                    ${isStart || isEnd ? 'bg-slate-600 text-white' : ''}
                    ${isFocused ? 'ring-2 ring-slate-400 ring-offset-1' : ''}
                    ${isToday && !isStart && !isEnd ? 'font-bold' : ''}
                  `}
                  aria-label={format(date, 'EEEE, MMMM d, yyyy')}
                  aria-selected={isStart || isEnd}
                  aria-disabled={!isSelectable}
                >
                  {format(date, 'd')}
                </button>
              )
            })}
          </div>

          {/* Selection summary */}
          {selectingStart && (
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
              {selectingEnd ? (
                <>
                  {format(
                    isBefore(selectingStart, selectingEnd) ? selectingStart : selectingEnd,
                    'MMM d'
                  )}{' '}
                  -{' '}
                  {format(
                    isBefore(selectingStart, selectingEnd) ? selectingEnd : selectingStart,
                    'MMM d, yyyy'
                  )}
                </>
              ) : (
                <>
                  {format(selectingStart, 'MMM d, yyyy')} - <span className="italic">Select end date</span>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded border border-slate-300 text-slate-600 hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className={`
                px-3 py-1.5 text-sm rounded transition-colors
                ${canApply
                  ? 'bg-slate-600 text-white hover:bg-slate-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Apply
            </button>
          </div>

          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
