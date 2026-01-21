import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useActivityLog, aggregateSummary, formatActivityDuration } from './useActivityLog'
import type { ActivityEntryWithDuration } from './useActivityLog'
import { electronBridge } from '../lib/electronBridge'

// Mock the electronBridge module
vi.mock('../lib/electronBridge', () => ({
  electronBridge: {
    activity: {
      getLog: vi.fn(),
    },
  },
}))

const mockGetLog = vi.mocked(electronBridge.activity.getLog)

describe('useActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns loading state initially (AC4.2.3)', async () => {
    // Make the mock never resolve to observe initial loading state
    mockGetLog.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T10:30:00Z')
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.entries).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('fetches activity entries and calculates durations correctly', async () => {
    const mockEntries = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:00:00Z',
        appName: 'VS Code',
        windowTitle: 'index.ts',
      },
      {
        id: '2',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:05:00Z',
        appName: 'Chrome',
        windowTitle: 'Google',
      },
      {
        id: '3',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:10:00Z',
        appName: 'VS Code',
        windowTitle: 'test.ts',
      },
    ]

    mockGetLog.mockResolvedValueOnce({ success: true, data: mockEntries })

    const sessionEndTime = '2026-01-18T09:15:00Z'
    const { result } = renderHook(() =>
      useActivityLog('entry-123', sessionEndTime)
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entries).toHaveLength(3)

    // First entry: 5 minutes (09:00 to 09:05)
    expect(result.current.entries[0].durationMs).toBe(5 * 60 * 1000)
    expect(result.current.entries[0].durationFormatted).toBe('5m')

    // Second entry: 5 minutes (09:05 to 09:10)
    expect(result.current.entries[1].durationMs).toBe(5 * 60 * 1000)
    expect(result.current.entries[1].durationFormatted).toBe('5m')

    // Third entry: 5 minutes (09:10 to session end 09:15)
    expect(result.current.entries[2].durationMs).toBe(5 * 60 * 1000)
    expect(result.current.entries[2].durationFormatted).toBe('5m')
  })

  it('calculates duration with seconds correctly', async () => {
    const mockEntries = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:00:00Z',
        appName: 'VS Code',
        windowTitle: 'index.ts',
      },
      {
        id: '2',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:05:32Z',
        appName: 'Chrome',
        windowTitle: 'Google',
      },
    ]

    mockGetLog.mockResolvedValueOnce({ success: true, data: mockEntries })

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T09:10:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // First entry: 5 minutes 32 seconds
    expect(result.current.entries[0].durationFormatted).toBe('5m 32s')

    // Second entry: 4 minutes 28 seconds (09:05:32 to 09:10:00)
    expect(result.current.entries[1].durationFormatted).toBe('4m 28s')
  })

  it('calculates duration with hours correctly', async () => {
    const mockEntries = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:00:00Z',
        appName: 'VS Code',
        windowTitle: 'index.ts',
      },
    ]

    mockGetLog.mockResolvedValueOnce({ success: true, data: mockEntries })

    // Session end is 2 hours 15 minutes later
    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T11:15:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entries[0].durationFormatted).toBe('2h 15m')
  })

  it('returns empty entries array when no activity recorded', async () => {
    mockGetLog.mockResolvedValueOnce({ success: true, data: [] })

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T10:30:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entries).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('handles error from electronBridge', async () => {
    mockGetLog.mockResolvedValueOnce({
      success: false,
      error: 'Database error',
    })

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T10:30:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Database error')
    expect(result.current.entries).toEqual([])
  })

  it('handles "Not in Electron" gracefully (no error)', async () => {
    mockGetLog.mockResolvedValueOnce({
      success: false,
      error: 'Not in Electron',
    })

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T10:30:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // "Not in Electron" should not be treated as an error
    expect(result.current.error).toBe(null)
    expect(result.current.entries).toEqual([])
  })

  it('formats very short durations as "< 1s"', async () => {
    const mockEntries = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:00:00.000Z',
        appName: 'VS Code',
        windowTitle: 'index.ts',
      },
      {
        id: '2',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:00:00.500Z',
        appName: 'Chrome',
        windowTitle: 'Google',
      },
    ]

    mockGetLog.mockResolvedValueOnce({ success: true, data: mockEntries })

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T09:00:01.000Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // First entry: 500ms
    expect(result.current.entries[0].durationFormatted).toBe('< 1s')
  })

  it('returns empty when timeEntryId is empty', async () => {
    const { result } = renderHook(() =>
      useActivityLog('', '2026-01-18T10:30:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.entries).toEqual([])
    expect(mockGetLog).not.toHaveBeenCalled()
  })

  it('returns summary data with aggregated per-app durations', async () => {
    const mockEntries = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:00:00Z',
        appName: 'VS Code',
        windowTitle: 'index.ts',
      },
      {
        id: '2',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:05:00Z',
        appName: 'Chrome',
        windowTitle: 'Google',
      },
      {
        id: '3',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-18T09:10:00Z',
        appName: 'VS Code',
        windowTitle: 'test.ts',
      },
    ]

    mockGetLog.mockResolvedValueOnce({ success: true, data: mockEntries })

    const sessionEndTime = '2026-01-18T09:15:00Z'
    const { result } = renderHook(() =>
      useActivityLog('entry-123', sessionEndTime)
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Summary should have 2 apps (VS Code and Chrome)
    expect(result.current.summary).toHaveLength(2)

    // VS Code: 5 + 5 = 10 minutes total (sorted first due to longer duration)
    expect(result.current.summary[0].appName).toBe('VS Code')
    expect(result.current.summary[0].totalDurationMs).toBe(10 * 60 * 1000)
    expect(result.current.summary[0].percentage).toBe(67) // 10/15 = 66.67%

    // Chrome: 5 minutes
    expect(result.current.summary[1].appName).toBe('Chrome')
    expect(result.current.summary[1].totalDurationMs).toBe(5 * 60 * 1000)
    expect(result.current.summary[1].percentage).toBe(33) // 5/15 = 33.33%

    // Total duration
    expect(result.current.totalDurationMs).toBe(15 * 60 * 1000)
    expect(result.current.totalDurationFormatted).toBe('15m')
  })

  it('returns empty summary when no entries', async () => {
    mockGetLog.mockResolvedValueOnce({ success: true, data: [] })

    const { result } = renderHook(() =>
      useActivityLog('entry-123', '2026-01-18T10:30:00Z')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.summary).toEqual([])
    expect(result.current.totalDurationMs).toBe(0)
    expect(result.current.totalDurationFormatted).toBe('0s')
  })
})

