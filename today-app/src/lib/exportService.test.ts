/**
 * Tests for export service
 *
 * Source: notes/sprint-artifacts/4-2-time-entries-in-export-backup.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { timeTrackingDb } from './timeTrackingDb'
import {
  getTasksForExport,
  getCategoriesFromTasks,
  getTimeEntriesForExport,
  createExportPayload,
} from './exportService'
import type { LocalTask } from './db'
import type { CachedTimeEntry } from '../types/timeTracking'

describe('exportService', () => {
  beforeEach(async () => {
    // Clear databases before each test
    await db.tasks.clear()
    await timeTrackingDb.timeEntries.clear()
  })

  describe('getTasksForExport', () => {
    it('returns empty array when no tasks exist', async () => {
      const tasks = await getTasksForExport()
      expect(tasks).toEqual([])
    })

    it('returns tasks without sync metadata', async () => {
      const localTask: LocalTask = {
        id: 'task-1',
        user_id: 'user-1',
        text: 'Test task',
        created_at: '2026-01-10T09:00:00Z',
        deferred_to: null,
        category: 'Work',
        completed_at: null,
        updated_at: '2026-01-10T09:00:00Z',
        notes: null,
        _syncStatus: 'synced',
        _localUpdatedAt: '2026-01-10T09:00:00Z',
      }

      await db.tasks.add(localTask)

      const tasks = await getTasksForExport()

      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toEqual({
        id: 'task-1',
        text: 'Test task',
        createdAt: '2026-01-10T09:00:00Z',
        deferredTo: null,
        category: 'Work',
        completedAt: null,
        notes: null,
      })
      // Should not have sync metadata
      expect(tasks[0]).not.toHaveProperty('_syncStatus')
      expect(tasks[0]).not.toHaveProperty('user_id')
    })
  })

  describe('getCategoriesFromTasks', () => {
    it('returns unique categories sorted alphabetically', () => {
      const tasks = [
        { id: '1', text: 'Task 1', createdAt: '', deferredTo: null, category: 'Work', completedAt: null, notes: null },
        { id: '2', text: 'Task 2', createdAt: '', deferredTo: null, category: 'Personal', completedAt: null, notes: null },
        { id: '3', text: 'Task 3', createdAt: '', deferredTo: null, category: 'Work', completedAt: null, notes: null },
        { id: '4', text: 'Task 4', createdAt: '', deferredTo: null, category: null, completedAt: null, notes: null },
      ]

      const categories = getCategoriesFromTasks(tasks)

      expect(categories).toEqual(['Personal', 'Work'])
    })

    it('returns empty array when no categories', () => {
      const tasks = [
        { id: '1', text: 'Task 1', createdAt: '', deferredTo: null, category: null, completedAt: null, notes: null },
      ]

      const categories = getCategoriesFromTasks(tasks)

      expect(categories).toEqual([])
    })
  })

  describe('getTimeEntriesForExport', () => {
    it('returns empty array when no entries exist (AC-4.2.1)', async () => {
      const entries = await getTimeEntriesForExport()
      expect(entries).toEqual([])
    })

    it('includes all required fields (AC-4.2.2)', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test task',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T10:30:00Z',
        duration: 5400000, // 1h 30m
        date: '2026-01-10',
        created_at: '2026-01-10T10:30:00Z',
        updated_at: '2026-01-10T10:30:00Z',
        _syncStatus: 'synced',
      }

      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()

      expect(entries).toHaveLength(1)
      expect(entries[0]).toHaveProperty('id', 'entry-1')
      expect(entries[0]).toHaveProperty('task_name', 'Test task')
      expect(entries[0]).toHaveProperty('start_time', '2026-01-10T09:00:00Z')
      expect(entries[0]).toHaveProperty('end_time', '2026-01-10T10:30:00Z')
      expect(entries[0]).toHaveProperty('duration', 5400000)
      expect(entries[0]).toHaveProperty('date', '2026-01-10')
    })

    it('includes human-readable duration_formatted (AC-4.2.3)', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test task',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T10:30:00Z',
        duration: 5400000, // 1h 30m
        date: '2026-01-10',
        created_at: '2026-01-10T10:30:00Z',
        updated_at: '2026-01-10T10:30:00Z',
        _syncStatus: 'synced',
      }

      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()

      expect(entries[0].duration_formatted).toBe('1h 30m')
    })

    it('includes entries with null task_id (deleted tasks) (AC-4.2.4)', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: null, // Deleted task
        task_name: 'Deleted task name',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T10:00:00Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
        _syncStatus: 'synced',
      }

      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()

      expect(entries).toHaveLength(1)
      expect(entries[0].task_name).toBe('Deleted task name')
    })

    it('sorts entries by start_time ascending (oldest first) (AC-4.2.9)', async () => {
      const entries: CachedTimeEntry[] = [
        {
          id: 'entry-3',
          user_id: 'user-1',
          task_id: 'task-1',
          task_name: 'Task 3',
          start_time: '2026-01-12T09:00:00Z',
          end_time: '2026-01-12T10:00:00Z',
          duration: 3600000,
          date: '2026-01-12',
          created_at: '2026-01-12T10:00:00Z',
          updated_at: '2026-01-12T10:00:00Z',
          _syncStatus: 'synced',
        },
        {
          id: 'entry-1',
          user_id: 'user-1',
          task_id: 'task-1',
          task_name: 'Task 1',
          start_time: '2026-01-10T09:00:00Z',
          end_time: '2026-01-10T10:00:00Z',
          duration: 3600000,
          date: '2026-01-10',
          created_at: '2026-01-10T10:00:00Z',
          updated_at: '2026-01-10T10:00:00Z',
          _syncStatus: 'synced',
        },
        {
          id: 'entry-2',
          user_id: 'user-1',
          task_id: 'task-1',
          task_name: 'Task 2',
          start_time: '2026-01-11T09:00:00Z',
          end_time: '2026-01-11T10:00:00Z',
          duration: 3600000,
          date: '2026-01-11',
          created_at: '2026-01-11T10:00:00Z',
          updated_at: '2026-01-11T10:00:00Z',
          _syncStatus: 'synced',
        },
      ]

      // Add in non-chronological order
      for (const entry of entries) {
        await timeTrackingDb.timeEntries.add(entry)
      }

      const exported = await getTimeEntriesForExport()

      expect(exported).toHaveLength(3)
      expect(exported[0].id).toBe('entry-1') // Oldest first
      expect(exported[1].id).toBe('entry-2')
      expect(exported[2].id).toBe('entry-3') // Newest last
    })

    it('includes entries with all sync statuses (AC-4.2.4)', async () => {
      const entries: CachedTimeEntry[] = [
        {
          id: 'synced-entry',
          user_id: 'user-1',
          task_id: 'task-1',
          task_name: 'Synced',
          start_time: '2026-01-10T09:00:00Z',
          end_time: '2026-01-10T10:00:00Z',
          duration: 3600000,
          date: '2026-01-10',
          created_at: '2026-01-10T10:00:00Z',
          updated_at: '2026-01-10T10:00:00Z',
          _syncStatus: 'synced',
        },
        {
          id: 'pending-entry',
          user_id: 'user-1',
          task_id: 'task-1',
          task_name: 'Pending',
          start_time: '2026-01-10T11:00:00Z',
          end_time: '2026-01-10T12:00:00Z',
          duration: 3600000,
          date: '2026-01-10',
          created_at: '2026-01-10T12:00:00Z',
          updated_at: '2026-01-10T12:00:00Z',
          _syncStatus: 'pending',
        },
        {
          id: 'error-entry',
          user_id: 'user-1',
          task_id: 'task-1',
          task_name: 'Error',
          start_time: '2026-01-10T13:00:00Z',
          end_time: '2026-01-10T14:00:00Z',
          duration: 3600000,
          date: '2026-01-10',
          created_at: '2026-01-10T14:00:00Z',
          updated_at: '2026-01-10T14:00:00Z',
          _syncStatus: 'error',
        },
      ]

      for (const entry of entries) {
        await timeTrackingDb.timeEntries.add(entry)
      }

      const exported = await getTimeEntriesForExport()

      // All entries should be included regardless of sync status
      expect(exported).toHaveLength(3)
      expect(exported.map(e => e.id).sort()).toEqual(['error-entry', 'pending-entry', 'synced-entry'])
    })
  })

  describe('createExportPayload', () => {
    it('includes time_entries array (AC-4.2.1)', async () => {
      const payload = await createExportPayload()

      expect(payload).toHaveProperty('time_entries')
      expect(Array.isArray(payload.time_entries)).toBe(true)
    })

    it('includes version and exported_at', async () => {
      const payload = await createExportPayload()

      expect(payload.version).toBe('1.0')
      expect(payload.exported_at).toBeDefined()
      // Should be valid ISO date
      expect(new Date(payload.exported_at).toISOString()).toBe(payload.exported_at)
    })

    it('creates complete payload with tasks, categories, and time entries', async () => {
      // Add a task
      const localTask: LocalTask = {
        id: 'task-1',
        user_id: 'user-1',
        text: 'Test task',
        created_at: '2026-01-10T09:00:00Z',
        deferred_to: null,
        category: 'Work',
        completed_at: null,
        updated_at: '2026-01-10T09:00:00Z',
        notes: null,
        _syncStatus: 'synced',
        _localUpdatedAt: '2026-01-10T09:00:00Z',
      }
      await db.tasks.add(localTask)

      // Add a time entry
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test task',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T10:00:00Z',
        duration: 3600000,
        date: '2026-01-10',
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
        _syncStatus: 'synced',
      }
      await timeTrackingDb.timeEntries.add(entry)

      const payload = await createExportPayload()

      expect(payload.tasks).toHaveLength(1)
      expect(payload.categories).toEqual(['Work'])
      expect(payload.time_entries).toHaveLength(1)
    })
  })

  describe('duration_formatted edge cases (AC-4.2.3)', () => {
    it('formats 0 duration as "0m"', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T09:00:00Z',
        duration: 0,
        date: '2026-01-10',
        created_at: '2026-01-10T09:00:00Z',
        updated_at: '2026-01-10T09:00:00Z',
        _syncStatus: 'synced',
      }
      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()
      expect(entries[0].duration_formatted).toBe('0m')
    })

    it('formats 59 minutes as "59m"', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T09:59:00Z',
        duration: 59 * 60 * 1000, // 59 minutes
        date: '2026-01-10',
        created_at: '2026-01-10T09:59:00Z',
        updated_at: '2026-01-10T09:59:00Z',
        _syncStatus: 'synced',
      }
      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()
      expect(entries[0].duration_formatted).toBe('59m')
    })

    it('formats 1 hour exactly as "1h"', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test',
        start_time: '2026-01-10T09:00:00Z',
        end_time: '2026-01-10T10:00:00Z',
        duration: 60 * 60 * 1000, // 1 hour
        date: '2026-01-10',
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
        _syncStatus: 'synced',
      }
      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()
      expect(entries[0].duration_formatted).toBe('1h')
    })

    it('formats 23h 59m correctly', async () => {
      const entry: CachedTimeEntry = {
        id: 'entry-1',
        user_id: 'user-1',
        task_id: 'task-1',
        task_name: 'Test',
        start_time: '2026-01-10T00:00:00Z',
        end_time: '2026-01-10T23:59:00Z',
        duration: (23 * 60 + 59) * 60 * 1000, // 23h 59m
        date: '2026-01-10',
        created_at: '2026-01-10T23:59:00Z',
        updated_at: '2026-01-10T23:59:00Z',
        _syncStatus: 'synced',
      }
      await timeTrackingDb.timeEntries.add(entry)

      const entries = await getTimeEntriesForExport()
      expect(entries[0].duration_formatted).toBe('23h 59m')
    })
  })
})
