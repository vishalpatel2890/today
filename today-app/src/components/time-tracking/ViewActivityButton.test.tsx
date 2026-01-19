import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewActivityButton } from './ViewActivityButton'

describe('ViewActivityButton', () => {
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

  beforeEach(() => {
    mockConsoleLog.mockClear()
  })

  afterEach(() => {
    mockConsoleLog.mockReset()
  })

  it('renders with correct aria-label and title', () => {
    render(<ViewActivityButton timeEntryId="test-123" />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'View Activity')
  })

  it('renders with correct styling classes', () => {
    render(<ViewActivityButton timeEntryId="test-123" />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toHaveClass('flex-1', 'h-full', 'bg-blue-500', 'text-white')
  })

  it('logs placeholder message on click with timeEntryId', () => {
    render(<ViewActivityButton timeEntryId="test-entry-456" />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    fireEvent.click(button)

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[Epic 2] View Activity clicked - modal in Epic 4',
      { timeEntryId: 'test-entry-456' }
    )
  })

  it('stops event propagation on click', () => {
    const parentClickHandler = vi.fn()

    render(
      <div onClick={parentClickHandler}>
        <ViewActivityButton timeEntryId="test-123" />
      </div>
    )

    const button = screen.getByRole('button', { name: 'View Activity' })
    fireEvent.click(button)

    expect(parentClickHandler).not.toHaveBeenCalled()
  })

  it('renders with tabIndex 0 by default', () => {
    render(<ViewActivityButton timeEntryId="test-123" />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toHaveAttribute('tabIndex', '0')
  })

  it('renders with custom tabIndex when provided', () => {
    render(<ViewActivityButton timeEntryId="test-123" tabIndex={-1} />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    expect(button).toHaveAttribute('tabIndex', '-1')
  })

  it('renders Activity icon', () => {
    render(<ViewActivityButton timeEntryId="test-123" />)

    const button = screen.getByRole('button', { name: 'View Activity' })
    // lucide-react Activity icon renders as SVG
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('h-4', 'w-4')
  })
})
