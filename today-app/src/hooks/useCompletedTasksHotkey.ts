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
 * Registers Cmd+Opt+C (Mac) / Ctrl+Alt+C (Windows) to open the completed tasks modal
 * Note: Cmd+Opt+D is reserved by macOS for showing/hiding the Dock
 *
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
    // Check for Cmd+Opt+C (Mac) or Ctrl+Alt+C (Windows)
    const isMac = e.metaKey && !e.ctrlKey
    const isWindows = e.ctrlKey && !e.metaKey
    const isModifierPressed = isMac || isWindows

    if (!isModifierPressed || !e.altKey || e.code !== 'KeyC') {
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
