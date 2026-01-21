import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivitySummary } from './ActivitySummary'
import type { ActivitySummaryItem } from '../../hooks/useActivityLog'

/**
 * Component tests for ActivitySummary
 * Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Task-4
 */
describe('ActivitySummary', () => {
  const mockItems: ActivitySummaryItem[] = [
    { appName: 'VS Code', totalDurationMs: 600000, totalDurationFormatted: '10m', percentage: 50 },
    { appName: 'Chrome', totalDurationMs: 360000, totalDurationFormatted: '6m', percentage: 30 },
    { appName: 'Slack', totalDurationMs: 240000, totalDurationFormatted: '4m', percentage: 20 },
  ]

  it('renders nothing when items array is empty (hides section)', () => {
    const { container } = render(
      <ActivitySummary items={[]} totalDurationFormatted="0s" />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders summary items with app name, duration, and percentage (AC4.3.3)', () => {
    render(<ActivitySummary items={mockItems} totalDurationFormatted="20m" />)

    // Check app names
    expect(screen.getByText('VS Code')).toBeInTheDocument()
    expect(screen.getByText('Chrome')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()

    // Check durations
    expect(screen.getByText('10m')).toBeInTheDocument()
    expect(screen.getByText('6m')).toBeInTheDocument()
    expect(screen.getByText('4m')).toBeInTheDocument()

    // Check percentages
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('renders progress bars with correct width based on percentage (AC4.3.4)', () => {
    render(<ActivitySummary items={mockItems} totalDurationFormatted="20m" />)

    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars).toHaveLength(3)

    // Check aria attributes
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '50')
    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '30')
    expect(progressBars[2]).toHaveAttribute('aria-valuenow', '20')

    // Check inner bar widths via style
    const innerBars = progressBars.map(pb => pb.querySelector('div'))
    expect(innerBars[0]).toHaveStyle({ width: '50%' })
    expect(innerBars[1]).toHaveStyle({ width: '30%' })
    expect(innerBars[2]).toHaveStyle({ width: '20%' })
  })

  it('displays total duration in header', () => {
    render(<ActivitySummary items={mockItems} totalDurationFormatted="1h 20m" />)

    expect(screen.getByText('Total: 1h 20m')).toBeInTheDocument()
  })

  it('renders section header "Time by App"', () => {
    render(<ActivitySummary items={mockItems} totalDurationFormatted="20m" />)

    expect(screen.getByText('Time by App')).toBeInTheDocument()
  })

  it('renders list with proper accessibility attributes', () => {
    render(<ActivitySummary items={mockItems} totalDurationFormatted="20m" />)

    const list = screen.getByRole('list', { name: 'Time spent per application' })
    expect(list).toBeInTheDocument()

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  it('renders progress bar with accessible label', () => {
    render(<ActivitySummary items={mockItems} totalDurationFormatted="20m" />)

    const vsCodeBar = screen.getByRole('progressbar', { name: 'VS Code: 50%' })
    expect(vsCodeBar).toBeInTheDocument()
  })

  it('handles single item correctly', () => {
    const singleItem: ActivitySummaryItem[] = [
      { appName: 'VS Code', totalDurationMs: 300000, totalDurationFormatted: '5m', percentage: 100 },
    ]

    render(<ActivitySummary items={singleItem} totalDurationFormatted="5m" />)

    expect(screen.getByText('VS Code')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar.querySelector('div')).toHaveStyle({ width: '100%' })
  })
})
