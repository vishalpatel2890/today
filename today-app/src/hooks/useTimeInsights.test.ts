import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { format, startOfWeek, subDays, addDays } from 'date-fns'
import { useTimeInsights } from './useTimeInsights'
import { timeTrackingDb } from '../lib/timeTrackingDb'
import type { TimeEntry } from '../types/timeTracking'

// Helper to create a TimeEntry
const createEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    user_id: 'local',
    task_id: 'task-1',
    task_name: 'Test Task',
    start_time: now.toISOString(),
    end_time: now.toISOString(),
    duration: 3600000, // 1 hour
    date: format(now, 'yyyy-MM-dd'),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  }
}

describe('useTimeInsights', () => {
  beforeEach(async () => {
    // Clear timeEntries store before each test
    await timeTrackingDb.timeEntries.clear()
  })

  describe('loading state', () => {
    it('should start with isLoading true', () => {
      const { result } = renderHook(() => useTimeInsights('local'))
      expect(result.current.isLoading).toBe(true)
      expect(result.current.insights).toBe(null)
    })

    it('should set isLoading false after fetching', async () => {
      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights).not.toBe(null)
    })
  })

  describe('totalToday calculation', () => {
    it('should return 0 when no entries exist', async () => {
      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights?.totalToday).toBe(0)
    })

    it('should sum durations for entries from today', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Add two entries for today
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 3600000, date: today }) // 1 hour
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 1800000, date: today }) // 30 min
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 1h + 30m = 5400000ms
      expect(result.current.insights?.totalToday).toBe(5400000)
    })

    it('should not include entries from yesterday', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 3600000, date: today }) // 1 hour today
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 7200000, date: yesterday }) // 2 hours yesterday
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Only today's 1 hour
      expect(result.current.insights?.totalToday).toBe(3600000)
    })
  })

  describe('totalWeek calculation', () => {
    it('should sum durations for entries from this week', async () => {
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 0 })
      const todayStr = format(today, 'yyyy-MM-dd')
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')

      // Only add if week start is different from today
      if (weekStartStr !== todayStr) {
        await timeTrackingDb.timeEntries.add(
          createEntry({ duration: 3600000, date: weekStartStr }) // 1 hour at start of week
        )
      }
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 1800000, date: todayStr }) // 30 min today
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include all entries from this week
      expect(result.current.insights?.totalWeek).toBeGreaterThanOrEqual(1800000)
    })

    it('should not include entries from before this week', async () => {
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 0 })
      const beforeWeek = format(subDays(weekStart, 1), 'yyyy-MM-dd')
      const todayStr = format(today, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 3600000, date: todayStr }) // 1 hour today
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 7200000, date: beforeWeek }) // 2 hours before this week
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Only this week's 1 hour
      expect(result.current.insights?.totalWeek).toBe(3600000)
    })
  })

  describe('avgPerDay calculation', () => {
    it('should return 0 when no entries this week', async () => {
      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights?.avgPerDay).toBe(0)
    })

    it('should not return NaN when no entries', async () => {
      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(Number.isNaN(result.current.insights?.avgPerDay)).toBe(false)
    })

    it('should calculate average based on days with entries, not calendar days', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const twoDaysAgo = subDays(today, 2)

      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
      // Skip twoDaysAgo - no entry

      // Add entries on 2 days only
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 3600000, date: todayStr }) // 1 hour today
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 3600000, date: yesterdayStr }) // 1 hour yesterday
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Total: 2 hours = 7200000ms, Days with entries: 2
      // Average: 7200000 / 2 = 3600000 (1 hour)
      expect(result.current.insights?.avgPerDay).toBe(3600000)
    })
  })

  describe('byTask aggregation', () => {
    it('should group entries by task_id for today', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Task A', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Task A', duration: 1800000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Task B', duration: 900000, date: today })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const byTask = result.current.insights?.byTask
      expect(byTask).toHaveLength(2)

      // Task A: 1.5 hours (first in sort order)
      const taskA = byTask?.find((t) => t.taskId === 'task-1')
      expect(taskA?.duration).toBe(5400000)
      expect(taskA?.taskName).toBe('Task A')

      // Task B: 15 minutes
      const taskB = byTask?.find((t) => t.taskId === 'task-2')
      expect(taskB?.duration).toBe(900000)
    })

    it('should sort byTask by duration descending', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Small Task', duration: 900000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Big Task', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-3', task_name: 'Medium Task', duration: 1800000, date: today })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const byTask = result.current.insights?.byTask
      expect(byTask?.[0].taskName).toBe('Big Task')
      expect(byTask?.[1].taskName).toBe('Medium Task')
      expect(byTask?.[2].taskName).toBe('Small Task')
    })

    it('should handle entries with null task_id (deleted tasks)', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: null,
          task_name: 'Deleted Task Snapshot',
          duration: 3600000,
          date: today,
        })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const byTask = result.current.insights?.byTask
      expect(byTask).toHaveLength(1)
      expect(byTask?.[0].taskId).toBe(null)
      expect(byTask?.[0].taskName).toBe('Deleted Task Snapshot')
      expect(byTask?.[0].duration).toBe(3600000)
    })

    it('should only include today entries in byTask', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Today Task', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-2',
          task_name: 'Yesterday Task',
          duration: 7200000,
          date: yesterday,
        })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const byTask = result.current.insights?.byTask
      expect(byTask).toHaveLength(1)
      expect(byTask?.[0].taskName).toBe('Today Task')
    })
  })

  describe('byDate aggregation', () => {
    it('should group entries by date for the week', async () => {
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')

      // Use a day within the same week (start of current week + 1 day if possible)
      // Week starts on Sunday (weekStartsOn: 0)
      const weekStart = startOfWeek(today, { weekStartsOn: 0 })
      const dayAfterWeekStart = addDays(weekStart, 1)

      // If today is Sunday, dayAfterWeekStart is tomorrow (not in week yet)
      // So we use today only in that case
      const isTodaySunday = format(today, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')

      if (isTodaySunday) {
        // If today is Sunday, just test with today only
        await timeTrackingDb.timeEntries.add(
          createEntry({ duration: 3600000, date: todayStr })
        )

        const { result } = renderHook(() => useTimeInsights('local'))

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        const byDate = result.current.insights?.byDate
        expect(byDate).toHaveLength(1)
        expect(byDate?.[0].date).toBe(todayStr)
      } else {
        // If today is not Sunday, use yesterday (which is in the same week)
        const yesterday = subDays(today, 1)
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

        await timeTrackingDb.timeEntries.add(
          createEntry({ duration: 3600000, date: todayStr })
        )
        await timeTrackingDb.timeEntries.add(
          createEntry({ duration: 1800000, date: yesterdayStr })
        )

        const { result } = renderHook(() => useTimeInsights('local'))

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        const byDate = result.current.insights?.byDate
        expect(byDate).toHaveLength(2)

        // Sorted by date ascending
        expect(byDate?.[0].date).toBe(yesterdayStr)
        expect(byDate?.[1].date).toBe(todayStr)
      }
    })
  })

  describe('recentEntries', () => {
    it('should return entries sorted by start_time descending', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()
      const earlier = new Date(now.getTime() - 3600000)

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Earlier Entry', start_time: earlier.toISOString(), date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Later Entry', start_time: now.toISOString(), date: today })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const recent = result.current.insights?.recentEntries
      expect(recent?.[0].task_name).toBe('Later Entry')
      expect(recent?.[1].task_name).toBe('Earlier Entry')
    })

    it('should limit to 20 entries', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Add 25 entries
      for (let i = 0; i < 25; i++) {
        await timeTrackingDb.timeEntries.add(
          createEntry({ task_name: `Task ${i}`, date: today })
        )
      }

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights?.recentEntries).toHaveLength(20)
    })
  })

  describe('refetch', () => {
    it('should refetch entries when refetch is called', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights?.totalToday).toBe(0)

      // Add an entry
      await timeTrackingDb.timeEntries.add(
        createEntry({ duration: 3600000, date: today })
      )

      // Refetch
      result.current.refetch()

      await waitFor(() => {
        expect(result.current.insights?.totalToday).toBe(3600000)
      })
    })
  })

  describe('date preset filtering (AC-3.1.4, AC-3.1.5, AC-3.1.6)', () => {
    it('should filter entries by "today" preset', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'today' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include today's entry in recentEntries
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Today Task')
    })

    it('should filter entries by "yesterday" preset', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'yesterday' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include yesterday's entry in recentEntries
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Yesterday Task')
    })

    it('should filter entries by "week" preset', async () => {
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 0 })
      const beforeWeek = subDays(weekStart, 1)

      const todayStr = format(today, 'yyyy-MM-dd')
      const beforeWeekStr = format(beforeWeek, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'This Week', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Before Week', duration: 7200000, date: beforeWeekStr, start_time: beforeWeek.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'week' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include this week's entry
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('This Week')
    })

    it('should return all entries when no filter (null)', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: null }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include all entries
      expect(result.current.insights?.recentEntries).toHaveLength(2)
    })

    it('should return all entries when filters undefined', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include all entries
      expect(result.current.insights?.recentEntries).toHaveLength(2)
    })

    it('should update byTask breakdown based on filter', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-today', task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-yesterday', task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'yesterday' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // byTask should only include yesterday's task
      expect(result.current.insights?.byTask).toHaveLength(1)
      expect(result.current.insights?.byTask[0].taskName).toBe('Yesterday Task')
      expect(result.current.insights?.byTask[0].duration).toBe(7200000)
    })

    it('should return 0 totals when filter matches no entries', async () => {
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')

      // Only add entry for today
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'yesterday' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have empty results
      expect(result.current.insights?.recentEntries).toHaveLength(0)
      expect(result.current.insights?.byTask).toHaveLength(0)
    })

    it('should recalculate when filter changes', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )

      // Start with today filter
      const { result, rerender } = renderHook(
        ({ datePreset }) => useTimeInsights('local', { datePreset }),
        { initialProps: { datePreset: 'today' as const } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Today Task')

      // Change to yesterday filter
      rerender({ datePreset: 'yesterday' })

      await waitFor(() => {
        expect(result.current.insights?.recentEntries).toHaveLength(1)
        expect(result.current.insights?.recentEntries[0].task_name).toBe('Yesterday Task')
      })
    })
  })

  describe('custom date range filtering (AC-3.2.6)', () => {
    it('should filter entries by custom date range', async () => {
      const today = new Date()
      const fiveDaysAgo = subDays(today, 5)
      const tenDaysAgo = subDays(today, 10)
      const todayStr = format(today, 'yyyy-MM-dd')
      const fiveDaysAgoStr = format(fiveDaysAgo, 'yyyy-MM-dd')
      const tenDaysAgoStr = format(tenDaysAgo, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Five Days Ago', duration: 7200000, date: fiveDaysAgoStr, start_time: fiveDaysAgo.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Ten Days Ago', duration: 1800000, date: tenDaysAgoStr, start_time: tenDaysAgo.toISOString() })
      )

      // Custom range: 7 days ago to 3 days ago (should only include fiveDaysAgo)
      const customRange = {
        start: subDays(today, 7),
        end: subDays(today, 3),
      }

      const { result } = renderHook(() => useTimeInsights('local', { customRange }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include entry from 5 days ago
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Five Days Ago')
    })

    it('should ignore customRange when datePreset is set', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const fiveDaysAgo = subDays(today, 5)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
      const fiveDaysAgoStr = format(fiveDaysAgo, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Yesterday Task', duration: 7200000, date: yesterdayStr, start_time: yesterday.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Five Days Ago', duration: 1800000, date: fiveDaysAgoStr, start_time: fiveDaysAgo.toISOString() })
      )

      // Set both preset and custom range - preset should take precedence
      const customRange = {
        start: subDays(today, 10),
        end: subDays(today, 3),
      }

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'today', customRange }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // datePreset 'today' should be used, not customRange
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Today Task')
    })

    it('should use customRange when datePreset is null', async () => {
      const today = new Date()
      const threeDaysAgo = subDays(today, 3)
      const todayStr = format(today, 'yyyy-MM-dd')
      const threeDaysAgoStr = format(threeDaysAgo, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Three Days Ago', duration: 7200000, date: threeDaysAgoStr, start_time: threeDaysAgo.toISOString() })
      )

      // Custom range for 3 days ago only
      const customRange = {
        start: threeDaysAgo,
        end: threeDaysAgo,
      }

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: null, customRange }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include entry from 3 days ago
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Three Days Ago')
    })

    it('should update byTask breakdown based on custom range', async () => {
      const today = new Date()
      const fiveDaysAgo = subDays(today, 5)
      const todayStr = format(today, 'yyyy-MM-dd')
      const fiveDaysAgoStr = format(fiveDaysAgo, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-today', task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-past', task_name: 'Past Task', duration: 7200000, date: fiveDaysAgoStr, start_time: fiveDaysAgo.toISOString() })
      )

      const customRange = {
        start: subDays(today, 7),
        end: subDays(today, 3),
      }

      const { result } = renderHook(() => useTimeInsights('local', { customRange }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // byTask should only include past task
      expect(result.current.insights?.byTask).toHaveLength(1)
      expect(result.current.insights?.byTask[0].taskName).toBe('Past Task')
      expect(result.current.insights?.byTask[0].duration).toBe(7200000)
    })

    it('should recalculate when customRange changes', async () => {
      const today = new Date()
      const threeDaysAgo = subDays(today, 3)
      const fiveDaysAgo = subDays(today, 5)
      const todayStr = format(today, 'yyyy-MM-dd')
      const threeDaysAgoStr = format(threeDaysAgo, 'yyyy-MM-dd')
      const fiveDaysAgoStr = format(fiveDaysAgo, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Today Task', duration: 3600000, date: todayStr, start_time: today.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Three Days Ago', duration: 7200000, date: threeDaysAgoStr, start_time: threeDaysAgo.toISOString() })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_name: 'Five Days Ago', duration: 1800000, date: fiveDaysAgoStr, start_time: fiveDaysAgo.toISOString() })
      )

      // Start with range for 3 days ago
      const initialRange = {
        start: threeDaysAgo,
        end: threeDaysAgo,
      }

      const { result, rerender } = renderHook(
        ({ customRange }) => useTimeInsights('local', { customRange }),
        { initialProps: { customRange: initialRange } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_name).toBe('Three Days Ago')

      // Change to range for 5 days ago
      const newRange = {
        start: fiveDaysAgo,
        end: fiveDaysAgo,
      }
      rerender({ customRange: newRange })

      await waitFor(() => {
        expect(result.current.insights?.recentEntries).toHaveLength(1)
        expect(result.current.insights?.recentEntries[0].task_name).toBe('Five Days Ago')
      })
    })
  })

  describe('task filtering (AC-3.3.3)', () => {
    it('should filter entries by taskId', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Task One', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Task Two', duration: 7200000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Task One', duration: 1800000, date: today })
      )

      const { result } = renderHook(() => useTimeInsights('local', { taskIds: ['task-1'] }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include entries for task-1
      expect(result.current.insights?.recentEntries).toHaveLength(2)
      expect(result.current.insights?.recentEntries.every(e => e.task_id === 'task-1')).toBe(true)

      // byTask should only show task-1
      expect(result.current.insights?.byTask).toHaveLength(1)
      expect(result.current.insights?.byTask[0].taskId).toBe('task-1')
      expect(result.current.insights?.byTask[0].duration).toBe(5400000) // 3600000 + 1800000
    })

    it('should include all entries when taskId is null', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Task One', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Task Two', duration: 7200000, date: today })
      )

      const { result } = renderHook(() => useTimeInsights('local', { taskIds: null }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include all entries
      expect(result.current.insights?.recentEntries).toHaveLength(2)
    })
  })

  describe('category filtering (AC-3.3.5)', () => {
    it('should filter entries by category using taskCategories map', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Work Task', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Personal Task', duration: 7200000, date: today })
      )

      // Create taskCategories map
      const taskCategories = new Map<string, string | null>([
        ['task-1', 'Work'],
        ['task-2', 'Personal'],
      ])

      const { result } = renderHook(() => useTimeInsights('local', { category: 'Work', taskCategories }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include entries for Work category
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_id).toBe('task-1')
    })

    it('should include all entries when category is null', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Work Task', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Personal Task', duration: 7200000, date: today })
      )

      const taskCategories = new Map<string, string | null>([
        ['task-1', 'Work'],
        ['task-2', 'Personal'],
      ])

      const { result } = renderHook(() => useTimeInsights('local', { category: null, taskCategories }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include all entries
      expect(result.current.insights?.recentEntries).toHaveLength(2)
    })
  })

  describe('combined filters (AC-3.3.6)', () => {
    it('should apply AND logic for date + task filters', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-1',
          task_name: 'Task One Today',
          duration: 3600000,
          date: todayStr,
          start_time: today.toISOString(),
          end_time: today.toISOString(),
        })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-1',
          task_name: 'Task One Yesterday',
          duration: 7200000,
          date: yesterdayStr,
          start_time: yesterday.toISOString(),
          end_time: yesterday.toISOString(),
        })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-2',
          task_name: 'Task Two Today',
          duration: 1800000,
          date: todayStr,
          start_time: today.toISOString(),
          end_time: today.toISOString(),
        })
      )

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'today', taskIds: ['task-1'] }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include task-1 entries from today
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_id).toBe('task-1')
      expect(result.current.insights?.recentEntries[0].date).toBe(todayStr)
    })

    it('should apply AND logic for date + category filters', async () => {
      const today = new Date()
      const yesterday = subDays(today, 1)
      const todayStr = format(today, 'yyyy-MM-dd')
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-1',
          task_name: 'Work Today',
          duration: 3600000,
          date: todayStr,
          start_time: today.toISOString(),
          end_time: today.toISOString(),
        })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-1',
          task_name: 'Work Yesterday',
          duration: 7200000,
          date: yesterdayStr,
          start_time: yesterday.toISOString(),
          end_time: yesterday.toISOString(),
        })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({
          task_id: 'task-2',
          task_name: 'Personal Today',
          duration: 1800000,
          date: todayStr,
          start_time: today.toISOString(),
          end_time: today.toISOString(),
        })
      )

      const taskCategories = new Map<string, string | null>([
        ['task-1', 'Work'],
        ['task-2', 'Personal'],
      ])

      const { result } = renderHook(() => useTimeInsights('local', { datePreset: 'today', category: 'Work', taskCategories }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include Work category entries from today
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_id).toBe('task-1')
      expect(result.current.insights?.recentEntries[0].date).toBe(todayStr)
    })

    it('should apply AND logic for task + category + date filters', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Work Task 1', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Work Task 2', duration: 7200000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-3', task_name: 'Personal Task', duration: 1800000, date: today })
      )

      const taskCategories = new Map<string, string | null>([
        ['task-1', 'Work'],
        ['task-2', 'Work'],
        ['task-3', 'Personal'],
      ])

      // Filter by task-1, which is in Work category
      const { result } = renderHook(() => useTimeInsights('local', {
        datePreset: 'today',
        taskIds: ['task-1'],
        category: 'Work',
        taskCategories
      }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should only include task-1 (matches both task and category filter)
      expect(result.current.insights?.recentEntries).toHaveLength(1)
      expect(result.current.insights?.recentEntries[0].task_id).toBe('task-1')
    })
  })

  describe('entries return value (Story 3.3)', () => {
    it('should return raw entries for deriving filter options', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')

      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-1', task_name: 'Task One', duration: 3600000, date: today })
      )
      await timeTrackingDb.timeEntries.add(
        createEntry({ task_id: 'task-2', task_name: 'Task Two', duration: 7200000, date: today })
      )

      const { result } = renderHook(() => useTimeInsights('local'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should include entries array in return value
      expect(result.current.entries).toBeDefined()
      expect(result.current.entries).toHaveLength(2)
    })
  })
})
