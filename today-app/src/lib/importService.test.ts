/**
 * Tests for import service
 *
 * Source: notes/sprint-artifacts/4-2-time-entries-in-export-backup.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from './db'
import { timeTrackingDb, getTimeEntries } from './timeTrackingDb'
import { importFromFile, formatImportMessage } from './importService'
import type { ExportPayload } from '../types/export'

// Mock the syncQueue to avoid side effects
vi.mock('./syncQueue', () => ({
  queueOperation: vi.fn().mockResolvedValue(undefined),
}))

/**
 * Create a mock File object from payload
 */
function createMockFile(payload: ExportPayload): File {
  const json = JSON.stringify(payload)
  return new File([json], 'backup.json', { type: 'application/json' })
}

describe('importService', () => {
  beforeEach(async () => {
    // Clear databases before each test
    await db.tasks.clear()
    await db.syncQueue.clear()
    await timeTrackingDb.timeEntries.clear()
    vi.clearAllMocks()
  })

  describe('importFromFile', () => {
    it('returns error for invalid JSON', async () => {
      const file = new File(['not valid json'], 'backup.json', { type: 'application/json' })

      const result = await importFromFile(file, 'user-1')

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors![0]).toContain('Failed to parse')
    })

    it('returns error for invalid payload structure', async () => {
      const file = new File([JSON.stringify({ invalid: true })], 'backup.json', { type: 'application/json' })

      const result = await importFromFile(file, 'user-1')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Invalid backup file format')
    })

    it('imports tasks to IndexedDB with pending status (AC-4.2.5)', async () => {
      const payload: ExportPayload = {
        version: '1.0',
        exported_at: '2026-01-11T10:00:00Z',
        tasks: [
          {
            id: 'task-1',
            text: 'Test task',
            createdAt: '2026-01-10T09:00:00Z',
            deferredTo: null,
            category: 'Work',
            completedAt: null,
            notes: null,
          },
        ],
        categories: ['Work'],
        time_entries: [],
      }

      const file = createMockFile(payload)
      const result = await importFromFile(file, 'user-1')

      expect(result.success).toBe(true)
      expect(result.tasksCount).toBe(1)

      // Verify task was saved with pending status
      const savedTask = await db.tasks.get('task-1')
      expect(savedTask).toBeDefined()
      expect(savedTask!._syncStatus).toBe('pending')
    })

    it('imports time entries to IndexedDB with pending status (AC-4.2.5)', async () => {
      const payload: ExportPayload = {
        version: '1.0',
        exported_at: '2026-01-11T10:00:00Z',
        tasks: [],
        categories: [],
        time_entries: [
          {
            id: 'entry-1',
            task_name: 'Test task',
            start_time: '2026-01-10T09:00:00Z',
            end_time: '2026-01-10T10:00:00Z',
            duration: 3600000,
            duration_formatted: '1h',
            date: '2026-01-10',
          },
        ],
      }

      const file = createMockFile(payload)
      const result = await importFromFile(file, 'user-1')

      expect(result.success).toBe(true)
      expect(result.timeEntriesCount).toBe(1)

      // Verify entry was saved with pending status
      const entries = await getTimeEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0]._syncStatus).toBe('pending')
    })

    it('imported entries appear in getTimeEntries (AC-4.2.6)', async () => {
      const payload: ExportPayload = {
        version: '1.0',
        exported_at: '2026-01-11T10:00:00Z',
        tasks: [],
        categories: [],
        time_entries: [
          {
            id: 'entry-1',
            task_name: 'Task 1',
            start_time: '2026-01-10T09:00:00Z',
            end_time: '2026-01-10T10:00:00Z',
            duration: 3600000,
            duration_formatted: '1h',
            date: '2026-01-10',
          },
          {
            id: 'entry-2',
            task_name: 'Task 2',
            start_time: '2026-01-10T11:00:00Z',
            end_time: '2026-01-10T12:00:00Z',
            duration: 3600000,
            duration_formatted: '1h',
            date: '2026-01-10',
          },
        ],
      }

      const file = createMockFile(payload)
      await importFromFile(file, 'user-1')

      // Verify entries are queryable via getTimeEntries (AC-4.2.6)
      const entries = await getTimeEntries()
      expect(entries).toHaveLength(2)
      expect(entries.map(e => e.id).sort()).toEqual(['entry-1', 'entry-2'])
    })

    it('uses upsert for duplicate imports - no duplicates created (AC-4.2.8)', async () => {
      const payload: ExportPayload = {
        version: '1.0',
        exported_at: '2026-01-11T10:00:00Z',
        tasks: [],
        categories: [],
        time_entries: [
          {
            id: 'entry-1',
            task_name: 'Original name',
            start_time: '2026-01-10T09:00:00Z',
            end_time: '2026-01-10T10:00:00Z',
            duration: 3600000,
            duration_formatted: '1h',
            date: '2026-01-10',
          },
        ],
      }

      // First import
      const file1 = createMockFile(payload)
      await importFromFile(file1, 'user-1')

      // Modify and re-import
      payload.time_entries[0].task_name = 'Updated name'
      const file2 = createMockFile(payload)
      await importFromFile(file2, 'user-1')

      // Should only have 1 entry (upsert, not insert)
      const entries = await getTimeEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0].task_name).toBe('Updated name')
    })

    it('validates required fields for time entries', async () => {
      const payload: ExportPayload = {
        version: '1.0',
        exported_at: '2026-01-11T10:00:00Z',
        tasks: [],
        categories: [],
        time_entries: [
          {
            id: 'entry-1',
            task_name: 'Valid entry',
            start_time: '2026-01-10T09:00:00Z',
            end_time: '2026-01-10T10:00:00Z',
            duration: 3600000,
            duration_formatted: '1h',
            date: '2026-01-10',
          },
          // Invalid entry - missing required fields
          {
            id: 'entry-2',
            // Missing task_name, start_time, etc.
          } as any,
        ],
      }

      const file = createMockFile(payload)
      const result = await importFromFile(file, 'user-1')

      // Should import valid entry, skip invalid
      expect(result.timeEntriesCount).toBe(1)
      expect(result.errors).toBeDefined()
      expect(result.errors!.some(e => e.includes('Invalid time entry'))).toBe(true)
    })

    it('returns correct counts for success message (AC-4.2.7)', async () => {
      const payload: ExportPayload = {
        version: '1.0',
        exported_at: '2026-01-11T10:00:00Z',
        tasks: [
          { id: 't1', text: 'Task 1', createdAt: '', deferredTo: null, category: null, completedAt: null, notes: null },
          { id: 't2', text: 'Task 2', createdAt: '', deferredTo: null, category: null, completedAt: null, notes: null },
        ],
        categories: ['Work'],
        time_entries: [
          { id: 'e1', task_name: 'E1', start_time: '', end_time: '', duration: 0, duration_formatted: '0m', date: '' },
          { id: 'e2', task_name: 'E2', start_time: '', end_time: '', duration: 0, duration_formatted: '0m', date: '' },
          { id: 'e3', task_name: 'E3', start_time: '', end_time: '', duration: 0, duration_formatted: '0m', date: '' },
        ],
      }

      const file = createMockFile(payload)
      const result = await importFromFile(file, 'user-1')

      expect(result.tasksCount).toBe(2)
      expect(result.categoriesCount).toBe(1)
      expect(result.timeEntriesCount).toBe(3)
    })
  })

  describe('formatImportMessage (AC-4.2.7)', () => {
    it('formats message with tasks and time entries', () => {
      const result = {
        success: true,
        tasksCount: 5,
        categoriesCount: 2,
        timeEntriesCount: 10,
      }

      const message = formatImportMessage(result)
      expect(message).toBe('Restored 5 tasks and 10 time entries')
    })

    it('handles singular task', () => {
      const result = {
        success: true,
        tasksCount: 1,
        categoriesCount: 0,
        timeEntriesCount: 3,
      }

      const message = formatImportMessage(result)
      expect(message).toBe('Restored 1 task and 3 time entries')
    })

    it('handles singular time entry', () => {
      const result = {
        success: true,
        tasksCount: 5,
        categoriesCount: 0,
        timeEntriesCount: 1,
      }

      const message = formatImportMessage(result)
      expect(message).toBe('Restored 5 tasks and 1 time entry')
    })

    it('handles zero tasks', () => {
      const result = {
        success: true,
        tasksCount: 0,
        categoriesCount: 0,
        timeEntriesCount: 5,
      }

      const message = formatImportMessage(result)
      expect(message).toBe('Restored 5 time entries')
    })

    it('handles zero time entries', () => {
      const result = {
        success: true,
        tasksCount: 3,
        categoriesCount: 0,
        timeEntriesCount: 0,
      }

      const message = formatImportMessage(result)
      expect(message).toBe('Restored 3 tasks')
    })

    it('handles zero of both', () => {
      const result = {
        success: true,
        tasksCount: 0,
        categoriesCount: 0,
        timeEntriesCount: 0,
      }

      const message = formatImportMessage(result)
      expect(message).toBe('No data to restore')
    })
  })
})
