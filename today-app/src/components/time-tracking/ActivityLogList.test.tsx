import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityLogList } from './ActivityLogList'
import type { ActivityEntryWithDuration } from '../../hooks/useActivityLog'

describe('ActivityLogList', () => {
  const mockEntries: ActivityEntryWithDuration[] = [
    {
      id: '1',
      timeEntryId: 'entry-123',
      timestamp: '2026-01-18T09:00:15Z',
      appName: 'VS Code',
      windowTitle: 'index.ts - today-app',
      durationMs: 5 * 60 * 1000,
      durationFormatted: '5m',
    },
    {
      id: '2',
      timeEntryId: 'entry-123',
      timestamp: '2026-01-18T09:05:32Z',
      appName: 'Chrome',
      windowTitle: 'React Documentation - Google Chrome',
      durationMs: 3 * 60 * 1000 + 28 * 1000,
      durationFormatted: '3m 28s',
    },
    {
      id: '3',
      timeEntryId: 'entry-123',
      timestamp: '2026-01-18T09:09:00Z',
      appName: 'Slack',
      windowTitle: '#engineering - Slack',
      durationMs: 1 * 60 * 1000,
      durationFormatted: '1m',
    },
  ]

  it('renders activity entries with correct format (AC4.2.4, AC4.2.5)', () => {
    render(<ActivityLogList entries={mockEntries} />)

    // Check time format (h:mm:ss a) - times shown in local timezone
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}:\d{2} [AP]M/)
    expect(timeElements).toHaveLength(3)

    // Check app names
    expect(screen.getByText('VS Code')).toBeInTheDocument()
    expect(screen.getByText('Chrome')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()

    // Check window titles
    expect(screen.getByText('index.ts - today-app')).toBeInTheDocument()
    expect(screen.getByText('React Documentation - Google Chrome')).toBeInTheDocument()
    expect(screen.getByText('#engineering - Slack')).toBeInTheDocument()

    // Check durations
    expect(screen.getByText('5m')).toBeInTheDocument()
    expect(screen.getByText('3m 28s')).toBeInTheDocument()
    expect(screen.getByText('1m')).toBeInTheDocument()
  })

  it('renders entries in chronological order (AC4.2.4)', () => {
    render(<ActivityLogList entries={mockEntries} />)

    // Check that all 3 list items are rendered in order
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)

    // First item should contain VS Code (first in chronological order)
    expect(items[0]).toHaveTextContent('VS Code')
    expect(items[0]).toHaveTextContent('index.ts - today-app')

    // Second item should contain Chrome
    expect(items[1]).toHaveTextContent('Chrome')

    // Third item should contain Slack
    expect(items[2]).toHaveTextContent('Slack')
  })

  it('shows empty state when no entries (AC4.2.9)', () => {
    render(<ActivityLogList entries={[]} />)

    expect(screen.getByText('No activity recorded for this session')).toBeInTheDocument()
  })

  it('has scrollable container with max-height (AC4.2.6)', () => {
    render(<ActivityLogList entries={mockEntries} />)

    const list = screen.getByRole('list', { name: 'Activity log entries' })
    expect(list).toHaveClass('overflow-y-auto')
    expect(list).toHaveClass('max-h-[400px]')
  })

  it('has proper accessibility attributes', () => {
    render(<ActivityLogList entries={mockEntries} />)

    const list = screen.getByRole('list', { name: 'Activity log entries' })
    expect(list).toBeInTheDocument()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('window titles have tooltip (title attribute)', () => {
    render(<ActivityLogList entries={mockEntries} />)

    const windowTitle = screen.getByText('index.ts - today-app')
    expect(windowTitle).toHaveAttribute('title', 'index.ts - today-app')
  })

  it('window titles are truncated with ellipsis', () => {
    render(<ActivityLogList entries={mockEntries} />)

    const windowTitle = screen.getByText('index.ts - today-app')
    expect(windowTitle).toHaveClass('truncate')
  })
})
