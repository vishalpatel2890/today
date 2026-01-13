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
    })
  })
})
