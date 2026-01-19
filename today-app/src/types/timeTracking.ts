/**
 * Time tracking types for the Today app
 * Source: notes/architecture-time-tracking.md and notes/sprint-artifacts/tech-spec-epic-1.md
 */

/**
 * Date preset for quick filtering in Insights modal
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.1
 */
export type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | null

/**
 * Option for filter dropdowns (task/category filters)
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Story 3.3
 */
export interface FilterOption {
  value: string
  label: string
}

/**
 * Date range for filtering time entries
 * Source: notes/sprint-artifacts/tech-spec-epic-3-insights-filtering.md#Detailed Design
 */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * Active tracking session stored in IndexedDB
 * Persists across browser refresh for crash-resistant tracking
 */
export interface ActiveSession {
  taskId: string
  taskName: string       // Snapshot of task name at tracking start
  startTime: string      // ISO 8601 timestamp
}

/**
 * Completed time entry stored in IndexedDB and synced to Supabase
 * Contains all data needed for insights and reporting
 */
export interface TimeEntry {
  id: string              // UUID via crypto.randomUUID()
  user_id: string         // References auth.users
  task_id: string | null  // References tasks (null if task deleted)
  task_name: string       // Snapshot of task name at creation
  start_time: string      // ISO 8601 timestamp
  end_time: string        // ISO 8601 timestamp
  duration: number        // Milliseconds
  date: string            // YYYY-MM-DD for grouping/filtering
  created_at: string      // ISO 8601 timestamp
  updated_at: string      // ISO 8601 timestamp
}

/**
 * Sync status for time entries in IndexedDB cache
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Data Models
 */
export type TimeEntrySyncStatus = 'synced' | 'pending' | 'error'

/**
 * Time entry with sync metadata for IndexedDB cache
 * Extends TimeEntry with local-only sync tracking fields
 * Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md#Data Models
 */
export interface CachedTimeEntry extends TimeEntry {
  _syncStatus: TimeEntrySyncStatus
  _lastSyncAttempt?: string  // ISO 8601 timestamp
}

/**
 * Aggregated time insights for display in Insights modal
 * Source: notes/architecture-time-tracking.md#Data Architecture
 * Source: notes/sprint-artifacts/tech-spec-epic-2.md#Data Models
 */
export interface TimeInsights {
  totalToday: number      // Milliseconds tracked today
  totalWeek: number       // Milliseconds tracked this week
  avgPerDay: number       // Milliseconds - totalWeek / days with entries
  byTask: Array<{
    taskId: string | null
    taskName: string
    duration: number      // Milliseconds
  }>
  byDate: Array<{
    date: string          // YYYY-MM-DD
    duration: number      // Milliseconds
  }>
  recentEntries: TimeEntry[] // Limited to 20 most recent
}
