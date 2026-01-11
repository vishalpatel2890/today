import { useEffect, useRef, useCallback } from 'react'

/**
 * Double-tap threshold in milliseconds
 * If second T is pressed within this time, trigger insights instead of tracking
 */
const DOUBLE_TAP_THRESHOLD = 300

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
 * Global keyboard shortcut hook for time tracking
 *
 * Registers Cmd+Opt+T (Mac) / Ctrl+Alt+T (Windows) for time tracking modal
 * Double-tap T within 300ms triggers insights modal instead
 *
 * @param onOpenTracking - Callback when tracking modal should open
 * @param onOpenInsights - Callback when insights modal should open (double-tap)
 *
 * Per ADR-TT-003: Uses native document.addEventListener, no external libraries
 */
export const useTimeTrackingHotkeys = (
  onOpenTracking: () => void,
  onOpenInsights: () => void
): void => {
  // Track timing for double-tap detection
  const lastTriggerRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable callback refs to avoid re-registering listener on every render
  const onOpenTrackingRef = useRef(onOpenTracking)
  const onOpenInsightsRef = useRef(onOpenInsights)

  // Keep refs updated
  useEffect(() => {
    onOpenTrackingRef.current = onOpenTracking
    onOpenInsightsRef.current = onOpenInsights
  }, [onOpenTracking, onOpenInsights])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check for Cmd+Opt+T (Mac) or Ctrl+Alt+T (Windows)
    const isMac = e.metaKey && !e.ctrlKey
    const isWindows = e.ctrlKey && !e.metaKey
    const isModifierPressed = isMac || isWindows

    // Use e.code instead of e.key because Option+T on Mac produces '†' character
    if (!isModifierPressed || !e.altKey || e.code !== 'KeyT') {
      return
    }

    // Don't intercept when in input fields (AC4)
    if (isInputElement(document.activeElement)) {
      return
    }

    // Prevent browser default (reopening closed tab) - AC2
    e.preventDefault()
    e.stopPropagation()

    const now = Date.now()
    const timeSinceLastTrigger = now - lastTriggerRef.current

    // Clear any pending single-tap timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Check for double-tap (AC5)
    if (timeSinceLastTrigger < DOUBLE_TAP_THRESHOLD) {
      // Double-tap detected - trigger insights
      lastTriggerRef.current = 0 // Reset to prevent triple-tap
      onOpenInsightsRef.current()
      return
    }

    // Record this trigger time
    lastTriggerRef.current = now

    // Wait for potential second tap before triggering tracking (AC6)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      onOpenTrackingRef.current()
    }, DOUBLE_TAP_THRESHOLD)
  }, [])

  useEffect(() => {
    // Register global keydown listener
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      // Cleanup on unmount
      document.removeEventListener('keydown', handleKeyDown, true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleKeyDown])
}
