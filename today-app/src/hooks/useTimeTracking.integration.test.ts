/**
 * Integration tests for time tracking sync flow
 *
 * Tests the full sync flow from stopping time tracking to syncing with Supabase.
 * Source: notes/sprint-artifacts/4-1-supabase-time-entries-table-and-sync.md#Task 11
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTimeTracking } from './useTimeTracking'
import { useTimeEntries } from './useTimeEntries'
import * as timeTrackingDb from '../lib/timeTrackingDb'
import * as syncQueue from '../lib/syncQueue'
import * as supabaseTimeEntries from '../lib/supabaseTimeEntries'
import type { ActiveSession, CachedTimeEntry, TimeEntry } from '../types/timeTracking'

// Mock dependencies
vi.mock('../lib/timeTrackingDb')
vi.mock('../lib/syncQueue')
vi.mock('../lib/supabaseTimeEntries')

describe('Time Tracking Sync Integration (Story 4.1)', () => {
  const mockSession: ActiveSession = {
    taskId: 'task-1',
    taskName: 'Integration Test Task',
    startTime: '2024-01-15T09:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(null)
    vi.mocked(timeTrackingDb.saveActiveSession).mockResolvedValue()
    vi.mocked(timeTrackingDb.clearActiveSession).mockResolvedValue()
    vi.mocked(timeTrackingDb.saveTimeEntry).mockResolvedValue()
    vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([])
    vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([])
    vi.mocked(timeTrackingDb.updateSyncStatus).mockResolvedValue()
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

  describe('Stop tracking → entry saved with pending status (AC-4.1.1)', () => {
    it('should save entry with pending status when using sync-aware path', async () => {
      vi.mocked(timeTrackingDb.loadActiveSession).mockResolvedValue(mockSession)

      // First render useTimeEntries to get addEntry
      const { result: entriesResult } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(entriesResult.current.isLoading).toBe(false)
      })

      // Render useTimeTracking with sync-aware options
      const { result: trackingResult } = renderHook(() =>
        useTimeTracking({
          userId: 'user-123',
          addEntryFn: entriesResult.current.addEntry,
        })
      )

      await waitFor(() => {
        expect(trackingResult.current.isLoading).toBe(false)
      })

      await act(async () => {
        await trackingResult.current.stopTracking()
      })

      // Verify entry was saved with pending status
      expect(timeTrackingDb.saveTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          task_id: 'task-1',
          task_name: 'Integration Test Task',
        })
      )

      // Verify it was queued for sync
      expect(syncQueue.queueOperation).toHaveBeenCalledWith(
        'INSERT',
        'time_entries',
        expect.any(String),
        expect.objectContaining({
          user_id: 'user-123',
        })
      )
    })
  })

  describe('Online sync → entry syncs to Supabase (AC-4.1.2, AC-4.1.3)', () => {
    it('should sync pending entries to Supabase and update status', async () => {
      const pendingEntry: CachedTimeEntry = {
        id: 'entry-pending-1',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'Pending Task',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'pending',
      }

      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([pendingEntry])
      vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([pendingEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.syncEntries()
      })

      // Verify entry was pushed to Supabase
      expect(supabaseTimeEntries.upsertTimeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-pending-1',
          user_id: 'user-123',
        })
      )

      // Verify sync status was updated
      expect(timeTrackingDb.updateSyncStatus).toHaveBeenCalledWith(
        'entry-pending-1',
        'synced',
        expect.any(String)
      )
    })
  })

  describe('Cross-device merge (AC-4.1.4, AC-4.1.5)', () => {
    it('should add remote entries not in local cache', async () => {
      const remoteEntry: TimeEntry = {
        id: 'remote-entry-1',
        user_id: 'user-123',
        task_id: 'task-2',
        task_name: 'Remote Task',
        start_time: '2024-01-16T09:00:00.000Z',
        end_time: '2024-01-16T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-16',
        created_at: '2024-01-16T10:00:00.000Z',
        updated_at: '2024-01-16T10:00:00.000Z',
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-123')
      })

      // Verify remote entry was added with synced status
      expect(timeTrackingDb.bulkUpsertTimeEntries).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'remote-entry-1',
          _syncStatus: 'synced',
        }),
      ])
    })

    it('should replace local with remote when remote is newer (last-write-wins)', async () => {
      const localEntry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'Local Version',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z', // Older
        _syncStatus: 'synced',
      }

      const remoteEntry: TimeEntry = {
        id: 'entry-1',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'Updated Remote Version',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:30:00.000Z',
        duration: 5400000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T14:00:00.000Z', // Newer
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([localEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-123')
      })

      // Verify remote version replaced local
      expect(timeTrackingDb.bulkUpsertTimeEntries).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'entry-1',
          task_name: 'Updated Remote Version',
          duration: 5400000,
          _syncStatus: 'synced',
        }),
      ])
    })

    it('should preserve pending local entries (not overwrite with remote)', async () => {
      const localPendingEntry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'Local Pending Changes',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'pending', // Local has pending changes
      }

      const remoteEntry: TimeEntry = {
        id: 'entry-1',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'Remote Version',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:30:00.000Z',
        duration: 5400000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T14:00:00.000Z', // Newer but should be ignored
      }

      vi.mocked(supabaseTimeEntries.fetchTimeEntries).mockResolvedValue([remoteEntry])
      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([localPendingEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchAndMerge('user-123')
      })

      // Verify local pending entry was NOT overwritten
      expect(timeTrackingDb.bulkUpsertTimeEntries).not.toHaveBeenCalled()
    })
  })

  describe('Task deletion → entry preserved with null task_id (AC-4.1.9)', () => {
    it('should preserve task_name even when task_id is null', async () => {
      // Entry with null task_id (task was deleted)
      const entryWithDeletedTask: CachedTimeEntry = {
        id: 'entry-orphaned',
        user_id: 'user-123',
        task_id: null, // Task was deleted
        task_name: 'Deleted Task Name', // Still preserved
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'synced',
      }

      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([entryWithDeletedTask])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify entry is still accessible with task_name preserved
      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0].task_id).toBeNull()
      expect(result.current.entries[0].task_name).toBe('Deleted Task Name')
    })
  })

  describe('Sync error → marks entry as error (AC-4.1.10)', () => {
    it('should mark entry as error when sync fails', async () => {
      const pendingEntry: CachedTimeEntry = {
        id: 'entry-error',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'Will Fail',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'pending',
      }

      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([pendingEntry])
      vi.mocked(timeTrackingDb.getPendingEntries).mockResolvedValue([pendingEntry])
      vi.mocked(supabaseTimeEntries.upsertTimeEntry).mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.syncEntries()
      })

      // Verify entry was marked as error
      expect(timeTrackingDb.updateSyncStatus).toHaveBeenCalledWith(
        'entry-error',
        'error',
        expect.any(String)
      )
    })
  })

  describe('Delete entry flow', () => {
    it('should delete entry and queue DELETE for sync', async () => {
      const existingEntry: CachedTimeEntry = {
        id: 'entry-to-delete',
        user_id: 'user-123',
        task_id: 'task-1',
        task_name: 'To Delete',
        start_time: '2024-01-15T09:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        duration: 3600000,
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        _syncStatus: 'synced',
      }

      vi.mocked(timeTrackingDb.getTimeEntries).mockResolvedValue([existingEntry])

      const { result } = renderHook(() => useTimeEntries())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.entries).toHaveLength(1)

      await act(async () => {
        await result.current.deleteEntry('entry-to-delete')
      })

      // Verify entry was deleted from IndexedDB
      expect(timeTrackingDb.deleteTimeEntry).toHaveBeenCalledWith('entry-to-delete')

      // Verify DELETE was queued for sync
      expect(syncQueue.queueOperation).toHaveBeenCalledWith(
        'DELETE',
        'time_entries',
        'entry-to-delete',
        {}
      )

      // Verify entry removed from state
      expect(result.current.entries).toHaveLength(0)
    })
  })
})