/**
 * Unit tests for aggregateSummary function
 * Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Task-4
 */
describe('aggregateSummary', () => {
  it('groups entries by appName correctly (AC4.3.2)', () => {
    const entries: ActivityEntryWithDuration[] = [
      { id: '1', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:00Z', appName: 'VS Code', windowTitle: 'a.ts', durationMs: 60000, durationFormatted: '1m' },
      { id: '2', timeEntryId: 'e1', timestamp: '2026-01-18T09:01:00Z', appName: 'Chrome', windowTitle: 'b', durationMs: 30000, durationFormatted: '30s' },
      { id: '3', timeEntryId: 'e1', timestamp: '2026-01-18T09:01:30Z', appName: 'VS Code', windowTitle: 'c.ts', durationMs: 60000, durationFormatted: '1m' },
    ]

    const summary = aggregateSummary(entries)

    expect(summary).toHaveLength(2)
    const vsCodeItem = summary.find(s => s.appName === 'VS Code')
    const chromeItem = summary.find(s => s.appName === 'Chrome')

    expect(vsCodeItem).toBeDefined()
    expect(chromeItem).toBeDefined()
  })

  it('sums durations per app correctly (AC4.3.3)', () => {
    const entries: ActivityEntryWithDuration[] = [
      { id: '1', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:00Z', appName: 'VS Code', windowTitle: 'a.ts', durationMs: 60000, durationFormatted: '1m' },
      { id: '2', timeEntryId: 'e1', timestamp: '2026-01-18T09:01:00Z', appName: 'Chrome', windowTitle: 'b', durationMs: 30000, durationFormatted: '30s' },
      { id: '3', timeEntryId: 'e1', timestamp: '2026-01-18T09:01:30Z', appName: 'VS Code', windowTitle: 'c.ts', durationMs: 90000, durationFormatted: '1m 30s' },
    ]

    const summary = aggregateSummary(entries)
    const vsCodeItem = summary.find(s => s.appName === 'VS Code')

    // VS Code: 60000 + 90000 = 150000ms = 2m 30s
    expect(vsCodeItem?.totalDurationMs).toBe(150000)
    expect(vsCodeItem?.totalDurationFormatted).toBe('2m 30s')
  })

  it('sorts by duration descending - most time first (AC4.3.2)', () => {
    const entries: ActivityEntryWithDuration[] = [
      { id: '1', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:00Z', appName: 'Slack', windowTitle: 'x', durationMs: 30000, durationFormatted: '30s' },
      { id: '2', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:30Z', appName: 'VS Code', windowTitle: 'a.ts', durationMs: 120000, durationFormatted: '2m' },
      { id: '3', timeEntryId: 'e1', timestamp: '2026-01-18T09:02:30Z', appName: 'Chrome', windowTitle: 'b', durationMs: 60000, durationFormatted: '1m' },
    ]

    const summary = aggregateSummary(entries)

    expect(summary[0].appName).toBe('VS Code')  // 120000ms - most time
    expect(summary[1].appName).toBe('Chrome')   // 60000ms
    expect(summary[2].appName).toBe('Slack')    // 30000ms - least time
  })

  it('calculates percentages correctly (AC4.3.3)', () => {
    const entries: ActivityEntryWithDuration[] = [
      { id: '1', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:00Z', appName: 'VS Code', windowTitle: 'a.ts', durationMs: 60000, durationFormatted: '1m' },
      { id: '2', timeEntryId: 'e1', timestamp: '2026-01-18T09:01:00Z', appName: 'Chrome', windowTitle: 'b', durationMs: 40000, durationFormatted: '40s' },
    ]

    const summary = aggregateSummary(entries)

    // Total: 100000ms. VS Code: 60%, Chrome: 40%
    expect(summary[0].percentage).toBe(60)
    expect(summary[1].percentage).toBe(40)
  })

  it('returns empty array for empty entries array', () => {
    const summary = aggregateSummary([])
    expect(summary).toEqual([])
  })

  it('handles single entry correctly - 100% for one app', () => {
    const entries: ActivityEntryWithDuration[] = [
      { id: '1', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:00Z', appName: 'VS Code', windowTitle: 'a.ts', durationMs: 300000, durationFormatted: '5m' },
    ]

    const summary = aggregateSummary(entries)

    expect(summary).toHaveLength(1)
    expect(summary[0].appName).toBe('VS Code')
    expect(summary[0].percentage).toBe(100)
    expect(summary[0].totalDurationMs).toBe(300000)
  })

  it('rounds percentages to integers', () => {
    const entries: ActivityEntryWithDuration[] = [
      { id: '1', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:00Z', appName: 'VS Code', windowTitle: 'a', durationMs: 33333, durationFormatted: '33s' },
      { id: '2', timeEntryId: 'e1', timestamp: '2026-01-18T09:00:33Z', appName: 'Chrome', windowTitle: 'b', durationMs: 33333, durationFormatted: '33s' },
      { id: '3', timeEntryId: 'e1', timestamp: '2026-01-18T09:01:06Z', appName: 'Slack', windowTitle: 'c', durationMs: 33334, durationFormatted: '33s' },
    ]

    const summary = aggregateSummary(entries)

    // All should round to 33% (33.33%)
    expect(summary.every(s => s.percentage === 33)).toBe(true)
  })
})

/**
 * Unit tests for formatActivityDuration function
 */
describe('formatActivityDuration', () => {
  it('formats sub-second durations as "< 1s"', () => {
    expect(formatActivityDuration(500)).toBe('< 1s')
    expect(formatActivityDuration(0)).toBe('< 1s')
    expect(formatActivityDuration(999)).toBe('< 1s')
  })

  it('formats seconds without minutes', () => {
    expect(formatActivityDuration(1000)).toBe('1s')
    expect(formatActivityDuration(30000)).toBe('30s')
    expect(formatActivityDuration(59000)).toBe('59s')
  })

  it('formats minutes without seconds when even', () => {
    expect(formatActivityDuration(60000)).toBe('1m')
    expect(formatActivityDuration(300000)).toBe('5m')
  })

  it('formats minutes with seconds', () => {
    expect(formatActivityDuration(92000)).toBe('1m 32s')
    expect(formatActivityDuration(330000)).toBe('5m 30s')
  })

  it('formats hours without minutes when even', () => {
    expect(formatActivityDuration(3600000)).toBe('1h')
    expect(formatActivityDuration(7200000)).toBe('2h')
  })

  it('formats hours with minutes', () => {
    expect(formatActivityDuration(4500000)).toBe('1h 15m')
    expect(formatActivityDuration(8100000)).toBe('2h 15m')
  })
})
