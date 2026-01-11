import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterChip } from './FilterChip'

describe('FilterChip', () => {
  describe('Rendering', () => {
    it('should render the label text', () => {
      const onRemove = vi.fn()
      render(<FilterChip label="Dec 1 - Dec 15" onRemove={onRemove} />)

      expect(screen.getByText('Dec 1 - Dec 15')).toBeTruthy()
    })

    it('should render remove button with X icon', () => {
      const onRemove = vi.fn()
      render(<FilterChip label="Dec 1 - Dec 15" onRemove={onRemove} />)

      // Should have a button with accessible label
      expect(screen.getByRole('button', { name: /remove dec 1 - dec 15 filter/i })).toBeTruthy()
    })
  })

  describe('Behavior', () => {
    it('should call onRemove when remove button is clicked', () => {
      const onRemove = vi.fn()
      render(<FilterChip label="Dec 1 - Dec 15" onRemove={onRemove} />)

      const removeButton = screen.getByRole('button', { name: /remove/i })
      fireEvent.click(removeButton)

      expect(onRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('Styling', () => {
    it('should have chip styling classes', () => {
      const onRemove = vi.fn()
      render(<FilterChip label="Dec 1 - Dec 15" onRemove={onRemove} />)

      const chip = screen.getByText('Dec 1 - Dec 15').parentElement
      expect(chip?.className).toContain('rounded-full')
      expect(chip?.className).toContain('bg-slate-600')
      expect(chip?.className).toContain('text-white')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label on remove button', () => {
      const onRemove = vi.fn()
      render(<FilterChip label="This Week" onRemove={onRemove} />)

      const removeButton = screen.getByRole('button', { name: 'Remove This Week filter' })
      expect(removeButton).toBeTruthy()
    })
  })
})
