import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  saveTimeEntry,
  getTimeEntries,
  getTimeEntryById,
  updateSyncStatus,
  getPendingEntries,
  upsertTimeEntry,
  bulkUpsertTimeEntries,
  deleteTimeEntry,
  timeTrackingDb,
} from './timeTrackingDb'
import type { ActiveSession, TimeEntry, CachedTimeEntry } from '../types/timeTracking'

describe('timeTrackingDb', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await timeTrackingDb.activeSession.clear()
    await timeTrackingDb.timeEntries.clear()
  })

  afterEach(async () => {
    // Clean up after each test
    await timeTrackingDb.activeSession.clear()
    await timeTrackingDb.timeEntries.clear()
  })

  describe('saveActiveSession', () => {
    it('should persist session to IndexedDB (AC3)', async () => {
      const session: ActiveSession = {
        taskId: 'task-123',
        taskName: 'Test Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }

      await saveActiveSession(session)

      // Verify it was saved
      const record = await timeTrackingDb.activeSession.get('current')
      expect(record).toBeDefined()
      expect(record?.session).toEqual(session)
    })

    it('should overwrite existing session', async () => {
      const session1: ActiveSession = {
        taskId: 'task-1',
        taskName: 'First Task',
        startTime: '2026-01-10T09:00:00.000Z',
      }

      const session2: ActiveSession = {
        taskId: 'task-2',
        taskName: 'Second Task',
        startTime: '2026-01-10T10:00:00.000Z',
      }

      await saveActiveSession(session1)
      await saveActiveSession(session2)

      // Should only have one record
      const count = await timeTrackingDb.activeSession.count()
      expect(count).toBe(1)

      // Should be the second session
      const record = await timeTrackingDb.activeSession.get('current')
      expect(record?.session).toEqual(session2)
    })

    it('should store all ActiveSession fields correctly (AC4)', async () => {
      const session: ActiveSession = {
        taskId: 'uuid-task-id',
        taskName: 'Task with Special Characters: é, ñ, 中文',
        startTime: '2026-01-10T15:30:45.123Z',
      }

      await saveActiveSession(session)

      const record = await timeTrackingDb.activeSession.get('current')
      expect(record?.session.taskId).toBe('uuid-task-id')
      expect(record?.session.taskName).toBe('Task with Special Characters: é, ñ, 中文')
      expect(record?.session.startTime).toBe('2026-01-10T15:30:45.123Z')
    })
  })

  describe('loadActiveSession', () => {
    it('should retrieve saved session (AC5)', async () => {
      const session: ActiveSession = {
        taskId: 'task-456',
        taskName: 'Saved Task',
        startTime: '2026-01-10T11:00:00.000Z',
      }

      await saveActiveSession(session)
      const loaded = await loadActiveSession()

      expect(loaded).toEqual(session)
    })

    it('should return null when no session exists', async () => {
      const loaded = await loadActiveSession()

      expect(loaded).toBeNull()
    })

    it('should work with empty database', async () => {
      // Database is already empty from beforeEach
      const loaded = await loadActiveSession()

      expect(loaded).toBeNull()
    })
  })

  describe('clearActiveSession', () => {
    it('should remove session from IndexedDB', async () => {
      const session: ActiveSession = {
        taskId: 'task-789',
        taskName: 'Task to Clear',
        startTime: '2026-01-10T12:00:00.000Z',
      }

      await saveActiveSession(session)

      // Verify it exists
      let loaded = await loadActiveSession()
      expect(loaded).not.toBeNull()

      // Clear it
      await clearActiveSession()

      // Verify it's gone
      loaded = await loadActiveSession()
      expect(loaded).toBeNull()
    })

    it('should not throw when clearing empty database', async () => {
      // Should not throw
      await expect(clearActiveSession()).resolves.not.toThrow()
    })
  })

  describe('offline functionality (AC7)', () => {
    it('should work without network (IndexedDB is inherently offline-capable)', async () => {
      // IndexedDB operations are local by nature
      // This test verifies the operations complete without network

      const session: ActiveSession = {
        taskId: 'offline-task',
        taskName: 'Offline Task',
        startTime: new Date().toISOString(),
      }

      // These operations should work without any network
      await saveActiveSession(session)
      const loaded = await loadActiveSession()
      expect(loaded).toEqual(session)

      await clearActiveSession()
      const cleared = await loadActiveSession()
      expect(cleared).toBeNull()
    })
  })

  describe('session restoration after simulated refresh (AC5, AC6)', () => {
    it('should persist session across database reconnection', async () => {
      const session: ActiveSession = {
        taskId: 'persist-task',
        taskName: 'Persistent Task',
        startTime: '2026-01-10T08:00:00.000Z',
      }

      // Save session
      await saveActiveSession(session)

      // Simulate "refresh" by clearing the module cache would be complex,
      // but we can verify the data persists in IndexedDB directly
      const record = await timeTrackingDb.activeSession.get('current')
      expect(record?.session).toEqual(session)

      // Load should return the same session
      const loaded = await loadActiveSession()
      expect(loaded).toEqual(session)
      expect(loaded?.startTime).toBe('2026-01-10T08:00:00.000Z')
    })

    it('should allow correct elapsed time calculation after restoration (AC6)', async () => {
      // Save session with a specific start time
      const pastTime = new Date(Date.now() - 60000) // 1 minute ago
      const session: ActiveSession = {
        taskId: 'elapsed-task',
        taskName: 'Elapsed Task',
        startTime: pastTime.toISOString(),
      }

      await saveActiveSession(session)

      // Load and calculate elapsed time
      const loaded = await loadActiveSession()
      expect(loaded).not.toBeNull()

      const elapsed = Date.now() - new Date(loaded!.startTime).getTime()

      // Should be approximately 1 minute (60000ms) - allow margin for test execution
      expect(elapsed).toBeGreaterThanOrEqual(60000)
      expect(elapsed).toBeLessThan(62000)
    })
  })

  describe('saveTimeEntry', () => {
    const createTestEntry = (overrides?: Partial<TimeEntry>): TimeEntry => ({
      id: 'entry-' + Math.random().toString(36).slice(2),
      user_id: 'local',
      task_id: 'task-123',
      task_name: 'Test Task',
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
      ...overrides,
    })

    it('should persist time entry to IndexedDB (AC7)', async () => {
      const entry = createTestEntry({ id: 'entry-1' })

      await saveTimeEntry(entry)

      const saved = await timeTrackingDb.timeEntries.get('entry-1')
      // Saved entry includes sync metadata
      expect(saved?.id).toBe('entry-1')
      expect(saved?.task_name).toBe('Test Task')
      expect(saved?._syncStatus).toBe('pending') // Default sync status
    })

    it('should store all TimeEntry fields correctly', async () => {
      const entry: TimeEntry = {
        id: 'full-entry',
        user_id: 'user-123',
        task_id: 'task-456',
        task_name: 'Complete Task',
        start_time: '2026-01-10T09:30:00.000Z',
        end_time: '2026-01-10T11:45:00.000Z',
        duration: 8100000,
        date: '2026-01-10',
        created_at: '2026-01-10T11:45:00.000Z',
        updated_at: '2026-01-10T11:45:00.000Z',
      }

      await saveTimeEntry(entry)

      const saved = await timeTrackingDb.timeEntries.get('full-entry')
      expect(saved?.id).toBe('full-entry')
      expect(saved?.user_id).toBe('user-123')
      expect(saved?.task_id).toBe('task-456')
      expect(saved?.task_name).toBe('Complete Task')
      expect(saved?.start_time).toBe('2026-01-10T09:30:00.000Z')
      expect(saved?.end_time).toBe('2026-01-10T11:45:00.000Z')
      expect(saved?.duration).toBe(8100000)
      expect(saved?.date).toBe('2026-01-10')
    })

    it('should allow multiple entries with different IDs (AC11)', async () => {
      const entry1 = createTestEntry({ id: 'entry-a' })
      const entry2 = createTestEntry({ id: 'entry-b' })

      await saveTimeEntry(entry1)
      await saveTimeEntry(entry2)

      const count = await timeTrackingDb.timeEntries.count()
      expect(count).toBe(2)
    })

    it('should allow null task_id (for deleted tasks, AC10)', async () => {
      const entry = createTestEntry({
        id: 'deleted-task-entry',
        task_id: null,
        task_name: 'Deleted Task Name Preserved',
      })

      await saveTimeEntry(entry)

      const saved = await timeTrackingDb.timeEntries.get('deleted-task-entry')
      expect(saved?.task_id).toBeNull()
      expect(saved?.task_name).toBe('Deleted Task Name Preserved')
    })
  })

  describe('getTimeEntries', () => {
    const createTestEntry = (overrides?: Partial<TimeEntry>): TimeEntry => ({
      id: 'entry-' + Math.random().toString(36).slice(2),
      user_id: 'local',
      task_id: 'task-123',
      task_name: 'Test Task',
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
      ...overrides,
    })

    it('should return all entries when no date range specified', async () => {
      await saveTimeEntry(createTestEntry({ id: 'entry-1', date: '2026-01-08' }))
      await saveTimeEntry(createTestEntry({ id: 'entry-2', date: '2026-01-09' }))
      await saveTimeEntry(createTestEntry({ id: 'entry-3', date: '2026-01-10' }))

      const entries = await getTimeEntries()

      expect(entries).toHaveLength(3)
    })

    it('should return empty array when no entries exist', async () => {
      const entries = await getTimeEntries()

      expect(entries).toHaveLength(0)
    })

    it('should filter entries by date range', async () => {
      await saveTimeEntry(createTestEntry({ id: 'entry-1', date: '2026-01-08' }))
      await saveTimeEntry(createTestEntry({ id: 'entry-2', date: '2026-01-09' }))
      await saveTimeEntry(createTestEntry({ id: 'entry-3', date: '2026-01-10' }))

      const entries = await getTimeEntries({
        start: '2026-01-09',
        end: '2026-01-10',
      })

      expect(entries).toHaveLength(2)
      expect(entries.map(e => e.id)).toContain('entry-2')
      expect(entries.map(e => e.id)).toContain('entry-3')
    })

    it('should include boundary dates in range', async () => {
      await saveTimeEntry(createTestEntry({ id: 'entry-start', date: '2026-01-09' }))
      await saveTimeEntry(createTestEntry({ id: 'entry-end', date: '2026-01-10' }))

      const entries = await getTimeEntries({
        start: '2026-01-09',
        end: '2026-01-10',
      })

      expect(entries).toHaveLength(2)
    })
  })

  describe('getTimeEntryById', () => {
    it('should return entry by ID', async () => {
      const entry: TimeEntry = {
        id: 'find-me',
        user_id: 'local',
        task_id: 'task-1',
        task_name: 'Find This Task',
        start_time: '2026-01-10T10:00:00.000Z',
        end_time: '2026-01-10T11:00:00.000Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T11:00:00.000Z',
        updated_at: '2026-01-10T11:00:00.000Z',
      }

      await saveTimeEntry(entry)

      const found = await getTimeEntryById('find-me')
      expect(found?.id).toBe('find-me')
      expect(found?.task_name).toBe('Find This Task')
      // Should have sync status added
      expect(found?._syncStatus).toBe('pending')
    })

    it('should return undefined for non-existent ID', async () => {
      const found = await getTimeEntryById('does-not-exist')
      expect(found).toBeUndefined()
    })
  })

  // Epic 4: Cross-Device Sync tests
  // Source: notes/sprint-artifacts/tech-spec-epic-4-cross-device-sync.md

  describe('saveTimeEntry with sync metadata (AC-4.1.1)', () => {
    const createTestEntry = (overrides?: Partial<TimeEntry>): TimeEntry => ({
      id: 'entry-' + Math.random().toString(36).slice(2),
      user_id: 'user-123',
      task_id: 'task-123',
      task_name: 'Test Task',
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
      ...overrides,
    })

    it('should automatically set _syncStatus to pending for new entries', async () => {
      const entry = createTestEntry({ id: 'new-entry' })

      await saveTimeEntry(entry)

      const saved = await getTimeEntryById('new-entry')
      expect(saved?._syncStatus).toBe('pending')
    })

    it('should preserve _syncStatus if already set', async () => {
      const entry: CachedTimeEntry = {
        ...createTestEntry({ id: 'synced-entry' }),
        _syncStatus: 'synced',
      }

      await saveTimeEntry(entry)

      const saved = await getTimeEntryById('synced-entry')
      expect(saved?._syncStatus).toBe('synced')
    })

    it('should preserve _lastSyncAttempt if provided', async () => {
      const entry: CachedTimeEntry = {
        ...createTestEntry({ id: 'sync-attempt-entry' }),
        _syncStatus: 'error',
        _lastSyncAttempt: '2026-01-10T12:00:00.000Z',
      }

      await saveTimeEntry(entry)

      const saved = await getTimeEntryById('sync-attempt-entry')
      expect(saved?._syncStatus).toBe('error')
      expect(saved?._lastSyncAttempt).toBe('2026-01-10T12:00:00.000Z')
    })
  })

  describe('updateSyncStatus (AC-4.1.3)', () => {
    const createTestEntry = (): TimeEntry => ({
      id: 'status-test-entry',
      user_id: 'user-123',
      task_id: 'task-123',
      task_name: 'Test Task',
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
    })

    it('should update _syncStatus from pending to synced', async () => {
      await saveTimeEntry(createTestEntry())

      await updateSyncStatus('status-test-entry', 'synced')

      const entry = await getTimeEntryById('status-test-entry')
      expect(entry?._syncStatus).toBe('synced')
    })

    it('should update _syncStatus to error', async () => {
      await saveTimeEntry(createTestEntry())

      await updateSyncStatus('status-test-entry', 'error')

      const entry = await getTimeEntryById('status-test-entry')
      expect(entry?._syncStatus).toBe('error')
    })

    it('should set _lastSyncAttempt when provided', async () => {
      await saveTimeEntry(createTestEntry())
      const timestamp = '2026-01-10T14:30:00.000Z'

      await updateSyncStatus('status-test-entry', 'error', timestamp)

      const entry = await getTimeEntryById('status-test-entry')
      expect(entry?._syncStatus).toBe('error')
      expect(entry?._lastSyncAttempt).toBe(timestamp)
    })

    it('should not modify _lastSyncAttempt when not provided', async () => {
      const entryWithAttempt: CachedTimeEntry = {
        ...createTestEntry(),
        _syncStatus: 'error',
        _lastSyncAttempt: '2026-01-10T12:00:00.000Z',
      }
      await saveTimeEntry(entryWithAttempt)

      await updateSyncStatus('status-test-entry', 'synced')

      const entry = await getTimeEntryById('status-test-entry')
      expect(entry?._syncStatus).toBe('synced')
      expect(entry?._lastSyncAttempt).toBe('2026-01-10T12:00:00.000Z')
    })
  })

  describe('getPendingEntries (AC-4.1.2)', () => {
    const createTestEntry = (id: string, status: 'synced' | 'pending' | 'error'): CachedTimeEntry => ({
      id,
      user_id: 'user-123',
      task_id: 'task-123',
      task_name: 'Test Task',
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
      _syncStatus: status,
    })

    it('should return only entries with pending status', async () => {
      await saveTimeEntry(createTestEntry('pending-1', 'pending'))
      await saveTimeEntry(createTestEntry('synced-1', 'synced'))
      await saveTimeEntry(createTestEntry('pending-2', 'pending'))
      await saveTimeEntry(createTestEntry('error-1', 'error'))

      const pending = await getPendingEntries()

      expect(pending).toHaveLength(2)
      expect(pending.map(e => e.id)).toContain('pending-1')
      expect(pending.map(e => e.id)).toContain('pending-2')
    })

    it('should return empty array when no pending entries exist', async () => {
      await saveTimeEntry(createTestEntry('synced-1', 'synced'))
      await saveTimeEntry(createTestEntry('synced-2', 'synced'))

      const pending = await getPendingEntries()

      expect(pending).toHaveLength(0)
    })

    it('should return empty array when database is empty', async () => {
      const pending = await getPendingEntries()

      expect(pending).toHaveLength(0)
    })
  })

  describe('upsertTimeEntry (AC-4.1.5)', () => {
    const createTestEntry = (overrides?: Partial<CachedTimeEntry>): CachedTimeEntry => ({
      id: 'upsert-entry',
      user_id: 'user-123',
      task_id: 'task-123',
      task_name: 'Test Task',
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
      _syncStatus: 'synced',
      ...overrides,
    })

    it('should insert new entry if not exists', async () => {
      const entry = createTestEntry()

      await upsertTimeEntry(entry)

      const saved = await getTimeEntryById('upsert-entry')
      expect(saved).toBeDefined()
      expect(saved?.task_name).toBe('Test Task')
    })

    it('should update existing entry if exists', async () => {
      const original = createTestEntry({ task_name: 'Original Name' })
      await upsertTimeEntry(original)

      const updated = createTestEntry({ task_name: 'Updated Name' })
      await upsertTimeEntry(updated)

      const saved = await getTimeEntryById('upsert-entry')
      expect(saved?.task_name).toBe('Updated Name')

      // Should still be only one entry
      const all = await getTimeEntries()
      expect(all).toHaveLength(1)
    })

    it('should update sync status during upsert', async () => {
      const pending = createTestEntry({ _syncStatus: 'pending' })
      await upsertTimeEntry(pending)

      const synced = createTestEntry({ _syncStatus: 'synced' })
      await upsertTimeEntry(synced)

      const saved = await getTimeEntryById('upsert-entry')
      expect(saved?._syncStatus).toBe('synced')
    })
  })

  describe('bulkUpsertTimeEntries (AC-4.1.4)', () => {
    const createTestEntry = (id: string, name: string): CachedTimeEntry => ({
      id,
      user_id: 'user-123',
      task_id: 'task-123',
      task_name: name,
      start_time: '2026-01-10T10:00:00.000Z',
      end_time: '2026-01-10T11:00:00.000Z',
      duration: 3600000,
      date: '2026-01-10',
      created_at: '2026-01-10T11:00:00.000Z',
      updated_at: '2026-01-10T11:00:00.000Z',
      _syncStatus: 'synced',
    })

    it('should insert multiple new entries', async () => {
      const entries = [
        createTestEntry('bulk-1', 'Task 1'),
        createTestEntry('bulk-2', 'Task 2'),
        createTestEntry('bulk-3', 'Task 3'),
      ]

      await bulkUpsertTimeEntries(entries)

      const all = await getTimeEntries()
      expect(all).toHaveLength(3)
    })

    it('should update existing entries in bulk', async () => {
      // Insert initial entries
      await bulkUpsertTimeEntries([
        createTestEntry('bulk-1', 'Original 1'),
        createTestEntry('bulk-2', 'Original 2'),
      ])

      // Update them
      await bulkUpsertTimeEntries([
        createTestEntry('bulk-1', 'Updated 1'),
        createTestEntry('bulk-2', 'Updated 2'),
      ])

      const all = await getTimeEntries()
      expect(all).toHaveLength(2)
      expect(all.find(e => e.id === 'bulk-1')?.task_name).toBe('Updated 1')
      expect(all.find(e => e.id === 'bulk-2')?.task_name).toBe('Updated 2')
    })

    it('should handle mix of inserts and updates', async () => {
      // Insert one entry
      await upsertTimeEntry(createTestEntry('existing', 'Existing'))

      // Bulk with one existing, two new
      await bulkUpsertTimeEntries([
        createTestEntry('existing', 'Existing Updated'),
        createTestEntry('new-1', 'New 1'),
        createTestEntry('new-2', 'New 2'),
      ])

      const all = await getTimeEntries()
      expect(all).toHaveLength(3)
      expect(all.find(e => e.id === 'existing')?.task_name).toBe('Existing Updated')
    })
  })

  describe('deleteTimeEntry', () => {
    it('should delete entry by ID', async () => {
      const entry: TimeEntry = {
        id: 'delete-me',
        user_id: 'user-123',
        task_id: 'task-123',
        task_name: 'Delete This Task',
        start_time: '2026-01-10T10:00:00.000Z',
        end_time: '2026-01-10T11:00:00.000Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T11:00:00.000Z',
        updated_at: '2026-01-10T11:00:00.000Z',
      }

      await saveTimeEntry(entry)
      expect(await getTimeEntryById('delete-me')).toBeDefined()

      await deleteTimeEntry('delete-me')

      expect(await getTimeEntryById('delete-me')).toBeUndefined()
    })

    it('should not throw when deleting non-existent entry', async () => {
      await expect(deleteTimeEntry('non-existent')).resolves.not.toThrow()
    })

    it('should not affect other entries', async () => {
      await saveTimeEntry({
        id: 'keep-1',
        user_id: 'user-123',
        task_id: 'task-123',
        task_name: 'Keep 1',
        start_time: '2026-01-10T10:00:00.000Z',
        end_time: '2026-01-10T11:00:00.000Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T11:00:00.000Z',
        updated_at: '2026-01-10T11:00:00.000Z',
      })
      await saveTimeEntry({
        id: 'delete-this',
        user_id: 'user-123',
        task_id: 'task-123',
        task_name: 'Delete This',
        start_time: '2026-01-10T10:00:00.000Z',
        end_time: '2026-01-10T11:00:00.000Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T11:00:00.000Z',
        updated_at: '2026-01-10T11:00:00.000Z',
      })
      await saveTimeEntry({
        id: 'keep-2',
        user_id: 'user-123',
        task_id: 'task-123',
        task_name: 'Keep 2',
        start_time: '2026-01-10T10:00:00.000Z',
        end_time: '2026-01-10T11:00:00.000Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T11:00:00.000Z',
        updated_at: '2026-01-10T11:00:00.000Z',
      })

      await deleteTimeEntry('delete-this')

      const all = await getTimeEntries()
      expect(all).toHaveLength(2)
      expect(all.map(e => e.id)).toContain('keep-1')
      expect(all.map(e => e.id)).toContain('keep-2')
    })
  })
})
