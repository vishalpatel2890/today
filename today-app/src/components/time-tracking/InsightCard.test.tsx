import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsightCard } from './InsightCard'

describe('InsightCard', () => {
  describe('rendering', () => {
    it('should render label, value, and sublabel', () => {
      render(
        <InsightCard
          label="Today"
          value="3h 42m"
          sublabel="tracked"
        />
      )

      expect(screen.getByText('Today')).toBeTruthy()
      expect(screen.getByText('3h 42m')).toBeTruthy()
      expect(screen.getByText('tracked')).toBeTruthy()
    })

    it('should render with different values', () => {
      render(
        <InsightCard
          label="Avg / Day"
          value="4h 12m"
          sublabel="this week"
        />
      )

      expect(screen.getByText('Avg / Day')).toBeTruthy()
      expect(screen.getByText('4h 12m')).toBeTruthy()
      expect(screen.getByText('this week')).toBeTruthy()
    })

    it('should render 0m for zero value', () => {
      render(
        <InsightCard
          label="Today"
          value="0m"
          sublabel="tracked"
        />
      )

      expect(screen.getByText('0m')).toBeTruthy()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when isLoading is true', () => {
      render(
        <InsightCard
          label="Today"
          value="3h 42m"
          sublabel="tracked"
          isLoading={true}
        />
      )

      // Label and sublabel should still be visible
      expect(screen.getByText('Today')).toBeTruthy()
      expect(screen.getByText('tracked')).toBeTruthy()

      // Value should not be visible (skeleton shown instead)
      expect(screen.queryByText('3h 42m')).toBeNull()
    })

    it('should show value when isLoading is false', () => {
      render(
        <InsightCard
          label="Today"
          value="3h 42m"
          sublabel="tracked"
          isLoading={false}
        />
      )

      expect(screen.getByText('3h 42m')).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('should have accessible aria-label with full context', () => {
      render(
        <InsightCard
          label="Today"
          value="3h 42m"
          sublabel="tracked"
        />
      )

      const region = screen.getByRole('region')
      expect(region.getAttribute('aria-label')).toBe('Today: 3h 42m tracked')
    })

    it('should have role="region" for screen readers', () => {
      render(
        <InsightCard
          label="Today"
          value="3h 42m"
          sublabel="tracked"
        />
      )

      expect(screen.getByRole('region')).toBeTruthy()
    })
  })

  describe('styling', () => {
    it('should have appropriate classes for styling', () => {
      render(
        <InsightCard
          label="Today"
          value="3h 42m"
          sublabel="tracked"
        />
      )

      const region = screen.getByRole('region')
      expect(region.className).toContain('bg-surface-muted')
      expect(region.className).toContain('rounded-lg')
      expect(region.className).toContain('shadow-sm')
    })

    it('should handle long values without overflow', () => {
      render(
        <InsightCard
          label="Today"
          value="100h 59m"
          sublabel="tracked"
        />
      )

      // Should render without throwing
      expect(screen.getByText('100h 59m')).toBeTruthy()
    })
  })
})
