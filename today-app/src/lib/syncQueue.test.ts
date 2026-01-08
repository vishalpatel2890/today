import { describe, it, expect, vi } from 'vitest'
import { db, type SyncQueueItem } from './db'
import {
  queueOperation,
  coalesceOperations,
  processQueue,
  getPendingCount,
  clearQueue,
} from './syncQueue'

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  },
}))

describe('syncQueue', () => {
  describe('queueOperation', () => {
    it('should add an INSERT operation to the queue', async () => {
      await queueOperation('INSERT', 'tasks', 'task-1', { text: 'Test task' })

      const items = await db.syncQueue.toArray()
      expect(items).toHaveLength(1)
      expect(items[0].operation).toBe('INSERT')
      expect(items[0].table).toBe('tasks')
      expect(items[0].entityId).toBe('task-1')
      expect(JSON.parse(items[0].payload)).toEqual({ text: 'Test task' })
      expect(items[0].retryCount).toBe(0)
    })

    it('should add an UPDATE operation to the queue', async () => {
      await queueOperation('UPDATE', 'tasks', 'task-1', { completed_at: '2024-01-01' })

      const items = await db.syncQueue.toArray()
      expect(items).toHaveLength(1)
      expect(items[0].operation).toBe('UPDATE')
      expect(items[0].entityId).toBe('task-1')
    })

    it('should add a DELETE operation to the queue', async () => {
      await queueOperation('DELETE', 'tasks', 'task-1', {})

      const items = await db.syncQueue.toArray()
      expect(items).toHaveLength(1)
      expect(items[0].operation).toBe('DELETE')
      expect(items[0].entityId).toBe('task-1')
    })

    it('should handle category operations', async () => {
      await queueOperation('INSERT', 'categories', 'cat-1', { name: 'Work' })

      const items = await db.syncQueue.toArray()
      expect(items).toHaveLength(1)
      expect(items[0].table).toBe('categories')
    })
  })

  describe('coalesceOperations', () => {
    it('should keep only the latest UPDATE for the same entity', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'First' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'Second' }),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
        {
          id: '3',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'Third' }),
          createdAt: '2024-01-01T00:00:02Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(1)
      // Latest payload with all merged fields
      expect(JSON.parse(result[0].payload)).toEqual({ text: 'Third' })
    })

    it('should merge multiple UPDATE payloads for the same entity', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'Updated text' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ completed_at: '2024-01-01' }),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(1)
      // Both fields merged
      expect(JSON.parse(result[0].payload)).toEqual({
        text: 'Updated text',
        completed_at: '2024-01-01',
      })
    })

    it('should handle DELETE winning over UPDATEs', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'Updated' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'DELETE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({}),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('DELETE')
    })

    it('should cancel out INSERT followed by DELETE', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'INSERT',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'New task' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'DELETE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({}),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(0)
    })

    it('should merge INSERT with subsequent UPDATEs', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'INSERT',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'New task', id: 'task-1' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ completed_at: '2024-01-01' }),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('INSERT')
      expect(JSON.parse(result[0].payload)).toEqual({
        text: 'New task',
        id: 'task-1',
        completed_at: '2024-01-01',
      })
    })

    it('should keep separate operations for different entities', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-1',
          payload: JSON.stringify({ text: 'Task 1' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'UPDATE',
          table: 'tasks',
          entityId: 'task-2',
          payload: JSON.stringify({ text: 'Task 2' }),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(2)
    })

    it('should keep operations for different tables separate', () => {
      const items: SyncQueueItem[] = [
        {
          id: '1',
          operation: 'INSERT',
          table: 'tasks',
          entityId: 'entity-1',
          payload: JSON.stringify({ text: 'Task' }),
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
        },
        {
          id: '2',
          operation: 'INSERT',
          table: 'categories',
          entityId: 'entity-1',
          payload: JSON.stringify({ name: 'Category' }),
          createdAt: '2024-01-01T00:00:01Z',
          retryCount: 0,
        },
      ]

      const result = coalesceOperations(items)
      expect(result).toHaveLength(2)
    })
  })

  describe('getPendingCount', () => {
    it('should return 0 when queue is empty', async () => {
      const count = await getPendingCount()
      expect(count).toBe(0)
    })

    it('should return correct count after queuing operations', async () => {
      await queueOperation('INSERT', 'tasks', 'task-1', { text: 'Task 1' })
      await queueOperation('INSERT', 'tasks', 'task-2', { text: 'Task 2' })
      await queueOperation('UPDATE', 'tasks', 'task-1', { completed_at: '2024-01-01' })

      const count = await getPendingCount()
      expect(count).toBe(3)
    })
  })

  describe('clearQueue', () => {
    it('should clear all items from the queue', async () => {
      await queueOperation('INSERT', 'tasks', 'task-1', { text: 'Task 1' })
      await queueOperation('INSERT', 'tasks', 'task-2', { text: 'Task 2' })

      expect(await getPendingCount()).toBe(2)

      await clearQueue()

      expect(await getPendingCount()).toBe(0)
    })
  })

  describe('processQueue', () => {
    it('should process all items and clear the queue on success', async () => {
      await queueOperation('INSERT', 'tasks', 'task-1', { text: 'Task 1' })
      await queueOperation('UPDATE', 'tasks', 'task-1', { completed_at: '2024-01-01' })

      const result = await processQueue('user-123')

      // Coalescing should merge these into 1 operation
      expect(result.processed).toBeGreaterThanOrEqual(1)
      expect(result.failed).toBe(0)
      expect(result.remaining).toBe(0)
      expect(await getPendingCount()).toBe(0)
    })

    it('should return empty result when queue is empty', async () => {
      const result = await processQueue('user-123')

      expect(result.processed).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.remaining).toBe(0)
      expect(result.conflicts).toBe(0)
    })

    it('should include conflicts count in result', async () => {
      // This test verifies the SyncResult structure includes conflicts
      const result = await processQueue('user-123')

      expect(result).toHaveProperty('conflicts')
      expect(typeof result.conflicts).toBe('number')
    })
  })
})
