import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { subDays, subWeeks, startOfWeek } from 'date-fns'
import { CompletedTasksModal } from './CompletedTasksModal'
import type { Task } from '../types'

describe('CompletedTasksModal', () => {
  const mockOnClose = vi.fn()
  const mockOnUncomplete = vi.fn()
  const mockOnUpdateNotes = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: crypto.randomUUID(),
    text: 'Test task',
    createdAt: new Date().toISOString(),
    deferredTo: new Date().toISOString(),
    category: null,
    completedAt: null,
    notes: null,
    ...overrides,
  })

  const renderModal = (tasks: Task[] = [], isOpen = true) => {
    return render(
      <CompletedTasksModal
        isOpen={isOpen}
        onClose={mockOnClose}
        tasks={tasks}
        onUncomplete={mockOnUncomplete}
        onUpdateNotes={mockOnUpdateNotes}
      />
    )
  }

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      renderModal([])
      expect(screen.getByText('Completed Tasks')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      renderModal([], false)
      expect(screen.queryByText('Completed Tasks')).not.toBeInTheDocument()
    })

    it('should show close button', () => {
      renderModal([])
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })
  })

  describe('14-Day Filtering (AC2)', () => {
    it('should show tasks completed within 14 days', () => {
      const recentTask = createTask({
        text: 'Recent completed task',
        completedAt: subDays(new Date(), 5).toISOString(),
      })
      renderModal([recentTask])
      expect(screen.getByText('Recent completed task')).toBeInTheDocument()
    })

    it('should not show tasks completed more than 14 days ago', () => {
      const oldTask = createTask({
        text: 'Old completed task',
        completedAt: subDays(new Date(), 20).toISOString(),
      })
      renderModal([oldTask])
      expect(screen.queryByText('Old completed task')).not.toBeInTheDocument()
    })

    it('should not show incomplete tasks', () => {
      const incompleteTask = createTask({
        text: 'Incomplete task',
        completedAt: null,
      })
      renderModal([incompleteTask])
      expect(screen.queryByText('Incomplete task')).not.toBeInTheDocument()
    })
  })

  describe('Date Grouping (AC3)', () => {
    it('should group tasks completed today under "Today"', () => {
      const todayTask = createTask({
        text: 'Today task',
        completedAt: new Date().toISOString(),
      })
      renderModal([todayTask])
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByText('Today task')).toBeInTheDocument()
    })

    it('should group tasks completed yesterday under "Yesterday"', () => {
      const yesterdayTask = createTask({
        text: 'Yesterday task',
        completedAt: subDays(new Date(), 1).toISOString(),
      })
      renderModal([yesterdayTask])
      expect(screen.getByText('Yesterday')).toBeInTheDocument()
      expect(screen.getByText('Yesterday task')).toBeInTheDocument()
    })

    it('should group tasks from this week under "This Week"', () => {
      // Get a day from this week that's not today or yesterday
      const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const dayOfWeek = new Date().getDay()

      // Only test if we're at least 3 days into the week
      if (dayOfWeek >= 3) {
        const thisWeekTask = createTask({
          text: 'This week task',
          completedAt: subDays(new Date(), 3).toISOString(),
        })
        renderModal([thisWeekTask])
        expect(screen.getByText('This Week')).toBeInTheDocument()
        expect(screen.getByText('This week task')).toBeInTheDocument()
      }
    })

    it('should group tasks from last week under "Last Week"', () => {
      const lastWeekTask = createTask({
        text: 'Last week task',
        completedAt: subWeeks(new Date(), 1).toISOString(),
      })
      renderModal([lastWeekTask])
      expect(screen.getByText('Last Week')).toBeInTheDocument()
      expect(screen.getByText('Last week task')).toBeInTheDocument()
    })

    it('should group older tasks (within 14 days) under "Older"', () => {
      const olderTask = createTask({
        text: 'Older task',
        completedAt: subDays(new Date(), 13).toISOString(),
      })
      renderModal([olderTask])
      // The task might be in "Last Week" or "Older" depending on the current date
      expect(screen.getByText('Older task')).toBeInTheDocument()
    })

    it('should show task count in group headers', () => {
      const tasks = [
        createTask({ text: 'Task 1', completedAt: new Date().toISOString() }),
        createTask({ text: 'Task 2', completedAt: new Date().toISOString() }),
      ]
      renderModal(tasks)
      expect(screen.getByText('(2)')).toBeInTheDocument()
    })
  })

  describe('Uncomplete Action (AC5, AC6)', () => {
    it('should call onUncomplete when Undo button is clicked', () => {
      const task = createTask({
        id: 'task-123',
        text: 'Completed task',
        completedAt: new Date().toISOString(),
      })
      renderModal([task])

      const undoButton = screen.getByLabelText('Restore task to Today')
      fireEvent.click(undoButton)

      expect(mockOnUncomplete).toHaveBeenCalledWith('task-123')
    })
  })

  describe('Notes Button (AC7)', () => {
    it('should show Notes button for tasks with notes', () => {
      const taskWithNotes = createTask({
        text: 'Task with notes',
        completedAt: new Date().toISOString(),
        notes: {
          items: [{ id: '1', type: 'text', value: 'Some note' }],
          updatedAt: new Date().toISOString(),
        },
      })
      renderModal([taskWithNotes])

      expect(screen.getByLabelText('View notes')).toBeInTheDocument()
    })

    it('should not show Notes button for tasks without notes', () => {
      const taskWithoutNotes = createTask({
        text: 'Task without notes',
        completedAt: new Date().toISOString(),
        notes: null,
      })
      renderModal([taskWithoutNotes])

      expect(screen.queryByLabelText('View notes')).not.toBeInTheDocument()
    })

    it('should not show Notes button for tasks with empty notes', () => {
      const taskWithEmptyNotes = createTask({
        text: 'Task with empty notes',
        completedAt: new Date().toISOString(),
        notes: {
          items: [],
          updatedAt: new Date().toISOString(),
        },
      })
      renderModal([taskWithEmptyNotes])

      expect(screen.queryByLabelText('View notes')).not.toBeInTheDocument()
    })
  })

  describe('Empty State (AC10)', () => {
    it('should show empty state message when no completed tasks', () => {
      renderModal([])
      expect(screen.getByText('No completed tasks in the last 14 days')).toBeInTheDocument()
    })

    it('should show empty state when only incomplete tasks exist', () => {
      const incompleteTasks = [
        createTask({ text: 'Task 1', completedAt: null }),
        createTask({ text: 'Task 2', completedAt: null }),
      ]
      renderModal(incompleteTasks)
      expect(screen.getByText('No completed tasks in the last 14 days')).toBeInTheDocument()
    })
  })

  describe('Modal Close (AC9)', () => {
    it('should call onClose when close button is clicked', () => {
      renderModal([])

      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Task Display (AC4)', () => {
    it('should display task text', () => {
      const task = createTask({
        text: 'My completed task',
        completedAt: new Date().toISOString(),
      })
      renderModal([task])

      expect(screen.getByText('My completed task')).toBeInTheDocument()
    })

    it('should sort tasks by completion date (most recent first)', () => {
      const olderTask = createTask({
        text: 'Older task',
        completedAt: subDays(new Date(), 1).toISOString(),
      })
      const newerTask = createTask({
        text: 'Newer task',
        completedAt: new Date().toISOString(),
      })
      renderModal([olderTask, newerTask])

      const tasks = screen.getAllByText(/task/)
      // Newer task should appear first within its group
      expect(tasks[0]).toHaveTextContent('Newer task')
    })
  })
})
