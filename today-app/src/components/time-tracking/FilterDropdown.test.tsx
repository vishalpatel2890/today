import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterDropdown, type FilterOption } from './FilterDropdown'

const mockOptions: FilterOption[] = [
  { value: 'task-1', label: 'Task One' },
  { value: 'task-2', label: 'Task Two' },
  { value: 'task-3', label: 'Task Three' },
]

describe('FilterDropdown', () => {
  describe('Rendering (AC-3.3.1)', () => {
    it('should render with label', () => {
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('Tasks')).toBeInTheDocument()
    })

    it('should render with placeholder when no selection', () => {
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('All tasks')).toBeInTheDocument()
    })

    it('should render with selected value label (AC-3.3.8)', () => {
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue="task-2"
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('Task Two')).toBeInTheDocument()
    })

    it('should have accessible label on trigger', () => {
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox', { name: /tasks filter/i })).toBeInTheDocument()
    })
  })

  describe('Dropdown Menu (AC-3.3.2, AC-3.3.4)', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      await user.click(screen.getByRole('combobox'))

      // Check that options are visible
      expect(screen.getByText('Task One')).toBeInTheDocument()
      expect(screen.getByText('Task Two')).toBeInTheDocument()
      expect(screen.getByText('Task Three')).toBeInTheDocument()
    })

    it('should show placeholder option as first item', async () => {
      const user = userEvent.setup()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      await user.click(screen.getByRole('combobox'))

      // "All tasks" should appear as an option in the dropdown
      const allOptions = screen.getAllByRole('option')
      expect(allOptions[0]).toHaveTextContent('All tasks')
    })
  })

  describe('Selection (AC-3.3.3, AC-3.3.5)', () => {
    it('should call onSelect with value when option selected', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={onSelect}
        />
      )

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByRole('option', { name: 'Task Two' }))

      expect(onSelect).toHaveBeenCalledWith('task-2')
    })

    it('should call onSelect with null when "All" option selected (AC-3.3.7)', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue="task-1"
          onSelect={onSelect}
        />
      )

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByRole('option', { name: 'All tasks' }))

      expect(onSelect).toHaveBeenCalledWith(null)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should open dropdown with Enter key', async () => {
      const user = userEvent.setup()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      const trigger = screen.getByRole('combobox')
      trigger.focus()
      await user.keyboard('{Enter}')

      // Dropdown should be open
      expect(screen.getByText('Task One')).toBeInTheDocument()
    })

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('Task One')).toBeInTheDocument()

      await user.keyboard('{Escape}')

      // Options should no longer be visible as role="option"
      expect(screen.queryByRole('option', { name: 'Task One' })).not.toBeInTheDocument()
    })
  })

  describe('Category Dropdown', () => {
    it('should work with category options', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const categoryOptions: FilterOption[] = [
        { value: 'Work', label: 'Work' },
        { value: 'Personal', label: 'Personal' },
      ]

      render(
        <FilterDropdown
          label="Category"
          placeholder="All"
          options={categoryOptions}
          selectedValue={null}
          onSelect={onSelect}
        />
      )

      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('All')).toBeInTheDocument()

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByRole('option', { name: 'Work' }))

      expect(onSelect).toHaveBeenCalledWith('Work')
    })
  })

  describe('Empty Options', () => {
    it('should handle empty options array', async () => {
      const user = userEvent.setup()
      render(
        <FilterDropdown
          label="Tasks"
          placeholder="All tasks"
          options={[]}
          selectedValue={null}
          onSelect={vi.fn()}
        />
      )

      await user.click(screen.getByRole('combobox'))

      // Should only show the "All tasks" option
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(1)
      expect(options[0]).toHaveTextContent('All tasks')
    })
  })
})
