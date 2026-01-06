import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  isVisible: boolean
  onDismiss: () => void
}

/**
 * Toast notification component
 * Appears at bottom-center, auto-dismisses after 3 seconds
 * AC-3.4.3, AC-3.4.4
 */
export const Toast = ({ message, isVisible, onDismiss }: ToastProps) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Reset animation state when shown
      setIsAnimatingOut(false)

      // Auto-dismiss after 3 seconds - AC-3.4.4
      const dismissTimer = setTimeout(() => {
        setIsAnimatingOut(true)
        // Wait for animation to complete before calling onDismiss
        setTimeout(onDismiss, 300)
      }, 3000)

      return () => clearTimeout(dismissTimer)
    }
  }, [isVisible, onDismiss])

  if (!isVisible && !isAnimatingOut) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-white shadow-lg ${
        isAnimatingOut ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
