import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DateRangePicker } from './DateRangePicker'

describe('DateRangePicker', () => {
  describe('Popover behavior (AC-3.2.1)', () => {
    it('should render children as trigger', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={false}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      expect(screen.getByText('Open Picker')).toBeTruthy()
    })

    it('should show calendar when isOpen is true', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      // Should show month navigation
      expect(screen.getByLabelText('Previous month')).toBeTruthy()
      expect(screen.getByLabelText('Next month')).toBeTruthy()

      // Should show weekday headers
      expect(screen.getByText('Su')).toBeTruthy()
      expect(screen.getByText('Mo')).toBeTruthy()
    })

    it('should not show calendar when isOpen is false', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={false}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      expect(screen.queryByLabelText('Previous month')).toBeNull()
    })
  })

  describe('Date selection (AC-3.2.2)', () => {
    it('should show Apply and Cancel buttons', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      expect(screen.getByText('Apply')).toBeTruthy()
      expect(screen.getByText('Cancel')).toBeTruthy()
    })

    it('should call onClose when Cancel is clicked', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      fireEvent.click(screen.getByText('Cancel'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should disable Apply button when no date selected', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      const applyButton = screen.getByText('Apply')
      expect(applyButton).toHaveProperty('disabled', true)
    })
  })

  describe('Month navigation', () => {
    it('should show current month name and year', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      // Current month should be displayed
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      expect(screen.getByText(currentMonth)).toBeTruthy()
    })

    it('should navigate to previous month when clicking prev button', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      const currentMonth = new Date()
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
      const prevMonthText = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      fireEvent.click(screen.getByLabelText('Previous month'))

      expect(screen.getByText(prevMonthText)).toBeTruthy()
    })

    it('should navigate to next month when clicking next button', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      const currentMonth = new Date()
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
      const nextMonthText = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      fireEvent.click(screen.getByLabelText('Next month'))

      expect(screen.getByText(nextMonthText)).toBeTruthy()
    })
  })

  describe('Calendar grid', () => {
    it('should render calendar grid with role="grid"', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      expect(screen.getByRole('grid')).toBeTruthy()
    })

    it('should render weekday headers', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      for (const day of weekdays) {
        expect(screen.getByText(day)).toBeTruthy()
      }
    })
  })

  describe('Accessibility (AC-3.2.8)', () => {
    it('should have accessible labels on navigation buttons', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      expect(screen.getByLabelText('Previous month')).toBeTruthy()
      expect(screen.getByLabelText('Next month')).toBeTruthy()
    })

    it('should have aria-label on calendar grid', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={null}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      expect(screen.getByLabelText('Calendar')).toBeTruthy()
    })
  })

  describe('Initial state with selectedRange', () => {
    it('should show selected range when provided', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()
      const selectedRange = {
        start: new Date(2026, 0, 5),
        end: new Date(2026, 0, 10),
      }

      render(
        <DateRangePicker
          isOpen={true}
          selectedRange={selectedRange}
          onSelect={onSelect}
          onClose={onClose}
        >
          <button>Open Picker</button>
        </DateRangePicker>
      )

      // Should enable Apply button since range is already selected
      const applyButton = screen.getByText('Apply')
      expect(applyButton).toHaveProperty('disabled', false)
    })
  })
})
