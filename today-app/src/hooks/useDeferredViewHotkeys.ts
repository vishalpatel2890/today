import { useEffect, useRef, useCallback } from 'react'

/**
 * Check if the active element is an input field where we should not intercept hotkeys
 */
const isInputElement = (element: Element | null): boolean => {
  if (!element) return false

  const tagName = element.tagName.toUpperCase()
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    return true
  }

  // Check for contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    return true
  }

  return false
}

/**
 * Global keyboard shortcut hook for Deferred view toggle-all
 *
 * Registers Cmd+Opt+A (Mac) / Ctrl+Alt+A (Windows) to toggle all categories
 * Only active when the Deferred view is rendered (component-scoped)
 *
 * @param onToggleAll - Callback when all categories should toggle
 *
 * Per ADR-TT-003: Uses native document.addEventListener, no external libraries
 */
export const useDeferredViewHotkeys = (onToggleAll: () => void): void => {
  // Stable callback ref to avoid re-registering listener on every render
  const onToggleAllRef = useRef(onToggleAll)

  // Keep ref updated
  useEffect(() => {
    onToggleAllRef.current = onToggleAll
  }, [onToggleAll])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Cmd+Opt+A (Mac) or Ctrl+Alt+A (Windows)
    const isMac = e.metaKey && !e.ctrlKey
    const isWindows = e.ctrlKey && !e.metaKey
    const isModifierPressed = isMac || isWindows

    // Use e.code instead of e.key because Option+A on Mac produces special characters
    if (!isModifierPressed || !e.altKey || e.code !== 'KeyA') {
      return
    }

    // Don't intercept when in input fields
    if (isInputElement(document.activeElement)) {
      return
    }

    // Prevent browser default
    e.preventDefault()
    e.stopPropagation()

    onToggleAllRef.current()
  }, [])

  useEffect(() => {
    // Register global keydown listener
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      // Cleanup on unmount
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])
}
