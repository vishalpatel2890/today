import { useState, useEffect, useMemo } from 'react'
import { electronBridge } from '../lib/electronBridge'
import type { ActivityEntry } from '../types/electron'

/**
 * Activity entry with calculated duration
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Dev-Notes
 */
export interface ActivityEntryWithDuration extends ActivityEntry {
  /** Duration in milliseconds (diff to next entry or session end) */
  durationMs: number
  /** Human-readable duration (e.g., "5m 32s") */
  durationFormatted: string
}

/**
 * Summary item for per-app duration aggregation
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4-electron.md#AC3
 * Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Dev-Notes
 */
export interface ActivitySummaryItem {
  /** Application name (e.g., "Visual Studio Code") */
  appName: string
  /** Total duration in milliseconds across all entries for this app */
  totalDurationMs: number
  /** Human-readable total duration (e.g., "45m 12s") */
  totalDurationFormatted: string
  /** Percentage of total session time (0-100) */
  percentage: number
}

/**
 * Return type for useActivityLog hook
 *
 * Extended for Story 4.3 with summary aggregation data
 */
export interface UseActivityLogReturn {
  /** Activity entries with calculated durations */
  entries: ActivityEntryWithDuration[]
  /** Per-app summary items, sorted by duration descending */
  summary: ActivitySummaryItem[]
  /** Total duration of all activity in milliseconds */
  totalDurationMs: number
  /** Human-readable total duration */
  totalDurationFormatted: string
  /** Whether the hook is loading entries */
  isLoading: boolean
  /** Error message if fetching failed */
  error: string | null
}

/**
 * Format duration in milliseconds to human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string: "1h 15m", "5m 32s", or "< 1s"
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Time-Formatting
 */
export function formatActivityDuration(ms: number): string {
  if (ms < 1000) {
    return '< 1s'
  }

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) {
      return `${minutes}m`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${seconds}s`
}

/**
 * Calculate durations for each activity entry
 *
 * Duration = time from this entry to the next entry (or session end for last entry)
 *
 * @param entries - Raw activity entries (chronologically sorted)
 * @param sessionEndTime - ISO 8601 timestamp when the time tracking session ended
 * @returns Entries with calculated durations
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Duration-Calculation-Pattern
 */
function calculateDurations(
  entries: ActivityEntry[],
  sessionEndTime: string
): ActivityEntryWithDuration[] {
  if (entries.length === 0) {
    return []
  }

  return entries.map((entry, index) => {
    // Use next entry's timestamp, or session end for last entry
    const nextTimestamp =
      index < entries.length - 1 ? entries[index + 1].timestamp : sessionEndTime

    const durationMs =
      new Date(nextTimestamp).getTime() - new Date(entry.timestamp).getTime()

    return {
      ...entry,
      durationMs: Math.max(0, durationMs), // Ensure non-negative
      durationFormatted: formatActivityDuration(Math.max(0, durationMs)),
    }
  })
}

/**
 * Aggregate activity entries into per-app summary items
 *
 * Groups entries by appName, sums their durations, calculates percentages,
 * and sorts by total duration descending (most time first).
 *
 * @param entriesWithDuration - Activity entries with calculated durations
 * @returns Summary items sorted by duration descending
 *
 * Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Implementation-Approach
 * Source: notes/sprint-artifacts/tech-spec-epic-4-electron.md#AC3
 */
export function aggregateSummary(
  entriesWithDuration: ActivityEntryWithDuration[]
): ActivitySummaryItem[] {
  if (entriesWithDuration.length === 0) {
    return []
  }

  // Group by appName and sum durations using Map for O(n) performance
  const byApp = new Map<string, number>()
  let totalMs = 0

  for (const entry of entriesWithDuration) {
    const current = byApp.get(entry.appName) || 0
    byApp.set(entry.appName, current + entry.durationMs)
    totalMs += entry.durationMs
  }

  // Convert to array with formatted values and percentages
  const items: ActivitySummaryItem[] = []
  for (const [appName, totalDurationMs] of byApp.entries()) {
    items.push({
      appName,
      totalDurationMs,
      totalDurationFormatted: formatActivityDuration(totalDurationMs),
      percentage: totalMs > 0 ? Math.round((totalDurationMs / totalMs) * 100) : 0,
    })
  }

  // Sort by duration descending (most time first)
  items.sort((a, b) => b.totalDurationMs - a.totalDurationMs)

  return items
}

/**
 * Hook for fetching and processing activity log entries
 *
 * Fetches activity entries for a time entry ID and calculates
 * the duration each app was in focus.
 *
 * @param timeEntryId - The ID of the time entry to fetch activity for
 * @param sessionEndTime - ISO 8601 timestamp when the session ended
 * @returns Activity entries with durations, loading state, and error
 *
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Task-1
 * Source: notes/architecture-electron-migration.md#Activity-Viewing
 */
export function useActivityLog(
  timeEntryId: string,
  sessionEndTime: string
): UseActivityLogReturn {
  const [rawEntries, setRawEntries] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch activity entries from electronBridge
  useEffect(() => {
    let mounted = true

    const fetchActivityLog = async () => {
      if (!timeEntryId) {
        setRawEntries([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await electronBridge.activity.getLog(timeEntryId)

        if (!mounted) return

        if (result.success && result.data) {
          setRawEntries(result.data)
        } else {
          // Not in Electron or fetch failed - treat as empty
          if (result.error && result.error !== 'Not in Electron') {
            setError(result.error)
          }
          setRawEntries([])
        }
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : 'Failed to load activity log'
        setError(message)
        setRawEntries([])
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchActivityLog()

    return () => {
      mounted = false
    }
  }, [timeEntryId])

  // Calculate durations using useMemo
  const entries = useMemo<ActivityEntryWithDuration[]>(() => {
    if (isLoading || rawEntries.length === 0) {
      return []
    }

    return calculateDurations(rawEntries, sessionEndTime)
  }, [rawEntries, sessionEndTime, isLoading])

  // Aggregate summary using useMemo (depends on entries)
  const { summary, totalDurationMs, totalDurationFormatted } = useMemo(() => {
    if (entries.length === 0) {
      return {
        summary: [] as ActivitySummaryItem[],
        totalDurationMs: 0,
        totalDurationFormatted: '0s',
      }
    }

    const summaryItems = aggregateSummary(entries)
    const totalMs = entries.reduce((sum, entry) => sum + entry.durationMs, 0)

    return {
      summary: summaryItems,
      totalDurationMs: totalMs,
      totalDurationFormatted: formatActivityDuration(totalMs),
    }
  }, [entries])

  return {
    entries,
    summary,
    totalDurationMs,
    totalDurationFormatted,
    isLoading,
    error,
  }
}
