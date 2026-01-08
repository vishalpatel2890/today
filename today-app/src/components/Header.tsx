import { format } from 'date-fns'
import { SyncStatusIcon } from './SyncStatusIcon'
import { SyncStatusBadge } from './SyncStatusBadge'

interface HeaderProps {
  isLinked?: boolean
  email?: string | null
  onSyncClick?: () => void
  userId?: string | null
}

/**
 * Header Component
 *
 * Displays app title, sync status badge, link status icon, and date.
 * AC-7.4.1, AC-7.4.2, AC-7.4.3: Offline/sync status indicator
 */
export const Header = ({ isLinked = false, email, onSyncClick, userId = null }: HeaderProps) => {
  const formattedDate = format(new Date(), 'MMMM d')

  return (
    <header className="flex items-center justify-between py-6">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Today
      </h1>
      <div className="flex items-center gap-3">
        {/* Sync status badge - shows offline/syncing/pending state */}
        <SyncStatusBadge userId={userId} />
        {onSyncClick && (
          <SyncStatusIcon
            isLinked={isLinked}
            email={email}
            onClick={onSyncClick}
          />
        )}
        <span className="font-body text-sm text-muted-foreground">
          {formattedDate}
        </span>
      </div>
    </header>
  )
}
