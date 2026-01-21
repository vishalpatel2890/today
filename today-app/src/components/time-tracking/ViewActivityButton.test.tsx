import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ViewActivityButton } from './ViewActivityButton'

// Mock the electronBridge module
vi.mock('../../lib/electronBridge', () => ({
  electronBridge: {
    activity: {
      getLog: vi.fn().mockResolvedValue({ success: true, data: [] }),
    },
  },
}))

describe('ViewActivityButton', () => {
  const defaultProps = {
    timeEntryId: 'test-123',
    taskName: 'Test Task',
    startTime: '2026-01-18T09:00:00Z',
    endTime: '2026-01-18T10:30:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with correct aria-label and title', () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'View Activity')
  })

  it('renders with correct styling classes', () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toHaveClass('flex-1', 'h-full', 'bg-blue-500', 'text-white')
  })

  it('opens modal on click (AC4.2.1)', async () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    fireEvent.click(button)

    // Modal should open with task name in header
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })

  it('stops event propagation on click', () => {
    const parentClickHandler = vi.fn()

    render(
      <div onClick={parentClickHandler}>
        <ViewActivityButton {...defaultProps} />
      </div>
    )

    const button = screen.getByRole('button', { name: 'View Activity' })
    fireEvent.click(button)

    expect(parentClickHandler).not.toHaveBeenCalled()
  })

  it('renders with tabIndex 0 by default', () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toHaveAttribute('tabIndex', '0')
  })

  it('renders with custom tabIndex when provided', () => {
    render(<ViewActivityButton {...defaultProps} tabIndex={-1} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toHaveAttribute('tabIndex', '-1')
  })

  it('renders Activity icon', () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    // lucide-react Activity icon renders as SVG
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('h-4', 'w-4')
  })

  it('displays formatted date and time range in modal header (AC4.2.2)', async () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    fireEvent.click(button)

    await waitFor(() => {
      // Should show formatted date and time range (exact times vary by timezone)
      expect(screen.getByText(/Jan 18, 2026/)).toBeInTheDocument()
      // Check for time range format (X:XX AM/PM - X:XX AM/PM)
      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M/)).toBeInTheDocument()
    })
  })

  it('modal can be closed via X button (AC4.2.7)', async () => {
    render(<ViewActivityButton {...defaultProps} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    fireEvent.click(button)

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Click the close button
    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument()
    })
  })
})
