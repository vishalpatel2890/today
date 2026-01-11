import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTimeTracking } from './useTimeTracking'
import * as timeTrackingDb from '../lib/timeTrackingDb'
import type { ActiveSession } from '../types/timeTracking'

// Mock the timeTrackingDb module
vi.mock('../lib/timeTrackingDb', () => ({
  saveActiveSession: vi.fn(),
  loadActiveSession: vi.fn(),
  clearActiveSession: vi.fn(),
  saveTimeEntry: vi.fn(),
}))

describe('useTimeTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no active session
    vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(null)
    vi.mocked(timeTrackingDb.saveActiveSession).mockResolvedValue(undefined)
    vi.mocked(timeTrackingDb.clearActiveSession).mockResolvedValue(undefined)
    vi.mocked(timeTrackingDb.saveTimeEntry).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should start with isLoading true', () => {
      const { result } = renderHook(() => useTimeTracking())

      // Initially loading
      expect(result.current.isLoading).toBe(true)
    })

    it('should load session from IndexedDB on mount', async () => {
      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(timeTrackingDb.loadActiveSession).toHaveBeenCalledTimes(1)
    })

    it('should set activeSession to null when no session exists', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(null)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.isTracking).toBe(false)
    })

    it('should restore existing session from IndexedDB (AC5)', async () => {
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activeSession).toEqual(mockSession)
      expect(result.current.isTracking).toBe(true)
    })
  })

  describe('startTracking', () => {
    it('should create ActiveSession with correct shape (AC4)', async () => {
      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.startTracking('task-456', 'My Task')
      })

      // Check saveActiveSession was called with correct shape
      expect(timeTrackingDb.saveActiveSession).toHaveBeenCalledTimes(1)
      const savedSession = vi.mocked(timeTrackingDb.saveActiveSession).mock.calls[0][0]

      expect(savedSession.taskId).toBe('task-456')
      expect(savedSession.taskName).toBe('My Task')
      expect(savedSession.startTime).toBeDefined()
      // Verify startTime is a valid ISO 8601 timestamp
      expect(new Date(savedSession.startTime).toISOString()).toBe(savedSession.startTime)
    })

    it('should call saveActiveSession before updating state (AC3)', async () => {
      const callOrder: string[] = []

      vi.mocked(timeTrackingDb.saveActiveSession).mockImplementation(async () => {
        callOrder.push('save')
      })

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.startTracking('task-789', 'Another Task')
        callOrder.push('stateUpdate')
      })

      // saveActiveSession should be called (state update happens after await)
      expect(callOrder[0]).toBe('save')
    })

    it('should update isTracking to true after starting', async () => {
      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isTracking).toBe(false)

      await act(async () => {
        await result.current.startTracking('task-1', 'Task 1')
      })

      expect(result.current.isTracking).toBe(true)
      expect(result.current.activeSession).not.toBeNull()
    })

    it('should snapshot task name (stored even if task changes) (AC4)', async () => {
      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const taskName = 'Original Task Name'

      await act(async () => {
        await result.current.startTracking('task-id', taskName)
      })

      const savedSession = vi.mocked(timeTrackingDb.saveActiveSession).mock.calls[0][0]
      expect(savedSession.taskName).toBe(taskName)
    })
  })

  describe('stopTracking', () => {
    it('should call saveTimeEntry before clearActiveSession (AC6)', async () => {
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const callOrder: string[] = []
      vi.mocked(timeTrackingDb.saveTimeEntry).mockImplementation(async () => {
        callOrder.push('saveTimeEntry')
      })
      vi.mocked(timeTrackingDb.clearActiveSession).mockImplementation(async () => {
        callOrder.push('clearActiveSession')
      })

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isTracking).toBe(true)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      expect(callOrder).toEqual(['saveTimeEntry', 'clearActiveSession'])
    })

    it('should create TimeEntry with all required fields (AC7)', async () => {
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isTracking).toBe(true)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      expect(timeTrackingDb.saveTimeEntry).toHaveBeenCalledTimes(1)
      const savedEntry = vi.mocked(timeTrackingDb.saveTimeEntry).mock.calls[0][0]

      // Verify all required fields are present
      expect(savedEntry.id).toBeDefined()
      expect(savedEntry.user_id).toBe('local')
      expect(savedEntry.task_id).toBe('task-123')
      expect(savedEntry.task_name).toBe('Test Task')
      expect(savedEntry.start_time).toBe('2026-01-10T10:00:00.000Z')
      expect(savedEntry.end_time).toBeDefined()
      expect(savedEntry.duration).toBeGreaterThan(0)
      expect(savedEntry.date).toBe('2026-01-10')
      expect(savedEntry.created_at).toBeDefined()
      expect(savedEntry.updated_at).toBeDefined()
    })

    it('should return the created TimeEntry', async () => {
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: new Date(Date.now() - 5000).toISOString(), // 5 seconds ago
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isTracking).toBe(true)
      })

      let returnedEntry
      await act(async () => {
        returnedEntry = await result.current.stopTracking()
      })

      expect(returnedEntry).not.toBeNull()
      expect(returnedEntry!.task_name).toBe('Test Task')
      expect(returnedEntry!.duration).toBeGreaterThanOrEqual(5000)
    })

    it('should return null when no active session (AC10)', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(null)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let returnedEntry
      await act(async () => {
        returnedEntry = await result.current.stopTracking()
      })

      expect(returnedEntry).toBeNull()
      expect(timeTrackingDb.saveTimeEntry).not.toHaveBeenCalled()
    })

    it('should set activeSession to null after stopping', async () => {
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isTracking).toBe(true)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      expect(result.current.activeSession).toBeNull()
      expect(result.current.isTracking).toBe(false)
    })

    it('should create separate entries for multiple tracking sessions (AC11)', async () => {
      const mockSession: ActiveSession = {
        taskId: 'same-task',
        taskName: 'Same Task',
        startTime: new Date(Date.now() - 1000).toISOString(),
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isTracking).toBe(true)
      })

      // First stop
      let entry1
      await act(async () => {
        entry1 = await result.current.stopTracking()
      })

      // Start again
      await act(async () => {
        await result.current.startTracking('same-task', 'Same Task')
      })

      // Second stop
      let entry2
      await act(async () => {
        entry2 = await result.current.stopTracking()
      })

      // Should have created 2 separate entries with different IDs
      expect(timeTrackingDb.saveTimeEntry).toHaveBeenCalledTimes(2)
      expect(entry1!.id).not.toBe(entry2!.id)
    })
  })

  describe('isTracking derived state', () => {
    it('should return false when activeSession is null', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(null)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isTracking).toBe(false)
    })

    it('should return true when activeSession exists', async () => {
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isTracking).toBe(true)
    })
  })

  describe('elapsed time calculation (AC6)', () => {
    it('should allow calculating elapsed time from startTime', async () => {
      const startTime = new Date(Date.now() - 5000).toISOString() // 5 seconds ago
      const mockSession: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime,
      }
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Calculate elapsed time as the UI would
      const elapsed = Date.now() - new Date(result.current.activeSession!.startTime).getTime()

      // Should be approximately 5 seconds (allow some margin for test execution)
      expect(elapsed).toBeGreaterThanOrEqual(5000)
      expect(elapsed).toBeLessThan(6000)
    })
  })

  describe('error handling', () => {
    it('should handle loadActiveSession failure gracefully', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockRejectedValue(new Error('DB Error'))

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should still complete loading and set null session
      expect(result.current.activeSession).toBeNull()
      expect(result.current.isTracking).toBe(false)
    })
  })

  describe('Epic 4 sync integration (AC-4.1.1)', () => {
    const mockSession: ActiveSession = {
      taskId: 'task-sync-1',
      taskName: 'Sync Task',
      startTime: '2024-01-15T09:00:00.000Z',
    }

    it('should use addEntryFn when provided', async () => {
      const addEntryFn = vi.fn().mockResolvedValue({
        id: 'synced-entry-1',
        user_id: 'auth-user-123',
        task_id: 'task-sync-1',
        task_name: 'Sync Task',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      })

      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() =>
        useTimeTracking({
          userId: 'auth-user-123',
          addEntryFn,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      // Should use addEntryFn instead of direct save
      expect(addEntryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'auth-user-123',
          task_id: 'task-sync-1',
          task_name: 'Sync Task',
        })
      )

      // Should NOT call direct saveTimeEntry
      expect(timeTrackingDb.saveTimeEntry).not.toHaveBeenCalled()
    })

    it('should use provided userId in entry', async () => {
      const addEntryFn = vi.fn().mockImplementation(async (data) => ({
        ...data,
        id: 'test-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() =>
        useTimeTracking({
          userId: 'custom-user-id',
          addEntryFn,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      expect(addEntryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'custom-user-id',
        })
      )
    })

    it('should return entry from addEntryFn', async () => {
      const mockReturnedEntry = {
        id: 'synced-entry-returned',
        user_id: 'auth-user-123',
        task_id: 'task-sync-1',
        task_name: 'Sync Task',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      }

      const addEntryFn = vi.fn().mockResolvedValue(mockReturnedEntry)
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() =>
        useTimeTracking({
          userId: 'auth-user-123',
          addEntryFn,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let returnedEntry: unknown

      await act(async () => {
        returnedEntry = await result.current.stopTracking()
      })

      expect(returnedEntry).toEqual(mockReturnedEntry)
    })

    it('should fall back to direct save when addEntryFn not provided', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() =>
        useTimeTracking({
          userId: 'fallback-user',
          // No addEntryFn provided
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      // Should use direct saveTimeEntry with provided userId
      expect(timeTrackingDb.saveTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'fallback-user',
        })
      )
    })

    it('should default userId to "local" when not provided', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      const { result } = renderHook(() => useTimeTracking())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.stopTracking()
      })

      // Should use default 'local' user_id
      expect(timeTrackingDb.saveTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'local',
        })
      )
    })
  })
})
