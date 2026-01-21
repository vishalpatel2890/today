import Cloud from 'lucide-react/dist/esm/icons/cloud'

interface SyncStatusIconProps {
  isLinked: boolean
  email?: string | null
  onClick: () => void
}

/**
 * Cloud icon showing sync status
 * Hollow when anonymous, solid when linked
 * Tooltip shows email when linked
 */
export const SyncStatusIcon = ({ isLinked, email, onClick }: SyncStatusIconProps) => {
  const tooltipText = isLinked && email
    ? `Synced to ${email}`
    : 'Not synced - Click to link email'

  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 rounded-md hover:bg-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={tooltipText}
      title={tooltipText}
    >
      <Cloud
        className={`h-5 w-5 transition-colors ${
          isLinked
            ? 'text-foreground fill-foreground'
            : 'text-muted-foreground'
        }`}
      />
    </button>
  )
}
