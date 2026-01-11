import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsightRow } from './InsightRow'
import type { TimeEntry } from '../../types/timeTracking'
import { format, subDays } from 'date-fns'

describe('InsightRow', () => {
  // Use a fixed local date for consistent testing
  // Set to Jan 10, 2026 at 3:00 PM local time
  const FIXED_NOW = new Date(2026, 0, 10, 15, 0, 0) // Local time

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper to create ISO string from local date components
  const toISOLocal = (year: number, month: number, day: number, hour: number, minute: number): string => {
    return new Date(year, month, day, hour, minute, 0).toISOString()
  }

  // Helper to create a TimeEntry for testing
  const createEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => {
    const defaultStart = toISOLocal(2026, 0, 10, 14, 30) // Jan 10, 2026 2:30 PM local
    return {
      id: 'entry-1',
      user_id: 'user-1',
      task_id: 'task-1',
      task_name: 'Test Task',
      start_time: defaultStart,
      end_time: toISOLocal(2026, 0, 10, 15, 0),
      duration: 1800000, // 30 minutes
      date: '2026-01-10',
      created_at: defaultStart,
      updated_at: toISOLocal(2026, 0, 10, 15, 0),
      ...overrides,
    }
  }

  describe('rendering', () => {
    it('should render timestamp, task name, and duration', () => {
      const entry = createEntry()
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Today 2:30pm')).toBeTruthy()
      expect(screen.getByText('Test Task')).toBeTruthy()
      expect(screen.getByText('30m')).toBeTruthy()
    })

    it('should render hours and minutes for longer durations', () => {
      const entry = createEntry({
        duration: 5400000, // 1h 30m
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('1h 30m')).toBeTruthy()
    })

    it('should render just hours when minutes are zero', () => {
      const entry = createEntry({
        duration: 7200000, // 2h
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('2h')).toBeTruthy()
    })

    it('should render "< 1m" for very short durations', () => {
      const entry = createEntry({
        duration: 30000, // 30 seconds
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('< 1m')).toBeTruthy()
    })
  })

  describe('relative timestamps', () => {
    it('should show "Today" for today entries', () => {
      const entry = createEntry({
        start_time: toISOLocal(2026, 0, 10, 9, 0), // Jan 10, 2026 9:00 AM local
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Today 9:00am')).toBeTruthy()
    })

    it('should show "Yesterday" for yesterday entries', () => {
      const entry = createEntry({
        start_time: toISOLocal(2026, 0, 9, 16, 45), // Jan 9, 2026 4:45 PM local
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Yesterday 4:45pm')).toBeTruthy()
    })

    it('should show day abbreviation for entries within 7 days', () => {
      // Jan 8, 2026 is a Thursday
      const entry = createEntry({
        start_time: toISOLocal(2026, 0, 8, 10, 30), // Jan 8, 2026 10:30 AM local
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Thu 10:30am')).toBeTruthy()
    })

    it('should show month and day for older entries', () => {
      const entry = createEntry({
        start_time: toISOLocal(2025, 11, 15, 14, 0), // Dec 15, 2025 2:00 PM local
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Dec 15 2:00pm')).toBeTruthy()
    })
  })

  describe('task name handling', () => {
    it('should display short task names fully', () => {
      const entry = createEntry({
        task_name: 'Bug fix',
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Bug fix')).toBeTruthy()
    })

    it('should render long task names (CSS handles truncation)', () => {
      const longName = 'This is a very long task name that should be truncated with ellipsis in the UI'
      const entry = createEntry({
        task_name: longName,
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText(longName)).toBeTruthy()
    })

    it('should handle task names with special characters', () => {
      const entry = createEntry({
        task_name: 'Fix bug #123 - "Critical" issue',
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Fix bug #123 - "Critical" issue')).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('should have role="listitem"', () => {
      const entry = createEntry()
      render(<InsightRow entry={entry} />)

      expect(screen.getByRole('listitem')).toBeTruthy()
    })

    it('should have descriptive aria-label', () => {
      const entry = createEntry({
        task_name: 'Review PR',
        duration: 3600000, // 1h
        start_time: toISOLocal(2026, 0, 10, 14, 30), // 2:30 PM local
      })
      render(<InsightRow entry={entry} />)

      const listitem = screen.getByRole('listitem')
      expect(listitem.getAttribute('aria-label')).toBe('Review PR: 1h on Today 2:30pm')
    })

    it('should include correct aria-label for multi-word durations', () => {
      const entry = createEntry({
        task_name: 'Code review',
        duration: 5400000, // 1h 30m
        start_time: toISOLocal(2026, 0, 10, 14, 30), // 2:30 PM local
      })
      render(<InsightRow entry={entry} />)

      const listitem = screen.getByRole('listitem')
      expect(listitem.getAttribute('aria-label')).toBe('Code review: 1h 30m on Today 2:30pm')
    })
  })

  describe('styling', () => {
    it('should have hover transition class', () => {
      const entry = createEntry()
      render(<InsightRow entry={entry} />)

      const listitem = screen.getByRole('listitem')
      expect(listitem.className).toContain('hover:bg-slate-50')
      expect(listitem.className).toContain('transition-colors')
    })

    it('should have appropriate padding', () => {
      const entry = createEntry()
      render(<InsightRow entry={entry} />)

      const listitem = screen.getByRole('listitem')
      expect(listitem.className).toContain('px-4')
      expect(listitem.className).toContain('py-2.5')
    })

    it('should have flex layout for proper alignment', () => {
      const entry = createEntry()
      render(<InsightRow entry={entry} />)

      const listitem = screen.getByRole('listitem')
      expect(listitem.className).toContain('flex')
      expect(listitem.className).toContain('items-center')
      expect(listitem.className).toContain('justify-between')
    })
  })

  describe('edge cases', () => {
    it('should handle null task_id (deleted task)', () => {
      const entry = createEntry({
        task_id: null,
        task_name: 'Deleted Task',
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('Deleted Task')).toBeTruthy()
    })

    it('should handle zero duration gracefully', () => {
      const entry = createEntry({
        duration: 0,
      })
      render(<InsightRow entry={entry} />)

      expect(screen.getByText('0m')).toBeTruthy()
    })
  })
})
