import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

/**
 * Toast message interface
 * AC-4.3.4, AC-4.3.5, AC-4.3.7
 */
export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
  duration: number
  isExiting: boolean
}

interface ToastContextValue {
  toasts: ToastMessage[]
  addToast: (message: string, options?: { type?: 'success' | 'error'; duration?: number }) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 3000 // AC-4.3.5: 3 seconds
const MAX_TOASTS = 3 // AC-4.3.7: Max 3 visible toasts
const EXIT_ANIMATION_DURATION = 300 // 300ms for slide-out animation

interface ToastProviderProps {
  children: ReactNode
}

/**
 * Toast Provider Component
 * Manages toast queue with auto-dismiss and stacking
 * AC-4.3.5: Auto-dismiss after 3 seconds
 * AC-4.3.7: Multiple toasts stack vertically (max 3)
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    // Clear the timer if exists
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    // Start exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t))

    // Remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, EXIT_ANIMATION_DURATION)
  }, [])

  const addToast = useCallback((
    message: string,
    options?: { type?: 'success' | 'error'; duration?: number }
  ) => {
    const id = crypto.randomUUID()
    const type = options?.type ?? 'success'
    const duration = options?.duration ?? DEFAULT_DURATION

    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration,
      isExiting: false,
    }

    setToasts(prev => {
      // If we're at max capacity, remove the oldest toast immediately
      let updated = [...prev]
      while (updated.length >= MAX_TOASTS) {
        const oldest = updated[0]
        // Clear its timer
        const timer = timersRef.current.get(oldest.id)
        if (timer) {
          clearTimeout(timer)
          timersRef.current.delete(oldest.id)
        }
        updated = updated.slice(1)
      }
      return [...updated, newToast]
    })

    // Set auto-dismiss timer
    const timer = setTimeout(() => {
      removeToast(id)
    }, duration)

    timersRef.current.set(id, timer)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

/**
 * Hook to access toast context
 * Usage: const { addToast } = useToast()
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
