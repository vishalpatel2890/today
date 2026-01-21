import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sanitizeFilename,
  escapeCSVField,
  generateCSV,
  generateJSON,
  generateDefaultFilename,
  type ActivityEntryForExport,
} from './activityExport'

describe('activityExport utilities', () => {
  describe('sanitizeFilename', () => {
    it('removes invalid filename characters (AC4.4.4)', () => {
      expect(sanitizeFilename('file<name>:test"path/file\\name|with?stars*')).toBe(
        'file-name--test-path-file-name-with-stars-'
      )
    })

    it('preserves valid characters', () => {
      expect(sanitizeFilename('My Task Name')).toBe('My Task Name')
      expect(sanitizeFilename('task-123')).toBe('task-123')
      expect(sanitizeFilename('Task_with_underscores')).toBe('Task_with_underscores')
    })

    it('trims whitespace', () => {
      expect(sanitizeFilename('  Task Name  ')).toBe('Task Name')
    })

    it('returns "activity" for empty string', () => {
      expect(sanitizeFilename('')).toBe('activity')
    })

    it('returns "activity" when only invalid characters', () => {
      expect(sanitizeFilename('<>:"/\\|?*')).toBe('activity')
    })

    it('handles special characters in task names', () => {
      expect(sanitizeFilename('Fix bug #123')).toBe('Fix bug #123')
      expect(sanitizeFilename('Task (high priority)')).toBe('Task (high priority)')
      expect(sanitizeFilename('Email & Calendar')).toBe('Email & Calendar')
    })
  })

  describe('escapeCSVField', () => {
    it('does not escape simple strings', () => {
      expect(escapeCSVField('Hello World')).toBe('Hello World')
      expect(escapeCSVField('VS Code')).toBe('VS Code')
    })

    it('escapes strings containing commas (AC4.4.3)', () => {
      expect(escapeCSVField('Hello, World')).toBe('"Hello, World"')
      expect(escapeCSVField('one, two, three')).toBe('"one, two, three"')
    })

    it('escapes strings containing double quotes', () => {
      expect(escapeCSVField('He said "Hello"')).toBe('"He said ""Hello"""')
    })

    it('escapes strings containing newlines', () => {
      expect(escapeCSVField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"')
    })

    it('escapes strings with multiple special characters', () => {
      expect(escapeCSVField('Value, with "quotes" and\nnewline')).toBe(
        '"Value, with ""quotes"" and\nnewline"'
      )
    })

    it('handles window titles with commas correctly', () => {
      expect(escapeCSVField('File.js - VS Code, Unsaved')).toBe('"File.js - VS Code, Unsaved"')
    })
  })

  describe('generateCSV', () => {
    const mockEntries: ActivityEntryForExport[] = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-20T09:00:15Z',
        appName: 'VS Code',
        windowTitle: 'index.ts - today-app',
        durationMs: 5 * 60 * 1000, // 5 minutes = 300 seconds
      },
      {
        id: '2',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-20T09:05:32Z',
        appName: 'Chrome',
        windowTitle: 'React Documentation - Google Chrome',
        durationMs: 3 * 60 * 1000 + 28 * 1000, // 3m 28s = 208 seconds
      },
    ]

    it('generates CSV with correct headers (AC4.4.3)', () => {
      const csv = generateCSV(mockEntries)
      const lines = csv.split('\n')
      expect(lines[0]).toBe('timestamp,app_name,window_title,duration_seconds')
    })

    it('generates correct data rows (AC4.4.3)', () => {
      const csv = generateCSV(mockEntries)
      const lines = csv.split('\n')

      expect(lines[1]).toBe('2026-01-20T09:00:15Z,VS Code,index.ts - today-app,300')
      expect(lines[2]).toBe(
        '2026-01-20T09:05:32Z,Chrome,React Documentation - Google Chrome,208'
      )
    })

    it('correctly calculates duration_seconds from durationMs (AC4.4.3)', () => {
      const entries: ActivityEntryForExport[] = [
        {
          id: '1',
          timeEntryId: 'entry-1',
          timestamp: '2026-01-20T09:00:00Z',
          appName: 'App',
          windowTitle: 'Window',
          durationMs: 65500, // 65.5 seconds, should round to 66
        },
      ]
      const csv = generateCSV(entries)
      const lines = csv.split('\n')
      expect(lines[1]).toContain(',66')
    })

    it('escapes commas in window titles (AC4.4.3)', () => {
      const entries: ActivityEntryForExport[] = [
        {
          id: '1',
          timeEntryId: 'entry-1',
          timestamp: '2026-01-20T09:00:00Z',
          appName: 'VS Code',
          windowTitle: 'File.ts - VS Code, Unsaved',
          durationMs: 60000,
        },
      ]
      const csv = generateCSV(entries)
      const lines = csv.split('\n')
      // Window title should be wrapped in quotes
      expect(lines[1]).toContain('"File.ts - VS Code, Unsaved"')
    })

    it('escapes commas in app names', () => {
      const entries: ActivityEntryForExport[] = [
        {
          id: '1',
          timeEntryId: 'entry-1',
          timestamp: '2026-01-20T09:00:00Z',
          appName: 'Some, App',
          windowTitle: 'Window',
          durationMs: 60000,
        },
      ]
      const csv = generateCSV(entries)
      const lines = csv.split('\n')
      expect(lines[1]).toContain('"Some, App"')
    })

    it('returns only headers for empty entries array', () => {
      const csv = generateCSV([])
      expect(csv).toBe('timestamp,app_name,window_title,duration_seconds')
    })
  })

  describe('generateJSON', () => {
    const mockEntries: ActivityEntryForExport[] = [
      {
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-20T09:00:15Z',
        appName: 'VS Code',
        windowTitle: 'index.ts - today-app',
        durationMs: 300000,
      },
    ]

    it('generates valid JSON (AC4.4.2)', () => {
      const json = generateJSON(mockEntries)
      const parsed = JSON.parse(json)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
    })

    it('includes all activity entry fields (AC4.4.2)', () => {
      const json = generateJSON(mockEntries)
      const parsed = JSON.parse(json)
      expect(parsed[0]).toEqual({
        id: '1',
        timeEntryId: 'entry-123',
        timestamp: '2026-01-20T09:00:15Z',
        appName: 'VS Code',
        windowTitle: 'index.ts - today-app',
        durationMs: 300000,
      })
    })

    it('generates pretty-printed JSON with 2-space indentation', () => {
      const json = generateJSON(mockEntries)
      // Pretty-printed JSON should contain newlines and indentation
      expect(json).toContain('\n')
      expect(json).toContain('  "id"')
    })

    it('returns empty array for no entries', () => {
      const json = generateJSON([])
      expect(json).toBe('[]')
    })

    it('handles special characters in window titles', () => {
      const entries: ActivityEntryForExport[] = [
        {
          id: '1',
          timeEntryId: 'entry-1',
          timestamp: '2026-01-20T09:00:00Z',
          appName: 'Browser',
          windowTitle: 'Search "React hooks" - Google',
          durationMs: 60000,
        },
      ]
      const json = generateJSON(entries)
      const parsed = JSON.parse(json)
      expect(parsed[0].windowTitle).toBe('Search "React hooks" - Google')
    })
  })

  describe('generateDefaultFilename', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-20T10:30:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('generates filename with task name and date for JSON (AC4.4.4)', () => {
      const filename = generateDefaultFilename('Fix login bug', 'json')
      expect(filename).toBe('activity-Fix login bug-2026-01-20.json')
    })

    it('generates filename with task name and date for CSV (AC4.4.4)', () => {
      const filename = generateDefaultFilename('Fix login bug', 'csv')
      expect(filename).toBe('activity-Fix login bug-2026-01-20.csv')
    })

    it('sanitizes task name in filename (AC4.4.4)', () => {
      const filename = generateDefaultFilename('Task: Fix <bug>', 'json')
      expect(filename).toBe('activity-Task- Fix -bug--2026-01-20.json')
    })

    it('handles empty task name', () => {
      const filename = generateDefaultFilename('', 'json')
      expect(filename).toBe('activity-activity-2026-01-20.json')
    })
  })
})
