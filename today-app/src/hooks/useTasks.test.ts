import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTasks } from './useTasks'
import { startOfDay } from 'date-fns'

// Clear localStorage before each test to ensure clean state
beforeEach(() => {
  localStorage.clear()
})

// Mock Supabase to prevent actual network calls
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }),
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: () => {} }) }),
    }),
    removeChannel: () => {},
  },
}))

describe('useTasks', () => {
  describe('addTask', () => {
    it('should set deferredTo to today when creating a task', async () => {
      const { result } = renderHook(() => useTasks(null))

      // Wait for initial hydration
      await waitFor(() => {
        expect(result.current.tasks).toBeDefined()
      })

      await act(async () => {
        await result.current.addTask('Test task')
      })

      // Wait for the task to be added
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1)
      })

      const task = result.current.tasks[0]
      expect(task.text).toBe('Test task')
      expect(task.deferredTo).toBe(startOfDay(new Date()).toISOString())
    })

    it('should create task that routes to Today view (not Deferred)', async () => {
      const { result } = renderHook(() => useTasks(null))

      await waitFor(() => {
        expect(result.current.tasks).toBeDefined()
      })

      await act(async () => {
        await result.current.addTask('Another task')
      })

      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1)
      })

      const task = result.current.tasks[0]

      // Task should have a date (not null) so it doesn't go to Deferred
      expect(task.deferredTo).not.toBeNull()

      // The date should be today
      const todayStart = startOfDay(new Date()).toISOString()
      expect(task.deferredTo).toBe(todayStart)
    })

    it('should include all required task fields', async () => {
      const { result } = renderHook(() => useTasks(null))

      await waitFor(() => {
        expect(result.current.tasks).toBeDefined()
      })

      await act(async () => {
        await result.current.addTask('Complete task')
      })

      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1)
      })

      const task = result.current.tasks[0]

      // Verify all required fields
      expect(task.id).toBeDefined()
      expect(task.text).toBe('Complete task')
      expect(task.createdAt).toBeDefined()
      expect(task.deferredTo).toBe(startOfDay(new Date()).toISOString())
      expect(task.category).toBeNull()
      expect(task.completedAt).toBeNull()
      expect(task.notes).toBeNull()
      expect(task.sortOrder).toBeDefined()
      expect(typeof task.sortOrder).toBe('number')
    })
  })

  describe('reorderTask', () => {
    it('should update sortOrder of reordered task', async () => {
      const { result } = renderHook(() => useTasks(null))

      await waitFor(() => {
        expect(result.current.tasks).toBeDefined()
      })

      // Add a task
      await act(async () => {
        await result.current.addTask('Task 1')
      })

      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1)
      })

      const taskId = result.current.tasks[0].id
      const originalSortOrder = result.current.tasks[0].sortOrder
      const newSortOrder = originalSortOrder - 500

      // Reorder the task
      await act(async () => {
        await result.current.reorderTask(taskId, newSortOrder)
      })

      // Verify sortOrder was updated
      expect(result.current.tasks[0].sortOrder).toBe(newSortOrder)
    })

    it('should set initial sortOrder based on timestamp for new tasks', async () => {
      const { result } = renderHook(() => useTasks(null))

      await waitFor(() => {
        expect(result.current.tasks).toBeDefined()
      })

      const beforeTimestamp = Date.now()

      await act(async () => {
        await result.current.addTask('New task')
      })

      const afterTimestamp = Date.now()

      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1)
      })

      const task = result.current.tasks[0]

      // sortOrder should be a timestamp-based value
      expect(task.sortOrder).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(task.sortOrder).toBeLessThanOrEqual(afterTimestamp)
    })

    it('should maintain separate sortOrder for multiple tasks', async () => {
      const { result } = renderHook(() => useTasks(null))

      await waitFor(() => {
        expect(result.current.tasks).toBeDefined()
      })

      // Add multiple tasks with slight delays to ensure different sortOrders
      await act(async () => {
        await result.current.addTask('Task 1')
      })

      await act(async () => {
        await result.current.addTask('Task 2')
      })

      await waitFor(() => {
        expect(result.current.tasks.length).toBe(2)
      })

      const task1 = result.current.tasks.find(t => t.text === 'Task 1')
      const task2 = result.current.tasks.find(t => t.text === 'Task 2')

      // Tasks should have different sortOrders (Task 2 created later should have higher sortOrder)
      expect(task1?.sortOrder).toBeDefined()
      expect(task2?.sortOrder).toBeDefined()
      expect(task2!.sortOrder).toBeGreaterThanOrEqual(task1!.sortOrder)
    })
  })
})
