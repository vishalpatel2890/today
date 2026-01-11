import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TimeEntry } from '../types/timeTracking'
import {
  fetchTimeEntries,
  upsertTimeEntry,
  batchUpsertTimeEntries,
  deleteTimeEntry,
  fetchTimeEntryById,
  TimeEntryError,
} from './supabaseTimeEntries'

// Mock the supabase client
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpsert = vi.fn()
const mockEq = vi.fn()
const mockGt = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}))

describe('supabaseTimeEntries', () => {
  const mockTimeEntry: TimeEntry = {
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
  }

  const mockDbRow = {
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
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the chain functions
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    })
    mockEq.mockReturnValue({
      order: mockOrder,
      gt: mockGt,
      single: mockSingle,
    })
    mockOrder.mockReturnValue({
      gt: mockGt,
    })
    mockGt.mockResolvedValue({ data: [], error: null })
    mockUpsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    })
  })

  describe('fetchTimeEntries', () => {
    it('should fetch all time entries for a user', async () => {
      // Setup mock chain
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockDbRow],
              error: null,
            }),
          }),
        }),
      })

      const result = await fetchTimeEntries('user-1')

      expect(mockFrom).toHaveBeenCalledWith('time_entries')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('entry-1')
      expect(result[0].user_id).toBe('user-1')
      expect(result[0].task_name).toBe('Test Task')
    })

    it('should fetch entries updated since a timestamp when since is provided', async () => {
      const mockGtFn = vi.fn().mockResolvedValue({
        data: [mockDbRow],
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              gt: mockGtFn,
            }),
          }),
        }),
      })

      const since = '2024-01-14T00:00:00.000Z'
      const result = await fetchTimeEntries('user-1', since)

      expect(mockGtFn).toHaveBeenCalledWith('updated_at', since)
      expect(result).toHaveLength(1)
    })

    it('should return empty array when no entries exist', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      })

      const result = await fetchTimeEntries('user-1')

      expect(result).toHaveLength(0)
    })

    it('should handle null data from Supabase', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      const result = await fetchTimeEntries('user-1')

      expect(result).toHaveLength(0)
    })

    it('should throw TimeEntryError when fetch fails', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'PGRST001' },
            }),
          }),
        }),
      })

      await expect(fetchTimeEntries('user-1')).rejects.toThrow(TimeEntryError)
      await expect(fetchTimeEntries('user-1')).rejects.toThrow(
        'Failed to fetch time entries: Database error'
      )
    })
  })

  describe('upsertTimeEntry', () => {
    it('should upsert a time entry successfully', async () => {
      const mockSelectAfterUpsert = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockDbRow,
          error: null,
        }),
      })

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: mockSelectAfterUpsert,
        }),
      })

      const result = await upsertTimeEntry(mockTimeEntry)

      expect(mockFrom).toHaveBeenCalledWith('time_entries')
      expect(result.id).toBe('entry-1')
      expect(result.task_name).toBe('Test Task')
    })

    it('should throw TimeEntryError when upsert fails', async () => {
      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Conflict error', code: 'PGRST002' },
            }),
          }),
        }),
      })

      await expect(upsertTimeEntry(mockTimeEntry)).rejects.toThrow(TimeEntryError)
      await expect(upsertTimeEntry(mockTimeEntry)).rejects.toThrow(
        'Failed to upsert time entry: Conflict error'
      )
    })

    it('should handle entry with null task_id', async () => {
      const entryWithNullTask: TimeEntry = {
        ...mockTimeEntry,
        task_id: null,
      }

      const dbRowWithNullTask = {
        ...mockDbRow,
        task_id: null,
      }

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: dbRowWithNullTask,
              error: null,
            }),
          }),
        }),
      })

      const result = await upsertTimeEntry(entryWithNullTask)

      expect(result.task_id).toBeNull()
    })
  })

  describe('batchUpsertTimeEntries', () => {
    it('should return empty array for empty input', async () => {
      const result = await batchUpsertTimeEntries([])

      expect(result).toHaveLength(0)
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should batch upsert multiple entries successfully', async () => {
      const entries: TimeEntry[] = [
        mockTimeEntry,
        { ...mockTimeEntry, id: 'entry-2', task_name: 'Task 2' },
      ]

      const dbRows = [
        mockDbRow,
        { ...mockDbRow, id: 'entry-2', task_name: 'Task 2' },
      ]

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: dbRows,
            error: null,
          }),
        }),
      })

      const result = await batchUpsertTimeEntries(entries)

      expect(mockFrom).toHaveBeenCalledWith('time_entries')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('entry-1')
      expect(result[1].id).toBe('entry-2')
    })

    it('should throw TimeEntryError when batch upsert fails', async () => {
      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Batch error', code: 'PGRST003' },
          }),
        }),
      })

      await expect(batchUpsertTimeEntries([mockTimeEntry])).rejects.toThrow(
        TimeEntryError
      )
      await expect(batchUpsertTimeEntries([mockTimeEntry])).rejects.toThrow(
        'Failed to batch upsert time entries: Batch error'
      )
    })

    it('should handle null data from Supabase', async () => {
      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      const result = await batchUpsertTimeEntries([mockTimeEntry])

      expect(result).toHaveLength(0)
    })
  })

  describe('deleteTimeEntry', () => {
    it('should delete a time entry successfully', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      })

      await expect(deleteTimeEntry('entry-1')).resolves.not.toThrow()
      expect(mockFrom).toHaveBeenCalledWith('time_entries')
    })

    it('should throw TimeEntryError when delete fails', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete error', code: 'PGRST004' },
          }),
        }),
      })

      await expect(deleteTimeEntry('entry-1')).rejects.toThrow(TimeEntryError)
      await expect(deleteTimeEntry('entry-1')).rejects.toThrow(
        'Failed to delete time entry: Delete error'
      )
    })
  })

  describe('fetchTimeEntryById', () => {
    it('should fetch a single time entry by ID', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDbRow,
              error: null,
            }),
          }),
        }),
      })

      const result = await fetchTimeEntryById('entry-1')

      expect(mockFrom).toHaveBeenCalledWith('time_entries')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('entry-1')
      expect(result?.task_name).toBe('Test Task')
    })

    it('should return null when entry does not exist (PGRST116)', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows returned', code: 'PGRST116' },
            }),
          }),
        }),
      })

      const result = await fetchTimeEntryById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw TimeEntryError for other errors', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'PGRST001' },
            }),
          }),
        }),
      })

      await expect(fetchTimeEntryById('entry-1')).rejects.toThrow(TimeEntryError)
      await expect(fetchTimeEntryById('entry-1')).rejects.toThrow(
        'Failed to fetch time entry: Database error'
      )
    })
  })

  describe('TimeEntryError', () => {
    it('should create error with code and details', () => {
      const error = new TimeEntryError('Test error', 'TEST001', { foo: 'bar' })

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST001')
      expect(error.details).toEqual({ foo: 'bar' })
      expect(error.name).toBe('TimeEntryError')
    })

    it('should be an instance of Error', () => {
      const error = new TimeEntryError('Test error', 'TEST001')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(TimeEntryError)
    })
  })
})
