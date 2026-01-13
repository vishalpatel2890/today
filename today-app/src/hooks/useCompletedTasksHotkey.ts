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
 * Global keyboard shortcut hook for Completed Tasks modal
 *
 * Registers Cmd+Opt+D (Mac) / Ctrl+Alt+D (Windows) to open the completed tasks modal
 * This hook is globally registered (not scoped to a specific view)
 *
 * @param onOpen - Callback when the modal should open
 *
 * Per ADR-TT-003: Uses native document.addEventListener, no external libraries
 */
export const useCompletedTasksHotkey = (onOpen: () => void): void => {
  // Stable callback ref to avoid re-registering listener on every render
  const onOpenRef = useRef(onOpen)

  // Keep ref updated
  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Cmd+Opt+D (Mac) or Ctrl+Alt+D (Windows)
    const isMac = e.metaKey && !e.ctrlKey
    const isWindows = e.ctrlKey && !e.metaKey
    const isModifierPressed = isMac || isWindows

    // Use e.code instead of e.key because Option+D on Mac produces special characters
    if (!isModifierPressed || !e.altKey || e.code !== 'KeyD') {
      return
    }

    // Don't intercept when in input fields
    if (isInputElement(document.activeElement)) {
      return
    }

    // Prevent browser default
    e.preventDefault()
    e.stopPropagation()

    onOpenRef.current()
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
