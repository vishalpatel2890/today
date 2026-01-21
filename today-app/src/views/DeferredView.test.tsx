import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeferredView } from './DeferredView'
import type { Task } from '../types'
import { ToastProvider } from '../contexts/ToastContext'

// Helper to wrap components with required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

// Helper to create a task with specific properties
const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  text: 'Test task',
  createdAt: new Date().toISOString(),
  deferredTo: null,
  category: null,
  completedAt: null,
  notes: null,
  sortOrder: Date.now(),
  ...overrides,
})

describe('DeferredView', () => {
  const mockOnComplete = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnUpdate = vi.fn()
  const mockOnCreateCategory = vi.fn()

  const defaultProps = {
    tasks: [],
    categories: [],
    onComplete: mockOnComplete,
    onDelete: mockOnDelete,
    onUpdate: mockOnUpdate,
    onCreateCategory: mockOnCreateCategory,
  }

  describe('AC-8.1.1: Null categories display as "Other"', () => {
    it('should display task with null category under "Other" header', () => {
      const taskWithNullCategory = createTask({
        id: 'task-null-cat',
        text: 'Uncategorized task',
        category: null,
      })

      renderWithProviders(
        <DeferredView {...defaultProps} tasks={[taskWithNullCategory]} />
      )

      // Should show "Other" category header
      expect(screen.getByText('Other')).toBeInTheDocument()
      // Task should be visible
      expect(screen.getByText('Uncategorized task')).toBeInTheDocument()
    })

    it('should group multiple null-category tasks under single "Other" section', () => {
      const tasks = [
        createTask({ id: '1', text: 'First uncategorized', category: null }),
        createTask({ id: '2', text: 'Second uncategorized', category: null }),
      ]

      renderWithProviders(<DeferredView {...defaultProps} tasks={tasks} />)

      // Should have only one "Other" header
      const otherHeaders = screen.getAllByText('Other')
      expect(otherHeaders).toHaveLength(1)

      // Both tasks should be visible
      expect(screen.getByText('First uncategorized')).toBeInTheDocument()
      expect(screen.getByText('Second uncategorized')).toBeInTheDocument()
    })
  })

  describe('AC-8.1.2: "Other" sorts last in category list', () => {
    it('should place "Other" after alphabetically sorted categories', () => {
      const tasks = [
        createTask({ id: '1', text: 'Work task', category: 'Work' }),
        createTask({ id: '2', text: 'Personal task', category: 'Personal' }),
        createTask({ id: '3', text: 'Uncategorized task', category: null }),
      ]

      renderWithProviders(<DeferredView {...defaultProps} tasks={tasks} />)

      // Get all category headers in order
      const headers = screen.getAllByRole('button')
      const headerTexts = headers.map((h) => h.textContent)

      // Find positions of categories
      const personalIndex = headerTexts.findIndex((t) => t?.includes('Personal'))
      const workIndex = headerTexts.findIndex((t) => t?.includes('Work'))
      const otherIndex = headerTexts.findIndex((t) => t?.includes('Other'))

      // Personal should come before Work (alphabetical)
      expect(personalIndex).toBeLessThan(workIndex)
      // Other should come last
      expect(otherIndex).toBeGreaterThan(personalIndex)
      expect(otherIndex).toBeGreaterThan(workIndex)
    })

    it('should handle case-insensitive sorting with "Other" last', () => {
      const tasks = [
        createTask({ id: '1', text: 'Zebra task', category: 'zebra' }),
        createTask({ id: '2', text: 'Apple task', category: 'Apple' }),
        createTask({ id: '3', text: 'Uncategorized', category: null }),
      ]

      renderWithProviders(<DeferredView {...defaultProps} tasks={tasks} />)

      const headers = screen.getAllByRole('button')
      const headerTexts = headers.map((h) => h.textContent)

      const appleIndex = headerTexts.findIndex((t) => t?.includes('Apple'))
      const zebraIndex = headerTexts.findIndex((t) => t?.includes('zebra'))
      const otherIndex = headerTexts.findIndex((t) => t?.includes('Other'))

      // Apple before zebra (case-insensitive alphabetical)
      expect(appleIndex).toBeLessThan(zebraIndex)
      // Other still last
      expect(otherIndex).toBeGreaterThan(zebraIndex)
    })
  })

  describe('AC-8.1.3: Only "Other" when all tasks uncategorized', () => {
    it('should show only "Other" section when all tasks have null category', () => {
      const tasks = [
        createTask({ id: '1', text: 'Task one', category: null }),
        createTask({ id: '2', text: 'Task two', category: null }),
        createTask({ id: '3', text: 'Task three', category: null }),
      ]

      renderWithProviders(<DeferredView {...defaultProps} tasks={tasks} />)

      // Should have exactly one "Other" header text
      const otherHeaders = screen.getAllByText('Other')
      expect(otherHeaders).toHaveLength(1)

      // All tasks should be visible
      expect(screen.getByText('Task one')).toBeInTheDocument()
      expect(screen.getByText('Task two')).toBeInTheDocument()
      expect(screen.getByText('Task three')).toBeInTheDocument()
    })
  })

  describe('AC-8.1.4: No "Other" section when all tasks have categories', () => {
    it('should not show "Other" when all tasks have categories', () => {
      const tasks = [
        createTask({ id: '1', text: 'Work task', category: 'Work' }),
        createTask({ id: '2', text: 'Personal task', category: 'Personal' }),
      ]

      renderWithProviders(<DeferredView {...defaultProps} tasks={tasks} />)

      // Should not have "Other" category
      expect(screen.queryByText('Other')).not.toBeInTheDocument()

      // Should have the actual categories
      expect(screen.getByText('Personal')).toBeInTheDocument()
      expect(screen.getByText('Work')).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('should show empty state when no tasks', () => {
      renderWithProviders(<DeferredView {...defaultProps} tasks={[]} />)

      expect(
        screen.getByText('No deferred tasks. Everything is in Today or Tomorrow!')
      ).toBeInTheDocument()
    })
  })
})
