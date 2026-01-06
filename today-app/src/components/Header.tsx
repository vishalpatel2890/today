import { format } from 'date-fns'

export const Header = () => {
  const formattedDate = format(new Date(), 'MMMM d')

  return (
    <header className="flex items-center justify-between py-6">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Today
      </h1>
      <span className="font-body text-sm text-muted-foreground">
        {formattedDate}
      </span>
    </header>
  )
}
