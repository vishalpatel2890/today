import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, startOfWeek, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import type { TimeEntry, TimeInsights, DatePreset, DateRange } from '../types/timeTracking'
import { getTimeEntriesByUserId } from '../lib/timeTrackingDb'
import { fetchTimeEntries as fetchTimeEntriesFromSupabase } from '../lib/supabaseTimeEntries'
import { getDateRangeForPreset } from '../lib/timeFormatters'

/**
 * Filter options for useTimeInsights hook
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.3
 * Source: notes/sprint-artifacts/story-task-filter-enhancements-2.md
 */
export interface InsightFilters {
  /** Date preset filter (today, yesterday, week, month) */
  datePreset?: DatePreset
  /** Custom date range filter - takes precedence when datePreset is null */
  customRange?: DateRange | null
  /** Filter by specific task IDs - Story 1.2 (multi-select) */
  taskIds?: string[] | null
  /** Filter by task category - Story 3.3 */
  category?: string | null
  /** Task category lookup map for category filtering (taskId -> category) */
  taskCategories?: Map<string, string | null>
}

/**
 * Return type for useTimeInsights hook
 */
export interface UseTimeInsightsReturn {
  /** Aggregated time insights, or null if loading/error */
  insights: TimeInsights | null
  /** Whether the hook is loading entries from IndexedDB */
  isLoading: boolean
  /** Error if fetching entries failed */
  error: Error | null
  /** Refetch entries and recalculate insights */
  refetch: () => void
  /** Raw time entries for deriving filter options - Story 3.3 */
  entries: TimeEntry[]
}

/**
 * Hook for aggregating time entry data into insights
 *
 * Provides:
 * - Total time tracked today
 * - Total time tracked this week
 * - Average time per day (based on days with entries, not calendar days)
 * - Breakdown by task for today
 * - Breakdown by date for the week
 * - Recent entries (limited to 20)
 *
 * Implementation follows ADR-TT-004:
 * - Client-side aggregation using useMemo
 * - Optimized for < 1000 entries/year
 * - Fetches from Supabase (source of truth) when online
 * - Falls back to user-filtered IndexedDB when offline
 *
 * Data Isolation Fix:
 * - Always filters by userId to prevent data leakage between users
 * - Source: notes/sprint-artifacts/tech-spec-time-entries-data-isolation.md
 *
 * @param userId - The current user's ID (required for data isolation)
 * @param filters - Optional filters to apply to entries
 * @param filters.datePreset - Date preset filter (today, yesterday, week, month)
 * @param filters.customRange - Custom date range filter (takes precedence when datePreset is null)
 *
 * Source: notes/architecture-time-tracking.md#ADR-TT-004
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#Story 2.2
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.1
 */
