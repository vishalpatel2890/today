/**
 * Activity Store Tests
 *
 * Tests for the activityStore module that manages activity log entries in IndexedDB.
 *
 * Source: notes/sprint-artifacts/3-3-activity-storage-in-indexeddb.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type ActivityLogEntry } from './db'
import {
  saveActivityEntries,
  getActivityEntriesByTimeEntryId,
  deleteActivityEntriesByTimeEntryId,
  getActivityCountByTimeEntryId,
  type ActivityEntryInput,
} from './activityStore'

describe('activityStore', () => {
  beforeEach(async () => {
    // Clear the activityLogs table before each test
    await db.activityLogs.clear()
  })

  afterEach(async () => {
    // Clean up after each test
    await db.activityLogs.clear()
  })

  describe('saveActivityEntries', () => {
    it('should save multiple activity entries to IndexedDB', async () => {
      // AC-3.3.1: When activity:stop is called, entries are saved to IndexedDB
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'entry-1',
          appName: 'Visual Studio Code',
          windowTitle: 'App.tsx - today-app',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
        {
          timeEntryId: 'entry-1',
          appName: 'Chrome',
          windowTitle: 'Google Search',
          timestamp: '2026-01-18T10:05:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const savedEntries = await db.activityLogs.toArray()
      expect(savedEntries).toHaveLength(2)
      expect(savedEntries[0].appName).toBe('Visual Studio Code')
      expect(savedEntries[1].appName).toBe('Chrome')
    })

    it('should auto-generate IDs for entries', async () => {
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'entry-1',
          appName: 'Slack',
          windowTitle: '#general',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const savedEntries = await db.activityLogs.toArray()
      expect(savedEntries).toHaveLength(1)
      expect(savedEntries[0].id).toBeDefined()
      expect(typeof savedEntries[0].id).toBe('number')
    })

    it('should handle empty entries array', async () => {
      // Should not throw when saving empty array
      await expect(saveActivityEntries([])).resolves.toBeUndefined()

      const savedEntries = await db.activityLogs.toArray()
      expect(savedEntries).toHaveLength(0)
    })

    it('should preserve all entry fields', async () => {
      const entry: ActivityEntryInput = {
        timeEntryId: 'entry-test-fields',
        appName: 'Terminal',
        windowTitle: 'bash - npm run test',
        timestamp: '2026-01-18T12:30:00.000Z',
      }

      await saveActivityEntries([entry])

      const saved = await db.activityLogs.toArray()
      expect(saved[0].timeEntryId).toBe('entry-test-fields')
      expect(saved[0].appName).toBe('Terminal')
      expect(saved[0].windowTitle).toBe('bash - npm run test')
      expect(saved[0].timestamp).toBe('2026-01-18T12:30:00.000Z')
    })
  })

  describe('getActivityEntriesByTimeEntryId', () => {
    it('should retrieve entries for a specific timeEntryId', async () => {
      // AC-3.3.3: Entries are indexed by timeEntryId for fast retrieval
      // AC-3.3.6: activity:get-log returns entries from IndexedDB
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'entry-1',
          appName: 'VSCode',
          windowTitle: 'File1.ts',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
        {
          timeEntryId: 'entry-2',
          appName: 'Chrome',
          windowTitle: 'Google',
          timestamp: '2026-01-18T10:05:00.000Z',
        },
        {
          timeEntryId: 'entry-1',
          appName: 'Terminal',
          windowTitle: 'bash',
          timestamp: '2026-01-18T10:10:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const entry1Logs = await getActivityEntriesByTimeEntryId('entry-1')
      expect(entry1Logs).toHaveLength(2)
      expect(entry1Logs.every(e => e.timeEntryId === 'entry-1')).toBe(true)

      const entry2Logs = await getActivityEntriesByTimeEntryId('entry-2')
      expect(entry2Logs).toHaveLength(1)
      expect(entry2Logs[0].appName).toBe('Chrome')
    })

    it('should return entries sorted by timestamp ascending', async () => {
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'entry-sorted',
          appName: 'App3',
          windowTitle: 'Third',
          timestamp: '2026-01-18T10:30:00.000Z',
        },
        {
          timeEntryId: 'entry-sorted',
          appName: 'App1',
          windowTitle: 'First',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
        {
          timeEntryId: 'entry-sorted',
          appName: 'App2',
          windowTitle: 'Second',
          timestamp: '2026-01-18T10:15:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const sorted = await getActivityEntriesByTimeEntryId('entry-sorted')
      expect(sorted).toHaveLength(3)
      expect(sorted[0].appName).toBe('App1') // earliest
      expect(sorted[1].appName).toBe('App2')
      expect(sorted[2].appName).toBe('App3') // latest
    })

    it('should return empty array for non-existent timeEntryId', async () => {
      // AC-3.3.7: Returns empty array if no activity exists for timeEntryId
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'existing-entry',
          appName: 'VSCode',
          windowTitle: 'test',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const result = await getActivityEntriesByTimeEntryId('non-existent')
      expect(result).toEqual([])
    })

    it('should return empty array when no entries exist at all', async () => {
      const result = await getActivityEntriesByTimeEntryId('any-id')
      expect(result).toEqual([])
    })
  })

  describe('deleteActivityEntriesByTimeEntryId', () => {
    it('should delete all entries for a specific timeEntryId', async () => {
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'entry-to-delete',
          appName: 'App1',
          windowTitle: 'Win1',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
        {
          timeEntryId: 'entry-to-keep',
          appName: 'App2',
          windowTitle: 'Win2',
          timestamp: '2026-01-18T10:05:00.000Z',
        },
        {
          timeEntryId: 'entry-to-delete',
          appName: 'App3',
          windowTitle: 'Win3',
          timestamp: '2026-01-18T10:10:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const deletedCount = await deleteActivityEntriesByTimeEntryId('entry-to-delete')
      expect(deletedCount).toBe(2)

      const remaining = await db.activityLogs.toArray()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].timeEntryId).toBe('entry-to-keep')
    })

    it('should return 0 when deleting non-existent timeEntryId', async () => {
      const deletedCount = await deleteActivityEntriesByTimeEntryId('non-existent')
      expect(deletedCount).toBe(0)
    })
  })

  describe('getActivityCountByTimeEntryId', () => {
    it('should return correct count of entries', async () => {
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'entry-count',
          appName: 'App1',
          windowTitle: 'Win1',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
        {
          timeEntryId: 'entry-count',
          appName: 'App2',
          windowTitle: 'Win2',
          timestamp: '2026-01-18T10:05:00.000Z',
        },
        {
          timeEntryId: 'other-entry',
          appName: 'App3',
          windowTitle: 'Win3',
          timestamp: '2026-01-18T10:10:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      const count = await getActivityCountByTimeEntryId('entry-count')
      expect(count).toBe(2)

      const otherCount = await getActivityCountByTimeEntryId('other-entry')
      expect(otherCount).toBe(1)
    })

    it('should return 0 for non-existent timeEntryId', async () => {
      const count = await getActivityCountByTimeEntryId('non-existent')
      expect(count).toBe(0)
    })
  })

  describe('activityLogs table schema', () => {
    it('should have activityLogs table in database', () => {
      // AC-3.3.2: Entries stored in separate activityLogs table
      expect(db.activityLogs).toBeDefined()
    })

    it('should have timeEntryId index for fast retrieval', async () => {
      // AC-3.3.3: Entries indexed by timeEntryId
      // This is implicitly tested by the fact that our queries work,
      // but we can also verify the index exists on the table
      const entries: ActivityEntryInput[] = [
        {
          timeEntryId: 'indexed-entry',
          appName: 'TestApp',
          windowTitle: 'TestWindow',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
      ]

      await saveActivityEntries(entries)

      // The where clause should use the index
      const result = await db.activityLogs
        .where('timeEntryId')
        .equals('indexed-entry')
        .toArray()

      expect(result).toHaveLength(1)
    })
  })

  describe('persistence', () => {
    it('should persist entries across multiple operations', async () => {
      // AC-3.3.4: Data persists after closing and reopening Electron
      // (Simulated by multiple operations without clearing)

      // First batch
      await saveActivityEntries([
        {
          timeEntryId: 'persist-test',
          appName: 'Batch1',
          windowTitle: 'First',
          timestamp: '2026-01-18T10:00:00.000Z',
        },
      ])

      // Second batch
      await saveActivityEntries([
        {
          timeEntryId: 'persist-test',
          appName: 'Batch2',
          windowTitle: 'Second',
          timestamp: '2026-01-18T10:05:00.000Z',
        },
      ])

      // Verify both batches are persisted
      const allEntries = await getActivityEntriesByTimeEntryId('persist-test')
      expect(allEntries).toHaveLength(2)
      expect(allEntries[0].appName).toBe('Batch1')
      expect(allEntries[1].appName).toBe('Batch2')
    })
  })
})
