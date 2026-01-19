/**
 * Time duration formatting utilities
 *
 * Source: notes/architecture-time-tracking.md#Timer Display Pattern
 * Source: notes/ux-design-time-tracking.md#Time Format
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#AC5.3 - Relative timestamp formats
 */

import {
  isToday,
  isYesterday,
  format,
  parseISO,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  isSameDay,
  getYear,
} from 'date-fns'
import type { DatePreset, DateRange } from '../types/timeTracking'

/**
 * Format duration in milliseconds to HH:MM:SS or MM:SS
 * Uses tabular-nums for stable width during updates
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string "HH:MM:SS" if >= 1 hour, "MM:SS" otherwise
 */
export function formatDuration(ms: number): string {
  // Handle negative or zero
  if (ms <= 0) return '0:00'

  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }
  return `${minutes}:${pad(secs)}`
}

/**
 * Format duration in milliseconds to human-readable summary
 * Used for success feedback and insights display
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string "Xh Ym" if >= 1 hour, "Xm" otherwise, "< 1m" if < 1 minute
 */
export function formatDurationSummary(ms: number): string {
  // Handle negative or zero
  if (ms <= 0) return '0m'

  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  // Less than 1 minute
  if (totalMinutes < 1) {
    return '< 1m'
  }

  // 1 hour or more
  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${minutes}m`
  }

  // Less than 1 hour
  return `${minutes}m`
}

/**
 * Format ISO timestamp to relative display format for time entries
 * Used in Recent Entries list in Insights modal
 *
 * @param isoString - ISO 8601 timestamp (e.g., "2026-01-10T14:30:00Z")
 * @returns Relative timestamp string:
 *   - Today: "Today 2:30pm"
 *   - Yesterday: "Yesterday 11:00am"
 *   - This week (within 7 days): "Mon 9:15am"
 *   - Older: "Dec 15 2:30pm"
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#AC5.3
 * Source: notes/ux-design-time-tracking.md#6.1 InsightRow
 */
export function formatRelativeTimestamp(isoString: string): string {
  const date = parseISO(isoString)
  const now = new Date()
  const timeFormat = 'h:mmaaa' // "2:30pm"

  if (isToday(date)) {
    return `Today ${format(date, timeFormat)}`
  }

  if (isYesterday(date)) {
    return `Yesterday ${format(date, timeFormat)}`
  }

  // Within last 7 days: use day abbreviation
  const daysDiff = differenceInDays(now, date)
  if (daysDiff <= 7) {
    return `${format(date, 'EEE')} ${format(date, timeFormat)}`
  }

  // Older: use month and day
  return `${format(date, 'MMM d')} ${format(date, timeFormat)}`
}

/**
 * Get date range for a given preset filter
 * Used for filtering time entries in Insights modal
 *
 * @param preset - The date preset to calculate range for
 * @returns DateRange with start and end dates, or null if preset is null
 *
 * Date ranges:
 * - "today": start of today to end of today
 * - "yesterday": start of yesterday to end of yesterday
 * - "week": start of week (Sunday) to end of today
 * - "month": start of month to end of today
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#AC-3.1.7
 * Source: notes/architecture-time-tracking.md#ADR-TT-004
 */
export function getDateRangeForPreset(preset: DatePreset): DateRange | null {
  if (preset === null || preset === 'all') return null

  const now = new Date()

  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      }
    case 'yesterday': {
      const yesterday = subDays(now, 1)
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      }
    }
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }), // Sunday
        end: endOfDay(now),
      }
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfDay(now),
      }
    default:
      return null
  }
}

/**
 * Format a date range for display in UI
 * Used for Custom date filter pill and FilterChip display
 *
 * @param range - DateRange with start and end dates
 * @returns Formatted string:
 *   - Same day: "Dec 15"
 *   - Same year: "Dec 1 - Dec 15"
 *   - Cross year: "Dec 15, 2025 - Jan 5, 2026"
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
 * Source: notes/ux-design-time-tracking.md#6.1 QuickFilterBar
 */
export function formatDateRange(range: DateRange): string {
  const { start, end } = range

  // Same day: show single date
  if (isSameDay(start, end)) {
    return format(start, 'MMM d')
  }

  const startYear = getYear(start)
  const endYear = getYear(end)

  // Cross-year: include years
  if (startYear !== endYear) {
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
  }

  // Same year: no year needed
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
}
