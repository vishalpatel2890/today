import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from './useOnlineStatus'

describe('useOnlineStatus', () => {
  const originalNavigator = window.navigator

  beforeEach(() => {
    // Reset navigator.onLine mock
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      onLine: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('should return true when navigator.onLine is true', () => {
      vi.stubGlobal('navigator', { ...originalNavigator, onLine: true })

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current.isOnline).toBe(true)
      expect(result.current.statusAnnouncement).toBe('')
    })

    it('should return false when navigator.onLine is false', () => {
      vi.stubGlobal('navigator', { ...originalNavigator, onLine: false })

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('online/offline events', () => {
    it('should update to offline when offline event fires', async () => {
      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current.isOnline).toBe(true)

      await act(async () => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current.isOnline).toBe(false)
      expect(result.current.statusAnnouncement).toBe(
        'You are now offline. Changes will sync when reconnected.'
      )
    })

    it('should update to online when online event fires', async () => {
      vi.stubGlobal('navigator', { ...originalNavigator, onLine: false })

      const { result } = renderHook(() => useOnlineStatus())

      expect(result.current.isOnline).toBe(false)

      await act(async () => {
        window.dispatchEvent(new Event('online'))
      })

      expect(result.current.isOnline).toBe(true)
      expect(result.current.statusAnnouncement).toBe('You are now online')
    })

    it('should clear status announcement after timeout', async () => {
      vi.useFakeTimers()

      const { result } = renderHook(() => useOnlineStatus())

      await act(async () => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current.statusAnnouncement).not.toBe('')

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.statusAnnouncement).toBe('')

      vi.useRealTimers()
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useOnlineStatus())

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})
