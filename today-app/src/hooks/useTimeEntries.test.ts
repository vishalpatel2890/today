import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTimeEntries } from './useTimeEntries'
import * as timeTrackingDb from '../lib/timeTrackingDb'
import * as syncQueue from '../lib/syncQueue'
import * as supabaseTimeEntries from '../lib/supabaseTimeEntries'
import type { TimeEntry, CachedTimeEntry } from '../types/timeTracking'

// Mock dependencies
vi.mock('../lib/timeTrackingDb')
vi.mock('../lib/syncQueue')
vi.mock('../lib/supabaseTimeEntries')

describe('useTimeEntries', () => {
  const mockCachedEntry: CachedTimeEntry = {
    id: 'entry-1',
    user_id: 'user-1',
    task_id: 'task-1',
    task_name: 'Test Task',
    start_time: '2024-01-15T09:00:00.000Z',
    end_time: '2024-01-15T10:00:00.000Z',
    duration: 3600000,
    date: '2024-01-15',
    created_at: '2024-01-15T09:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z',
    _syncStatus: 'synced',
  }

  const mockTimeEntry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'> = {
    user_id: 'user-1',
    task_id: 'task-1',
    task_name: 'New Task',
    start_time: '2024-01-15T14:00:00.000Z',
    end_time: '2024-01-15T15:00:00.000Z',
    duration: 3600000,
    date: '2024-01-15',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([mockCachedEntry])
    vi.mocked(timeTrackingDb.saveTimeEntry).mockResolvedValue()
    vi.mocked(timeTrackingDb.updateSyncStatus).mockResolvedValue()
    vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([])
    vi.mocked(timeTrackingDb.upsertTimeEntry).mockResolvedValue()
    vi.mocked(timeTrackingDb.bulkUpsertTimeEntries).mockResolvedValue()
    vi.mocked(timeTrackingDb.deleteTimeEntry).mockResolvedValue()
    vi.mocked(syncQueue.queueOperation).mockResolvedValue()
    vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([])
    vi.mocked(supabaseTimeEntries.upsertTimeEntry).mockImplementation(async entry => entry)
    vi.mocked(supabaseTimeEntries.deleteTimeEntry).mockResolvedValue()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initial state and loading', () => {
    it('should start with isLoading true', () => {
      const { result } = renderHook(() => useTimeEntries())

      // Initially loading
      expect(result.current.isLoading).toBe(true)
    })

    it('should load entries from IndexedDB on mount', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(timeTrackingDb.getTimeEntries).toHaveBeenCalled()
      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0].id).toBe('entry-1')
    })

    it('should handle load errors gracefully', async () => {
      vi.mocked(timeTrackingDb.getTimeEntries).mockRejectedValue(
        new Error('IndexedDB error')
      )

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.entries).toHaveLength(0)
    })
  })

  describe('pendingCount', () => {
    it('should count entries with pending sync status', async () => {
      const pendingEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        id: 'entry-2',
        _syncStatus: 'pending',
      }

      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([
        mockCachedEntry,
        pendingEntry,
      ])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pendingCount).toBe(1)
    })

    it('should return 0 when no pending entries', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.pendingCount).toBe(0)
    })
  })

  describe('addEntry (AC-4.1.1)', () => {
    it('should generate UUID for new entry', async () => {
      const mockUUID = 'generated-uuid-123'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID)

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let createdEntry: TimeEntry | undefined

      await act(async () => {
        createdEntry = await result.current.addEntry(mockTimeEntry)
      })

      expect(createdEntry?.id).toBe(mockUUID)
    })

    it('should save entry to IndexedDB with pending status', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addEntry(mockTimeEntry)
      })

      expect(timeTrackingDb.saveTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          task_name: 'New Task',
        })
      )
    })

    it('should queue INSERT operation for sync', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addEntry(mockTimeEntry)
      })

      expect(syncQueue.queueOperation).toHaveBeenCalledWith(
        'INSERT',
        'time_entries',
        expect.any(String),
        expect.objectContaining({
          user_id: 'user-1',
          task_name: 'New Task',
        })
      )
    })

    it('should update React state with new entry', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCount = result.current.entries.length

      await act(async () => {
        await result.current.addEntry(mockTimeEntry)
      })

      expect(result.current.entries.length).toBe(initialCount + 1)
      expect(result.current.entries[0].task_name).toBe('New Task')
      expect(result.current.entries[0]._syncStatus).toBe('pending')
    })

    it('should return the created entry', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let createdEntry: TimeEntry | undefined

      await act(async () => {
        createdEntry = await result.current.addEntry(mockTimeEntry)
      })

      expect(createdEntry).toBeDefined()
      expect(createdEntry?.task_name).toBe('New Task')
      expect(createdEntry?.user_id).toBe('user-1')
    })

    it('should set error on failure', async () => {
      vi.mocked(timeTrackingDb.saveTimeEntry).mockRejectedValue(
        new Error('Save failed')
      )

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.addEntry(mockTimeEntry)
        } catch {
          // Expected error
        }
      })

      expect(result.current.error).not.toBeNull()
    })
  })

  describe('deleteEntry', () => {
    it('should delete entry from IndexedDB', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteEntry('entry-1')
      })

      expect(timeTrackingDb.deleteTimeEntry).toHaveBeenCalledWith('entry-1')
    })

    it('should queue DELETE operation for sync', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteEntry('entry-1')
      })

      expect(syncQueue.queueOperation).toHaveBeenCalledWith(
        'DELETE',
        'time_entries',
        'entry-1',
        {}
      )
    })

    it('should remove entry from React state', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.entries).toHaveLength(1)

      await act(async () => {
        await result.current.deleteEntry('entry-1')
      })

      expect(result.current.entries).toHaveLength(0)
    })
  })

  describe('syncEntries (AC-4.1.2, AC-4.1.3)', () => {
    it('should do nothing when no pending entries', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.syncEntries()
      })

      expect(supabaseTimeEntries.upsertTimeEntry).not.toHaveBeenCalled()
    })

    it('should push pending entries to Supabase', async () => {
      const pendingEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        _syncStatus: 'pending',
      }

      vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([pendingEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.syncEntries()
      })

      expect(supabaseTimeEntries.upsertTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-1',
          user_id: 'user-1',
        })
      )
    })

    it('should update sync status to synced on success (AC-4.1.3)', async () => {
      const pendingEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        _syncStatus: 'pending',
      }

      vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([pendingEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([pendingEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.syncEntries()
      })

      expect(timeTrackingDb.updateSyncStatus).toHaveBeenCalledWith(
        'entry-1',
        'synced',
        expect.any(String)
      )
    })

    it('should mark entry as error on sync failure', async () => {
      const pendingEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        _syncStatus: 'pending',
      }

      vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([pendingEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([pendingEntry])
      vi.mocked(supabaseTimeEntries.upsertTimeEntry).mockRejectedValue(
        new Error('Sync failed')
      )

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.syncEntries()
      })

      expect(timeTrackingDb.updateSyncStatus).toHaveBeenCalledWith(
        'entry-1',
        'error',
        expect.any(String)
      )
    })
  })

  describe('fetchAndMerge (AC-4.1.4, AC-4.1.5)', () => {
    it('should fetch entries from Supabase', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-1')
      })

      expect(supabaseTimeEntries.fetchTimeEntries).toHaveBeenCalledWith('user-1')
    })

    it('should add remote entries not in local cache (AC-4.1.4)', async () => {
      const remoteEntry: TimeEntry = {
        id: 'remote-entry-1',
        user_id: 'user-1',
        task_id: 'task-2',
        task_name: 'Remote Task',
        start_time: '2024-01-16T09:00:00.000Z',
        end_time: '2024-01-16T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-16',
        created_at: '2024-01-16T09:00:00.000Z',
        updated_at: '2024-01-16T10:00:00.000Z',
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([mockCachedEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-1')
      })

      expect(timeTrackingDb.bulkUpsertTimeEntries).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'remote-entry-1',
          _syncStatus: 'synced',
        }),
      ])
    })

    it('should replace local with remote when remote is newer (AC-4.1.5)', async () => {
      const localEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'synced',
      }

      const remoteEntry: TimeEntry = {
        ...mockCachedEntry,
        updated_at: '2024-01-15T12:00:00.000Z', // Newer
        task_name: 'Updated Task Name',
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([localEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-1')
      })

      expect(timeTrackingDb.bulkUpsertTimeEntries).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'entry-1',
          task_name: 'Updated Task Name',
          _syncStatus: 'synced',
        }),
      ])
    })

    it('should keep local entry when local is newer (AC-4.1.5)', async () => {
      const localEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        updated_at: '2024-01-15T14:00:00.000Z', // Newer
        _syncStatus: 'synced',
      }

      const remoteEntry: TimeEntry = {
        ...mockCachedEntry,
        updated_at: '2024-01-15T10:00:00.000Z', // Older
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([localEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-1')
      })

      // Should not upsert anything since local is newer
      expect(timeTrackingDb.bulkUpsertTimeEntries).not.toHaveBeenCalled()
    })

    it('should preserve pending local entries (AC-4.1.5)', async () => {
      const localPendingEntry: CachedTimeEntry = {
        ...mockCachedEntry,
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'pending', // Pending - should not be overwritten
      }

      const remoteEntry: TimeEntry = {
        ...mockCachedEntry,
        updated_at: '2024-01-15T12:00:00.000Z', // Newer but local is pending
        task_name: 'Remote Update',
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([localPendingEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-1')
      })

      // Should not upsert because local is pending
      expect(timeTrackingDb.bulkUpsertTimeEntries).not.toHaveBeenCalled()
    })
  })

  describe('refreshEntries', () => {
    it('should reload entries from IndexedDB', async () => {
      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      vi.mocked(timeTrackingDb.getTimeEntries).mockClear()

      await act(async () => {
        await result.current.refreshEntries()
      })

      expect(timeTrackingDb.getTimeEntries).toHaveBeenCalled()
    })
  })
})