export function useTimeInsights(userId: string | null, filters?: InsightFilters): UseTimeInsightsReturn {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch entries from Supabase (online) or IndexedDB (offline)
  // Always filtered by userId for data isolation
  useEffect(() => {
    let mounted = true

    const fetchEntries = async () => {
      // No user = no entries (prevents data leakage)
      if (!userId) {
        setEntries([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        let userEntries: TimeEntry[]

        // Try Supabase first (source of truth with RLS)
        if (navigator.onLine) {
          try {
            userEntries = await fetchTimeEntriesFromSupabase(userId)
            if (import.meta.env.DEV) {
              console.log('[Today] TimeInsights: Fetched from Supabase', userEntries.length)
            }
          } catch (supabaseError) {
            // Supabase failed, fall back to IndexedDB
            console.warn('[Today] TimeInsights: Supabase fetch failed, using cache', supabaseError)
            userEntries = await getTimeEntriesByUserId(userId)
          }
        } else {
          // Offline - use IndexedDB cache (user-filtered)
          userEntries = await getTimeEntriesByUserId(userId)
          if (import.meta.env.DEV) {
            console.log('[Today] TimeInsights: Offline, using cached entries', userEntries.length)
          }
        }

        if (mounted) {
          setEntries(userEntries)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[Today] TimeInsights: Failed to load entries', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load time entries'))
          setIsLoading(false)
        }
      }
    }

    fetchEntries()

    return () => {
      mounted = false
    }
  }, [userId, refreshKey])

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  // Calculate insights using useMemo (per ADR-TT-004)
  const insights = useMemo<TimeInsights | null>(() => {
    if (isLoading || error) return null

    const today = format(new Date(), 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')

    // Determine active date range filter
    // Priority: customRange (when datePreset is null) > datePreset
    // Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.2
    let dateRange: DateRange | null = null

    if (filters?.customRange && !filters.datePreset) {
      // Custom range takes precedence when preset is null
      dateRange = {
        start: startOfDay(filters.customRange.start),
        end: endOfDay(filters.customRange.end),
      }
    } else if (filters?.datePreset) {
      // Use preset filter
      dateRange = getDateRangeForPreset(filters.datePreset)
    }

    // Apply date filter first
    let baseEntries = dateRange
      ? entries.filter((e) => {
          const entryDate = parseISO(e.start_time)
          return isWithinInterval(entryDate, { start: dateRange!.start, end: dateRange!.end })
        })
      : entries

    // Apply task filter (Story 1.2 - multi-select, AC-1.2.3)
    // Uses Set for efficient lookup when filtering by multiple task IDs
    if (filters?.taskIds && filters.taskIds.length > 0) {
      const taskIdSet = new Set(filters.taskIds)
      baseEntries = baseEntries.filter((e) => e.task_id && taskIdSet.has(e.task_id))
    }

    // Apply category filter (Story 3.3 - AC-3.3.5)
    // Uses taskCategories map to lookup category for each entry's task_id
    if (filters?.category && filters?.taskCategories) {
      baseEntries = baseEntries.filter((e) => {
        if (!e.task_id) return false
        const taskCategory = filters.taskCategories!.get(e.task_id)
        return taskCategory === filters.category
      })
    }

    // Filter entries for today (from filtered base if filter active)
    const todayEntries = baseEntries.filter((e) => e.date === today)

    // Filter entries for this week (from Sunday to today) (from filtered base if filter active)
    const weekEntries = baseEntries.filter((e) => e.date >= weekStart && e.date <= today)

    // Calculate totalToday
    const totalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0)

    // Calculate totalWeek
    const totalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)

    // Calculate avgPerDay: totalWeek / distinct days with entries
    const daysWithEntries = new Set(weekEntries.map((e) => e.date))
    const numDays = daysWithEntries.size
    const avgPerDay = numDays > 0 ? Math.floor(totalWeek / numDays) : 0

    // Build byTask: group by task_id, aggregate duration
    // When filter is active, use all filtered entries; otherwise use today's entries
    const entriesForTaskBreakdown = dateRange ? baseEntries : todayEntries
    const taskMap = new Map<string, { taskId: string | null; taskName: string; duration: number }>()
    for (const entry of entriesForTaskBreakdown) {
      // Use task_id as key, but fallback to task_name for null task_id (deleted tasks)
      const key = entry.task_id ?? `deleted:${entry.task_name}`
      const existing = taskMap.get(key)
      if (existing) {
        existing.duration += entry.duration
      } else {
        taskMap.set(key, {
          taskId: entry.task_id,
          taskName: entry.task_name,
          duration: entry.duration,
        })
      }
    }
    // Sort by duration descending
    const byTask = Array.from(taskMap.values()).sort((a, b) => b.duration - a.duration)

    // Build byDate for the week: group by date, aggregate duration
    const dateMap = new Map<string, number>()
    for (const entry of weekEntries) {
      dateMap.set(entry.date, (dateMap.get(entry.date) ?? 0) + entry.duration)
    }
    // Sort by date ascending
    const byDate = Array.from(dateMap.entries())
      .map(([date, duration]) => ({ date, duration }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get recent entries (limited to 20, sorted by start_time descending)
    // Uses baseEntries so filtering applies to recent entries list
    const recentEntries = [...baseEntries]
      .sort((a, b) => b.start_time.localeCompare(a.start_time))
      .slice(0, 20)

    return {
      totalToday,
      totalWeek,
      avgPerDay,
      byTask,
      byDate,
      recentEntries,
    }
  }, [entries, isLoading, error, filters?.datePreset, filters?.customRange, filters?.taskIds, filters?.category, filters?.taskCategories])

  return {
    insights,
    isLoading,
    error,
    refetch,
    entries,
  }
}
