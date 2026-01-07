import { format } from 'date-fns'
import { SyncStatusIcon } from './SyncStatusIcon'

interface HeaderProps {
  isLinked?: boolean
  email?: string | null
  onSyncClick?: () => void
}

export const Header = ({ isLinked = false, email, onSyncClick }: HeaderProps) => {
  const formattedDate = format(new Date(), 'MMMM d')

  return (
    <header className="flex items-center justify-between py-6">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Today
      </h1>
      <div className="flex items-center gap-3">
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
