import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskList } from './TaskList'
import type { Task } from '../types'
import { ToastProvider } from '../contexts/ToastContext'

// Helper to wrap components with required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  )
}

// Mock tasks with sortOrder for testing
const createMockTasks = (): Task[] => [
  {
    id: 'task-1',
    text: 'First task',
    createdAt: '2026-01-20T10:00:00.000Z',
    deferredTo: '2026-01-20T00:00:00.000Z',
    category: null,
    completedAt: null,
    notes: null,
    sortOrder: 1000,
  },
  {
    id: 'task-2',
    text: 'Second task',
    createdAt: '2026-01-20T10:01:00.000Z',
    deferredTo: '2026-01-20T00:00:00.000Z',
    category: null,
    completedAt: null,
    notes: null,
    sortOrder: 2000,
  },
  {
    id: 'task-3',
    text: 'Third task',
    createdAt: '2026-01-20T10:02:00.000Z',
    deferredTo: '2026-01-20T00:00:00.000Z',
    category: null,
    completedAt: null,
    notes: null,
    sortOrder: 3000,
  },
]

describe('TaskList', () => {
  const mockOnComplete = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnUpdate = vi.fn()
  const mockOnCreateCategory = vi.fn()
  const mockOnReorder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render tasks in sortOrder', () => {
      const tasks = createMockTasks()

      renderWithProviders(
        <TaskList
          tasks={tasks}
          categories={[]}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
          onCreateCategory={mockOnCreateCategory}
        />
      )

      const taskElements = screen.getAllByText(/task$/i)
      expect(taskElements).toHaveLength(3)

      // Verify order matches sortOrder
      expect(taskElements[0]).toHaveTextContent('First task')
      expect(taskElements[1]).toHaveTextContent('Second task')
      expect(taskElements[2]).toHaveTextContent('Third task')
    })

    it('should sort tasks by sortOrder regardless of array order', () => {
      // Create tasks in reverse order
      const tasks: Task[] = [
        {
          id: 'task-3',
          text: 'Third task',
          createdAt: '2026-01-20T10:02:00.000Z',
          deferredTo: '2026-01-20T00:00:00.000Z',
          category: null,
          completedAt: null,
          notes: null,
          sortOrder: 3000,
        },
        {
          id: 'task-1',
          text: 'First task',
          createdAt: '2026-01-20T10:00:00.000Z',
          deferredTo: '2026-01-20T00:00:00.000Z',
          category: null,
          completedAt: null,
          notes: null,
          sortOrder: 1000,
        },
        {
          id: 'task-2',
          text: 'Second task',
          createdAt: '2026-01-20T10:01:00.000Z',
          deferredTo: '2026-01-20T00:00:00.000Z',
          category: null,
          completedAt: null,
          notes: null,
          sortOrder: 2000,
        },
      ]

      renderWithProviders(
        <TaskList
          tasks={tasks}
          categories={[]}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
          onCreateCategory={mockOnCreateCategory}
        />
      )

      const taskElements = screen.getAllByText(/task$/i)

      // Should still be sorted by sortOrder
      expect(taskElements[0]).toHaveTextContent('First task')
      expect(taskElements[1]).toHaveTextContent('Second task')
      expect(taskElements[2]).toHaveTextContent('Third task')
    })
  })

  describe('drag and drop', () => {
    it('should make tasks draggable when onReorder is provided', () => {
      const tasks = createMockTasks()

      renderWithProviders(
        <TaskList
          tasks={tasks}
          categories={[]}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
          onCreateCategory={mockOnCreateCategory}
          onReorder={mockOnReorder}
        />
      )

      // Find task cards by their container divs with draggable attribute
      const draggableElements = document.querySelectorAll('[draggable="true"]')
      expect(draggableElements.length).toBe(3)
    })

    it('should not make tasks draggable when onReorder is not provided', () => {
      const tasks = createMockTasks()

      renderWithProviders(
        <TaskList
          tasks={tasks}
          categories={[]}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
          onCreateCategory={mockOnCreateCategory}
        />
      )

      const draggableElements = document.querySelectorAll('[draggable="true"]')
      expect(draggableElements.length).toBe(0)
    })

    it('should call onReorder with correct position when dropping task', () => {
      const tasks = createMockTasks()

      renderWithProviders(
        <TaskList
          tasks={tasks}
          categories={[]}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
          onCreateCategory={mockOnCreateCategory}
          onReorder={mockOnReorder}
        />
      )

      const draggableElements = document.querySelectorAll('[draggable="true"]')
      const firstTask = draggableElements[0]
      const secondTask = draggableElements[1]

      // Simulate drag start on first task
      fireEvent.dragStart(firstTask, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move',
        },
      })

      // Simulate drag over second task
      fireEvent.dragOver(secondTask, {
        dataTransfer: {
          dropEffect: 'move',
        },
        preventDefault: vi.fn(),
      })

      // Simulate drop on second task position
      fireEvent.drop(secondTask, {
        dataTransfer: {
          getData: () => 'task-1',
        },
        preventDefault: vi.fn(),
      })

      // onReorder should be called with taskId and new sortOrder
      expect(mockOnReorder).toHaveBeenCalled()
      expect(mockOnReorder).toHaveBeenCalledWith('task-1', expect.any(Number))
    })
  })

  describe('fractional indexing', () => {
    it('should calculate midpoint sortOrder when moving between tasks', () => {
      const tasks = createMockTasks()

      renderWithProviders(
        <TaskList
          tasks={tasks}
          categories={[]}
          onComplete={mockOnComplete}
          onDelete={mockOnDelete}
          onUpdate={mockOnUpdate}
          onCreateCategory={mockOnCreateCategory}
          onReorder={mockOnReorder}
        />
      )

      const draggableElements = document.querySelectorAll('[draggable="true"]')
      const thirdTask = draggableElements[2]
      const secondTaskPosition = draggableElements[1]

      // Drag third task to second position
      fireEvent.dragStart(thirdTask, {
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: 'move',
        },
      })

      fireEvent.drop(secondTaskPosition, {
        dataTransfer: {
          getData: () => 'task-3',
        },
        preventDefault: vi.fn(),
      })

      // New sortOrder should be between first (1000) and second (2000) tasks
      const [_, newSortOrder] = mockOnReorder.mock.calls[0]
      expect(newSortOrder).toBeGreaterThan(1000)
      expect(newSortOrder).toBeLessThan(2000)
    })
  })
})
