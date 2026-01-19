import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickFilterBar } from './QuickFilterBar'
import type { DatePreset } from '../../types/timeTracking'

describe('QuickFilterBar', () => {
  describe('Rendering (AC-3.1.1)', () => {
    it('should render 6 pills with correct labels', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      expect(screen.getByText('All Time')).toBeTruthy()
      expect(screen.getByText('Today')).toBeTruthy()
      expect(screen.getByText('Yesterday')).toBeTruthy()
      expect(screen.getByText('This Week')).toBeTruthy()
      expect(screen.getByText('This Month')).toBeTruthy()
      expect(screen.getByText('Custom')).toBeTruthy()
    })

    it('should render pills as buttons with radio role', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBe(6) // All Time, Today, Yesterday, This Week, This Month, Custom
    })

    it('should have radiogroup role on container', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      expect(screen.getByRole('radiogroup')).toBeTruthy()
    })

    it('should have accessible aria-label on container', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup.getAttribute('aria-label')).toBe('Date filter')
    })
  })

  describe('Selection State (AC-3.1.2, AC-3.1.8)', () => {
    it('should highlight active preset with filled styling', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="today" onPresetSelect={onPresetSelect} />)

      const todayButton = screen.getByText('Today')
      expect(todayButton.className).toContain('bg-slate-600')
      expect(todayButton.className).toContain('text-white')
    })

    it('should show non-active presets with default styling', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="today" onPresetSelect={onPresetSelect} />)

      const yesterdayButton = screen.getByText('Yesterday')
      expect(yesterdayButton.className).toContain('border')
      expect(yesterdayButton.className).toContain('text-slate-600')
      expect(yesterdayButton.className).not.toContain('bg-slate-600')
    })

    it('should set aria-checked="true" on active preset', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="week" onPresetSelect={onPresetSelect} />)

      const weekButton = screen.getByText('This Week')
      expect(weekButton.getAttribute('aria-checked')).toBe('true')
    })

    it('should set aria-checked="false" on non-active presets', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="week" onPresetSelect={onPresetSelect} />)

      const todayButton = screen.getByText('Today')
      expect(todayButton.getAttribute('aria-checked')).toBe('false')
    })

    it('should only allow one preset to be active at a time', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="month" onPresetSelect={onPresetSelect} />)

      const checkedRadios = screen.getAllByRole('radio').filter(
        (radio) => radio.getAttribute('aria-checked') === 'true'
      )
      expect(checkedRadios.length).toBe(1)
    })
  })

  describe('Click Behavior (AC-3.1.3)', () => {
    it('should call onPresetSelect with preset value when clicking inactive pill', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      fireEvent.click(screen.getByText('Today'))

      expect(onPresetSelect).toHaveBeenCalledTimes(1)
      expect(onPresetSelect).toHaveBeenCalledWith('today')
    })

    it('should call onPresetSelect with null when clicking active pill (toggle off)', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="today" onPresetSelect={onPresetSelect} />)

      fireEvent.click(screen.getByText('Today'))

      expect(onPresetSelect).toHaveBeenCalledTimes(1)
      expect(onPresetSelect).toHaveBeenCalledWith(null)
    })

    it('should call onPresetSelect with new preset when switching presets', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset="today" onPresetSelect={onPresetSelect} />)

      fireEvent.click(screen.getByText('Yesterday'))

      expect(onPresetSelect).toHaveBeenCalledWith('yesterday')
    })

    it('should call onPresetSelect for each preset correctly', () => {
      const presets: Array<{ text: string; value: Exclude<DatePreset, null> }> = [
        { text: 'All Time', value: 'all' },
        { text: 'Today', value: 'today' },
        { text: 'Yesterday', value: 'yesterday' },
        { text: 'This Week', value: 'week' },
        { text: 'This Month', value: 'month' },
      ]

      for (const { text, value } of presets) {
        const onPresetSelect = vi.fn()
        const { unmount } = render(
          <QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />
        )

        fireEvent.click(screen.getByText(text))

        expect(onPresetSelect).toHaveBeenCalledWith(value)
        unmount()
      }
    })
  })

  describe('Custom Button (Story 3.2)', () => {
    it('should render Custom button as enabled', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const customButton = screen.getByText('Custom')
      expect(customButton).toHaveProperty('disabled', false)
    })

    it('should call onCustomClick when clicking Custom button', () => {
      const onPresetSelect = vi.fn()
      const onCustomClick = vi.fn()
      render(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          onCustomClick={onCustomClick}
        />
      )

      fireEvent.click(screen.getByText('Custom'))

      expect(onCustomClick).toHaveBeenCalledTimes(1)
    })

    it('should show custom range label when hasCustomRange is true', () => {
      const onPresetSelect = vi.fn()
      render(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          hasCustomRange={true}
          customRangeLabel="Dec 1 - Dec 15"
        />
      )

      expect(screen.getByText('Dec 1 - Dec 15')).toBeTruthy()
    })

    it('should show "Custom" when no custom range is active', () => {
      const onPresetSelect = vi.fn()
      render(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          hasCustomRange={false}
        />
      )

      expect(screen.getByText('Custom')).toBeTruthy()
    })

    it('should have active styling when hasCustomRange is true', () => {
      const onPresetSelect = vi.fn()
      render(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          hasCustomRange={true}
          customRangeLabel="Dec 1 - Dec 15"
        />
      )

      const customButton = screen.getByText('Dec 1 - Dec 15')
      expect(customButton.className).toContain('bg-slate-600')
      expect(customButton.className).toContain('text-white')
    })

    it('should have default styling when hasCustomRange is false', () => {
      const onPresetSelect = vi.fn()
      render(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          hasCustomRange={false}
        />
      )

      const customButton = screen.getByText('Custom')
      expect(customButton.className).toContain('border')
      expect(customButton.className).toContain('text-slate-600')
    })

    it('should set aria-checked based on hasCustomRange', () => {
      const onPresetSelect = vi.fn()
      const { rerender } = render(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          hasCustomRange={false}
        />
      )

      expect(screen.getByText('Custom').getAttribute('aria-checked')).toBe('false')

      rerender(
        <QuickFilterBar
          activePreset={null}
          onPresetSelect={onPresetSelect}
          hasCustomRange={true}
          customRangeLabel="Dec 1 - Dec 15"
        />
      )

      expect(screen.getByText('Dec 1 - Dec 15').getAttribute('aria-checked')).toBe('true')
    })
  })

  describe('Styling (UX Spec)', () => {
    it('should have rounded-full class on pills', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const todayButton = screen.getByText('Today')
      expect(todayButton.className).toContain('rounded-full')
    })

    it('should have correct padding classes', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const todayButton = screen.getByText('Today')
      expect(todayButton.className).toContain('px-3')
      expect(todayButton.className).toContain('py-1')
    })

    it('should have text-sm class', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const todayButton = screen.getByText('Today')
      expect(todayButton.className).toContain('text-sm')
    })

    it('should have font-medium class', () => {
      const onPresetSelect = vi.fn()
      render(<QuickFilterBar activePreset={null} onPresetSelect={onPresetSelect} />)

      const todayButton = screen.getByText('Today')
      expect(todayButton.className).toContain('font-medium')
    })
  })
})
