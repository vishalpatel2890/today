import type { ReactNode } from 'react'

/**
 * EmptyState - Reusable empty state component for views
 * AC-4.4.4: Uses muted-foreground color (#64748b)
 * AC-4.4.5: Text is centered in the content area
 * Source: Story 4.4, notes/ux-design-specification.md Section 7.2
 */

export interface EmptyStateProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export const EmptyState = ({ title, subtitle, children }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground text-base">{title}</p>
      {subtitle && (
        <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>
      )}
      {children && (
        <div className="mt-6 w-full">
          {children}
        </div>
      )}
    </div>
  )
}
