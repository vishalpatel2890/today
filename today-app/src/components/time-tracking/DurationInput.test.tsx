import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DurationInput } from './DurationInput'

describe('DurationInput', () => {
  describe('rendering', () => {
    it('should render hours and minutes inputs', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      expect(screen.getByLabelText('Hours')).toBeInTheDocument()
      expect(screen.getByLabelText('Minutes')).toBeInTheDocument()
    })

    it('should display correct hours and minutes from milliseconds', () => {
      const onChange = vi.fn()
      // 2 hours 30 minutes = 9,000,000 ms
      const twoHoursThirtyMinutes = (2 * 60 + 30) * 60 * 1000

      render(<DurationInput value={twoHoursThirtyMinutes} onChange={onChange} />)

      expect(screen.getByLabelText('Hours')).toHaveValue(2)
      expect(screen.getByLabelText('Minutes')).toHaveValue(30)
    })

    it('should display 0h 0m for zero value', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      expect(screen.getByLabelText('Hours')).toHaveValue(0)
      expect(screen.getByLabelText('Minutes')).toHaveValue(0)
    })

    it('should show h and m labels', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      expect(screen.getByText('h')).toBeInTheDocument()
      expect(screen.getByText('m')).toBeInTheDocument()
    })
  })

  describe('onChange behavior', () => {
    it('should call onChange with correct milliseconds when hours change', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      const hoursInput = screen.getByLabelText('Hours')
      fireEvent.change(hoursInput, { target: { value: '2' } })

      // 2 hours = 7,200,000 ms
      expect(onChange).toHaveBeenCalledWith(2 * 60 * 60 * 1000)
    })

    it('should call onChange with correct milliseconds when minutes change', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      const minutesInput = screen.getByLabelText('Minutes')
      fireEvent.change(minutesInput, { target: { value: '45' } })

      // 45 minutes = 2,700,000 ms
      expect(onChange).toHaveBeenCalledWith(45 * 60 * 1000)
    })

    it('should combine hours and minutes correctly', () => {
      const onChange = vi.fn()
      // Start with 1 hour
      const oneHour = 60 * 60 * 1000
      render(<DurationInput value={oneHour} onChange={onChange} />)

      const minutesInput = screen.getByLabelText('Minutes')
      fireEvent.change(minutesInput, { target: { value: '30' } })

      // 1h 30m = 5,400,000 ms
      expect(onChange).toHaveBeenCalledWith((1 * 60 + 30) * 60 * 1000)
    })
  })

  describe('validation constraints', () => {
    it('should clamp hours to max 23', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      const hoursInput = screen.getByLabelText('Hours')
      fireEvent.change(hoursInput, { target: { value: '99' } })

      // Should be clamped to 23 hours
      expect(onChange).toHaveBeenCalledWith(23 * 60 * 60 * 1000)
    })

    it('should clamp minutes to max 59', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      const minutesInput = screen.getByLabelText('Minutes')
      fireEvent.change(minutesInput, { target: { value: '99' } })

      // Should be clamped to 59 minutes
      expect(onChange).toHaveBeenCalledWith(59 * 60 * 1000)
    })

    it('should treat empty input as 0', () => {
      const onChange = vi.fn()
      const oneHour = 60 * 60 * 1000
      render(<DurationInput value={oneHour} onChange={onChange} />)

      const hoursInput = screen.getByLabelText('Hours')
      fireEvent.change(hoursInput, { target: { value: '' } })

      // Should call with 0 hours (just the existing minutes which is 0)
      expect(onChange).toHaveBeenCalledWith(0)
    })
  })

  describe('disabled state', () => {
    it('should disable both inputs when disabled prop is true', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} disabled />)

      expect(screen.getByLabelText('Hours')).toBeDisabled()
      expect(screen.getByLabelText('Minutes')).toBeDisabled()
    })
  })

  describe('edge cases', () => {
    it('should handle 23h 59m (max valid duration)', () => {
      const onChange = vi.fn()
      const maxDuration = (23 * 60 + 59) * 60 * 1000

      render(<DurationInput value={maxDuration} onChange={onChange} />)

      expect(screen.getByLabelText('Hours')).toHaveValue(23)
      expect(screen.getByLabelText('Minutes')).toHaveValue(59)
    })

    it('should handle duration with only minutes', () => {
      const onChange = vi.fn()
      const thirtyMinutes = 30 * 60 * 1000

      render(<DurationInput value={thirtyMinutes} onChange={onChange} />)

      expect(screen.getByLabelText('Hours')).toHaveValue(0)
      expect(screen.getByLabelText('Minutes')).toHaveValue(30)
    })

    it('should handle duration with only hours', () => {
      const onChange = vi.fn()
      const fiveHours = 5 * 60 * 60 * 1000

      render(<DurationInput value={fiveHours} onChange={onChange} />)

      expect(screen.getByLabelText('Hours')).toHaveValue(5)
      expect(screen.getByLabelText('Minutes')).toHaveValue(0)
    })

    it('should handle negative input as 0', () => {
      const onChange = vi.fn()
      render(<DurationInput value={0} onChange={onChange} />)

      const hoursInput = screen.getByLabelText('Hours')
      fireEvent.change(hoursInput, { target: { value: '-5' } })

      // Should clamp to 0
      expect(onChange).toHaveBeenCalledWith(0)
    })
  })
})
