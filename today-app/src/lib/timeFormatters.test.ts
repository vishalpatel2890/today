import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startOfDay, endOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns'
import { formatDuration, formatDurationSummary, formatRelativeTimestamp, getDateRangeForPreset, formatDateRange } from './timeFormatters'

describe('timeFormatters', () => {
  describe('formatDuration', () => {
    it('should return "0:00" for zero duration', () => {
      expect(formatDuration(0)).toBe('0:00')
    })

    it('should return "0:00" for negative duration', () => {
      expect(formatDuration(-1000)).toBe('0:00')
    })

    it('should format seconds only (< 1 minute)', () => {
      expect(formatDuration(5000)).toBe('0:05')
      expect(formatDuration(30000)).toBe('0:30')
      expect(formatDuration(59000)).toBe('0:59')
    })

    it('should format minutes and seconds (< 1 hour)', () => {
      expect(formatDuration(60000)).toBe('1:00')
      expect(formatDuration(90000)).toBe('1:30')
      expect(formatDuration(600000)).toBe('10:00')
      expect(formatDuration(3599000)).toBe('59:59')
    })

    it('should format hours, minutes, and seconds (>= 1 hour)', () => {
      expect(formatDuration(3600000)).toBe('1:00:00')
      expect(formatDuration(3661000)).toBe('1:01:01')
      expect(formatDuration(7200000)).toBe('2:00:00')
      expect(formatDuration(86400000)).toBe('24:00:00') // 24 hours
    })

    it('should pad minutes and seconds with leading zeros', () => {
      expect(formatDuration(61000)).toBe('1:01')
      expect(formatDuration(3601000)).toBe('1:00:01')
      expect(formatDuration(3660000)).toBe('1:01:00')
    })

    it('should handle milliseconds correctly (floor to seconds)', () => {
      expect(formatDuration(1500)).toBe('0:01')
      expect(formatDuration(1999)).toBe('0:01')
      expect(formatDuration(999)).toBe('0:00')
    })
  })

  describe('formatDurationSummary', () => {
    it('should return "0m" for zero duration', () => {
      expect(formatDurationSummary(0)).toBe('0m')
    })

    it('should return "0m" for negative duration', () => {
      expect(formatDurationSummary(-1000)).toBe('0m')
    })

    it('should return "< 1m" for duration less than 1 minute', () => {
      expect(formatDurationSummary(1000)).toBe('< 1m')
      expect(formatDurationSummary(30000)).toBe('< 1m')
      expect(formatDurationSummary(59999)).toBe('< 1m')
    })

    it('should format minutes only (< 1 hour)', () => {
      expect(formatDurationSummary(60000)).toBe('1m')
      expect(formatDurationSummary(120000)).toBe('2m')
      expect(formatDurationSummary(1800000)).toBe('30m')
      expect(formatDurationSummary(3540000)).toBe('59m')
    })

    it('should format hours only when minutes are 0', () => {
      expect(formatDurationSummary(3600000)).toBe('1h')
      expect(formatDurationSummary(7200000)).toBe('2h')
    })

    it('should format hours and minutes when both present', () => {
      expect(formatDurationSummary(3660000)).toBe('1h 1m')
      expect(formatDurationSummary(5400000)).toBe('1h 30m')
      expect(formatDurationSummary(9000000)).toBe('2h 30m')
    })

    it('should floor to minutes (ignore seconds)', () => {
      expect(formatDurationSummary(65000)).toBe('1m') // 1 minute 5 seconds -> 1m
      expect(formatDurationSummary(3659999)).toBe('1h') // 60 minutes 59.999 seconds -> 1h (60m = 1h)
    })

    it('should handle large durations', () => {
      expect(formatDurationSummary(86400000)).toBe('24h') // 24 hours
      expect(formatDurationSummary(90000000)).toBe('25h') // 25 hours
    })
  })

  describe('formatRelativeTimestamp', () => {
    // Use a fixed local date for consistent testing
    // Set to Jan 10, 2026 at 3:00 PM local time
    const FIXED_NOW = new Date(2026, 0, 10, 15, 0, 0) // Local time

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(FIXED_NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    // Helper to create ISO string from local date components
    const toISOLocal = (year: number, month: number, day: number, hour: number, minute: number): string => {
      return new Date(year, month, day, hour, minute, 0).toISOString()
    }

    describe('today timestamps', () => {
      it('should format today morning as "Today X:XXam"', () => {
        const todayMorning = toISOLocal(2026, 0, 10, 9, 30) // 9:30 AM local
        expect(formatRelativeTimestamp(todayMorning)).toBe('Today 9:30am')
      })

      it('should format today afternoon as "Today X:XXpm"', () => {
        const todayAfternoon = toISOLocal(2026, 0, 10, 14, 30) // 2:30 PM local
        expect(formatRelativeTimestamp(todayAfternoon)).toBe('Today 2:30pm')
      })

      it('should format noon correctly', () => {
        const todayNoon = toISOLocal(2026, 0, 10, 12, 0) // 12:00 PM local
        expect(formatRelativeTimestamp(todayNoon)).toBe('Today 12:00pm')
      })

      it('should format midnight correctly', () => {
        const todayMidnight = toISOLocal(2026, 0, 10, 0, 0) // 12:00 AM local
        expect(formatRelativeTimestamp(todayMidnight)).toBe('Today 12:00am')
      })
    })

    describe('yesterday timestamps', () => {
      it('should format yesterday morning as "Yesterday X:XXam"', () => {
        const yesterdayMorning = toISOLocal(2026, 0, 9, 11, 0) // Jan 9, 11:00 AM local
        expect(formatRelativeTimestamp(yesterdayMorning)).toBe('Yesterday 11:00am')
      })

      it('should format yesterday afternoon as "Yesterday X:XXpm"', () => {
        const yesterdayAfternoon = toISOLocal(2026, 0, 9, 16, 45) // Jan 9, 4:45 PM local
        expect(formatRelativeTimestamp(yesterdayAfternoon)).toBe('Yesterday 4:45pm')
      })
    })

    describe('this week timestamps (within 7 days)', () => {
      it('should format 2 days ago with day abbreviation', () => {
        // Jan 8, 2026 is a Thursday (2 days before Saturday Jan 10)
        const twoDaysAgo = toISOLocal(2026, 0, 8, 9, 15) // Jan 8, 9:15 AM local
        expect(formatRelativeTimestamp(twoDaysAgo)).toBe('Thu 9:15am')
      })

      it('should format 5 days ago with day abbreviation', () => {
        // Jan 5, 2026 is a Monday
        const fiveDaysAgo = toISOLocal(2026, 0, 5, 14, 0) // Jan 5, 2:00 PM local
        expect(formatRelativeTimestamp(fiveDaysAgo)).toBe('Mon 2:00pm')
      })

      it('should format 7 days ago with day abbreviation', () => {
        // Jan 3, 2026 is a Saturday (exactly 7 days before)
        const sevenDaysAgo = toISOLocal(2026, 0, 3, 10, 30) // Jan 3, 10:30 AM local
        expect(formatRelativeTimestamp(sevenDaysAgo)).toBe('Sat 10:30am')
      })
    })

    describe('older timestamps (more than 7 days)', () => {
      it('should format 9 days ago with month and day', () => {
        // Jan 1 at 3:30 PM - clearly more than 7 days before Jan 10 at 3:00 PM
        const nineDaysAgo = toISOLocal(2026, 0, 1, 15, 30) // Jan 1, 3:30 PM local
        expect(formatRelativeTimestamp(nineDaysAgo)).toBe('Jan 1 3:30pm')
      })

      it('should format last month with month and day', () => {
        const lastMonth = toISOLocal(2025, 11, 15, 9, 0) // Dec 15, 9:00 AM local
        expect(formatRelativeTimestamp(lastMonth)).toBe('Dec 15 9:00am')
      })

      it('should format old dates with month and day', () => {
        const oldDate = toISOLocal(2025, 10, 1, 12, 0) // Nov 1, 12:00 PM local
        expect(formatRelativeTimestamp(oldDate)).toBe('Nov 1 12:00pm')
      })
    })

    describe('edge cases', () => {
      it('should handle single-digit hours without leading zeros', () => {
        const singleDigitHour = toISOLocal(2026, 0, 10, 5, 5) // 5:05 AM local
        expect(formatRelativeTimestamp(singleDigitHour)).toBe('Today 5:05am')
      })

      it('should handle 12-hour format boundaries correctly', () => {
        // 12:30 PM
        const afternoon = toISOLocal(2026, 0, 10, 12, 30)
        expect(formatRelativeTimestamp(afternoon)).toBe('Today 12:30pm')

        // 11:59 PM (before midnight)
        const lateNight = toISOLocal(2026, 0, 10, 23, 59)
        expect(formatRelativeTimestamp(lateNight)).toBe('Today 11:59pm')
      })
    })
  })

  describe('getDateRangeForPreset', () => {
    // Use a fixed date for consistent testing
    // Set to Jan 10, 2026 (Saturday) at 3:00 PM local time
    const FIXED_NOW = new Date(2026, 0, 10, 15, 0, 0)

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(FIXED_NOW)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('null preset', () => {
      it('should return null for null preset', () => {
        expect(getDateRangeForPreset(null)).toBeNull()
      })
    })

    describe('today preset (AC-3.1.7)', () => {
      it('should return start of today to end of today', () => {
        const range = getDateRangeForPreset('today')

        expect(range).not.toBeNull()
        expect(range!.start.getTime()).toBe(startOfDay(FIXED_NOW).getTime())
        expect(range!.end.getTime()).toBe(endOfDay(FIXED_NOW).getTime())
      })

      it('should have start at midnight (00:00:00.000)', () => {
        const range = getDateRangeForPreset('today')

        expect(range!.start.getHours()).toBe(0)
        expect(range!.start.getMinutes()).toBe(0)
        expect(range!.start.getSeconds()).toBe(0)
        expect(range!.start.getMilliseconds()).toBe(0)
      })

      it('should have end at 23:59:59.999', () => {
        const range = getDateRangeForPreset('today')

        expect(range!.end.getHours()).toBe(23)
        expect(range!.end.getMinutes()).toBe(59)
        expect(range!.end.getSeconds()).toBe(59)
        expect(range!.end.getMilliseconds()).toBe(999)
      })
    })

    describe('yesterday preset (AC-3.1.7)', () => {
      it('should return start of yesterday to end of yesterday', () => {
        const yesterday = subDays(FIXED_NOW, 1)
        const range = getDateRangeForPreset('yesterday')

        expect(range).not.toBeNull()
        expect(range!.start.getTime()).toBe(startOfDay(yesterday).getTime())
        expect(range!.end.getTime()).toBe(endOfDay(yesterday).getTime())
      })

      it('should be the day before today', () => {
        const range = getDateRangeForPreset('yesterday')

        // Jan 10, 2026 is a Saturday, so yesterday is Jan 9 (Friday)
        expect(range!.start.getDate()).toBe(9)
        expect(range!.start.getMonth()).toBe(0) // January
        expect(range!.start.getFullYear()).toBe(2026)
      })
    })

    describe('week preset (AC-3.1.7)', () => {
      it('should return start of week (Sunday) to end of today', () => {
        const range = getDateRangeForPreset('week')

        expect(range).not.toBeNull()
        expect(range!.start.getTime()).toBe(startOfWeek(FIXED_NOW, { weekStartsOn: 0 }).getTime())
        expect(range!.end.getTime()).toBe(endOfDay(FIXED_NOW).getTime())
      })

      it('should start on Sunday (weekStartsOn: 0)', () => {
        const range = getDateRangeForPreset('week')

        // Jan 10, 2026 is Saturday, so week starts Jan 4 (Sunday)
        expect(range!.start.getDay()).toBe(0) // Sunday
        expect(range!.start.getDate()).toBe(4)
      })

      it('should end today', () => {
        const range = getDateRangeForPreset('week')

        expect(range!.end.getDate()).toBe(10) // Jan 10
      })
    })

    describe('month preset (AC-3.1.7)', () => {
      it('should return start of month to end of today', () => {
        const range = getDateRangeForPreset('month')

        expect(range).not.toBeNull()
        expect(range!.start.getTime()).toBe(startOfMonth(FIXED_NOW).getTime())
        expect(range!.end.getTime()).toBe(endOfDay(FIXED_NOW).getTime())
      })

      it('should start on the 1st of the month', () => {
        const range = getDateRangeForPreset('month')

        expect(range!.start.getDate()).toBe(1)
        expect(range!.start.getMonth()).toBe(0) // January
      })

      it('should end today', () => {
        const range = getDateRangeForPreset('month')

        expect(range!.end.getDate()).toBe(10) // Jan 10
      })
    })

    describe('edge cases', () => {
      it('should handle first day of month correctly for week preset', () => {
        // Test on Feb 1, 2026 (Sunday) - week and month start on same day
        vi.setSystemTime(new Date(2026, 1, 1, 15, 0, 0))

        const weekRange = getDateRangeForPreset('week')
        const monthRange = getDateRangeForPreset('month')

        // Feb 1 is Sunday, so week starts on Feb 1
        expect(weekRange!.start.getDate()).toBe(1)
        expect(monthRange!.start.getDate()).toBe(1)
      })

      it('should handle first day of year correctly', () => {
        // Test on Jan 1, 2026 (Thursday)
        vi.setSystemTime(new Date(2026, 0, 1, 15, 0, 0))

        const todayRange = getDateRangeForPreset('today')
        const monthRange = getDateRangeForPreset('month')

        expect(todayRange!.start.getDate()).toBe(1)
        expect(monthRange!.start.getDate()).toBe(1)
      })

      it('should handle week spanning two months', () => {
        // Test on Feb 3, 2026 (Tuesday) - week starts in January
        vi.setSystemTime(new Date(2026, 1, 3, 15, 0, 0))

        const weekRange = getDateRangeForPreset('week')

        // Week starts Feb 1 (Sunday)
        expect(weekRange!.start.getMonth()).toBe(1) // February
        expect(weekRange!.start.getDate()).toBe(1)
      })
    })
  })

  describe('formatDateRange', () => {
    describe('same day (AC-3.2.5)', () => {
      it('should format same day range as single date', () => {
        const sameDay = {
          start: new Date(2026, 11, 15), // Dec 15
          end: new Date(2026, 11, 15),   // Dec 15
        }
        expect(formatDateRange(sameDay)).toBe('Dec 15')
      })

      it('should format same day with different times as single date', () => {
        const sameDay = {
          start: new Date(2026, 11, 15, 9, 0),  // Dec 15, 9:00 AM
          end: new Date(2026, 11, 15, 17, 0),   // Dec 15, 5:00 PM
        }
        expect(formatDateRange(sameDay)).toBe('Dec 15')
      })
    })

    describe('same year (AC-3.2.5)', () => {
      it('should format range without year when in same year', () => {
        const sameYear = {
          start: new Date(2026, 11, 1),  // Dec 1
          end: new Date(2026, 11, 15),   // Dec 15
        }
        expect(formatDateRange(sameYear)).toBe('Dec 1 - Dec 15')
      })

      it('should format range spanning months in same year', () => {
        const spanningMonths = {
          start: new Date(2026, 0, 5),   // Jan 5
          end: new Date(2026, 2, 20),    // Mar 20
        }
        expect(formatDateRange(spanningMonths)).toBe('Jan 5 - Mar 20')
      })

      it('should format single-digit days without leading zeros', () => {
        const singleDigit = {
          start: new Date(2026, 5, 1),   // Jun 1
          end: new Date(2026, 5, 9),     // Jun 9
        }
        expect(formatDateRange(singleDigit)).toBe('Jun 1 - Jun 9')
      })
    })

    describe('cross-year (AC-3.2.5)', () => {
      it('should format range with years when spanning years', () => {
        const crossYear = {
          start: new Date(2025, 11, 15), // Dec 15, 2025
          end: new Date(2026, 0, 5),     // Jan 5, 2026
        }
        expect(formatDateRange(crossYear)).toBe('Dec 15, 2025 - Jan 5, 2026')
      })

      it('should format range spanning multiple years', () => {
        const multiYear = {
          start: new Date(2024, 5, 1),   // Jun 1, 2024
          end: new Date(2026, 2, 15),    // Mar 15, 2026
        }
        expect(formatDateRange(multiYear)).toBe('Jun 1, 2024 - Mar 15, 2026')
      })
    })

    describe('edge cases', () => {
      it('should handle first and last day of year', () => {
        const fullYear = {
          start: new Date(2026, 0, 1),   // Jan 1
          end: new Date(2026, 11, 31),   // Dec 31
        }
        expect(formatDateRange(fullYear)).toBe('Jan 1 - Dec 31')
      })

      it('should handle February edge case', () => {
        const february = {
          start: new Date(2026, 1, 1),   // Feb 1
          end: new Date(2026, 1, 28),    // Feb 28
        }
        expect(formatDateRange(february)).toBe('Feb 1 - Feb 28')
      })
    })
  })
})
