import { useId } from 'react'

interface DurationInputProps {
  /** Duration value in milliseconds */
  value: number
  /** Callback when duration changes, receives milliseconds */
  onChange: (ms: number) => void
  /** Whether the input is disabled */
  disabled?: boolean
}

/**
 * Duration input component with hours and minutes fields
 *
 * Features:
 * - Two number inputs for hours (0-23) and minutes (0-59)
 * - Returns total duration in milliseconds via onChange
 * - Validates input constraints
 * - Accessible with proper labels
 *
 * Source: notes/sprint-artifacts/tech-spec-manual-time-entry.md
 */
export const DurationInput = ({ value, onChange, disabled = false }: DurationInputProps) => {
  const hoursId = useId()
  const minutesId = useId()

  // Convert milliseconds to hours and minutes
  const totalMinutes = Math.floor(value / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  /**
   * Handle hours change
   * Clamp to 0-23 range
   */
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
    const newMs = (newHours * 60 + minutes) * 60 * 1000
    onChange(newMs)
  }

  /**
   * Handle minutes change
   * Clamp to 0-59 range
   */
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
    const newMs = (hours * 60 + newMinutes) * 60 * 1000
    onChange(newMs)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Hours input */}
      <div className="flex items-center gap-1">
        <input
          id={hoursId}
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={handleHoursChange}
          disabled={disabled}
          className="w-16 px-2 py-1.5 text-sm text-center border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Hours"
        />
        <label htmlFor={hoursId} className="text-sm text-muted-foreground">
          h
        </label>
      </div>

      {/* Minutes input */}
      <div className="flex items-center gap-1">
        <input
          id={minutesId}
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={handleMinutesChange}
          disabled={disabled}
          className="w-16 px-2 py-1.5 text-sm text-center border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Minutes"
        />
        <label htmlFor={minutesId} className="text-sm text-muted-foreground">
          m
        </label>
      </div>
    </div>
  )
}
