import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfDay,
} from 'date-fns'
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right'

interface DatePickerProps {
  selectedDate: string | null
  onSelect: (date: string | null) => void
  minDate?: Date
}

export const DatePicker = ({ selectedDate, onSelect, minDate }: DatePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(minDate || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const selectedDateParsed = selectedDate ? parseISO(selectedDate) : null
  const effectiveMinDate = minDate ? startOfDay(minDate) : startOfDay(new Date())

  const isDateDisabled = (date: Date): boolean => {
    return isBefore(date, effectiveMinDate)
  }

  const isDateSelected = (date: Date): boolean => {
    return selectedDateParsed ? isSameDay(date, selectedDateParsed) : false
  }

  const isCurrentMonth = (date: Date): boolean => {
    return format(date, 'M') === format(currentMonth, 'M')
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return
    onSelect(date.toISOString())
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  return (
    <div className="mt-4 p-3 border border-border rounded-lg bg-surface">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-surface-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-surface-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const disabled = isDateDisabled(date)
          const selected = isDateSelected(date)
          const inCurrentMonth = isCurrentMonth(date)

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                h-8 w-8 flex items-center justify-center text-sm rounded transition-colors
                ${!inCurrentMonth ? 'text-tertiary' : ''}
                ${disabled ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${selected ? 'bg-primary text-white' : ''}
                ${!disabled && !selected ? 'hover:bg-surface-muted' : ''}
                ${!disabled && !selected && inCurrentMonth ? 'text-foreground' : ''}
              `}
              aria-label={format(date, 'MMMM d, yyyy')}
              aria-disabled={disabled}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
