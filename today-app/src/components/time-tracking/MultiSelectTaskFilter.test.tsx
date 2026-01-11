import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelectTaskFilter } from './MultiSelectTaskFilter'
import type { FilterOption } from './FilterDropdown'

const mockOptions: FilterOption[] = [
  { value: 'task-1', label: 'Client Project Alpha' },
  { value: 'task-2', label: 'Client Project Beta' },
  { value: 'task-3', label: 'Internal Meetings' },
  { value: 'task-4', label: 'Documentation' },
]

describe('MultiSelectTaskFilter', () => {
  describe('Rendering', () => {
    it('should render with label', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('Tasks')).toBeInTheDocument()
    })

    it('should render with placeholder when no selection (AC-1.2.9)', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('All tasks')).toBeInTheDocument()
    })

    it('should render with selected task name when one selected (AC-1.2.6)', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-2']}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('Client Project Beta')).toBeInTheDocument()
    })

    it('should render "X tasks" when multiple selected (AC-1.2.5)', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1', 'task-2', 'task-3']}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('3 tasks')).toBeInTheDocument()
    })

    it('should have accessible trigger button with multiselectable', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      const trigger = screen.getByRole('button', { name: /tasks filter/i })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    })
  })

  describe('Dropdown Opening (AC-1.1.1)', () => {
    it('should show search input when dropdown opens', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
    })

    it('should show all task options when dropdown opens', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      expect(screen.getByText('Client Project Alpha')).toBeInTheDocument()
      expect(screen.getByText('Client Project Beta')).toBeInTheDocument()
      expect(screen.getByText('Internal Meetings')).toBeInTheDocument()
      expect(screen.getByText('Documentation')).toBeInTheDocument()
    })
  })

  describe('Search Filtering (AC-1.1.2)', () => {
    it('should filter tasks as user types (case-insensitive)', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')

      // Should show matching tasks
      expect(screen.getByText('Client Project Alpha')).toBeInTheDocument()
      expect(screen.getByText('Client Project Beta')).toBeInTheDocument()

      // Should not show non-matching tasks
      expect(screen.queryByText('Internal Meetings')).not.toBeInTheDocument()
      expect(screen.queryByText('Documentation')).not.toBeInTheDocument()
    })

    it('should filter by substring match', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'meet')

      // Should show matching task
      expect(screen.getByText('Internal Meetings')).toBeInTheDocument()

      // Should not show non-matching tasks
      expect(screen.queryByText('Client Project Alpha')).not.toBeInTheDocument()
    })
  })

  describe('No Results Message (AC-1.1.3)', () => {
    it('should show "No tasks match" message when search has no results', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'xyz')

      expect(screen.getByText('No tasks match "xyz"')).toBeInTheDocument()
    })

    it('should still show "All tasks" option when search has no results', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'nonexistent')

      // "All tasks" option should still be visible
      const allTasksOptions = screen.getAllByText('All tasks')
      expect(allTasksOptions.length).toBeGreaterThan(0)
    })
  })

  describe('Search Clear on Close (AC-1.1.4)', () => {
    it('should clear search when dropdown closes and reopens', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      // Open and type search
      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')

      // Close by clicking outside (Escape key)
      await user.keyboard('{Escape}')

      // Reopen
      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Search should be cleared
      expect(screen.getByPlaceholderText('Search tasks...')).toHaveValue('')

      // All tasks should be visible again
      expect(screen.getByText('Internal Meetings')).toBeInTheDocument()
    })
  })

  describe('Auto-focus Search (AC-1.1.5)', () => {
    it('should auto-focus search input when dropdown opens', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Wait for focus to be set (there's a small delay)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search tasks...')).toHaveFocus()
      })
    })
  })

  describe('Keyboard Escape (AC-1.1.6)', () => {
    it('should close dropdown and clear search when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')

      // Press Escape
      await user.keyboard('{Escape}')

      // Dropdown should be closed (search input should not be visible)
      expect(screen.queryByPlaceholderText('Search tasks...')).not.toBeInTheDocument()
    })
  })

  describe('Multi-Select Behavior (Story 1.2)', () => {
    it('should toggle task selection on click (AC-1.2.1)', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.click(screen.getByText('Client Project Alpha'))

      expect(onSelectionChange).toHaveBeenCalledWith(['task-1'])
    })

    it('should allow multiple selections (AC-1.2.2)', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1']}
          onSelectionChange={onSelectionChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.click(screen.getByText('Client Project Beta'))

      expect(onSelectionChange).toHaveBeenCalledWith(['task-1', 'task-2'])
    })

    it('should uncheck task when clicking already selected task', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1', 'task-2']}
          onSelectionChange={onSelectionChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.click(screen.getByText('Client Project Alpha'))

      expect(onSelectionChange).toHaveBeenCalledWith(['task-2'])
    })

    it('should keep dropdown open after selection (AC-1.2.2)', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))
      await user.click(screen.getByText('Client Project Alpha'))

      // Dropdown should still be open
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
    })

    it('should show checkbox visual for selected tasks (AC-1.2.1)', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-2']}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // The selected option should have aria-selected="true"
      const selectedOption = screen.getByRole('option', { name: /Client Project Beta/i })
      expect(selectedOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should clear all selections when "All tasks" is clicked (AC-1.2.7)', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1', 'task-2']}
          onSelectionChange={onSelectionChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Click the "All tasks" option in the listbox
      const allTasksOptions = screen.getAllByRole('option')
      const allTasksOption = allTasksOptions.find(opt => opt.textContent?.includes('All tasks'))
      await user.click(allTasksOption!)

      expect(onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should close dropdown after clicking "All tasks"', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1']}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Click the "All tasks" option
      const allTasksOptions = screen.getAllByRole('option')
      const allTasksOption = allTasksOptions.find(opt => opt.textContent?.includes('All tasks'))
      await user.click(allTasksOption!)

      // Dropdown should be closed
      expect(screen.queryByPlaceholderText('Search tasks...')).not.toBeInTheDocument()
    })
  })

  describe('Selection Persistence Across Search (AC-1.2.8)', () => {
    it('should preserve selections when filtering tasks', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1', 'task-3']}
          onSelectionChange={onSelectionChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Type search that hides task-1 (Client Project Alpha) but shows task-3 (Internal Meetings)
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'meet')

      // task-1 should be hidden by search but not deselected
      // Selection should not have changed
      expect(onSelectionChange).not.toHaveBeenCalled()

      // Clear search
      await user.clear(screen.getByPlaceholderText('Search tasks...'))

      // Both selected tasks should still show as selected
      const alphaOption = screen.getByRole('option', { name: /Client Project Alpha/i })
      const meetingsOption = screen.getByRole('option', { name: /Internal Meetings/i })
      expect(alphaOption).toHaveAttribute('aria-selected', 'true')
      expect(meetingsOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should allow selecting visible tasks while others are hidden', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1']}
          onSelectionChange={onSelectionChange}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Filter to show only "Client Project Beta"
      await user.type(screen.getByPlaceholderText('Search tasks...'), 'beta')

      // Select the visible task
      await user.click(screen.getByText('Client Project Beta'))

      // Should add to existing selection
      expect(onSelectionChange).toHaveBeenCalledWith(['task-1', 'task-2'])
    })
  })

  describe('Chip Display Logic (AC-1.2.5, AC-1.2.6)', () => {
    it('should display single task name when one selected', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-4']}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('Documentation')).toBeInTheDocument()
    })

    it('should display "2 tasks" when two selected', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1', 'task-2']}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('2 tasks')).toBeInTheDocument()
    })

    it('should display "4 tasks" when all four selected', () => {
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={['task-1', 'task-2', 'task-3', 'task-4']}
          onSelectionChange={vi.fn()}
        />
      )

      expect(screen.getByText('4 tasks')).toBeInTheDocument()
    })
  })

  describe('Empty Options', () => {
    it('should handle empty options array', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={[]}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      // Should still show search and "All tasks" option
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
      // The "All tasks" option should be present
      const allTasksOptions = screen.getAllByText('All tasks')
      expect(allTasksOptions.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-multiselectable on listbox', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelectTaskFilter
          label="Tasks"
          placeholder="All tasks"
          options={mockOptions}
          selectedValues={[]}
          onSelectionChange={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /tasks filter/i }))

      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true')
    })
  })

  describe('Select All in View (Story 1.3)', () => {
    describe('Select All UI (AC-1.3.1, AC-1.3.2)', () => {
      it('should display Select All checkbox at top of task list', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        expect(screen.getByText(/Select All \(\d+ visible\)/)).toBeInTheDocument()
      })

      it('should show correct count of visible tasks (AC-1.3.2)', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        // All 4 tasks should be visible initially
        expect(screen.getByText('Select All (4 visible)')).toBeInTheDocument()
      })

      it('should update count when search filters tasks', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')

        // Only 2 "Client" tasks should be visible
        expect(screen.getByText('Select All (2 visible)')).toBeInTheDocument()
      })
    })

    describe('Select All Click Behavior (AC-1.3.3, AC-1.3.4)', () => {
      it('should select all visible tasks when clicking Select All (AC-1.3.3)', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.click(screen.getByText('Select All (4 visible)'))

        expect(onSelectionChange).toHaveBeenCalledWith(['task-1', 'task-2', 'task-3', 'task-4'])
      })

      it('should only select visible tasks when search is active (AC-1.3.3)', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')
        await user.click(screen.getByText('Select All (2 visible)'))

        // Should only select the 2 visible "Client" tasks
        expect(onSelectionChange).toHaveBeenCalledWith(['task-1', 'task-2'])
      })

      it('should deselect all visible tasks when all are already selected (AC-1.3.4)', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-1', 'task-2', 'task-3', 'task-4']}
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.click(screen.getByText('Select All (4 visible)'))

        // Should deselect all visible tasks (toggle behavior)
        expect(onSelectionChange).toHaveBeenCalledWith([])
      })

      it('should toggle correctly when some visible tasks are selected', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-1', 'task-3']}
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.click(screen.getByText('Select All (4 visible)'))

        // Should select all visible (add the missing ones)
        expect(onSelectionChange).toHaveBeenCalledWith(['task-1', 'task-3', 'task-2', 'task-4'])
      })
    })

    describe('Preserve Hidden Selections (AC-1.3.5, AC-1.3.7)', () => {
      it('should preserve selections outside current search view (AC-1.3.5)', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-3']} // Internal Meetings is selected
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        // Filter to show only Client tasks (hides task-3)
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')
        await user.click(screen.getByText('Select All (2 visible)'))

        // Should add Client tasks but preserve the hidden Internal Meetings selection
        expect(onSelectionChange).toHaveBeenCalledWith(['task-3', 'task-1', 'task-2'])
      })

      it('should preserve hidden selections when deselecting all visible (AC-1.3.5)', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-1', 'task-2', 'task-3']} // Client projects + Internal Meetings
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        // Filter to show only Client tasks
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')
        // All 2 visible Client tasks are selected, clicking should deselect them
        await user.click(screen.getByText('Select All (2 visible)'))

        // Should remove only the visible Client tasks, keep Internal Meetings
        expect(onSelectionChange).toHaveBeenCalledWith(['task-3'])
      })
    })

    describe('Disabled State (AC-1.3.6)', () => {
      it('should be disabled when no tasks match search', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'xyz')

        // Should show 0 visible
        expect(screen.getByText('Select All (0 visible)')).toBeInTheDocument()

        // Should have disabled styling (opacity-50)
        const selectAllLabel = screen.getByText('Select All (0 visible)').closest('label')
        expect(selectAllLabel).toHaveClass('opacity-50')
      })

      it('should not call onSelectionChange when disabled and clicked', async () => {
        const user = userEvent.setup()
        const onSelectionChange = vi.fn()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={onSelectionChange}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'xyz')
        await user.click(screen.getByText('Select All (0 visible)'))

        expect(onSelectionChange).not.toHaveBeenCalled()
      })
    })

    describe('Checkbox States (AC-1.3.8)', () => {
      it('should show unchecked state when no visible tasks are selected', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={[]}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        const checkbox = screen.getByRole('checkbox', { name: /select all/i })
        expect(checkbox).toHaveAttribute('aria-checked', 'false')
      })

      it('should show checked state when all visible tasks are selected', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-1', 'task-2', 'task-3', 'task-4']}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        const checkbox = screen.getByRole('checkbox', { name: /select all/i })
        expect(checkbox).toHaveAttribute('aria-checked', 'true')
      })

      it('should show indeterminate (mixed) state when some visible tasks are selected', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-1', 'task-3']}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        const checkbox = screen.getByRole('checkbox', { name: /select all/i })
        expect(checkbox).toHaveAttribute('aria-checked', 'mixed')
      })

      it('should update checkbox state when search changes visible tasks', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={mockOptions}
            selectedValues={['task-1', 'task-2']} // Both Client tasks selected
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        // Initially mixed (2 of 4 selected)
        let checkbox = screen.getByRole('checkbox', { name: /select all/i })
        expect(checkbox).toHaveAttribute('aria-checked', 'mixed')

        // Filter to only Client tasks
        await user.type(screen.getByPlaceholderText('Search tasks...'), 'client')

        // Now all visible tasks are selected (2 of 2)
        checkbox = screen.getByRole('checkbox', { name: /select all/i })
        expect(checkbox).toHaveAttribute('aria-checked', 'true')
      })
    })

    describe('Select All with Empty Options', () => {
      it('should not show Select All row when options array is empty', async () => {
        const user = userEvent.setup()
        render(
          <MultiSelectTaskFilter
            label="Tasks"
            placeholder="All tasks"
            options={[]}
            selectedValues={[]}
            onSelectionChange={vi.fn()}
          />
        )

        await user.click(screen.getByRole('button', { name: /tasks filter/i }))

        expect(screen.queryByText(/Select All/)).not.toBeInTheDocument()
      })
    })
  })
})
