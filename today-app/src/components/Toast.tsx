import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import { useToast, type ToastMessage } from '../contexts/ToastContext'

/**
 * Individual Toast Item Component
 * AC-4.3.4: Bottom-center positioning
 * AC-4.3.6: Slide in/out animations
 * AC-4.3.3: Error type styling
 */
const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const isError = toast.type === 'error'

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        isError
          ? 'bg-error-bg text-error border border-error/20'
          : 'bg-foreground text-white'
      } ${toast.isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      role="status"
      aria-live="polite"
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  )
}

/**
 * Toast Container Component
 * Renders all toasts from context
 * AC-4.3.4: Fixed at bottom-center of screen
 * AC-4.3.7: Stacks vertically, most recent at bottom
 */
export const ToastContainer = () => {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
