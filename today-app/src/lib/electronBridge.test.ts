/**
 * Tests for Electron Bridge
 *
 * Tests the type-safe wrapper for Electron IPC calls.
 * Verifies correct behavior in both browser and Electron environments.
 *
 * Story 3.3: Updated tests to reflect that:
 * - stop() now saves entries to IndexedDB after receiving from IPC
 * - getLog() now queries IndexedDB directly (not IPC)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { electronBridge } from './electronBridge'

// Mock the activityStore module
vi.mock('./activityStore', () => ({
  saveActivityEntries: vi.fn().mockResolvedValue(undefined),
  getActivityEntriesByTimeEntryId: vi.fn().mockResolvedValue([]),
}))

describe('electronBridge', () => {
  // Store original window.electronAPI
  const originalElectronAPI = window.electronAPI

  beforeEach(() => {
    // Reset to browser environment (no electronAPI)
    delete (window as unknown as Record<string, unknown>).electronAPI
  })

  afterEach(() => {
    // Restore original state
    if (originalElectronAPI) {
      window.electronAPI = originalElectronAPI
    } else {
      delete (window as unknown as Record<string, unknown>).electronAPI
    }
    vi.restoreAllMocks()
  })

  describe('when not in Electron (browser environment)', () => {
    it('activity.start returns error', async () => {
      const result = await electronBridge.activity.start('test-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not in Electron')
    })

    it('activity.stop returns error', async () => {
      const result = await electronBridge.activity.stop()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not in Electron')
    })

    it('activity.getLog returns error', async () => {
      const result = await electronBridge.activity.getLog('test-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not in Electron')
    })

    it('activity.export returns error', async () => {
      const result = await electronBridge.activity.export('test-id', 'json')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not in Electron')
    })
  })

  describe('when in Electron environment', () => {
    const mockElectronAPI = {
      activity: {
        start: vi.fn(),
        stop: vi.fn(),
        getLog: vi.fn(),
        export: vi.fn(),
        getCurrent: vi.fn(),
      },
    }

    beforeEach(() => {
      // Set up Electron environment
      window.electronAPI = mockElectronAPI
    })

    it('activity.start calls window.electronAPI.activity.start', async () => {
      const expectedResponse = { success: true }
      mockElectronAPI.activity.start.mockResolvedValue(expectedResponse)

      const result = await electronBridge.activity.start('entry-123')

      expect(mockElectronAPI.activity.start).toHaveBeenCalledWith('entry-123')
      expect(result).toEqual(expectedResponse)
    })

    it('activity.stop calls window.electronAPI.activity.stop and saves entries to IndexedDB', async () => {
      // Story 3.3: stop() now returns entries and saves them to IndexedDB
      const { saveActivityEntries } = await import('./activityStore')
      const expectedResponse = {
        success: true,
        data: {
          entriesRecorded: 2,
          entries: [
            {
              id: '1',
              timeEntryId: 'entry-123',
              timestamp: '2026-01-12T10:00:00Z',
              appName: 'VS Code',
              windowTitle: 'project.ts',
            },
            {
              id: '2',
              timeEntryId: 'entry-123',
              timestamp: '2026-01-12T10:05:00Z',
              appName: 'Chrome',
              windowTitle: 'Google',
            },
          ],
        },
      }
      mockElectronAPI.activity.stop.mockResolvedValue(expectedResponse)

      const result = await electronBridge.activity.stop()

      expect(mockElectronAPI.activity.stop).toHaveBeenCalled()
      expect(saveActivityEntries).toHaveBeenCalledWith(expectedResponse.data.entries)
      expect(result).toEqual(expectedResponse)
    })

    it('activity.stop does not save entries when none captured', async () => {
      const { saveActivityEntries } = await import('./activityStore')
      const expectedResponse = {
        success: true,
        data: {
          entriesRecorded: 0,
          entries: [],
        },
      }
      mockElectronAPI.activity.stop.mockResolvedValue(expectedResponse)

      await electronBridge.activity.stop()

      expect(saveActivityEntries).not.toHaveBeenCalled()
    })

    it('activity.getLog queries IndexedDB directly (not IPC)', async () => {
      // Story 3.3: getLog() now queries IndexedDB directly since main process can't access it
      const { getActivityEntriesByTimeEntryId } = await import('./activityStore')
      const mockEntries = [
        {
          id: 1,
          timeEntryId: 'entry-123',
          timestamp: '2026-01-12T10:00:00Z',
          appName: 'VS Code',
          windowTitle: 'project.ts',
        },
      ]
      vi.mocked(getActivityEntriesByTimeEntryId).mockResolvedValue(mockEntries)

      const result = await electronBridge.activity.getLog('entry-123')

      // Should NOT call IPC - we query IndexedDB directly
      expect(mockElectronAPI.activity.getLog).not.toHaveBeenCalled()
      // Should call activityStore
      expect(getActivityEntriesByTimeEntryId).toHaveBeenCalledWith('entry-123')
      // Should return success with converted entries (id converted to string)
      expect(result.success).toBe(true)
      expect(result.data).toEqual([
        {
          id: '1',
          timeEntryId: 'entry-123',
          timestamp: '2026-01-12T10:00:00Z',
          appName: 'VS Code',
          windowTitle: 'project.ts',
        },
      ])
    })

    it('activity.getLog returns empty array for non-existent timeEntryId', async () => {
      const { getActivityEntriesByTimeEntryId } = await import('./activityStore')
      vi.mocked(getActivityEntriesByTimeEntryId).mockResolvedValue([])

      const result = await electronBridge.activity.getLog('non-existent')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('activity.export calls window.electronAPI.activity.export with format', async () => {
      const expectedResponse = { success: true, data: { filePath: '/path/to/export.csv' } }
      mockElectronAPI.activity.export.mockResolvedValue(expectedResponse)

      const result = await electronBridge.activity.export('entry-123', 'csv')

      expect(mockElectronAPI.activity.export).toHaveBeenCalledWith('entry-123', 'csv')
      expect(result).toEqual(expectedResponse)
    })

    it('activity.export supports json format', async () => {
      const expectedResponse = { success: true, data: { filePath: '/path/to/export.json' } }
      mockElectronAPI.activity.export.mockResolvedValue(expectedResponse)

      const result = await electronBridge.activity.export('entry-123', 'json')

      expect(mockElectronAPI.activity.export).toHaveBeenCalledWith('entry-123', 'json')
      expect(result).toEqual(expectedResponse)
    })
  })
})
