import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCompletedTasksHotkey } from './useCompletedTasksHotkey'

describe('useCompletedTasksHotkey', () => {
  let onOpen: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onOpen = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createKeyboardEvent = (options: {
    code?: string
    metaKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
  }): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      code: options.code ?? 'KeyC',
      metaKey: options.metaKey ?? false,
      ctrlKey: options.ctrlKey ?? false,
      altKey: options.altKey ?? false,
      bubbles: true,
      cancelable: true,
    })
  }

  describe('Hotkey Detection (AC1)', () => {
    it('should trigger onOpen when Cmd+Opt+C is pressed on Mac', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('should trigger onOpen when Ctrl+Alt+C is pressed on Windows', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ ctrlKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('should not trigger without Alt/Option key', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ metaKey: true, altKey: false, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()
    })

    it('should not trigger without Cmd/Ctrl key', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ metaKey: false, ctrlKey: false, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()
    })

    it('should not trigger for wrong key', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyA' })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()
    })

    it('should not trigger when both Cmd and Ctrl are pressed', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = new KeyboardEvent('keydown', {
        code: 'KeyC',
        metaKey: true,
        ctrlKey: true,
        altKey: true,
        bubbles: true,
        cancelable: true,
      })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()
    })
  })

  describe('preventDefault (AC8)', () => {
    it('should call preventDefault when hotkey is detected', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('should not call preventDefault for non-matching keystrokes', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const event = createKeyboardEvent({ metaKey: false, altKey: false, code: 'KeyC' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      document.dispatchEvent(event)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('Input Field Exclusion (AC8)', () => {
    it('should not trigger when focused on input element', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('should not trigger when focused on textarea element', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('should not trigger when focused on contenteditable element', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      document.body.appendChild(div)
      div.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).not.toHaveBeenCalled()

      document.body.removeChild(div)
    })

    it('should trigger when focused on non-input element', () => {
      renderHook(() => useCompletedTasksHotkey(onOpen))

      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(onOpen).toHaveBeenCalledTimes(1)

      document.body.removeChild(button)
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => useCompletedTasksHotkey(onOpen))
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
    })
  })

  describe('Callback Updates', () => {
    it('should use the latest callback when it changes', () => {
      const firstCallback = vi.fn()
      const secondCallback = vi.fn()

      const { rerender } = renderHook(
        ({ callback }) => useCompletedTasksHotkey(callback),
        { initialProps: { callback: firstCallback } }
      )

      // Update to new callback
      rerender({ callback: secondCallback })

      // Trigger hotkey
      const event = createKeyboardEvent({ metaKey: true, altKey: true, code: 'KeyC' })
      document.dispatchEvent(event)

      expect(firstCallback).not.toHaveBeenCalled()
      expect(secondCallback).toHaveBeenCalledTimes(1)
    })
  })
})
