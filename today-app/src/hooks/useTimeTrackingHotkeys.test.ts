import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTimeTrackingHotkeys } from './useTimeTrackingHotkeys'

describe('useTimeTrackingHotkeys', () => {
  let onOpenTracking: ReturnType<typeof vi.fn>
  let onOpenInsights: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onOpenTracking = vi.fn()
    onOpenInsights = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const createKeyboardEvent = (options: {
    code?: string
    metaKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
  }): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      code: options.code ?? 'KeyT',
      metaKey: options.metaKey ?? false,
      ctrlKey: options.ctrlKey ?? false,
      altKey: options.altKey ?? false,
      bubbles: true,
      cancelable: true,
    })
  }

  describe('Hotkey Detection (AC1)', () => {
    it('should trigger onOpenTracking when Cmd+Opt+T is pressed on Mac', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      // Wait for double-tap timeout to expire
      vi.advanceTimersByTime(350)

      expect(onOpenTracking).toHaveBeenCalledTimes(1)
      expect(onOpenInsights).not.toHaveBeenCalled()
    })

    it('should trigger onOpenTracking when Ctrl+Alt+T is pressed on Windows', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ ctrlKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      // Wait for double-tap timeout to expire
      vi.advanceTimersByTime(350)

      expect(onOpenTracking).toHaveBeenCalledTimes(1)
      expect(onOpenInsights).not.toHaveBeenCalled()
    })

    it('should handle uppercase T', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).toHaveBeenCalledTimes(1)
    })

    it('should not trigger without Alt/Option key', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: false, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).not.toHaveBeenCalled()
      expect(onOpenInsights).not.toHaveBeenCalled()
    })

    it('should not trigger without Cmd/Ctrl key', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: false, ctrlKey: false, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).not.toHaveBeenCalled()
    })

    it('should not trigger for wrong key', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyR' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).not.toHaveBeenCalled()
    })
  })

  describe('preventDefault (AC2)', () => {
    it('should call preventDefault when hotkey is detected', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('should not call preventDefault for non-matching keystrokes', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: false, altKey: false, code: 'KeyT' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('Input Field Exclusion (AC4)', () => {
    it('should not trigger when focused on input element', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('should not trigger when focused on textarea element', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('should not trigger when focused on contenteditable element', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      document.body.appendChild(div)
      div.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).not.toHaveBeenCalled()

      document.body.removeChild(div)
    })

    it('should trigger when focused on non-input element', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      vi.advanceTimersByTime(350)

      expect(onOpenTracking).toHaveBeenCalledTimes(1)

      document.body.removeChild(button)
    })
  })

  describe('Double-tap Detection (AC5)', () => {
    it('should trigger onOpenInsights for double-tap within 300ms', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      // First tap
      const event1 = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event1)

      // Second tap within 300ms
      vi.advanceTimersByTime(200)
      const event2 = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event2)

      expect(onOpenInsights).toHaveBeenCalledTimes(1)
      expect(onOpenTracking).not.toHaveBeenCalled()
    })

    it('should not trigger onOpenInsights after double-tap (triple-tap prevention)', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      // First tap
      document.dispatchEvent(createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' }))
      vi.advanceTimersByTime(100)

      // Second tap (triggers insights)
      document.dispatchEvent(createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' }))

      expect(onOpenInsights).toHaveBeenCalledTimes(1)

      // Third tap within 300ms should NOT trigger insights again
      vi.advanceTimersByTime(100)
      document.dispatchEvent(createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' }))

      // Wait for single-tap timeout
      vi.advanceTimersByTime(350)

      // Should only be called once from the double-tap
      expect(onOpenInsights).toHaveBeenCalledTimes(1)
      // Third tap starts a new single-tap which triggers tracking
      expect(onOpenTracking).toHaveBeenCalledTimes(1)
    })
  })

  describe('Single-tap Delayed Callback (AC6)', () => {
    it('should delay onOpenTracking call by double-tap threshold', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      // Should not be called immediately
      expect(onOpenTracking).not.toHaveBeenCalled()

      // Should still not be called before threshold
      vi.advanceTimersByTime(290)
      expect(onOpenTracking).not.toHaveBeenCalled()

      // Should be called after threshold
      vi.advanceTimersByTime(20)
      expect(onOpenTracking).toHaveBeenCalledTimes(1)
    })

    it('should trigger onOpenTracking after single tap with 500ms wait', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' })
      document.dispatchEvent(event)

      // Wait 500ms (well past the 300ms threshold)
      vi.advanceTimersByTime(500)

      expect(onOpenTracking).toHaveBeenCalledTimes(1)
      expect(onOpenInsights).not.toHaveBeenCalled()
    })

    it('should cancel pending single-tap when double-tap occurs', () => {
      renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      // First tap
      document.dispatchEvent(createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' }))

      // Before timeout expires, second tap
      vi.advanceTimersByTime(100)
      document.dispatchEvent(createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' }))

      // Wait for any pending timeouts
      vi.advanceTimersByTime(500)

      // Only insights should have been called (from double-tap), not tracking
      expect(onOpenInsights).toHaveBeenCalledTimes(1)
      // Tracking was NOT called because the pending timeout was cancelled
      expect(onOpenTracking).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
    })

    it('should clear pending timeout on unmount', () => {
      const { unmount } = renderHook(() => useTimeTrackingHotkeys(onOpenTracking, onOpenInsights))

      // Trigger a single tap (starts timeout)
      document.dispatchEvent(createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyT' }))

      // Unmount before timeout completes
      vi.advanceTimersByTime(100)
      unmount()

      // Advance past when callback would have fired
      vi.advanceTimersByTime(500)

      // Callback should NOT have been called
      expect(onOpenTracking).not.toHaveBeenCalled()
    })
  })
})
