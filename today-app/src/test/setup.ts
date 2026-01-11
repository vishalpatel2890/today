import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { db } from '../lib/db'
import { timeTrackingDb } from '../lib/timeTrackingDb'

// Mock navigator.onLine to false by default so tests use IndexedDB fallback
// This prevents tests from making actual network requests to Supabase
Object.defineProperty(navigator, 'onLine', {
  value: false,
  writable: true,
  configurable: true,
})

// Mock ResizeObserver for Radix UI components that use @radix-ui/react-use-size
// ResizeObserver is not available in JSDOM environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock scrollIntoView for Radix Select components
// scrollIntoView is not available in JSDOM environment
Element.prototype.scrollIntoView = function () {}

// Mock hasPointerCapture and related pointer capture APIs for Radix Select
// These are not available in JSDOM environment
Element.prototype.hasPointerCapture = function () {
  return false
}
Element.prototype.setPointerCapture = function () {}
Element.prototype.releasePointerCapture = function () {}

// Clear the database before each test
beforeEach(async () => {
  await db.tasks.clear()
  await db.syncQueue.clear()
  await timeTrackingDb.timeEntries.clear()
  await timeTrackingDb.activeSession.clear()
})
