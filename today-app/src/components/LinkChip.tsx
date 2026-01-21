import ExternalLink from 'lucide-react/dist/esm/icons/external-link'

interface LinkChipProps {
  url: string
  label: string
}

/**
 * LinkChip - Pill-shaped clickable element for URLs
 * AC #1: URLs render as chips
 * AC #2: Chips show website name (label)
 * AC #3: Chips are clickable
 */
export const LinkChip = ({ url, label }: LinkChipProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-muted text-primary text-sm font-medium hover:bg-border transition-colors cursor-pointer"
      title={url}
      aria-label={`Open ${label} in new tab`}
    >
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  )
}
