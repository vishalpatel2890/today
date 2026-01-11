import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskSelector, type SelectedTask } from './TaskSelector'
import type { Task } from '../../types'

// Mock tasks for testing
const createMockTask = (id: string, text: string): Task => ({
  id,
  text,
  createdAt: new Date().toISOString(),
  deferredTo: null,
  category: null,
  completedAt: null,
  notes: null,
})

const mockTasks: Task[] = [
  createMockTask('1', 'Review pull request'),
  createMockTask('2', 'Write documentation'),
  createMockTask('3', 'Fix login bug'),
  createMockTask('4', 'Update dependencies'),
]

describe('TaskSelector', () => {
  const defaultProps = {
    tasks: mockTasks,
    selectedTask: null,
    onSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with placeholder text when no task is selected', () => {
      render(<TaskSelector {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeTruthy()
      expect(screen.getByText('Select a task...')).toBeTruthy()
    })

    it('should render with selected task name when task is selected', () => {
      const selectedTask: SelectedTask = { id: '1', name: 'Review pull request' }
      render(<TaskSelector {...defaultProps} selectedTask={selectedTask} />)

      expect(screen.getByText('Review pull request')).toBeTruthy()
    })

    it('should render empty state message when no tasks provided', () => {
      render(<TaskSelector {...defaultProps} tasks={[]} />)

      expect(screen.getByText('No tasks for today. Add a task first.')).toBeTruthy()
    })

    it('should be disabled when no tasks are available', () => {
      render(<TaskSelector {...defaultProps} tasks={[]} />)

      const trigger = screen.getByRole('combobox') as HTMLButtonElement
      expect(trigger.disabled).toBe(true)
    })

    it('should be disabled when disabled prop is true', () => {
      render(<TaskSelector {...defaultProps} disabled={true} />)

      const trigger = screen.getByRole('combobox') as HTMLButtonElement
      expect(trigger.disabled).toBe(true)
    })
  })

  describe('Dropdown behavior', () => {
    it('should open dropdown on click', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      // Dropdown should show all tasks
      expect(screen.getByRole('listbox')).toBeTruthy()
      expect(screen.getByText('Review pull request')).toBeTruthy()
      expect(screen.getByText('Write documentation')).toBeTruthy()
      expect(screen.getByText('Fix login bug')).toBeTruthy()
      expect(screen.getByText('Update dependencies')).toBeTruthy()
    })

    it('should show search input when dropdown is open', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      expect(screen.getByPlaceholderText('Search tasks...')).toBeTruthy()
    })
  })

  describe('Keyboard navigation', () => {
    it('should open dropdown on Enter key', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.keyDown(trigger, { key: 'Enter' })

      expect(screen.getByRole('listbox')).toBeTruthy()
    })

    it('should open dropdown on ArrowDown key', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.keyDown(trigger, { key: 'ArrowDown' })

      expect(screen.getByRole('listbox')).toBeTruthy()
    })

    it('should navigate down with ArrowDown key', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByPlaceholderText('Search tasks...')

      // Navigate down
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

      // Second item should be highlighted
      const options = screen.getAllByRole('option')
      expect(options[1].getAttribute('data-highlighted')).toBe('true')
    })

    it('should navigate up with ArrowUp key', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByPlaceholderText('Search tasks...')

      // Navigate down twice
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' })
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' })

      // Navigate up once
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' })

      // Second item should be highlighted
      const options = screen.getAllByRole('option')
      expect(options[1].getAttribute('data-highlighted')).toBe('true')
    })

    it('should select task on Enter key', () => {
      const onSelect = vi.fn()
      render(<TaskSelector {...defaultProps} onSelect={onSelect} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByPlaceholderText('Search tasks...')
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      // First task should be selected
      expect(onSelect).toHaveBeenCalledWith({
        id: '1',
        name: 'Review pull request',
      })
    })

    it('should close dropdown on Escape key', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      expect(screen.getByRole('listbox')).toBeTruthy()

      const searchInput = screen.getByPlaceholderText('Search tasks...')
      fireEvent.keyDown(searchInput, { key: 'Escape' })

      // Dropdown should be closed - listbox should not be in document
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('Type-ahead filtering', () => {
    it('should filter tasks based on search query', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByPlaceholderText('Search tasks...')
      fireEvent.change(searchInput, { target: { value: 'review' } })

      // Only the task containing "review" should be visible
      expect(screen.getByText('Review pull request')).toBeTruthy()
      expect(screen.queryByText('Write documentation')).toBeNull()
      expect(screen.queryByText('Fix login bug')).toBeNull()
    })

    it('should be case-insensitive when filtering', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByPlaceholderText('Search tasks...')
      fireEvent.change(searchInput, { target: { value: 'REVIEW' } })

      expect(screen.getByText('Review pull request')).toBeTruthy()
    })

    it('should show "no results" message when filter has no matches', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByPlaceholderText('Search tasks...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      expect(screen.getByText(/No tasks match "nonexistent"/)).toBeTruthy()
    })
  })

  describe('Selection', () => {
    it('should call onSelect with correct task data when clicked', () => {
      const onSelect = vi.fn()
      render(<TaskSelector {...defaultProps} onSelect={onSelect} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      // Click on a task
      const taskOption = screen.getByText('Write documentation')
      fireEvent.click(taskOption)

      expect(onSelect).toHaveBeenCalledWith({
        id: '2',
        name: 'Write documentation',
      })
    })

    it('should show check icon next to selected task', () => {
      const selectedTask: SelectedTask = { id: '2', name: 'Write documentation' }
      render(<TaskSelector {...defaultProps} selectedTask={selectedTask} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      // The selected option should have aria-selected="true"
      const options = screen.getAllByRole('option')
      const selectedOption = options.find(
        opt => opt.getAttribute('aria-selected') === 'true'
      )
      expect(selectedOption).toBeTruthy()
      expect(selectedOption?.textContent).toContain('Write documentation')
    })
  })

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on trigger', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    })

    it('should update aria-expanded when dropdown opens', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      fireEvent.click(trigger)
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })

    it('should have accessible label on search input', () => {
      render(<TaskSelector {...defaultProps} />)

      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)

      const searchInput = screen.getByLabelText('Search tasks')
      expect(searchInput).toBeTruthy()
    })
  })
})
